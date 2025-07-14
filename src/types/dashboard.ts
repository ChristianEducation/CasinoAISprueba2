export interface DashboardUser {
  id: string
  firstName: string
  lastName: string
  email: string
  userType: 'funcionario' | 'apoderado'
  tipoUsuario: 'funcionario' | 'apoderado'
  active: boolean
  createdAt: Date
  children?: Array<{
    id: string
    name: string
    age: number
    class: string
    level: 'Pre School' | 'Lower School' | 'Middle School' | 'High School'
    curso: string
    rut?: string
    active: boolean
  }>
}

export interface OrderStatus {
  status: 'not_started' | 'in_progress' | 'confirmed' | 'paid'
  daysSelected: number
  totalDays: number
  lastModified?: Date
  paymentDeadline?: Date
}

export interface EconomicSummary {
  selectedDays: number
  estimatedTotal: number
  lunchPrice: number
  snackPrice: number
  totalLunches: number
  totalSnacks: number
}

export interface WeeklyMenuInfo {
  isPublished: boolean
  weekStart?: string
  weekEnd?: string
  publishedAt?: Date
  lastUpdated?: Date
}

export interface DashboardAlert {
  id: string
  type: 'warning' | 'info' | 'error' | 'success'
  title: string
  message: string
  actionText?: string
  actionUrl?: string
  dismissible: boolean
  priority: 'high' | 'medium' | 'low'
}

export interface DashboardData {
  user: DashboardUser
  orderStatus: OrderStatus
  economicSummary: EconomicSummary
  weeklyMenuInfo: WeeklyMenuInfo
  alerts: DashboardAlert[]
  isLoading: boolean
}