import { useState, useEffect, useCallback } from 'react'
import { useAdminOrders } from './useAdminOrders'
import { AdminOrderView, OrderFilters } from '@/types/adminOrder'
import { OrdersExportUtils, ExportOptions } from '@/lib/ordersExportUtils'
import { format, startOfWeek } from 'date-fns'

export interface DashboardFilters extends OrderFilters {
  menuType?: 'almuerzo' | 'colacion' | 'all'
  dateRange?: 'today' | 'week' | 'month' | 'custom'
  customStartDate?: string
  customEndDate?: string
}

export function useOrdersDashboard() {
  const {
    orders: baseOrders,
    metrics: baseMetrics,
    isLoading,
    error,
    refreshOrders,
    updateOrderStatus,
    deleteOrder
  } = useAdminOrders()

  const [dashboardFilters, setDashboardFilters] = useState<DashboardFilters>({
    weekStart: format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    userType: 'all',
    status: 'all',
    searchTerm: '',
    menuType: 'all',
    dateRange: 'week'
  })

  const [filteredOrders, setFilteredOrders] = useState<AdminOrderView[]>([])
  const [isExporting, setIsExporting] = useState(false)

  // Aplicar filtros adicionales del dashboard
  const applyDashboardFilters = useCallback((orders: AdminOrderView[]) => {
    let filtered = [...orders]

    // Filtro por tipo de menú
    if (dashboardFilters.menuType && dashboardFilters.menuType !== 'all') {
      filtered = filtered.filter(order => {
        if (dashboardFilters.menuType === 'almuerzo') {
          return order.itemsSummary.totalAlmuerzos > 0
        } else if (dashboardFilters.menuType === 'colacion') {
          return order.itemsSummary.totalColaciones > 0
        }
        return true
      })
    }

    // Filtro por rango de fechas personalizado
    if (dashboardFilters.dateRange === 'custom' && dashboardFilters.customStartDate && dashboardFilters.customEndDate) {
      const startDate = new Date(dashboardFilters.customStartDate)
      const endDate = new Date(dashboardFilters.customEndDate)
      endDate.setHours(23, 59, 59, 999) // Incluir todo el día final

      filtered = filtered.filter(order => {
        const orderDate = order.createdAt
        return orderDate >= startDate && orderDate <= endDate
      })
    }

    return filtered
  }, [dashboardFilters])

  // Actualizar órdenes filtradas cuando cambien las órdenes base o los filtros
  useEffect(() => {
    const filtered = applyDashboardFilters(baseOrders)
    setFilteredOrders(filtered)
  }, [baseOrders, applyDashboardFilters])

  // Actualizar filtros del dashboard
  // Define a no-op updateBaseFilters if not provided by useAdminOrders
  const updateBaseFilters = () => {}

  const updateDashboardFilters = useCallback((newFilters: Partial<DashboardFilters>) => {
    setDashboardFilters(prev => {
      const updated = { ...prev, ...newFilters }
      
      // Actualizar también los filtros base si es necesario
      const baseFilterUpdates: Partial<OrderFilters> = {}
      
      if (newFilters.weekStart !== undefined) baseFilterUpdates.weekStart = newFilters.weekStart
      if (newFilters.day !== undefined) baseFilterUpdates.day = newFilters.day
      if (newFilters.userType !== undefined) baseFilterUpdates.userType = newFilters.userType
      if (newFilters.status !== undefined) baseFilterUpdates.status = newFilters.status
      if (newFilters.searchTerm !== undefined) baseFilterUpdates.searchTerm = newFilters.searchTerm

      if (Object.keys(baseFilterUpdates).length > 0) {
        updateBaseFilters()
      }

      return updated
    })
  }, [])

  // Función para exportar pedidos
  const exportOrders = useCallback(async (options: ExportOptions) => {
    setIsExporting(true)
    try {
      console.log(`Exportando ${filteredOrders.length} pedidos con opciones:`, options)
      
      if (filteredOrders.length === 0) {
        throw new Error('No hay pedidos para exportar')
      }

      OrdersExportUtils.exportToExcel(filteredOrders, baseMetrics ?? undefined, options)
      
      console.log('Exportación completada exitosamente')
    } catch (error) {
      console.error('Error en exportación:', error)
      throw error
    } finally {
      setIsExporting(false)
    }
  }, [filteredOrders, baseMetrics])

  // Función para exportar solo datos de cocina
  const exportKitchenData = useCallback(async () => {
    setIsExporting(true)
    try {
      console.log(`Exportando datos de cocina para ${filteredOrders.length} pedidos`)
      
      if (filteredOrders.length === 0) {
        throw new Error('No hay pedidos para exportar')
      }

      OrdersExportUtils.exportKitchenData(filteredOrders)
      
      console.log('Exportación de datos de cocina completada')
    } catch (error) {
      console.error('Error en exportación de cocina:', error)
      throw error
    } finally {
      setIsExporting(false)
    }
  }, [filteredOrders])

  // Obtener estadísticas específicas del dashboard
  const getDashboardStats = useCallback(() => {
    const stats = {
      totalFiltered: filteredOrders.length,
      todayOrders: filteredOrders.filter(order => {
        const today = new Date()
        const orderDate = order.createdAt
        return orderDate.toDateString() === today.toDateString()
      }).length,
      criticalOrders: filteredOrders.filter(order => 
        order.status === 'pending' && (order.daysSincePending || 0) > 3
      ).length,
      revenueFiltered: filteredOrders
        .filter(order => order.status === 'paid')
        .reduce((sum, order) => sum + order.total, 0),
      byMenuType: {
        almuerzo: filteredOrders.filter(order => order.itemsSummary.totalAlmuerzos > 0).length,
        colacion: filteredOrders.filter(order => order.itemsSummary.totalColaciones > 0).length,
        both: filteredOrders.filter(order => 
          order.itemsSummary.totalAlmuerzos > 0 && order.itemsSummary.totalColaciones > 0
        ).length
      },
      byUserType: {
        estudiante: filteredOrders.filter(order => order.user.userType === 'estudiante').length,
        funcionario: filteredOrders.filter(order => order.user.userType === 'funcionario').length
      },
      byStatus: {
        pending: filteredOrders.filter(order => order.status === 'pending').length,
        paid: filteredOrders.filter(order => order.status === 'paid').length,
        cancelled: filteredOrders.filter(order => order.status === 'cancelled').length
      }
    }

    return stats
  }, [filteredOrders])

  // Obtener pedidos agrupados por día para visualización
  const getOrdersByDay = useCallback(() => {
    const groupedByDay = new Map<string, AdminOrderView[]>()
    
    filteredOrders.forEach(order => {
      order.itemsSummary.itemsDetail.forEach(detail => {
        const dateKey = detail.date
        if (!groupedByDay.has(dateKey)) {
          groupedByDay.set(dateKey, [])
        }
        groupedByDay.get(dateKey)!.push(order)
      })
    })

    return Array.from(groupedByDay.entries())
      .map(([date, orders]) => ({
        date,
        dayName: orders[0]?.itemsSummary.itemsDetail.find(d => d.date === date)?.dayName || '',
        orders: orders,
        totalOrders: orders.length,
        totalAlmuerzos: orders.reduce((sum, order) => 
          sum + order.itemsSummary.itemsDetail
            .filter(d => d.date === date && d.almuerzo)
            .length, 0
        ),
        totalColaciones: orders.reduce((sum, order) => 
          sum + order.itemsSummary.itemsDetail
            .filter(d => d.date === date && d.colacion)
            .length, 0
        )
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [filteredOrders])

  return {
    // Datos
    orders: filteredOrders,
    allOrders: baseOrders,
    metrics: baseMetrics,
    
    // Estados
    isLoading,
    error,
    isExporting,
    
    // Filtros
    filters: dashboardFilters,
    updateFilters: updateDashboardFilters,
    
    // Acciones
    refreshOrders,
    updateOrderStatus,
    deleteOrder,
    exportOrders,
    exportKitchenData,
    
    // Estadísticas y agrupaciones
    dashboardStats: getDashboardStats(),
    ordersByDay: getOrdersByDay()
  }
}
