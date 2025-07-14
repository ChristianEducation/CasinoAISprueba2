import { useState, useEffect, useCallback } from 'react'
import { OrderService, OrderStateByChild } from '@/services/orderService'
import { User } from '@/types/panel'
import { format, subWeeks } from 'date-fns'
import { es } from 'date-fns/locale'

interface OrderHistoryFilters {
  childId?: string
  status?: 'all' | 'pendiente' | 'pagado' | 'cancelado'
  dateRange?: 'all' | 'last_month' | 'last_3_months'
}

interface OrderHistoryItem extends OrderStateByChild {
  weekLabel: string
  formattedDate: string
  itemsCount: number
  hasColaciones: boolean
}

interface UseOrderHistoryReturn {
  orders: OrderHistoryItem[]
  filteredOrders: OrderHistoryItem[]
  isLoading: boolean
  error: string | null
  filters: OrderHistoryFilters
  setFilters: (filters: OrderHistoryFilters) => void
  refreshOrders: () => Promise<void>
  totalOrders: number
  totalSpent: number
  paidOrders: number
  pendingOrders: number
}

export function useOrderHistory(user: User | null): UseOrderHistoryReturn {
  const [orders, setOrders] = useState<OrderHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<OrderHistoryFilters>({
    childId: 'all',
    status: 'all',
    dateRange: 'all'
  })

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

      return {
        ...order,
        weekLabel,
        formattedDate,
        itemsCount,
        hasColaciones
      }
    })
  }, [])

  // Cargar historial de pedidos
  const loadOrderHistory = useCallback(async () => {
    if (!user) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Obtener pedidos de los últimos 6 meses
      const sixMonthsAgo = subWeeks(new Date(), 24)
      
      const rawOrders = await OrderService.getOrdersWithFilters({
        userId: user.id,
        dateRange: {
          start: sixMonthsAgo,
          end: new Date()
        }
      })

      // Ordenar por fecha de creación (más recientes primero)
      const sortedOrders = rawOrders.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )

      const formattedOrders = formatOrders(sortedOrders)
      setOrders(formattedOrders)

    } catch (error) {
      console.error('Error loading order history:', error)
      setError(error instanceof Error ? error.message : 'Error al cargar el historial de pedidos')
    } finally {
      setIsLoading(false)
    }
  }, [user, formatOrders])

  // Filtrar pedidos
  const filteredOrders = useCallback(() => {
    let filtered = [...orders]

    // Filtrar por hijo
    if (filters.childId && filters.childId !== 'all') {
      if (filters.childId === 'funcionario') {
        // Para funcionarios, mostrar pedidos sin hijo asignado
        filtered = filtered.filter(order => 
          order.resumenPedido.some(selection => !selection.hijo)
        )
      } else {
        // Para hijos específicos
        filtered = filtered.filter(order =>
          order.resumenPedido.some(selection => 
            selection.hijo && selection.hijo.id === filters.childId
          )
        )
      }
    }

    // Filtrar por estado
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(order => order.status === filters.status)
    }

    // Filtrar por rango de fechas
    if (filters.dateRange && filters.dateRange !== 'all') {
      const now = new Date()
      let cutoffDate: Date

      switch (filters.dateRange) {
        case 'last_month':
          cutoffDate = subWeeks(now, 4)
          break
        case 'last_3_months':
          cutoffDate = subWeeks(now, 12)
          break
        default:
          cutoffDate = new Date(0) // Mostrar todos
      }

      filtered = filtered.filter(order => 
        new Date(order.createdAt) >= cutoffDate
      )
    }

    return filtered
  }, [orders, filters])

  // Función para refrescar pedidos
  const refreshOrders = useCallback(async () => {
    await loadOrderHistory()
  }, [loadOrderHistory])

  // Calcular estadísticas
  const stats = useCallback(() => {
    const filtered = filteredOrders()
    const totalOrders = filtered.length
    const totalSpent = filtered
      .filter(order => order.status === 'pagado')
      .reduce((sum, order) => sum + order.total, 0)
    const paidOrders = filtered.filter(order => order.status === 'pagado').length
    const pendingOrders = filtered.filter(order => order.status === 'pendiente').length

    return { totalOrders, totalSpent, paidOrders, pendingOrders }
  }, [filteredOrders])

  // Efectos
  useEffect(() => {
    loadOrderHistory()
  }, [loadOrderHistory])

  const { totalOrders, totalSpent, paidOrders, pendingOrders } = stats()

  return {
    orders,
    filteredOrders: filteredOrders(),
    isLoading,
    error,
    filters,
    setFilters,
    refreshOrders,
    totalOrders,
    totalSpent,
    paidOrders,
    pendingOrders
  }
}
