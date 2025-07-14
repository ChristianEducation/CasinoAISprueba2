import { OrderState } from './order'

export interface AdminOrderView extends OrderState {
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    userType: 'estudiante' | 'funcionario'
  }
  status: 'draft' | 'pending' | 'cancelled' | 'paid'
  dayName: string
  formattedDate: string
  itemsCount: number
  hasColaciones: boolean
  paidAt?: Date
  cancelledAt?: Date
  daysSincePending?: number
  itemsSummary: {
    totalAlmuerzos: number
    totalColaciones: number
    almuerzosPrice: number
    colacionesPrice: number
    itemsDetail: Array<{
      date: string
      dayName: string
      almuerzo?: {
        code: string
        name: string
        price: number
      }
      colacion?: {
        code: string
        name: string
        price: number
      }
    }>
  }
}

export interface OrderFilters {
  weekStart?: string
  day?: string
  userType?: 'estudiante' | 'funcionario' | 'all'
  status?: 'pending' | 'paid' | 'cancelled' | 'all'
  searchTerm?: string
}

export interface OrderMetrics {
  totalOrders: number
  totalRevenue: number
  totalByDay: Record<string, number>
  totalByUserType: Record<string, number>
  averageOrderValue: number
  pendingOrders: number
  paidOrders: number
  cancelledOrders: number
  criticalPendingOrders: number
  totalByStatus: {
    pending: number
    paid: number
    cancelled: number
  }
  revenueByStatus: {
    pending: number
    paid: number
    cancelled: number
  }
  itemsMetrics: {
    totalAlmuerzos: number
    totalColaciones: number
    averageItemsPerOrder: number
    mostPopularItems: Array<{
      code: string
      name: string
      type: 'almuerzo' | 'colacion'
      count: number
      revenue: number
    }>
  }
  weeklyTrends: {
    ordersGrowth: number
    revenueGrowth: number
    conversionRate: number
  }
}

export interface WeekOption {
  value: string
  label: string
  start: Date
  end: Date
  isCurrent: boolean
}

export interface DayOption {
  value: string
  label: string
  date: string
}

export interface ExportOptions {
  format: 'excel' | 'pdf'
  includeDetails: boolean
  groupByDay: boolean
}

export interface OrderUpdateRequest {
  orderId: string
  status?: 'pending' | 'paid' | 'cancelled'
  notes?: string
}

export interface OrderDetailView extends Omit<AdminOrderView, 'selections'> {
  selections: Array<{
    date: string
    dayName: string
    almuerzo?: {
      code: string
      name: string
      price: number
      description?: string
    }
    colacion?: {
      code: string
      name: string
      price: number
      description?: string
    }
  }>
  paymentHistory: Array<{
    date: Date
    status: string
    amount: number
    method?: string
  }>
  financialSummary: {
    subtotalAlmuerzos: number
    subtotalColaciones: number
    totalItems: number
    averageItemPrice: number
    discounts?: number
    taxes?: number
  }
}
