import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { OrderStatus, EconomicSummary } from '@/types/dashboard'

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

export function getOrderStatusInfo(status: OrderStatus) {
  const statusConfig = {
    not_started: {
      label: 'Sin iniciar',
      description: 'Comienza seleccionando los días que deseas almorzar esta semana',
      color: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-600',
      iconName: 'Clock',
      actionText: 'Comenzar selección'
    },
    in_progress: {
      label: 'En progreso',
      description: `Continúa completando tu selección semanal`,
      color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
      iconName: 'Edit',
      actionText: 'Continuar selección'
    },
    confirmed: {
      label: 'Listo para pagar',
      description: 'Tu selección está completa. Procede al pago para confirmar tu pedido',
      color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
      iconName: 'CheckCircle',
      actionText: 'Proceder al pago'
    },
    paid: {
      label: 'Pedido confirmado',
      description: 'Tu pedido está completo y confirmado. Los almuerzos serán servidos según tu selección',
      color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
      iconName: 'Package',
      actionText: 'Ver detalles'
    }
  }

  return statusConfig[status.status] || statusConfig.not_started
}

export function getWeekDateRange(weekStart: string, weekEnd: string): string {
  const start = parseISO(weekStart)
  const end = parseISO(weekEnd)
  
  return `Del ${format(start, 'dd')} al ${format(end, 'dd')} de ${format(end, 'MMMM', { locale: es })}`
}

export function getGreetingMessage(firstName: string): string {
  const hour = new Date().getHours()
  
  if (hour < 12) {
    return `Buenos días, ${firstName}`
  } else if (hour < 18) {
    return `Buenas tardes, ${firstName}`
  } else {
    return `Buenas noches, ${firstName}`
  }
}

export function getUserTypeLabel(userType: 'funcionario' | 'apoderado'): string {
  return userType === 'funcionario' ? 'Funcionario' : 'Apoderado'
}

export function getUserTypeBadgeColor(userType: 'funcionario' | 'apoderado'): string {
  return userType === 'funcionario' 
    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
}

export function getAlertIconName(type: 'warning' | 'info' | 'error' | 'success'): string {
  const icons = {
    warning: 'AlertTriangle',
    info: 'Info',
    error: 'XCircle',
    success: 'CheckCircle'
  }
  return icons[type]
}

export function getAlertColor(type: 'warning' | 'info' | 'error' | 'success'): string {
  const colors = {
    warning: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300',
    success: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
  }
  return colors[type]
}

export function calculateProjectedTotal(economicSummary: EconomicSummary, remainingDays: number): number {
  // Proyección asumiendo que se seleccionará almuerzo para los días restantes
  const projectedLunches = economicSummary.totalLunches + remainingDays
  const projectedTotal = (projectedLunches * economicSummary.lunchPrice) + 
                        (economicSummary.totalSnacks * economicSummary.snackPrice)
  return projectedTotal
}

export function getProgressPercentage(current: number, total: number): number {
  return Math.round((current / total) * 100)
}