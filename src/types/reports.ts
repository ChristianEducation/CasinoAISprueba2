export interface ReportsFilters {
  dateRange: {
    start: string
    end: string
  }
  userType: 'all' | 'estudiante' | 'funcionario'
  orderStatus: 'all' | 'paid' | 'pending'
  menuType: 'all' | 'almuerzo' | 'colacion' | 'both'
}

export interface ReportsStats {
  totalOrders: number
  totalRevenue: number
  totalUsers: number
  totalMenuItems: number
  growthPercentage: number
  averageOrderValue: number
  conversionRate: number
}

export interface ChartDataPoint {
  date: string
  day: string
  orders: number
  revenue: number
  users: number
}

export interface MenuDistribution {
  name: string
  code: string
  count: number
  percentage: number
  revenue: number
  color: string
}

export interface UserTypeData {
  type: string
  orders: number
  revenue: number
  users: number
  percentage: number
}

export interface DailyMetrics {
  date: string
  dayName: string
  totalOrders: number
  totalRevenue: number
  uniqueUsers: number
  almuerzoOrders: number
  colacionOrders: number
  averageOrderValue: number
}

export interface ReportsData {
  stats: ReportsStats
  dailyData: ChartDataPoint[]
  revenueData: ChartDataPoint[]
  menuDistribution: MenuDistribution[]
  userTypeData: UserTypeData[]
  dailyMetrics: DailyMetrics[]
  topMenuItems: MenuDistribution[]
  isLoading: boolean
  lastUpdated: Date
}

export interface ExportOptions {
  format: 'pdf' | 'excel'
  includeCharts: boolean
  includeDetails: boolean
  filters: ReportsFilters
}

export interface ReportMetadata {
  generatedBy: string
  generatedAt: Date
  dateRange: string
  totalRecords: number
  filters: ReportsFilters
}
