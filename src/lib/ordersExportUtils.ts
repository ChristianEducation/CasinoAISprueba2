import * as XLSX from 'xlsx'
import { AdminOrderView, OrderMetrics } from '@/types/adminOrder'
import { format } from 'date-fns'

export interface ExportOptions {
  format: 'excel'
  includeDetails: boolean
  groupByDay: boolean
  includeMetrics: boolean
}

export class OrdersExportUtils {
  
  static exportToExcel(
    orders: AdminOrderView[], 
    metrics?: OrderMetrics,
    options: ExportOptions = {
      format: 'excel',
      includeDetails: true,
      groupByDay: false,
      includeMetrics: true
    }
  ): void {
    try {
      const workbook = XLSX.utils.book_new()

      // Hoja principal con resumen de pedidos
      this.addOrdersSummarySheet(workbook, orders)

      // Hoja detallada para cocina si se solicita
      if (options.includeDetails) {
        this.addKitchenDetailsSheet(workbook, orders)
      }

      // Hoja agrupada por día si se solicita
      if (options.groupByDay) {
        this.addDailyGroupedSheet(workbook, orders)
      }

      // Hoja de métricas si se solicita
      if (options.includeMetrics && metrics) {
        this.addMetricsSheet(workbook, metrics)
      }

      // Generar y descargar archivo
      const fileName = `pedidos_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`
      XLSX.writeFile(workbook, fileName)

      console.log(`Archivo Excel exportado: ${fileName}`)
    } catch (error) {
      console.error('Error al exportar a Excel:', error)
      throw new Error('No se pudo exportar el archivo Excel')
    }
  }

  private static addOrdersSummarySheet(
    workbook: XLSX.WorkBook, 
    orders: AdminOrderView[]
  ): void {
    const summaryData = orders.map(order => ({
      'ID Pedido': order.id,
      'Fecha': format(order.createdAt, 'dd/MM/yyyy HH:mm'),
      'Día': order.dayName,
      'Usuario': `${order.user.firstName} ${order.user.lastName}`,
      'Email': order.user.email,
      'Tipo Usuario': order.user.userType === 'estudiante' ? 'Estudiante' : 'Funcionario',
      'Estado': this.getStatusLabel(order.status),
      'Total Items': order.itemsCount,
      'Almuerzos': order.itemsSummary.totalAlmuerzos,
      'Colaciones': order.itemsSummary.totalColaciones,
      'Total': `$${order.total.toLocaleString('es-CL')}`,
      'Días Pendiente': order.daysSincePending || 0,
      'Semana': order.weekStart
    }))

    const worksheet = XLSX.utils.json_to_sheet(summaryData)
    
    // Configurar ancho de columnas
    const columnWidths = [
      { wch: 15 }, // ID Pedido
      { wch: 18 }, // Fecha
      { wch: 12 }, // Día
      { wch: 25 }, // Usuario
      { wch: 30 }, // Email
      { wch: 15 }, // Tipo Usuario
      { wch: 12 }, // Estado
      { wch: 12 }, // Total Items
      { wch: 12 }, // Almuerzos
      { wch: 12 }, // Colaciones
      { wch: 15 }, // Total
      { wch: 15 }, // Días Pendiente
      { wch: 15 }  // Semana
    ]
    worksheet['!cols'] = columnWidths

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Resumen Pedidos')
  }

  private static addKitchenDetailsSheet(
    workbook: XLSX.WorkBook, 
    orders: AdminOrderView[]
  ): void {
    interface KitchenDetailRow {
      'Fecha Menú': string
      'Día': string
      'Usuario': string
      'Tipo Usuario': string
      'Estado Pedido': string
      'ID Pedido': number | string
      'Tipo Menú': string
      'Código': string
      'Descripción': string
      'Precio': string
    }
    const kitchenData: KitchenDetailRow[] = []

    orders.forEach(order => {
      order.itemsSummary.itemsDetail.forEach(detail => {
        const baseRow = {
          'Fecha Menú': format(new Date(detail.date), 'dd/MM/yyyy'),
          'Día': detail.dayName,
          'Usuario': `${order.user.firstName} ${order.user.lastName}`,
          'Tipo Usuario': order.user.userType === 'estudiante' ? 'Estudiante' : 'Funcionario',
          'Estado Pedido': this.getStatusLabel(order.status),
          'ID Pedido': order.id ?? ''
        }

        // Agregar fila para almuerzo si existe
        if (detail.almuerzo && detail.almuerzo.code && detail.almuerzo.name && typeof detail.almuerzo.price === 'number') {
          kitchenData.push({
            ...baseRow,
            'Tipo Menú': 'Almuerzo',
            'Código': detail.almuerzo.code,
            'Descripción': detail.almuerzo.name,
            'Precio': `$${detail.almuerzo.price.toLocaleString('es-CL')}`
          })
        }

        // Agregar fila para colación si existe
        if (detail.colacion && detail.colacion.code && detail.colacion.name && typeof detail.colacion.price === 'number') {
          kitchenData.push({
            ...baseRow,
            'Tipo Menú': 'Colación',
            'Código': detail.colacion.code,
            'Descripción': detail.colacion.name,
            'Precio': `$${detail.colacion.price.toLocaleString('es-CL')}`
          })
        }
      })
    })

    // Ordenar por fecha de menú y tipo de usuario para facilitar preparación
    kitchenData.sort((a, b) => {
      const dateCompare = new Date(a['Fecha Menú']).getTime() - new Date(b['Fecha Menú']).getTime()
      if (dateCompare !== 0) return dateCompare
      
      const typeCompare = a['Tipo Menú'].localeCompare(b['Tipo Menú'])
      if (typeCompare !== 0) return typeCompare
      
      return a['Tipo Usuario'].localeCompare(b['Tipo Usuario'])
    })

    const worksheet = XLSX.utils.json_to_sheet(kitchenData)
    
    // Configurar ancho de columnas para cocina
    const columnWidths = [
      { wch: 15 }, // Fecha Menú
      { wch: 12 }, // Día
      { wch: 25 }, // Usuario
      { wch: 15 }, // Tipo Usuario
      { wch: 15 }, // Estado Pedido
      { wch: 15 }, // ID Pedido
      { wch: 15 }, // Tipo Menú
      { wch: 12 }, // Código
      { wch: 35 }, // Descripción
      { wch: 12 }  // Precio
    ]
    worksheet['!cols'] = columnWidths

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Detalle para Cocina')
  }

  private static addDailyGroupedSheet(
    workbook: XLSX.WorkBook, 
    orders: AdminOrderView[]
  ): void {
    const dailyGroups = new Map<string, {
      date: string
      dayName: string
      almuerzos: Map<string, { code: string; name: string; count: number; users: string[] }>
      colaciones: Map<string, { code: string; name: string; count: number; users: string[] }>
      totalUsers: Set<string>
      totalStudents: number
      totalStaff: number
    }>()

    // Agrupar por día
    orders.forEach(order => {
      order.itemsSummary.itemsDetail.forEach(detail => {
        const dateKey = detail.date
        
        if (!dailyGroups.has(dateKey)) {
          dailyGroups.set(dateKey, {
            date: dateKey,
            dayName: detail.dayName,
            almuerzos: new Map(),
            colaciones: new Map(),
            totalUsers: new Set(),
            totalStudents: 0,
            totalStaff: 0
          })
        }

        const group = dailyGroups.get(dateKey)!
        const userName = `${order.user.firstName} ${order.user.lastName}`
        
        group.totalUsers.add(order.user.id)
        if (order.user.userType === 'estudiante') {
          group.totalStudents++
        } else {
          group.totalStaff++
        }

        // Procesar almuerzo
        if (detail.almuerzo) {
          const key = detail.almuerzo.code
          if (!group.almuerzos.has(key)) {
            group.almuerzos.set(key, {
              code: detail.almuerzo.code,
              name: detail.almuerzo.name,
              count: 0,
              users: []
            })
          }
          const almuerzo = group.almuerzos.get(key)!
          almuerzo.count++
          almuerzo.users.push(userName)
        }

        // Procesar colación
        if (detail.colacion) {
          const key = detail.colacion.code
          if (!group.colaciones.has(key)) {
            group.colaciones.set(key, {
              code: detail.colacion.code,
              name: detail.colacion.name,
              count: 0,
              users: []
            })
          }
          const colacion = group.colaciones.get(key)!
          colacion.count++
          colacion.users.push(userName)
        }
      })
    })

    // Convertir a formato de hoja
    type DailyGroupedRow = {
      'Fecha': string
      'Día': string
      'Tipo': string
      'Código': string
      'Descripción': string
      'Cantidad': string | number
      'Usuarios': string
    }
    const dailyData: DailyGroupedRow[] = []

    Array.from(dailyGroups.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .forEach(group => {
        // Encabezado del día
        dailyData.push({
          'Fecha': format(new Date(group.date), 'dd/MM/yyyy'),
          'Día': group.dayName.toUpperCase(),
          'Tipo': 'RESUMEN',
          'Código': '',
          'Descripción': `Total: ${group.totalUsers.size} usuarios (${group.totalStudents} estudiantes, ${group.totalStaff} funcionarios)`,
          'Cantidad': '',
          'Usuarios': ''
        })

        // Almuerzos
        if (group.almuerzos.size > 0) {
          dailyData.push({
            'Fecha': '',
            'Día': '',
            'Tipo': 'ALMUERZOS',
            'Código': '',
            'Descripción': '',
            'Cantidad': '',
            'Usuarios': ''
          })

          Array.from(group.almuerzos.values()).forEach(almuerzo => {
            dailyData.push({
              'Fecha': '',
              'Día': '',
              'Tipo': 'Almuerzo',
              'Código': almuerzo.code,
              'Descripción': almuerzo.name,
              'Cantidad': almuerzo.count,
              'Usuarios': almuerzo.users.join(', ')
            })
          })
        }

        // Colaciones
        if (group.colaciones.size > 0) {
          dailyData.push({
            'Fecha': '',
            'Día': '',
            'Tipo': 'COLACIONES',
            'Código': '',
            'Descripción': '',
            'Cantidad': '',
            'Usuarios': ''
          })

          Array.from(group.colaciones.values()).forEach(colacion => {
            dailyData.push({
              'Fecha': '',
              'Día': '',
              'Tipo': 'Colación',
              'Código': colacion.code,
              'Descripción': colacion.name,
              'Cantidad': colacion.count,
              'Usuarios': colacion.users.join(', ')
            })
          })
        }

        // Separador
        dailyData.push({
          'Fecha': '',
          'Día': '',
          'Tipo': '',
          'Código': '',
          'Descripción': '',
          'Cantidad': '',
          'Usuarios': ''
        })
      })

    const worksheet = XLSX.utils.json_to_sheet(dailyData)
    
    // Configurar ancho de columnas
    const columnWidths = [
      { wch: 15 }, // Fecha
      { wch: 12 }, // Día
      { wch: 15 }, // Tipo
      { wch: 12 }, // Código
      { wch: 40 }, // Descripción
      { wch: 10 }, // Cantidad
      { wch: 50 }  // Usuarios
    ]
    worksheet['!cols'] = columnWidths

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Agrupado por Día')
  }

  private static addMetricsSheet(
    workbook: XLSX.WorkBook, 
    metrics: OrderMetrics
  ): void {
    const metricsData = [
      { 'Métrica': 'Total de Pedidos', 'Valor': metrics.totalOrders },
      { 'Métrica': 'Pedidos Pagados', 'Valor': metrics.paidOrders },
      { 'Métrica': 'Pedidos Pendientes', 'Valor': metrics.pendingOrders },
      { 'Métrica': 'Pedidos Cancelados', 'Valor': metrics.cancelledOrders },
      { 'Métrica': 'Pedidos Críticos (>3 días)', 'Valor': metrics.criticalPendingOrders },
      { 'Métrica': '', 'Valor': '' },
      { 'Métrica': 'Ingresos Totales', 'Valor': `$${metrics.totalRevenue.toLocaleString('es-CL')}` },
      { 'Métrica': 'Valor Promedio por Pedido', 'Valor': `$${metrics.averageOrderValue.toLocaleString('es-CL')}` },
      { 'Métrica': 'Tasa de Conversión', 'Valor': `${metrics.weeklyTrends.conversionRate}%` },
      { 'Métrica': '', 'Valor': '' },
      { 'Métrica': 'Total Almuerzos', 'Valor': metrics.itemsMetrics.totalAlmuerzos },
      { 'Métrica': 'Total Colaciones', 'Valor': metrics.itemsMetrics.totalColaciones },
      { 'Métrica': 'Promedio Items por Pedido', 'Valor': metrics.itemsMetrics.averageItemsPerOrder },
      { 'Métrica': '', 'Valor': '' },
      { 'Métrica': 'Ingresos Estudiantes', 'Valor': `$${metrics.totalByUserType.estudiante.toLocaleString('es-CL')}` },
      { 'Métrica': 'Ingresos Funcionarios', 'Valor': `$${metrics.totalByUserType.funcionario.toLocaleString('es-CL')}` }
    ]

    // Agregar distribución por días
    metricsData.push({ 'Métrica': '', 'Valor': '' })
    metricsData.push({ 'Métrica': 'DISTRIBUCIÓN POR DÍAS', 'Valor': '' })
    Object.entries(metrics.totalByDay).forEach(([day, count]) => {
      metricsData.push({
        'Métrica': `Pedidos ${day.charAt(0).toUpperCase() + day.slice(1)}`,
        'Valor': count
      })
    })

    // Agregar items más populares
    if (metrics.itemsMetrics.mostPopularItems.length > 0) {
      metricsData.push({ 'Métrica': '', 'Valor': '' })
      metricsData.push({ 'Métrica': 'ITEMS MÁS POPULARES', 'Valor': '' })
      metrics.itemsMetrics.mostPopularItems.slice(0, 10).forEach((item, index) => {
        metricsData.push({
          'Métrica': `${index + 1}. ${item.code} - ${item.name}`,
          'Valor': `${item.count} pedidos`
        })
      })
    }

    const worksheet = XLSX.utils.json_to_sheet(metricsData)
    
    // Configurar ancho de columnas
    worksheet['!cols'] = [
      { wch: 35 }, // Métrica
      { wch: 20 }  // Valor
    ]

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Métricas')
  }

  private static getStatusLabel(status: string): string {
    switch (status) {
      case 'pending': return 'Pendiente'
      case 'paid': return 'Pagado'
      case 'cancelled': return 'Cancelado'
      default: return status
    }
  }

  // Función para exportar solo datos de cocina (formato simplificado)
  static exportKitchenData(orders: AdminOrderView[]): void {
    try {
      const workbook = XLSX.utils.book_new()
      
      // Solo agregar hoja detallada para cocina
      this.addKitchenDetailsSheet(workbook, orders)
      
      // Agregar hoja agrupada por día
      this.addDailyGroupedSheet(workbook, orders)

      const fileName = `cocina_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`
      XLSX.writeFile(workbook, fileName)

      console.log(`Archivo para cocina exportado: ${fileName}`)
    } catch (error) {
      console.error('Error al exportar datos de cocina:', error)
      throw new Error('No se pudo exportar el archivo para cocina')
    }
  }
}
