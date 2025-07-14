import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  doc,
  getDoc,
  Timestamp,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore'
import { db } from '@/app/lib/firebase'
import { AdminStats, WeeklyOrderData, UserTypeStats, MenuPopularity } from '@/types/admin'
import { addDays, format, startOfWeek, endOfWeek } from 'date-fns'

interface Selection {
  date: string
  almuerzo?: { name: string; code: string; price: number }
  colacion?: { name: string; code: string; price: number }
}

interface Order {
  id: string
  userId: string
  status: 'paid' | 'pending'
  total: number
  createdAt: Timestamp
  weekStart: string
  selections?: Selection[]
}

// Cache temporal para optimizar consultas frecuentes
const cache = new Map<string, { data: unknown; timestamp: number }>()
const CACHE_DURATION = 2 * 60 * 1000 // 2 minutos

export class AdminService {
  private static getCacheKey(operation: string, params: Record<string, unknown>): string {
    return `${operation}_${JSON.stringify(params)}`
  }

  private static getFromCache<T>(key: string): T | null {
    const cached = cache.get(key)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data as T
    }
    cache.delete(key)
    return null
  }

  private static setCache(key: string, data: unknown): void {
    cache.set(key, { data, timestamp: Date.now() })
  }

  static async getWeeklyStats(weekStart: string): Promise<AdminStats> {
    const cacheKey = this.getCacheKey('weeklyStats', { weekStart })
    const cached = this.getFromCache<AdminStats>(cacheKey)
    if (cached) return cached

    try {
      // Consultar pedidos de la semana con optimización
      const ordersRef = collection(db, 'orders')
      const weekQuery = query(
        ordersRef,
        where('weekStart', '==', weekStart),
        orderBy('createdAt', 'desc')
      )
      
      const ordersSnapshot = await getDocs(weekQuery)
      const orders = ordersSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
        id: doc.id,
        ...doc.data()
      })) as Order[]

      // Validar y filtrar pedidos válidos
      const validOrders = orders.filter(order => 
        order && 
        typeof order.total === 'number' && 
        order.total >= 0 &&
        ['paid', 'pending'].includes(order.status)
      )

      const totalOrdersWeek = validOrders.length
      const paidOrders = validOrders.filter(order => order.status === 'paid')
      const pendingOrdersCount = validOrders.filter(order => order.status === 'pending').length
      
      // Cálculo optimizado de recaudación semanal
      const totalRevenueWeek = paidOrders.reduce((sum, order) => {
        const orderTotal = order.total || 0
        // Validación adicional para asegurar que el total sea un número válido
        return sum + (isNaN(orderTotal) ? 0 : orderTotal)
      }, 0)

      // Obtener usuarios únicos con pedidos
      const usersWithOrders = [...new Set(validOrders.map(order => order.userId))]
      
      // Consultar tipos de usuario con cache
      const userTypeStats = await this.getUserTypeStats(usersWithOrders)
      
      // Cálculo seguro del valor promedio por pedido
      const averageOrderValue = paidOrders.length > 0 ? 
        Math.round((totalRevenueWeek / paidOrders.length) * 100) / 100 : 0
      
      // Obtener items más populares
      const popularMenuItems = await this.getPopularMenuItems(paidOrders)

      const stats: AdminStats = {
        totalOrdersWeek,
        totalStudentsWithOrder: userTypeStats.estudiantes.withOrders,
        totalStaffWithOrder: userTypeStats.funcionarios.withOrders,
        totalRevenueWeek: Math.round(totalRevenueWeek * 100) / 100, // Redondear a 2 decimales
        pendingOrders: pendingOrdersCount,
        paidOrders: paidOrders.length,
        averageOrderValue,
        popularMenuItems
      }

      // Guardar en cache
      this.setCache(cacheKey, stats)
      
      return stats
    } catch (error) {
      console.error('Error fetching weekly stats:', error)
      throw new Error('No se pudieron cargar las estadísticas semanales')
    }
  }

  static async getWeeklyOrderData(weekStart: string): Promise<WeeklyOrderData[]> {
    const cacheKey = this.getCacheKey('weeklyOrderData', { weekStart })
    const cached = this.getFromCache<WeeklyOrderData[]>(cacheKey)
    if (cached) return cached

    try {
      const weekData: WeeklyOrderData[] = []
      const dayNames = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes']
      
      // Obtener todos los pedidos de la semana una sola vez
      const ordersRef = collection(db, 'orders')
      const weekQuery = query(
        ordersRef,
        where('weekStart', '==', weekStart),
        where('status', '==', 'paid')
      )
      
      const snapshot = await getDocs(weekQuery)
      const weekOrders = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
        id: doc.id,
        ...doc.data()
      })) as Order[]

      // Procesar datos por día
      for (let i = 0; i < 5; i++) {
        const currentDay = addDays(new Date(weekStart), i)
        const dateStr = format(currentDay, 'yyyy-MM-dd')
        
        // Filtrar pedidos del día específico
        const dayOrders = weekOrders.filter(order => 
          order.selections?.some((selection: Selection) => selection.date === dateStr)
        )

        const dayOrderCount = dayOrders.length

        // Cálculo optimizado de ingresos del día
        const dayRevenue = dayOrders.reduce((sum, order) => {
          const daySelections = order.selections?.filter((s: Selection) => s.date === dateStr) || []
          return sum + daySelections.reduce((daySum: number, selection: Selection) => {
            const almuerzoPrice = selection.almuerzo?.price || 0
            const colacionPrice = selection.colacion?.price || 0
            // Validación de precios
            const validAlmuerzoPrice = isNaN(almuerzoPrice) ? 0 : almuerzoPrice
            const validColacionPrice = isNaN(colacionPrice) ? 0 : colacionPrice
            return daySum + validAlmuerzoPrice + validColacionPrice
          }, 0)
        }, 0)

        weekData.push({
          date: dateStr,
          day: dayNames[i],
          orderCount: dayOrderCount,
          revenue: Math.round(dayRevenue * 100) / 100 // Redondear a 2 decimales
        })
      }
      
      // Guardar en cache
      this.setCache(cacheKey, weekData)
      
      return weekData
    } catch (error) {
      console.error('Error fetching weekly order data:', error)
      return []
    }
  }

  static async getUserTypeStats(userIds: string[]): Promise<UserTypeStats> {
    const cacheKey = this.getCacheKey('userTypeStats', { userIds: userIds.sort() })
    const cached = this.getFromCache<UserTypeStats>(cacheKey)
    if (cached) return cached

    try {
      const stats: UserTypeStats = {
        estudiantes: { total: 0, withOrders: 0, revenue: 0 },
        funcionarios: { total: 0, withOrders: 0, revenue: 0 }
      }

      // Obtener totales de usuarios por tipo de manera optimizada
      const usersRef = collection(db, 'users')
      const [estudiantesSnapshot, funcionariosSnapshot] = await Promise.all([
        getDocs(query(usersRef, where('userType', '==', 'estudiante'))),
        getDocs(query(usersRef, where('userType', '==', 'funcionario')))
      ])
      
      stats.estudiantes.total = estudiantesSnapshot.size
      stats.funcionarios.total = funcionariosSnapshot.size

      // Optimización: obtener tipos de usuario en lotes
      if (userIds.length > 0) {
        const userTypePromises = userIds.map(async (userId) => {
          try {
            const userDoc = await getDoc(doc(db, 'users', userId))
            if (userDoc.exists()) {
              const userData = userDoc.data()
              return { userId, userType: userData.userType }
            }
          } catch (error) {
            console.warn(`Error fetching user ${userId}:`, error)
          }
          return null
        })

        const userTypes = await Promise.all(userTypePromises)
        
        // Contar usuarios con pedidos por tipo
        userTypes.forEach(result => {
          if (result) {
            if (result.userType === 'estudiante') {
              stats.estudiantes.withOrders++
            } else if (result.userType === 'funcionario') {
              stats.funcionarios.withOrders++
            }
          }
        })
      }

      // Guardar en cache
      this.setCache(cacheKey, stats)

      return stats
    } catch (error) {
      console.error('Error fetching user type stats:', error)
      return {
        estudiantes: { total: 0, withOrders: 0, revenue: 0 },
        funcionarios: { total: 0, withOrders: 0, revenue: 0 }
      }
    }
  }

  static async getPopularMenuItems(orders: Order[]): Promise<MenuPopularity[]> {
    try {
      const itemCounts: { [key: string]: { name: string; count: number } } = {}
      
      orders.forEach(order => {
        if (order.selections && Array.isArray(order.selections)) {
          order.selections.forEach((selection: Selection) => {
            // Procesar almuerzo
            if (selection.almuerzo && selection.almuerzo.code && selection.almuerzo.name) {
              const key = selection.almuerzo.code
              if (!itemCounts[key]) {
                itemCounts[key] = { name: selection.almuerzo.name, count: 0 }
              }
              itemCounts[key].count++
            }
            
            // Procesar colación
            if (selection.colacion && selection.colacion.code && selection.colacion.name) {
              const key = selection.colacion.code
              if (!itemCounts[key]) {
                itemCounts[key] = { name: selection.colacion.name, count: 0 }
              }
              itemCounts[key].count++
            }
          })
        }
      })

      const totalSelections = Object.values(itemCounts).reduce((sum, item) => sum + item.count, 0)
      
      return Object.entries(itemCounts)
        .map(([code, data]) => ({
          itemCode: code,
          itemName: data.name,
          orderCount: data.count,
          percentage: totalSelections > 0 ? 
            Math.round((data.count / totalSelections) * 100 * 100) / 100 : 0 // Redondear a 2 decimales
        }))
        .sort((a, b) => b.orderCount - a.orderCount)
        .slice(0, 5)
    } catch (error) {
      console.error('Error calculating popular menu items:', error)
      return []
    }
  }

  static async checkMenuStatus(weekStart: string): Promise<boolean> {
    const cacheKey = this.getCacheKey('menuStatus', { weekStart })
    const cached = this.getFromCache<boolean>(cacheKey)
    if (cached !== null) return cached

    try {
      const menusRef = collection(db, 'menus')
      const menuQuery = query(
        menusRef,
        where('weekStart', '==', weekStart),
        limit(1)
      )
      
      const snapshot = await getDocs(menuQuery)
      const hasMenu = !snapshot.empty
      
      // Guardar en cache
      this.setCache(cacheKey, hasMenu)
      
      return hasMenu
    } catch (error) {
      console.error('Error checking menu status:', error)
      return false
    }
  }

  static getCurrentWeekInfo() {
    const now = new Date()
    const weekStart = startOfWeek(now, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
    
    // Deadline: miércoles a las 13:00
    const wednesday = addDays(weekStart, 2)
    const orderDeadline = new Date(wednesday)
    orderDeadline.setHours(13, 0, 0, 0)
    
    return {
      start: format(weekStart, 'yyyy-MM-dd'),
      end: format(weekEnd, 'yyyy-MM-dd'),
      orderDeadline
    }
  }

  // Método para limpiar cache manualmente si es necesario
  static clearCache(): void {
    cache.clear()
  }

  // Método para obtener estadísticas específicas de pedidos pendientes (optimizado)
  static async getPendingOrdersCount(weekStart: string): Promise<number> {
    const cacheKey = this.getCacheKey('pendingOrders', { weekStart })
    const cached = this.getFromCache<number>(cacheKey)
    if (cached !== null) return cached

    try {
      const ordersRef = collection(db, 'orders')
      const pendingQuery = query(
        ordersRef,
        where('weekStart', '==', weekStart),
        where('status', '==', 'pending')
      )
      
      const snapshot = await getDocs(pendingQuery)
      const count = snapshot.size
      
      // Guardar en cache por menos tiempo para datos más dinámicos
      this.setCache(cacheKey, count)
      
      return count
    } catch (error) {
      console.error('Error fetching pending orders count:', error)
      return 0
    }
  }
}