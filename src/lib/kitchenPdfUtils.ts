import { AdminOrderView } from '@/types/adminOrder'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

interface KitchenSummaryData {
  date: string
  dayName: string
  menuItems: {
    almuerzos: Array<{
      code: string
      name: string
      description?: string
      quantity: number
      courses: Record<string, number>
      userTypes: { estudiante: number; funcionario: number }
    }>
    colaciones: Array<{
      code: string
      name: string
      description?: string
      quantity: number
      courses: Record<string, number>
      userTypes: { estudiante: number; funcionario: number }
    }>
  }
  totals: {
    totalAlmuerzos: number
    totalColaciones: number
    totalItems: number
    byUserType: { estudiante: number; funcionario: number }
    byCourse: Record<string, number>
  }
}

interface WeeklySummary {
  weekStart: string
  weekEnd: string
  dailySummaries: KitchenSummaryData[]
  weeklyTotals: {
    totalOrders: number
    totalItems: number
    totalAlmuerzos: number
    totalColaciones: number
    byUserType: { estudiante: number; funcionario: number }
    byDay: Record<string, number>
    popularItems: Array<{
      code: string
      name: string
      type: 'almuerzo' | 'colacion'
      totalQuantity: number
    }>
  }
}

export class KitchenPdfUtils {
  static generateDailySummary(orders: AdminOrderView[], targetDate: string): KitchenSummaryData {
    const dayName = format(parseISO(targetDate), 'EEEE', { locale: es })
    
    // Mapas para agregar datos
    const almuerzoMap = new Map<string, {
      code: string
      name: string
      description?: string
      quantity: number
      courses: Record<string, number>
      userTypes: { estudiante: number; funcionario: number }
    }>()
    
    const colacionMap = new Map<string, {
      code: string
      name: string
      description?: string
      quantity: number
      courses: Record<string, number>
      userTypes: { estudiante: number; funcionario: number }
    }>()

    let totalAlmuerzos = 0
    let totalColaciones = 0
    const userTypeTotals = { estudiante: 0, funcionario: 0 }
    const courseTotals: Record<string, number> = {}

    // Procesar cada pedido
    orders.forEach(order => {
      if (order.status !== 'paid') return // Solo pedidos pagados

      // Buscar items para la fecha específica
      order.itemsSummary.itemsDetail.forEach(detail => {
        if (detail.date !== targetDate) return

        const userType = order.user.userType
        const course = this.extractCourseFromUser(order.user) || 'Sin curso'

        // Procesar almuerzo
        if (detail.almuerzo) {
          const key = detail.almuerzo.code
          const existing = almuerzoMap.get(key) || {
            code: detail.almuerzo.code,
            name: detail.almuerzo.name,
            description: detail.almuerzo.name,
            quantity: 0,
            courses: {},
            userTypes: { estudiante: 0, funcionario: 0 }
          }

          existing.quantity++
          existing.userTypes[userType]++
          existing.courses[course] = (existing.courses[course] || 0) + 1
          almuerzoMap.set(key, existing)

          totalAlmuerzos++
          userTypeTotals[userType]++
          courseTotals[course] = (courseTotals[course] || 0) + 1
        }

        // Procesar colación
        if (detail.colacion) {
          const key = detail.colacion.code
          const existing = colacionMap.get(key) || {
            code: detail.colacion.code,
            name: detail.colacion.name,
            description: detail.colacion.name,
            quantity: 0,
            courses: {},
            userTypes: { estudiante: 0, funcionario: 0 }
          }

          existing.quantity++
          existing.userTypes[userType]++
          existing.courses[course] = (existing.courses[course] || 0) + 1
          colacionMap.set(key, existing)

          totalColaciones++
          userTypeTotals[userType]++
          courseTotals[course] = (courseTotals[course] || 0) + 1
        }
      })
    })

    return {
      date: targetDate,
      dayName: dayName,
      menuItems: {
        almuerzos: Array.from(almuerzoMap.values()).sort((a, b) => b.quantity - a.quantity),
        colaciones: Array.from(colacionMap.values()).sort((a, b) => b.quantity - a.quantity)
      },
      totals: {
        totalAlmuerzos,
        totalColaciones,
        totalItems: totalAlmuerzos + totalColaciones,
        byUserType: userTypeTotals,
        byCourse: courseTotals
      }
    }
  }

  static generateWeeklySummary(orders: AdminOrderView[], weekStart: string): WeeklySummary {
    const startDate = parseISO(weekStart)
    const weekDays = []
    
    // Generar fechas de la semana (lunes a viernes)
    for (let i = 0; i < 5; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      weekDays.push(format(date, 'yyyy-MM-dd'))
    }

    const dailySummaries = weekDays.map(date => this.generateDailySummary(orders, date))
    
    // Calcular totales semanales
    const weeklyTotals = {
      totalOrders: orders.filter(o => o.status === 'paid').length,
      totalItems: 0,
      totalAlmuerzos: 0,
      totalColaciones: 0,
      byUserType: { estudiante: 0, funcionario: 0 },
      byDay: {} as Record<string, number>,
      popularItems: [] as Array<{
        code: string
        name: string
        type: 'almuerzo' | 'colacion'
        totalQuantity: number
      }>
    }

    const itemTracker = new Map<string, {
      code: string
      name: string
      type: 'almuerzo' | 'colacion'
      totalQuantity: number
    }>()

    dailySummaries.forEach(daily => {
      weeklyTotals.totalItems += daily.totals.totalItems
      weeklyTotals.totalAlmuerzos += daily.totals.totalAlmuerzos
      weeklyTotals.totalColaciones += daily.totals.totalColaciones
      weeklyTotals.byUserType.estudiante += daily.totals.byUserType.estudiante
      weeklyTotals.byUserType.funcionario += daily.totals.byUserType.funcionario
      weeklyTotals.byDay[daily.dayName] = daily.totals.totalItems

      // Trackear items populares
      daily.menuItems.almuerzos.forEach(item => {
        const key = `${item.code}-almuerzo`
        const existing = itemTracker.get(key) || {
          code: item.code,
          name: item.name,
          type: 'almuerzo' as const,
          totalQuantity: 0
        }
        existing.totalQuantity += item.quantity
        itemTracker.set(key, existing)
      })

      daily.menuItems.colaciones.forEach(item => {
        const key = `${item.code}-colacion`
        const existing = itemTracker.get(key) || {
          code: item.code,
          name: item.name,
          type: 'colacion' as const,
          totalQuantity: 0
        }
        existing.totalQuantity += item.quantity
        itemTracker.set(key, existing)
      })
    })

    weeklyTotals.popularItems = Array.from(itemTracker.values())
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 10)

    const weekEnd = new Date(startDate)
    weekEnd.setDate(weekEnd.getDate() + 4)

    return {
      weekStart,
      weekEnd: format(weekEnd, 'yyyy-MM-dd'),
      dailySummaries,
      weeklyTotals
    }
  }

  static generateKitchenPDF(summary: KitchenSummaryData, adminUser: { firstName?: string; lastName?: string }): string {
    const currentDateTime = format(new Date(), 'dd/MM/yyyy HH:mm')
    const formattedDate = format(parseISO(summary.date), "EEEE d 'de' MMMM, yyyy", { locale: es })

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Lista de Preparación - ${summary.dayName} - Casino Escolar</title>
        <style>
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
            .page-break { page-break-before: always; }
          }
          
          body { 
            font-family: 'Arial', sans-serif; 
            margin: 20px; 
            line-height: 1.4;
            color: #333;
          }
          
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
          }
          
          .header h1 { 
            color: #1e40af; 
            margin: 0 0 10px 0; 
            font-size: 28px;
            font-weight: bold;
          }
          
          .header .subtitle { 
            color: #64748b; 
            font-size: 16px; 
            margin: 5px 0;
          }
          
          .summary-cards { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 15px; 
            margin-bottom: 30px; 
          }
          
          .summary-card { 
            border: 2px solid #e2e8f0; 
            padding: 15px; 
            border-radius: 8px; 
            text-align: center;
            background: #f8fafc;
          }
          
          .summary-card.almuerzo { border-color: #3b82f6; background: #eff6ff; }
          .summary-card.colacion { border-color: #10b981; background: #ecfdf5; }
          .summary-card.total { border-color: #8b5cf6; background: #f3e8ff; }
          
          .summary-value { 
            font-size: 32px; 
            font-weight: bold; 
            margin: 5px 0;
          }
          
          .summary-value.almuerzo { color: #1d4ed8; }
          .summary-value.colacion { color: #059669; }
          .summary-value.total { color: #7c3aed; }
          
          .summary-label { 
            font-size: 14px; 
            color: #64748b; 
            font-weight: 500;
          }
          
          .section { 
            margin-bottom: 40px; 
          }
          
          .section-title { 
            font-size: 22px; 
            font-weight: bold; 
            color: #1e293b; 
            margin-bottom: 20px; 
            padding: 10px 0;
            border-bottom: 2px solid #e2e8f0;
            display: flex;
            align-items: center;
          }
          
          .section-title.almuerzo { border-color: #3b82f6; color: #1d4ed8; }
          .section-title.colacion { border-color: #10b981; color: #059669; }
          
          .section-title::before {
            content: '';
            width: 4px;
            height: 24px;
            margin-right: 12px;
            border-radius: 2px;
          }
          
          .section-title.almuerzo::before { background: #3b82f6; }
          .section-title.colacion::before { background: #10b981; }
          
          .menu-item { 
            border: 1px solid #e2e8f0; 
            margin-bottom: 20px; 
            border-radius: 8px; 
            overflow: hidden;
            background: white;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          
          .menu-item-header { 
            background: #f1f5f9; 
            padding: 15px 20px; 
            border-bottom: 1px solid #e2e8f0;
          }
          
          .menu-item-header.almuerzo { background: #dbeafe; }
          .menu-item-header.colacion { background: #d1fae5; }
          
          .menu-item-title { 
            font-size: 18px; 
            font-weight: bold; 
            margin: 0 0 5px 0;
          }
          
          .menu-item-title.almuerzo { color: #1d4ed8; }
          .menu-item-title.colacion { color: #059669; }
          
          .menu-item-code { 
            font-family: 'Courier New', monospace; 
            background: white; 
            padding: 4px 8px; 
            border-radius: 4px; 
            font-size: 14px; 
            font-weight: bold;
            display: inline-block;
          }
          
          .menu-item-quantity { 
            float: right; 
            font-size: 24px; 
            font-weight: bold; 
            color: #dc2626;
            background: white;
            padding: 5px 15px;
            border-radius: 20px;
            border: 2px solid #dc2626;
          }
          
          .menu-item-body { 
            padding: 20px; 
          }
          
          .breakdown-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 20px; 
          }
          
          .breakdown-section h4 { 
            font-size: 14px; 
            font-weight: bold; 
            color: #374151; 
            margin: 0 0 10px 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .breakdown-list { 
            list-style: none; 
            padding: 0; 
            margin: 0; 
          }
          
          .breakdown-item { 
            display: flex; 
            justify-content: space-between; 
            padding: 6px 0; 
            border-bottom: 1px solid #f1f5f9;
          }
          
          .breakdown-item:last-child { 
            border-bottom: none; 
          }
          
          .breakdown-label { 
            color: #64748b; 
          }
          
          .breakdown-value { 
            font-weight: bold; 
            color: #1e293b;
          }
          
          .totals-section { 
            background: #f8fafc; 
            border: 2px solid #e2e8f0; 
            border-radius: 8px; 
            padding: 20px; 
            margin-top: 30px;
          }
          
          .totals-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); 
            gap: 15px; 
          }
          
          .total-item { 
            text-align: center; 
            padding: 10px;
            background: white;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
          }
          
          .total-value { 
            font-size: 20px; 
            font-weight: bold; 
            color: #1e293b;
          }
          
          .total-label { 
            font-size: 12px; 
            color: #64748b; 
            margin-top: 5px;
          }
          
          .footer { 
            margin-top: 40px; 
            padding-top: 20px; 
            border-top: 1px solid #e2e8f0; 
            font-size: 12px; 
            color: #64748b; 
            text-align: center;
          }
          
          .no-items { 
            text-align: center; 
            padding: 40px; 
            color: #64748b; 
            font-style: italic;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🍽️ Lista de Preparación - Casino Escolar</h1>
          <div class="subtitle">
            <strong>${formattedDate}</strong>
          </div>
          <div class="subtitle">
            Generado por: ${adminUser?.firstName || 'Administrador'} ${adminUser?.lastName || ''} | ${currentDateTime}
          </div>
        </div>

        <div class="summary-cards">
          <div class="summary-card almuerzo">
            <div class="summary-value almuerzo">${summary.totals.totalAlmuerzos}</div>
            <div class="summary-label">Almuerzos Total</div>
          </div>
          <div class="summary-card colacion">
            <div class="summary-value colacion">${summary.totals.totalColaciones}</div>
            <div class="summary-label">Colaciones Total</div>
          </div>
          <div class="summary-card total">
            <div class="summary-value total">${summary.totals.totalItems}</div>
            <div class="summary-label">Items Total</div>
          </div>
        </div>

        ${summary.menuItems.almuerzos.length > 0 ? `
        <div class="section">
          <h2 class="section-title almuerzo">🍽️ ALMUERZOS</h2>
          ${summary.menuItems.almuerzos.map(item => `
            <div class="menu-item">
              <div class="menu-item-header almuerzo">
                <div class="menu-item-quantity">${item.quantity}</div>
                <div class="menu-item-title almuerzo">${item.name}</div>
                <div class="menu-item-code">${item.code}</div>
              </div>
              <div class="menu-item-body">
                <div class="breakdown-grid">
                  <div class="breakdown-section">
                    <h4>Por Tipo de Usuario</h4>
                    <ul class="breakdown-list">
                      <li class="breakdown-item">
                        <span class="breakdown-label">Estudiantes:</span>
                        <span class="breakdown-value">${item.userTypes.estudiante}</span>
                      </li>
                      <li class="breakdown-item">
                        <span class="breakdown-label">Funcionarios:</span>
                        <span class="breakdown-value">${item.userTypes.funcionario}</span>
                      </li>
                    </ul>
                  </div>
                  <div class="breakdown-section">
                    <h4>Por Curso</h4>
                    <ul class="breakdown-list">
                      ${Object.entries(item.courses).map(([course, count]) => `
                        <li class="breakdown-item">
                          <span class="breakdown-label">${course}:</span>
                          <span class="breakdown-value">${count}</span>
                        </li>
                      `).join('')}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
        ` : '<div class="section"><h2 class="section-title almuerzo">🍽️ ALMUERZOS</h2><div class="no-items">No hay almuerzos para este día</div></div>'}

        ${summary.menuItems.colaciones.length > 0 ? `
        <div class="section">
          <h2 class="section-title colacion">☕ COLACIONES</h2>
          ${summary.menuItems.colaciones.map(item => `
            <div class="menu-item">
              <div class="menu-item-header colacion">
                <div class="menu-item-quantity">${item.quantity}</div>
                <div class="menu-item-title colacion">${item.name}</div>
                <div class="menu-item-code">${item.code}</div>
              </div>
              <div class="menu-item-body">
                <div class="breakdown-grid">
                  <div class="breakdown-section">
                    <h4>Por Tipo de Usuario</h4>
                    <ul class="breakdown-list">
                      <li class="breakdown-item">
                        <span class="breakdown-label">Estudiantes:</span>
                        <span class="breakdown-value">${item.userTypes.estudiante}</span>
                      </li>
                      <li class="breakdown-item">
                        <span class="breakdown-label">Funcionarios:</span>
                        <span class="breakdown-value">${item.userTypes.funcionario}</span>
                      </li>
                    </ul>
                  </div>
                  <div class="breakdown-section">
                    <h4>Por Curso</h4>
                    <ul class="breakdown-list">
                      ${Object.entries(item.courses).map(([course, count]) => `
                        <li class="breakdown-item">
                          <span class="breakdown-label">${course}:</span>
                          <span class="breakdown-value">${count}</span>
                        </li>
                      `).join('')}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
        ` : '<div class="section"><h2 class="section-title colacion">☕ COLACIONES</h2><div class="no-items">No hay colaciones para este día</div></div>'}

        <div class="totals-section">
          <h3 style="margin: 0 0 20px 0; color: #1e293b;">📊 Resumen del Día</h3>
          <div class="totals-grid">
            <div class="total-item">
              <div class="total-value">${summary.totals.byUserType.estudiante}</div>
              <div class="total-label">Estudiantes</div>
            </div>
            <div class="total-item">
              <div class="total-value">${summary.totals.byUserType.funcionario}</div>
              <div class="total-label">Funcionarios</div>
            </div>
            ${Object.entries(summary.totals.byCourse).map(([course, count]) => `
              <div class="total-item">
                <div class="total-value">${count}</div>
                <div class="total-label">${course}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="footer">
          <p><strong>Casino Escolar</strong> - Lista de preparación generada automáticamente</p>
          <p>Este documento contiene la información necesaria para la preparación de alimentos del día</p>
        </div>
      </body>
      </html>
    `
  }

  static generateWeeklyKitchenPDF(summary: WeeklySummary, adminUser: { firstName?: string; lastName?: string }): string {
    const currentDateTime = format(new Date(), 'dd/MM/yyyy HH:mm')
    const weekStartFormatted = format(parseISO(summary.weekStart), "d 'de' MMMM", { locale: es })
    const weekEndFormatted = format(parseISO(summary.weekEnd), "d 'de' MMMM, yyyy", { locale: es })

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Resumen Semanal de Cocina - Casino Escolar</title>
        <style>
          @media print {
            body { margin: 0; }
            .page-break { page-break-before: always; }
          }
          
          body { 
            font-family: 'Arial', sans-serif; 
            margin: 20px; 
            line-height: 1.4;
            color: #333;
          }
          
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
          }
          
          .header h1 { 
            color: #1e40af; 
            margin: 0 0 10px 0; 
            font-size: 28px;
          }
          
          .week-summary { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 15px; 
            margin-bottom: 30px; 
          }
          
          .summary-card { 
            border: 2px solid #e2e8f0; 
            padding: 15px; 
            border-radius: 8px; 
            text-align: center;
            background: #f8fafc;
          }
          
          .summary-value { 
            font-size: 24px; 
            font-weight: bold; 
            color: #1d4ed8;
            margin: 5px 0;
          }
          
          .daily-breakdown { 
            margin-bottom: 40px; 
          }
          
          .day-section { 
            border: 1px solid #e2e8f0; 
            margin-bottom: 20px; 
            border-radius: 8px; 
            overflow: hidden;
          }
          
          .day-header { 
            background: #f1f5f9; 
            padding: 15px 20px; 
            font-weight: bold;
            font-size: 18px;
          }
          
          .day-content { 
            padding: 20px; 
          }
          
          .items-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 20px; 
          }
          
          .popular-items { 
            margin-top: 30px; 
          }
          
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 20px; 
          }
          
          th, td { 
            border: 1px solid #e2e8f0; 
            padding: 8px 12px; 
            text-align: left; 
          }
          
          th { 
            background: #f8fafc; 
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📊 Resumen Semanal de Cocina</h1>
          <p><strong>Semana del ${weekStartFormatted} al ${weekEndFormatted}</strong></p>
          <p>Generado por: ${adminUser?.firstName || 'Administrador'} ${adminUser?.lastName || ''} | ${currentDateTime}</p>
        </div>

        <div class="week-summary">
          <div class="summary-card">
            <div class="summary-value">${summary.weeklyTotals.totalOrders}</div>
            <div>Pedidos Totales</div>
          </div>
          <div class="summary-card">
            <div class="summary-value">${summary.weeklyTotals.totalItems}</div>
            <div>Items Totales</div>
          </div>
          <div class="summary-card">
            <div class="summary-value">${summary.weeklyTotals.totalAlmuerzos}</div>
            <div>Almuerzos</div>
          </div>
          <div class="summary-card">
            <div class="summary-value">${summary.weeklyTotals.totalColaciones}</div>
            <div>Colaciones</div>
          </div>
        </div>

        <div class="daily-breakdown">
          <h2>📅 Desglose Diario</h2>
          ${summary.dailySummaries.map(daily => `
            <div class="day-section">
              <div class="day-header">
                ${daily.dayName} - ${format(parseISO(daily.date), "d 'de' MMMM", { locale: es })} 
                (${daily.totals.totalItems} items)
              </div>
              <div class="day-content">
                <div class="items-grid">
                  <div>
                    <h4>🍽️ Almuerzos (${daily.totals.totalAlmuerzos})</h4>
                    ${daily.menuItems.almuerzos.length > 0 ? `
                      <ul>
                        ${daily.menuItems.almuerzos.map(item => `
                          <li><strong>${item.code}</strong> - ${item.name} (${item.quantity})</li>
                        `).join('')}
                      </ul>
                    ` : '<p><em>Sin almuerzos</em></p>'}
                  </div>
                  <div>
                    <h4>☕ Colaciones (${daily.totals.totalColaciones})</h4>
                    ${daily.menuItems.colaciones.length > 0 ? `
                      <ul>
                        ${daily.menuItems.colaciones.map(item => `
                          <li><strong>${item.code}</strong> - ${item.name} (${item.quantity})</li>
                        `).join('')}
                      </ul>
                    ` : '<p><em>Sin colaciones</em></p>'}
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="popular-items">
          <h2>🏆 Items Más Populares de la Semana</h2>
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Cantidad Total</th>
              </tr>
            </thead>
            <tbody>
              ${summary.weeklyTotals.popularItems.map(item => `
                <tr>
                  <td><strong>${item.code}</strong></td>
                  <td>${item.name}</td>
                  <td>${item.type === 'almuerzo' ? '🍽️ Almuerzo' : '☕ Colación'}</td>
                  <td><strong>${item.totalQuantity}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center;">
          <p><strong>Casino Escolar</strong> - Resumen semanal generado automáticamente</p>
        </div>
      </body>
      </html>
    `
  }

  private static extractCourseFromUser(user: { firstName: string; lastName: string; email: string }): string | null {
    // Intentar extraer curso del email o nombre
    // Esto es un ejemplo, deberías adaptarlo según tu estructura de datos
    const emailMatch = user.email.match(/(\d+[a-z]?)/i)
    if (emailMatch) {
      return emailMatch[1].toUpperCase()
    }
    
    // Si no se puede extraer, retornar null
    return null
  }

  static async generateAndDownloadDailyPDF(
    orders: AdminOrderView[], 
    targetDate: string, 
    adminUser: { firstName?: string; lastName?: string }
  ): Promise<void> {
    try {
      const summary = this.generateDailySummary(orders, targetDate)
      const htmlContent = this.generateKitchenPDF(summary, adminUser)
      
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(htmlContent)
        printWindow.document.close()
        printWindow.focus()
        setTimeout(() => {
          printWindow.print()
          printWindow.close()
        }, 250)
      }
    } catch (error) {
      console.error('Error generating daily PDF:', error)
      throw new Error('No se pudo generar el PDF del día')
    }
  }

  static async generateAndDownloadWeeklyPDF(
    orders: AdminOrderView[], 
    weekStart: string, 
    adminUser: { firstName?: string; lastName?: string }
  ): Promise<void> {
    try {
      const summary = this.generateWeeklySummary(orders, weekStart)
      const htmlContent = this.generateWeeklyKitchenPDF(summary, adminUser)
      
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(htmlContent)
        printWindow.document.close()
        printWindow.focus()
        setTimeout(() => {
          printWindow.print()
          printWindow.close()
        }, 250)
      }
    } catch (error) {
      console.error('Error generating weekly PDF:', error)
      throw new Error('No se pudo generar el PDF semanal')
    }
  }
}
