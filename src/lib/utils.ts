import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper para crear fecha local desde string YYYY-MM-DD sin problemas de zona horaria
export function createLocalDate(dateString: string): Date {
  try {
    const [year, month, day] = dateString.split('-').map(Number)
    if (!year || !month || !day || month < 1 || month > 12 || day < 1 || day > 31) {
      throw new Error(`Invalid date components: ${dateString}`)
    }
    
    // Crear fecha local (sin conversión de zona horaria)
    const date = new Date(year, month - 1, day)
    
    // Verificar que la fecha creada es válida
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date created: ${dateString}`)
    }
    
    return date
  } catch (error) {
    console.error('Error creating local date:', dateString, error)
    // Último recurso: fecha actual
    return new Date()
  }
}

// Helper para formatear fecha local a formato abreviado
export function formatDateShort(dateString: string): string {
  try {
    const date = createLocalDate(dateString)
    return date.toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'short'
    })
  } catch (error) {
    console.error('Error formatting date short:', dateString, error)
    return dateString
  }
}