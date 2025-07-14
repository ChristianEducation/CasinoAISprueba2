export interface AdminUserView {
  id: string
  firstName: string
  lastName: string
  email: string
  role: 'funcionario' | 'estudiante' | 'admin' | 'super_admin' | 'apoderado'
  userType: 'funcionario' | 'estudiante' | 'apoderado'
  emailVerified: boolean
  createdAt: Date
  lastLogin?: Date
  phone?: string
  isActive: boolean
  children?: AdminUserChild[]
  ordersCount: number
  lastOrderDate?: Date
}

export interface AdminUserChild {
  id: string
  name: string
  age: number
  class: string
  level: 'Pre School' | 'Lower School' | 'Middle School' | 'High School'
}

export interface UserFilters {
  role?: 'funcionario' | 'estudiante' | 'admin' | 'apoderado' | 'all'
  emailVerified?: boolean | 'all'
  dateRange?: 'week' | 'month' | 'custom'
  customStartDate?: string
  customEndDate?: string
  searchTerm?: string
  isActive?: boolean | 'all'
}

export interface UserStats {
  totalUsers: number
  funcionarios: number
  apoderados: number
  estudiantes: number
  admins: number
  verifiedEmails: number
  unverifiedEmails: number
  activeUsers: number
  newUsersThisWeek: number
  newUsersThisMonth: number
}

export interface UserDetailView extends AdminUserView {
  recentOrders: UserOrderSummary[]
  totalSpent: number
  averageOrderValue: number
  registrationSource: string
}

export interface UserOrderSummary {
  id: string
  weekStart: string
  total: number
  status: 'pending' | 'paid' | 'cancelled'
  createdAt: Date
  itemsCount: number
}

export interface UserUpdateRequest {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  role?: 'funcionario' | 'estudiante' | 'admin' | 'super_admin' | 'apoderado'
  isActive?: boolean
}

export interface UserActionResult {
  success: boolean
  message: string
  error?: string
}

export type SortField = 'firstName' | 'email' | 'role' | 'createdAt' | 'lastLogin' | 'ordersCount'
export type SortDirection = 'asc' | 'desc'

export interface UserSortConfig {
  field: SortField
  direction: SortDirection
}