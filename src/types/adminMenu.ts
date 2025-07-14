export interface AdminMenuItem {
  id?: string
  code: string
  title: string
  description?: string
  type: 'almuerzo' | 'colacion'
  date: string
  day: string
  weekStart: string
  active: boolean
  published: boolean
  price?: number
  createdAt?: Date
  updatedAt?: Date
}

export interface AdminDayMenu {
  date: string
  day: string
  dayName: string
  almuerzos: AdminMenuItem[]
  colaciones: AdminMenuItem[]
  isEditable: boolean
}

export interface AdminWeekMenu {
  weekStart: string
  weekEnd: string
  weekLabel: string
  days: AdminDayMenu[]
  isPublished: boolean
  totalItems: number
}

export interface MenuFormData {
  type: 'almuerzo' | 'colacion'
  code: string
  title: string
  description?: string
  active: boolean
  price?: number
}

export interface WeekNavigation {
  currentWeek: string
  canGoBack: boolean
  canGoForward: boolean
  weekLabel: string
}

export interface MenuValidationError {
  field: string
  message: string
}

export interface MenuOperationResult<T = unknown> {
  success: boolean
  message: string
  data?: T
  errors?: MenuValidationError[]
}

export type MenuModalMode = 'create' | 'edit' | 'view'

export interface MenuModalState {
  isOpen: boolean
  mode: MenuModalMode
  item?: AdminMenuItem
  date: string
  day: string
  type?: 'almuerzo' | 'colacion'
}

// Configuración del menú de colaciones predeterminado
export interface DefaultColacionConfig {
  code: string
  title: string
  description?: string
  price: number
  active: boolean
}

export const DEFAULT_COLACIONES: DefaultColacionConfig[] = [
  {
    code: 'C1',
    title: 'Yogurt con Granola',
    description: 'Yogurt natural con granola casera + Jugo natural 200cc',
    price: 3100,
    active: true
  },
  {
    code: 'C2', 
    title: 'Yogurt Saludable',
    description: 'Yogurt con granola + Agua saborizada natural 200cc',
    price: 3100,
    active: true
  },
  {
    code: 'C3',
    title: 'Sándwich de Ave',
    description: 'Miga de ave con mayonesa casera + Jugo natural 200cc',
    price: 2800,
    active: true
  },
  {
    code: 'C4',
    title: 'Sándwich Aliado',
    description: 'Jamón de pavo y queso fresco + Leche semidescremada 200cc',
    price: 2850,
    active: true
  },
  {
    code: 'C5',
    title: 'Barra de Cereal',
    description: 'Barra de cereal saludable + Jugo natural 200cc',
    price: 1500,
    active: true
  },
  {
    code: 'C6',
    title: 'Cereal con Leche',
    description: 'Barra de cereal saludable + Leche semidescremada 200cc',
    price: 1800,
    active: true
  }
]