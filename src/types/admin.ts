export interface AdminUser {
  id: string
  firstName: string
  lastName: string
  email: string
  role: 'admin' | 'super_admin'
  createdAt: Date
  lastLogin?: Date
}

export interface AdminStats {
  totalOrdersWeek: number
  totalStudentsWithOrder: number
  totalStaffWithOrder: number
  totalRevenueWeek: number
  pendingOrders: number
  paidOrders: number
  averageOrderValue: number
  popularMenuItems: MenuPopularity[]
}

export interface MenuPopularity {
  itemCode: string
  itemName: string
  orderCount: number
  percentage: number
}

export interface WeeklyOrderData {
  date: string
  day: string
  orderCount: number
  revenue: number
}

export interface UserTypeStats {
  estudiantes: {
    total: number
    withOrders: number
    revenue: number
  }
  funcionarios: {
    total: number
    withOrders: number
    revenue: number
  }
}

export interface SystemAlert {
  id: string
  type: 'warning' | 'error' | 'info' | 'success'
  title: string
  message: string
  priority: 'high' | 'medium' | 'low'
  createdAt: Date
  isRead: boolean
  actionUrl?: string
  actionText?: string
  dismissible?: boolean
}

export interface AdminDashboardData {
  stats: AdminStats
  weeklyData: WeeklyOrderData[]
  userTypeStats: UserTypeStats
  alerts: SystemAlert[]
  currentWeek: {
    start: string
    end: string
    isMenuPublished: boolean
    orderDeadline: Date
  }
  isLoading: boolean
  lastUpdated: Date
}

export interface QuickAction {
  id: string
  title: string
  description: string
  href: string
  icon: string
  color: string
  bgColor: string
  count?: number
}
