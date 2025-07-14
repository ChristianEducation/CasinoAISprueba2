import { useState, useEffect, useCallback } from 'react'
import { OrderService, OrderStateByChild } from '@/services/orderService'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/app/lib/firebase'
import { format, subWeeks, differenceInDays } from 'date-fns'
import { es } from 'date-fns/locale'

interface OrderHistoryItem extends OrderStateByChild {
  weekLabel: string
  formattedDate: string
  itemsCount: number
  hasColaciones: boolean
  user?: {
    id: string
    firstName: string
    lastName: string
    email: string
    userType: string
  }
  daysSincePending?: number
}



export function useAdminOrdersSimple() {
  const [orders, setOrders] = useState<OrderHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Función para formatear pedidos
  const formatOrders = useCallback((rawOrders: OrderStateByChild[]): OrderHistoryItem[] => {
    return rawOrders.map(order => {
      const weekStartDate = new Date(order.weekStart)
      const weekEndDate = new Date(weekStartDate)
      weekEndDate.setDate(weekEndDate.getDate() + 6)
      
      const weekLabel = `Del ${format(weekStartDate, 'd')} al ${format(weekEndDate, 'd')} de ${format(weekEndDate, 'MMMM yyyy', { locale: es })}`
      const formattedDate = format(order.createdAt, "d 'de' MMMM, yyyy", { locale: es })
      
      const itemsCount = order.resumenPedido.reduce((count, selection) => {
        return count + (selection.almuerzo ? 1 : 0) + (selection.colacion ? 1 : 0)
      }, 0)
      
      const hasColaciones = order.resumenPedido.some(selection => selection.colacion)

      const daysSincePending = order.status === 'pendiente' 
        ? differenceInDays(new Date(), order.createdAt)
        : 0

      return {
        ...order,
        weekLabel,
        formattedDate,
        itemsCount,
        hasColaciones,
        daysSincePending
      }
    })
  }, [])

  // Cargar todos los pedidos
  const loadOrders = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      console.log('Loading all orders from Firebase...')

      // Obtener pedidos de los últimos 3 meses (sin filtro de usuario)
      const threeMonthsAgo = subWeeks(new Date(), 12)
      
      const rawOrders = await OrderService.getOrdersWithFilters({
        dateRange: {
          start: threeMonthsAgo,
          end: new Date()
        }
      })

      console.log(`Found ${rawOrders.length} orders`)

      // Obtener información de usuarios para cada pedido
      const ordersWithUsers = await Promise.all(
        rawOrders.map(async (order) => {
          try {
            const userDoc = await getDoc(doc(db, 'users', order.userId))
            let userData = null
            
            if (userDoc.exists()) {
              const data = userDoc.data()
              userData = {
                id: data.id || order.userId,
                firstName: data.firstName || data.nombre || '',
                lastName: data.lastName || data.apellido || '',
                email: data.email || data.correo || '',
                userType: data.userType || data.tipoUsuario || 'apoderado'
              }
            }

            return {
              ...order,
              user: userData || {
                id: order.userId,
                firstName: 'Usuario',
                lastName: 'Desconocido',
                email: 'email@desconocido.com',
                userType: order.tipoUsuario
              }
            }
          } catch (error) {
            console.error(`Error loading user for order ${order.id}:`, error)
            return {
              ...order,
              user: {
                id: order.userId,
                firstName: 'Usuario',
                lastName: 'Desconocido',
                email: 'email@desconocido.com',
                userType: order.tipoUsuario
              }
            }
          }
        })
      )

      // Ordenar por fecha de creación (más recientes primero)
      const sortedOrders = ordersWithUsers.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )

      const formattedOrders = formatOrders(sortedOrders)
      setOrders(formattedOrders)

      console.log(`Processed ${formattedOrders.length} orders successfully`)

    } catch (error) {
      console.error('Error loading orders:', error)
      setError(error instanceof Error ? error.message : 'Error al cargar los pedidos')
    } finally {
      setIsLoading(false)
    }
  }, [formatOrders])

  // Función para refrescar pedidos
  const refreshOrders = useCallback(async () => {
    await loadOrders()
  }, [loadOrders])

  // Función para actualizar estado de pedido
  const updateOrderStatus = useCallback(async (orderId: string, status: 'pendiente' | 'pagado' | 'cancelado') => {
    try {
      await OrderService.updateOrder(orderId, { status })
      await refreshOrders()
    } catch (error) {
      console.error('Error updating order status:', error)
      throw new Error('Error al actualizar el estado del pedido')
    }
  }, [refreshOrders])

  // Efectos
  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  return {
    orders,
    isLoading,
    error,
    refreshOrders,
    updateOrderStatus
  }
}
