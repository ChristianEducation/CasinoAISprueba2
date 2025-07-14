import * as XLSX from 'xlsx'
import { AdminOrderView } from '@/types/adminOrder'
import { format } from 'date-fns'

export interface ExcelExportOptions {
  includeDetails: boolean
  groupByDay: boolean
  filename?: string
}

export class ExcelExportUtils {
  
  // Función principal para exportar pedidos a Excel
  static exportOrdersToExcel(
    orders: AdminOrderView[], 
    options: ExcelExportOptions = { includeDetails: true, groupByDay: false }
  ): void {
    try {
      const workbook = XLSX.utils.book_new()
      
      // Hoja principal con resumen de pedidos
      const mainSheet = this.createMainOrdersSheet(orders, options.includeDetails)
      XLSX.utils.book_append_sheet(workbook, mainSheet, 'Pedidos')
      
      // Si se incluyen detalles, crear hoja adicional con productos
      if (options.includeDetails) {
        const detailsSheet = this.createOrderDetailsSheet(orders)
        XLSX.utils.book_append_sheet(workbook, detailsSheet, 'Detalle de Productos')
      }
      
      // Si se agrupa por día, crear hoja de resumen diario
      if (options.groupByDay) {
        const dailySheet = this.createDailySummarySheet(orders)
        XLSX.utils.book_append_sheet(workbook, dailySheet, 'Resumen Diario')
      }
      
      // Crear hoja de estadísticas
      const statsSheet = this.createStatsSheet(orders)
      XLSX.utils.book_append_sheet(workbook, statsSheet, 'Estadísticas')
      
      // Generar nombre de archivo
      const filename = options.filename || this.generateFilename(orders)
      
      // Descargar archivo
      XLSX.writeFile(workbook, filename)
      
      console.log(`Excel exported successfully: ${filename}`)
    } catch (error) {
      console.error('Error exporting to Excel:', error)
      throw new Error('Error al exportar a Excel')
    }
  }
  
  // Crear hoja principal con información de pedidos
  private static createMainOrdersSheet(orders: AdminOrderView[], includeDetails: boolean): XLSX.WorkSheet {
    const data = orders.map(order => {
      const baseData = {
        'ID Pedido': Number(order.id) || 0,
        'Cliente': `${order.user.firstName} ${order.user.lastName}`,
        'Email': order.user.email,
        'Tipo Usuario': order.user.userType === 'estudiante' ? 'Estudiante' : 'Funcionario',
        'Fecha Pedido': format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm'),
        'Semana': order.weekStart,
        'Estado': this.getStatusText(order.status),
        'Total Items': order.itemsCount,
        'Almuerzos': order.itemsSummary.totalAlmuerzos,
        'Colaciones': order.itemsSummary.totalColaciones,
        'Total': order.total,
        'Fecha Pago': order.paidAt ? format(new Date(order.paidAt), 'dd/MM/yyyy HH:mm') : '',
        'Días Pendiente': order.daysSincePending || 0
      }
      
      if (includeDetails) {
        // Agregar resumen de productos
        const productsSummary = order.itemsSummary.itemsDetail.map(detail => {
          const items = []
          if (detail.almuerzo) items.push(`${detail.almuerzo.code} (A)`)
          if (detail.colacion) items.push(`${detail.colacion.code} (C)`)
          return `${detail.dayName}: ${items.join(', ')}`
        }).join(' | ')
        
        return {
          ...baseData,
          'Productos': productsSummary
        }
      }
      
      return baseData
    })
    
    return XLSX.utils.json_to_sheet(data)
  }
  
  // Crear hoja con detalle de productos por pedido
  private static createOrderDetailsSheet(orders: AdminOrderView[]): XLSX.WorkSheet {
    const data: {
      'ID Pedido': number
      'Cliente': string
      'Fecha': string
      'Día': string
      'Tipo': string
      'Código': string
      'Producto': string
      'Precio': number
      'Estado Pedido': string
    }[] = []
    
    orders.forEach(order => {
      order.itemsSummary.itemsDetail.forEach(detail => {
        if (detail.almuerzo) {
          data.push({
            'ID Pedido': Number(order.id) || 0,
            'Cliente': `${order.user.firstName} ${order.user.lastName}`,
            'Fecha': detail.date,
            'Día': detail.dayName,
            'Tipo': 'Almuerzo',
            'Código': detail.almuerzo.code,
            'Producto': detail.almuerzo.name,
            'Precio': detail.almuerzo.price,
            'Estado Pedido': this.getStatusText(order.status)
          })
        }
        
        if (detail.colacion) {
          data.push({
            'ID Pedido': Number(order.id) || 0,
            'Cliente': `${order.user.firstName} ${order.user.lastName}`,
            'Fecha': detail.date,
            'Día': detail.dayName,
            'Tipo': 'Colación',
            'Código': detail.colacion.code,
            'Producto': detail.colacion.name,
            'Precio': detail.colacion.price,
            'Estado Pedido': this.getStatusText(order.status)
          })
        }
      })
    })
    
    return XLSX.utils.json_to_sheet(data)
  }
  
  // Crear hoja de resumen diario
  private static createDailySummarySheet(orders: AdminOrderView[]): XLSX.WorkSheet {
    const dailyData = new Map<string, {
      date: string
      day: string
      totalOrders: number
      totalRevenue: number
      totalAlmuerzos: number
      totalColaciones: number
      paidOrders: number
      pendingOrders: number
    }>()
    
    orders.forEach(order => {
      order.itemsSummary.itemsDetail.forEach(detail => {
        const key = detail.date
        if (!dailyData.has(key)) {
          dailyData.set(key, {
            date: detail.date,
            day: detail.dayName,
            totalOrders: 0,
            totalRevenue: 0,
            totalAlmuerzos: 0,
            totalColaciones: 0,
            paidOrders: 0,
            pendingOrders: 0
          })
        }
        
        const dayData = dailyData.get(key)!
        dayData.totalOrders++
        
        // Corregir la comparación de estados
        if (this.isPaidStatus(order.status)) {
          dayData.totalRevenue += order.total
          dayData.paidOrders++
        } else if (this.isPendingStatus(order.status)) {
          dayData.pendingOrders++
        }
        
        if (detail.almuerzo) dayData.totalAlmuerzos++
        if (detail.colacion) dayData.totalColaciones++
      })
    })
    
    const data = Array.from(dailyData.values()).map(day => ({
      'Fecha': day.date,
      'Día': day.day,
      'Total Pedidos': day.totalOrders,
      'Pedidos Pagados': day.paidOrders,
      'Pedidos Pendientes': day.pendingOrders,
      'Total Almuerzos': day.totalAlmuerzos,
      'Total Colaciones': day.totalColaciones,
      'Ingresos': day.totalRevenue
    }))
    
    return XLSX.utils.json_to_sheet(data)
  }
  
  // Crear hoja de estadísticas generales
  private static createStatsSheet(orders: AdminOrderView[]): XLSX.WorkSheet {
    const totalOrders = orders.length
    const paidOrders = orders.filter(o => this.isPaidStatus(o.status)).length
    const pendingOrders = orders.filter(o => this.isPendingStatus(o.status)).length
    const cancelledOrders = orders.filter(o => this.isCancelledStatus(o.status)).length
    
    const totalRevenue = orders
      .filter(o => this.isPaidStatus(o.status))
      .reduce((sum, o) => sum + o.total, 0)
    
    const totalAlmuerzos = orders.reduce((sum, o) => sum + o.itemsSummary.totalAlmuerzos, 0)
    const totalColaciones = orders.reduce((sum, o) => sum + o.itemsSummary.totalColaciones, 0)
    
    const averageOrderValue = paidOrders > 0 ? totalRevenue / paidOrders : 0
    
    // Productos más populares
    const itemsTracker = new Map<string, { name: string; count: number; type: string }>()
    
    orders.forEach(order => {
      order.itemsSummary.itemsDetail.forEach(detail => {
        if (detail.almuerzo) {
          const key = detail.almuerzo.code
          const existing = itemsTracker.get(key) || { name: detail.almuerzo.name, count: 0, type: 'Almuerzo' }
          existing.count++
          itemsTracker.set(key, existing)
        }
        
        if (detail.colacion) {
          const key = detail.colacion.code
          const existing = itemsTracker.get(key) || { name: detail.colacion.name, count: 0, type: 'Colación' }
          existing.count++
          itemsTracker.set(key, existing)
        }
      })
    })
    
    const popularItems = Array.from(itemsTracker.entries())
      .sort(([,a], [,b]) => b.count - a.count)
      .slice(0, 10)
    
    const data = [
      { 'Métrica': 'Total de Pedidos', 'Valor': totalOrders },
      { 'Métrica': 'Pedidos Pagados', 'Valor': paidOrders },
      { 'Métrica': 'Pedidos Pendientes', 'Valor': pendingOrders },
      { 'Métrica': 'Pedidos Cancelados', 'Valor': cancelledOrders },
      { 'Métrica': 'Ingresos Totales', 'Valor': totalRevenue },
      { 'Métrica': 'Valor Promedio por Pedido', 'Valor': Math.round(averageOrderValue) },
      { 'Métrica': 'Total Almuerzos', 'Valor': totalAlmuerzos },
      { 'Métrica': 'Total Colaciones', 'Valor': totalColaciones },
      { 'Métrica': 'Tasa de Conversión (%)', 'Valor': totalOrders > 0 ? Math.round((paidOrders / totalOrders) * 100) : 0 },
      { 'Métrica': '', 'Valor': '' }, // Separador
      { 'Métrica': 'PRODUCTOS MÁS POPULARES', 'Valor': '' },
      ...popularItems.map(([code, item], index) => ({
        'Métrica': `${index + 1}. ${code} (${item.type})`,
        'Valor': `${item.count} pedidos`
      }))
    ]
    
    return XLSX.utils.json_to_sheet(data)
  }
  
  // Generar nombre de archivo automático
  private static generateFilename(orders: AdminOrderView[]): string {
    const now = new Date()
    const dateStr = format(now, 'yyyy-MM-dd_HH-mm')
    
    if (orders.length > 0) {
      const weekStart = orders[0].weekStart
      return `pedidos_${weekStart}_${dateStr}.xlsx`
    }
    
    return `pedidos_${dateStr}.xlsx`
  }
  
  // Funciones helper para verificar estados
  private static isPaidStatus(status: string): boolean {
    return status === 'paid' || status === 'pagado'
  }
  
  private static isPendingStatus(status: string): boolean {
    return status === 'pending' || status === 'pendiente'
  }
  
  private static isCancelledStatus(status: string): boolean {
    return status === 'cancelled' || status === 'cancelado'
  }
  
  // Obtener texto del estado
  private static getStatusText(status: string): string {
    switch (status) {
      case 'paid':
      case 'pagado':
        return 'Pagado'
      case 'pending':
      case 'pendiente':
        return 'Pendiente'
      case 'cancelled':
      case 'cancelado':
        return 'Cancelado'
      default:
        return status
    }
  }
  
  // Exportar solo estadísticas rápidas
  static exportQuickStats(orders: AdminOrderView[]): void {
    try {
      const workbook = XLSX.utils.book_new()
      const statsSheet = this.createStatsSheet(orders)
      XLSX.utils.book_append_sheet(workbook, statsSheet, 'Estadísticas')
      
      const filename = `estadisticas_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`
      XLSX.writeFile(workbook, filename)
    } catch (error) {
      console.error('Error exporting stats to Excel:', error)
      throw new Error('Error al exportar estadísticas')
    }
  }
}