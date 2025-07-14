import { useState, useEffect, useCallback } from 'react'
import { AdminOrderService } from '@/services/adminOrderService'
import { AdminOrderView, OrderFilters, OrderMetrics } from '@/types/adminOrder'
import { format, startOfWeek } from 'date-fns'

export function useAdminOrders() {
  const [orders, setOrders] = useState<AdminOrderView[]>([])
  const [metrics, setMetrics] = useState<OrderMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<OrderFilters>({
    weekStart: format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    userType: 'all',
    status: 'all',
    searchTerm: ''
  })

  const loadOrders = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('Loading orders with filters:', filters)
      
      const [ordersData, metricsData] = await Promise.all([
        AdminOrderService.getOrdersWithFilters(filters),
        AdminOrderService.getOrderMetrics(filters)
      ])
      
      console.log('Orders loaded:', ordersData.length)
      console.log('Metrics calculated:', metricsData)
      
      setOrders(ordersData)
      setMetrics(metricsData)
    } catch (err) {
      console.error('Error loading orders:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar los pedidos')
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  const updateFilters = useCallback((newFilters: Partial<OrderFilters>) => {
    console.log('Updating filters:', newFilters)
    setFilters(prev => {
      const updated = { ...prev, ...newFilters }
      console.log('New filters state:', updated)
      return updated
    })
  }, [])

  const refreshOrders = useCallback(() => {
    console.log('Refreshing orders...')
    // Limpiar cache antes de recargar
    AdminOrderService.clearCache()
    loadOrders()
  }, [loadOrders])

  const updateOrderStatus = useCallback(async (orderId: string, status: 'pending' | 'paid' | 'cancelled') => {
    try {
      console.log(`Updating order ${orderId} to status: ${status}`)
      await AdminOrderService.updateOrderStatus({ orderId, status })
      console.log('Order status updated successfully')
      await refreshOrders()
    } catch (err) {
      console.error('Error updating order status:', err)
      throw new Error(err instanceof Error ? err.message : 'Error al actualizar el pedido')
    }
  }, [refreshOrders])

  const deleteOrder = useCallback(async (orderId: string) => {
    try {
      console.log(`Deleting order: ${orderId}`)
      await AdminOrderService.deleteOrder(orderId)
      console.log('Order deleted successfully')
      await refreshOrders()
    } catch (err) {
      console.error('Error deleting order:', err)
      throw new Error(err instanceof Error ? err.message : 'Error al eliminar el pedido')
    }
  }, [refreshOrders])

  return {
    orders,
    metrics,
    isLoading,
    error,
    filters,
    updateFilters,
    refreshOrders,
    updateOrderStatus,
    deleteOrder
  }
}