import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { AdminMenuItem, AdminWeekMenu } from '@/types/adminMenu'

export function formatMenuDate(date: string): string {
  return format(new Date(date), 'EEEE d', { locale: es })
}

export function formatWeekRange(weekStart: string, weekEnd: string): string {
  const start = new Date(weekStart)
  const end = new Date(weekEnd)
  return `Del ${format(start, 'd')} al ${format(end, 'd')} de ${format(end, 'MMMM yyyy', { locale: es })}`
}

export function generateMenuCode(type: 'almuerzo' | 'colacion', existingCodes: string[]): string {
  const prefix = type === 'almuerzo' ? 'A' : 'C'
  let counter = 1
  
  while (existingCodes.includes(`${prefix}${counter}`)) {
    counter++
  }
  
  return `${prefix}${counter}`
}

export function validateMenuCode(code: string): boolean {
  const pattern = /^[AC]\d{1,2}$/
  return pattern.test(code)
}

export function getMenuTypeLabel(type: 'almuerzo' | 'colacion'): string {
  return type === 'almuerzo' ? 'Almuerzo' : 'Colación'
}

export function getMenuTypeColor(type: 'almuerzo' | 'colacion'): {
  bg: string
  text: string
  border: string
} {
  if (type === 'almuerzo') {
    return {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-200 dark:border-blue-800'
    }
  }
  
  return {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800'
  }
}

export function sortMenuItems(items: AdminMenuItem[]): AdminMenuItem[] {
  return items.sort((a, b) => {
    // Primero por tipo (almuerzos antes que colaciones)
    if (a.type !== b.type) {
      return a.type === 'almuerzo' ? -1 : 1
    }
    
    // Luego por código
    return a.code.localeCompare(b.code)
  })
}

export function getWeekSummary(weekMenu: AdminWeekMenu): {
  totalAlmuerzos: number
  totalColaciones: number
  activeDays: number
  totalActiveItems: number
} {
  let totalAlmuerzos = 0
  let totalColaciones = 0
  let activeDays = 0
  let totalActiveItems = 0
  
  weekMenu.days.forEach(day => {
    const dayAlmuerzos = day.almuerzos.length
    const dayColaciones = day.colaciones.length
    
    totalAlmuerzos += dayAlmuerzos
    totalColaciones += dayColaciones
    
    if (dayAlmuerzos > 0 || dayColaciones > 0) {
      activeDays++
    }
    
    totalActiveItems += day.almuerzos.filter(item => item.active).length
    totalActiveItems += day.colaciones.filter(item => item.active).length
  })
  
  return {
    totalAlmuerzos,
    totalColaciones,
    activeDays,
    totalActiveItems
  }
}

export function exportWeekMenuToCSV(weekMenu: AdminWeekMenu): string {
  const headers = ['Fecha', 'Día', 'Tipo', 'Código', 'Descripción', 'Estado']
  const rows = [headers.join(',')]
  
  weekMenu.days.forEach(day => {
    [...day.almuerzos, ...day.colaciones].forEach(item => {
      const row = [
        day.date,
        day.dayName,
        getMenuTypeLabel(item.type),
        item.code,
        `"${item.description}"`,
        item.active ? 'Activo' : 'Inactivo'
      ]
      rows.push(row.join(','))
    })
  })
  
  return rows.join('\n')
}

export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

export function getEmptyDayMessage(type: 'almuerzo' | 'colacion'): string {
  return type === 'almuerzo' 
    ? 'No hay almuerzos configurados para este día'
    : 'No hay colaciones configuradas para este día'
}

export function getMenuItemStatusBadge(active: boolean): {
  variant: 'default' | 'secondary' | 'destructive'
  text: string
  className: string
} {
  if (active) {
    return {
      variant: 'default',
      text: 'Activo',
      className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
    }
  }
  
  return {
    variant: 'secondary',
    text: 'Inactivo',
    className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
  }
}
