import { MenuItem, OrderSelection } from './panel'

export interface WeekInfo {
  weekStart: string
  weekEnd: string
  weekNumber: number
  year: number
  isCurrentWeek: boolean
  isOrderingAllowed: boolean
  orderDeadline: Date
  weekLabel: string
}

export interface OrderState {
  id?: string
  userId: string
  weekStart: string
  selections: OrderSelection[]
  total: number
  status: 'draft' | 'pending' | 'paid' | 'cancelled'
  createdAt: Date
  paidAt?: Date
  paymentId?: string
}

export interface NetGetPaymentRequest {
  amount: number
  orderId: string
  description: string
  customerEmail: string
  customerName: string
  returnUrl?: string
  notifyUrl?: string
}

// Actualizar para que coincida con DayMenuDisplay de menu.ts
export interface DayMenuOptions {
  date: string
  day: string
  dayLabel: string
  dateFormatted: string
  almuerzos: MenuItem[]
  colaciones: MenuItem[]
  hasItems: boolean
  isAvailable: boolean
}

export interface OrderValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
  missingDays: string[]
  canProceedToPayment: boolean
}

export interface PaymentRequest {
  orderId: string
  amount: number
  currency?: 'CLP'
  description: string
  userEmail: string
  customerName?: string
  returnUrl?: string
  cancelUrl?: string
}

export interface PaymentResponse {
  success: boolean
  paymentId?: string
  redirectUrl?: string
  error?: string
}

export type OrderStep = 'selecting' | 'reviewing' | 'paying' | 'completed' | 'error'

export interface OrderProgress {
  currentStep: OrderStep
  completedSteps: OrderStep[]
  canGoBack: boolean
  canProceed: boolean
}