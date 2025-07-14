export interface AdminUser {
  id: string
  firstName: string
  lastName: string
  email: string
  role: 'funcionario' | 'apoderado' | 'admin' | 'super_admin'
  userType: 'funcionario' | 'apoderado'
  emailVerified: boolean
  createdAt: Date
  lastLogin?: Date
  phone?: string
  isActive: boolean
  children?: AdminUserChild[]
  ordersCount: number
  lastOrderDate?: Date
  // Nuevos campos para funcionarios
  dondeRetira?: 'casino_basica' | 'casino_media' | 'preschool'
  cursoPreschool?: string // Solo si dondeRetira es 'preschool'
}

export interface AdminUserChild {
  id: string
  name: string
  age: number
  class: string
  level: 'Pre School' | 'Lower School' | 'Middle School' | 'High School'
  rut?: string
}

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  userType: 'funcionario' | 'apoderado'
  tipoUsuario: 'funcionario' | 'apoderado'
  children?: Child[]
  isActive: boolean
  createdAt: Date
  phone?: string
  // Nuevos campos para funcionarios
  dondeRetira?: 'casino_basica' | 'casino_media' | 'preschool'
  cursoPreschool?: string // Solo si dondeRetira es 'preschool'
}

export interface Child {
  id: string
  name: string
  curso: string
  rut?: string
  active: boolean
  age?: number
  edad?: number
  level?: 'Pre School' | 'Lower School' | 'Middle School' | 'High School'
}

export type UserType = 'apoderado' | 'funcionario'

// Nuevos tipos para opciones de funcionarios
export type DondeRetiraOption = 'casino_basica' | 'casino_media' | 'preschool'

export interface DondeRetiraConfig {
  value: DondeRetiraOption
  label: string
  description: string
}

// Cursos de preschool (playgroup a primero básico)
export const CURSOS_PRESCHOOL = [
  'Playgroup',
  'Pre-Kinder',
  'Kinder',
  'Primero Básico'
] as const

export type CursoPreschool = typeof CURSOS_PRESCHOOL[number]