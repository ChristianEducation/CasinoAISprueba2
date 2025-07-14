import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy,
  doc,
  getDoc,
  Timestamp
} from 'firebase/firestore'
import { db } from '@/app/lib/firebase'
import { 
  ReportsFilters, 
  ReportsStats, 
  ChartDataPoint, 
  MenuDistribution, 
  UserTypeData, 
  DailyMetrics,
  ReportsData 
} from '@/types/reports'
import { format, parseISO, eachDayOfInterval } from 'date-fns'
import { es } from 'date-fns/locale'

interface OrderData {
  id: string
  userId: string
  status: string
  total?: number
  createdAt?: Timestamp | Date | string | number | { seconds: number; nanoseconds?: number }
  selections?: Array<{
    almuerzo?: {
      code: string
      name: string
      price?: number
    }
    colacion?: {
      code: string
      name: string
      price?: number
    }
  }>
  user?: {
    userType: string
    [key: string]: string | number | boolean | Date | null | undefined
  }
}

interface UserData {
  id: string
  userType: string
  [key: string]: string | number | boolean | Date | null | undefined
}

// Helper function to create local date from YYYY-MM-DD string - CORREGIDO
function createLocalDate(dateString: string): Date {
  try {
    const [year, month, day] = dateString.split('-').map(Number)
    if (!year || !month || !day || month < 1 || month > 12 || day < 1 || day > 31) {
      throw new Error(`Invalid date components: ${dateString}`)
    }
    
    // Crear fecha local (sin conversión de zona horaria)
    const date = new Date(year, month - 1, day)
    
    // Verificar que la fecha creada es válida
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date created: ${dateString}`)
    }
    
    return date
  } catch (error) {
    console.error('Error creating local date:', dateString, error)
    // Fallback: usar parseISO pero ajustar a medianoche local
    try {
      const isoDate = parseISO(dateString + 'T00:00:00')
      if (!isNaN(isoDate.getTime())) {
        return isoDate
      }
    } catch (fallbackError) {
      console.error('Fallback date parsing also failed:', fallbackError)
    }
    
    // Último recurso: fecha actual
    return new Date()
  }
}

// Helper function to format date to YYYY-MM-DD - CORREGIDO
function formatToDateString(date: Date): string {
  try {
    // Usar métodos locales para evitar problemas de zona horaria
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  } catch (error) {
    console.error('Error formatting date to string:', error)
    // Fallback usando format de date-fns
    return format(date, 'yyyy-MM-dd')
  }
}

// Helper function to safely convert Firebase timestamp to Date - CORREGIDO
function safeToDate(timestamp: Timestamp | Date | string | number | { seconds: number; nanoseconds?: number } | null | undefined): Date | null {
  if (!timestamp) return null
  
  // If it's already a Date object
  if (timestamp instanceof Date) {
    return timestamp
  }
  
  // If it's a Firebase Timestamp
  if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp && typeof timestamp.toDate === 'function') {
    try {
      return timestamp.toDate()
    } catch (error) {
      console.error('Error converting timestamp to date:', error)
      return null
    }
  }
  
  // If it's a timestamp object with seconds
  if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp && typeof timestamp.seconds === 'number') {
    try {
      return new Date(timestamp.seconds * 1000)
    } catch (error) {
      console.error('Error converting seconds to date:', error)
      return null
    }
  }
  
  // If it's a string, try to parse it
  if (typeof timestamp === 'string') {
    try {
      return new Date(timestamp)
    } catch (error) {
      console.error('Error parsing date string:', error)
      return null
    }
  }
  
  // If it's a number (milliseconds)
  if (typeof timestamp === 'number') {
    try {
      return new Date(timestamp)
    } catch (error) {
      console.error('Error converting number to date:', error)
      return null
    }
  }
  
  console.warn('Unknown timestamp format:', timestamp)
  return null
}

export class ReportsService {
  static async getReportsData(filters: ReportsFilters): Promise<ReportsData> {
    try {
      const [orders] = await Promise.all([
        this.getFilteredOrders(filters),
        this.getUsers()
      ])

      const stats = this.calculateStats(orders)
      const dailyData = this.generateDailyData(orders, filters)
      const revenueData = this.generateRevenueData(orders, filters)
      const menuDistribution = this.calculateMenuDistribution(orders)
      const userTypeData = this.calculateUserTypeData(orders)
      const dailyMetrics = this.calculateDailyMetrics(orders, filters)
      const topMenuItems = this.getTopMenuItems(orders)

      return {
        stats,
        dailyData,
        revenueData,
        menuDistribution,
        userTypeData,
        dailyMetrics,
        topMenuItems,
        isLoading: false,
        lastUpdated: new Date()
      }
    } catch (error) {
      console.error('Error fetching reports data:', error)
      throw new Error('No se pudieron cargar los datos de reportes')
    }
  }

  private static async getFilteredOrders(filters: ReportsFilters): Promise<OrderData[]> {
    try {
      const ordersRef = collection(db, 'orders')
      let q = query(ordersRef, orderBy('createdAt', 'desc'))

      // Filtrar por estado si no es 'all'
      if (filters.orderStatus !== 'all') {
        q = query(ordersRef, where('status', '==', filters.orderStatus), orderBy('createdAt', 'desc'))
      }

      const ordersSnapshot = await getDocs(q)
      const orders: OrderData[] = []

      for (const orderDoc of ordersSnapshot.docs) {
        const orderData = orderDoc.data()
        const orderDate = safeToDate(orderData.createdAt)

        // Filtrar por rango de fechas usando fechas locales
        if (orderDate) {
          const orderDateStr = formatToDateString(orderDate)
          if (orderDateStr >= filters.dateRange.start && orderDateStr <= filters.dateRange.end) {
            // Obtener datos del usuario
            try {
              const userDoc = await getDoc(doc(db, 'users', orderData.userId))
              let userData: Partial<UserData> = {}
              
              if (userDoc.exists()) {
                userData = userDoc.data()
              }

              // Filtrar por tipo de usuario si no es 'all'
              if (filters.userType !== 'all') {
                if (userData.userType === filters.userType) {
                  orders.push({
                    id: orderDoc.id,
                    ...orderData,
                    createdAt: orderDate, // Use the safely converted date
                    user: userData
                  } as OrderData)
                }
              } else {
                orders.push({
                  id: orderDoc.id,
                  ...orderData,
                  createdAt: orderDate, // Use the safely converted date
                  user: userData
                } as OrderData)
              }
            } catch (userError) {
              console.error(`Error fetching user ${orderData.userId}:`, userError)
              // Incluir orden sin datos de usuario si hay error
              if (filters.userType === 'all') {
                orders.push({
                  id: orderDoc.id,
                  ...orderData,
                  createdAt: orderDate, // Use the safely converted date
                  user: { userType: 'estudiante' } // valor por defecto
                } as OrderData)
              }
            }
          }
        } else {
          console.warn(`Order ${orderDoc.id} has invalid createdAt timestamp:`, orderData.createdAt)
        }
      }

      return orders
    } catch (error) {
      console.error('Error fetching filtered orders:', error)
      return []
    }
  }

  private static async getUsers(): Promise<UserData[]> {
    try {
      const usersRef = collection(db, 'users')
      const usersSnapshot = await getDocs(usersRef)
      return usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserData[]
    } catch (error) {
      console.error('Error fetching users:', error)
      return []
    }
  }

  private static calculateStats(orders: OrderData[]): ReportsStats {
    const totalOrders = orders.length
    const paidOrders = orders.filter(order => order.status === 'paid')
    const totalRevenue = paidOrders.reduce((sum, order) => sum + (order.total || 0), 0)
    
    const uniqueUserIds = [...new Set(orders.map(order => order.userId))]
    const totalUsers = uniqueUserIds.length

    // Calcular total de items de menú seleccionados
    const totalMenuItems = orders.reduce((sum, order) => {
      if (!order.selections) return sum
      return sum + order.selections.reduce((itemSum, selection) => {
        let count = 0
        if (selection.almuerzo) count++
        if (selection.colacion) count++
        return itemSum + count
      }, 0)
    }, 0)

    const averageOrderValue = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0

    // Calcular crecimiento (simulado - en producción compararía con período anterior)
    const growthPercentage = Math.random() * 20 - 10 // -10% a +10%

    // Tasa de conversión (pedidos pagados vs total)
    const conversionRate = totalOrders > 0 ? (paidOrders.length / totalOrders) * 100 : 0

    return {
      totalOrders,
      totalRevenue,
      totalUsers,
      totalMenuItems,
      growthPercentage,
      averageOrderValue,
      conversionRate
    }
  }

  private static generateDailyData(orders: OrderData[], filters: ReportsFilters): ChartDataPoint[] {
    const startDate = createLocalDate(filters.dateRange.start)
    const endDate = createLocalDate(filters.dateRange.end)
    const days = eachDayOfInterval({ start: startDate, end: endDate })

    return days.map(day => {
      const dayStr = formatToDateString(day)
      const dayOrders = orders.filter(order => {
        const orderDate = order.createdAt instanceof Date ? order.createdAt : safeToDate(order.createdAt)
        return orderDate && formatToDateString(orderDate) === dayStr
      })

      const dayRevenue = dayOrders
        .filter(order => order.status === 'paid')
        .reduce((sum, order) => sum + (order.total || 0), 0)

      const uniqueUsers = [...new Set(dayOrders.map(order => order.userId))].length

      return {
        date: dayStr,
        day: format(day, 'dd/MM'),
        orders: dayOrders.length,
        revenue: dayRevenue,
        users: uniqueUsers
      }
    })
  }

  private static generateRevenueData(orders: OrderData[], filters: ReportsFilters): ChartDataPoint[] {
    return this.generateDailyData(orders, filters)
  }

  private static calculateMenuDistribution(orders: OrderData[]): MenuDistribution[] {
    const menuCounts: { [key: string]: { name: string; count: number; revenue: number } } = {}
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16']

    orders.forEach(order => {
      if (order.selections && Array.isArray(order.selections)) {
        order.selections.forEach((selection) => {
          if (selection.almuerzo) {
            const key = selection.almuerzo.code
            if (!menuCounts[key]) {
              menuCounts[key] = { 
                name: selection.almuerzo.name, 
                count: 0, 
                revenue: 0 
              }
            }
            menuCounts[key].count++
            menuCounts[key].revenue += selection.almuerzo.price || 0
          }
          if (selection.colacion) {
            const key = selection.colacion.code
            if (!menuCounts[key]) {
              menuCounts[key] = { 
                name: selection.colacion.name, 
                count: 0, 
                revenue: 0 
              }
            }
            menuCounts[key].count++
            menuCounts[key].revenue += selection.colacion.price || 0
          }
        })
      }
    })

    const totalCount = Object.values(menuCounts).reduce((sum, item) => sum + item.count, 0)

    return Object.entries(menuCounts)
      .map(([code, data], index) => ({
        name: data.name,
        code,
        count: data.count,
        percentage: totalCount > 0 ? Math.round((data.count / totalCount) * 100 * 100) / 100 : 0,
        revenue: data.revenue,
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
  }

  private static calculateUserTypeData(orders: OrderData[]): UserTypeData[] {
    const userTypeStats: { [key: string]: { orders: number; revenue: number; users: Set<string> } } = {
      estudiante: { orders: 0, revenue: 0, users: new Set() },
      funcionario: { orders: 0, revenue: 0, users: new Set() }
    }

    orders.forEach(order => {
      const userType = order.user?.userType || 'estudiante'
      if (userTypeStats[userType]) {
        userTypeStats[userType].orders++
        if (order.status === 'paid') {
          userTypeStats[userType].revenue += order.total || 0
        }
        userTypeStats[userType].users.add(order.userId)
      }
    })

    const totalOrders = orders.length

    return Object.entries(userTypeStats).map(([type, data]) => ({
      type: type === 'estudiante' ? 'Estudiantes' : 'Funcionarios',
      orders: data.orders,
      revenue: data.revenue,
      users: data.users.size,
      percentage: totalOrders > 0 ? Math.round((data.orders / totalOrders) * 100 * 100) / 100 : 0
    }))
  }

  private static calculateDailyMetrics(orders: OrderData[], filters: ReportsFilters): DailyMetrics[] {
    const startDate = createLocalDate(filters.dateRange.start)
    const endDate = createLocalDate(filters.dateRange.end)
    const days = eachDayOfInterval({ start: startDate, end: endDate })

    return days.map(day => {
      const dayStr = formatToDateString(day)
      const dayOrders = orders.filter(order => {
        const orderDate = order.createdAt instanceof Date ? order.createdAt : safeToDate(order.createdAt)
        return orderDate && formatToDateString(orderDate) === dayStr
      })

      const totalRevenue = dayOrders
        .filter(order => order.status === 'paid')
        .reduce((sum, order) => sum + (order.total || 0), 0)

      const uniqueUsers = [...new Set(dayOrders.map(order => order.userId))].length

      let almuerzoOrders = 0
      let colacionOrders = 0

      dayOrders.forEach(order => {
        if (order.selections && Array.isArray(order.selections)) {
          order.selections.forEach((selection) => {
            if (selection.almuerzo) almuerzoOrders++
            if (selection.colacion) colacionOrders++
          })
        }
      })

      return {
        date: dayStr,
        dayName: format(day, 'EEEE', { locale: es }),
        totalOrders: dayOrders.length,
        totalRevenue,
        uniqueUsers,
        almuerzoOrders,
        colacionOrders,
        averageOrderValue: dayOrders.length > 0 ? Math.round((totalRevenue / dayOrders.length) * 100) / 100 : 0
      }
    })
  }

  private static getTopMenuItems(orders: OrderData[]): MenuDistribution[] {
    return this.calculateMenuDistribution(orders).slice(0, 5)
  }

  static getDefaultFilters(): ReportsFilters {
    // Usar fechas locales para evitar problemas de zona horaria
    const today = new Date()
    const thirtyDaysAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 30)

    return {
      dateRange: {
        start: formatToDateString(thirtyDaysAgo),
        end: formatToDateString(today)
      },
      userType: 'all',
      orderStatus: 'all',
      menuType: 'all'
    }
  }

  // Método adicional para exportar datos
  static async exportReportsData(filters: ReportsFilters, format: 'csv' | 'json' = 'json'): Promise<string> {
    try {
      const data = await this.getReportsData(filters)
      
      if (format === 'csv') {
        return this.convertToCSV(data)
      }
      
      return JSON.stringify(data, null, 2)
    } catch (error) {
      console.error('Error exporting reports data:', error)
      throw new Error('No se pudieron exportar los datos de reportes')
    }
  }

  private static convertToCSV(data: ReportsData): string {
    const headers = ['Fecha', 'Pedidos', 'Ingresos', 'Usuarios']
    const rows = data.dailyData.map(item => [
      item.date,
      item.orders.toString(),
      item.revenue.toString(),
      item.users.toString()
    ])

    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }
}