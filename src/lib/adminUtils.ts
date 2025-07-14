import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

interface AdminStats {
  pendingOrders: number
  totalRevenueWeek: number
}

interface WeekInfo {
  isMenuPublished: boolean
  orderDeadline: Date
}

interface SystemAlert {
  id: string
  type: 'warning' | 'error' | 'info' | 'success'
  title: string
  message: string
  priority: 'high' | 'medium' | 'low'
  actionText?: string
  actionUrl?: string
  createdAt: Date
  isRead: boolean
  dismissible: boolean
}

export function formatAdminCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

export function formatAdminDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, "d 'de' MMMM, yyyy", { locale: es })
}

export function formatAdminTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, 'HH:mm', { locale: es })
}

export function getAdminGreeting(firstName: string): string {
  const hour = new Date().getHours()
  
  if (hour < 12) {
    return `Buenos días, ${firstName}`
  } else if (hour < 18) {
    return `Buenas tardes, ${firstName}`
  } else {
    return `Buenas noches, ${firstName}`
  }
}

export function getStatCardColor(type: 'orders' | 'revenue' | 'users' | 'pending'): string {
  const colors = {
    orders: 'from-blue-500 to-blue-600',
    revenue: 'from-emerald-500 to-emerald-600',
    users: 'from-purple-500 to-purple-600',
    pending: 'from-amber-500 to-amber-600'
  }
  return colors[type]
}

export function getStatCardIcon(type: 'orders' | 'revenue' | 'users' | 'pending'): string {
  const icons = {
    orders: 'ShoppingCart',
    revenue: 'DollarSign',
    users: 'Users',
    pending: 'Clock'
  }
  return icons[type]
}

export function getAlertPriorityColor(priority: 'high' | 'medium' | 'low'): string {
  const colors = {
    high: 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300',
    medium: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300',
    low: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
  }
  return colors[priority]
}

export function getAlertIcon(type: 'warning' | 'error' | 'info' | 'success'): string {
  const icons = {
    warning: 'AlertTriangle',
    error: 'XCircle',
    info: 'Info',
    success: 'CheckCircle'
  }
  return icons[type]
}

export function calculateGrowthPercentage(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

export function formatGrowthPercentage(percentage: number): string {
  const sign = percentage >= 0 ? '+' : ''
  return `${sign}${percentage.toFixed(1)}%`
}

export function getGrowthColor(percentage: number): string {
  if (percentage > 0) return 'text-emerald-600 dark:text-emerald-400'
  if (percentage < 0) return 'text-red-600 dark:text-red-400'
  return 'text-slate-600 dark:text-slate-400'
}

export function generateSystemAlerts(stats: AdminStats, weekInfo: WeekInfo): SystemAlert[] {
  const alerts: Omit<SystemAlert, 'createdAt' | 'isRead' | 'dismissible'>[] = []
  const now = new Date()
  
  // Alerta si no hay menú publicado
  if (!weekInfo.isMenuPublished) {
    alerts.push({
      id: 'no-menu',
      type: 'warning',
      title: 'Menú no publicado',
      message: 'El menú de la semana actual no ha sido publicado. Los usuarios no pueden realizar pedidos.',
      priority: 'high',
      actionText: 'Publicar menú',
      actionUrl: '/admin/menus'
    })
  }
  
  // Alerta si hay muchos pedidos pendientes
  if (stats.pendingOrders > 10) {
    alerts.push({
      id: 'pending-orders',
      type: 'warning',
      title: 'Pedidos pendientes',
      message: `Hay ${stats.pendingOrders} pedidos pendientes de pago que requieren atención.`,
      priority: 'medium',
      actionText: 'Ver pedidos',
      actionUrl: '/admin/pedidos'
    })
  }
  
  // Alerta si la recaudación es baja
  if (stats.totalRevenueWeek < 100000) {
    alerts.push({
      id: 'low-revenue',
      type: 'info',
      title: 'Recaudación baja',
      message: 'La recaudación de esta semana está por debajo del promedio esperado.',
      priority: 'low',
      actionText: 'Ver reportes',
      actionUrl: '/admin/reportes'
    })
  }
  
  // Alerta de deadline próximo
  const timeToDeadline = weekInfo.orderDeadline.getTime() - now.getTime()
  const hoursToDeadline = timeToDeadline / (1000 * 60 * 60)
  
  if (hoursToDeadline > 0 && hoursToDeadline < 24) {
    alerts.push({
      id: 'deadline-soon',
      type: 'info',
      title: 'Deadline próximo',
      message: `El plazo para realizar pedidos vence en ${Math.round(hoursToDeadline)} horas.`,
      priority: 'medium'
    })
  }
  
  return alerts.map(alert => ({
    ...alert,
    createdAt: now,
    isRead: false,
    dismissible: true
  }))
}
