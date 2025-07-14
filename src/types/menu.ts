import { MenuItem } from './panel'

export interface WeeklyMenuData {
  weekStart: string
  weekEnd: string
  days: DayMenuDisplay[]
  isLoading: boolean
  isEmpty: boolean
}

export interface MenuViewState {
  currentWeek: string
  isLoading: boolean
  error: string | null
  hasData: boolean
}

export interface MenuItemDisplay extends MenuItem {
  isHighlighted?: boolean
  nutritionalInfo?: {
    calories?: number
    protein?: string
    carbs?: string
    allergens?: string
  }
}

export interface DayMenuDisplay {
  date: string
  day: string
  dayLabel: string
  dateFormatted: string
  almuerzos: MenuItem[]
  colaciones: MenuItem[]
  hasItems: boolean
  isAvailable?: boolean
}

export interface WeekMenuDisplay {
  weekStart: string
  weekEnd: string
  weekLabel: string
  days: DayMenuDisplay[]
  totalItems: number
}

export type MenuLoadingState = 'idle' | 'loading' | 'success' | 'error'

export interface MenuError {
  type: 'network' | 'validation' | 'permission'
  message: string
  code: string
}

// Precios por tipo de usuario (importar desde panel.ts)
export { PRICES as MENU_PRICES } from './panel'

// Re-exportar tipos necesarios
export type { MenuItem } from './panel'