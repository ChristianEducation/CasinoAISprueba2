// Tipos para niveles educativos
export type SchoolLevel = 'Pre School' | 'Lower School' | 'Middle School' | 'High School'

// Constantes para niveles educativos
export const SCHOOL_LEVELS: SchoolLevel[] = [
  'Pre School',
  'Lower School', 
  'Middle School',
  'High School'
]

// Configuración de cursos por nivel
export const COURSE_CONFIG: Record<SchoolLevel, {
  label: string
  description: string
  grades: string[]
  sections: string[]
}> = {
  'Pre School': {
    label: 'Pre School',
    description: 'Educación Preescolar',
    grades: ['Pre-K', 'Kinder'],
    sections: ['A', 'B', 'C']
  },
  'Lower School': {
    label: 'Lower School',
    description: 'Educación Básica (1° a 6°)',
    grades: ['1°', '2°', '3°', '4°', '5°', '6°'],
    sections: ['A', 'B', 'C', 'D']
  },
  'Middle School': {
    label: 'Middle School', 
    description: 'Educación Básica (7° y 8°)',
    grades: ['7°', '8°'],
    sections: ['A', 'B', 'C']
  },
  'High School': {
    label: 'High School',
    description: 'Educación Media (1° a 4°)',
    grades: ['1°', '2°', '3°', '4°'],
    sections: ['A', 'B', 'C']
  }
}

// Función para obtener información de un nivel
export function getSchoolLevelInfo(level: SchoolLevel) {
  const config = COURSE_CONFIG[level]
  if (!config) {
    console.warn(`School level not found: ${level}`)
    return COURSE_CONFIG['Lower School'] // Fallback
  }
  return config
}

// Función para obtener todos los cursos posibles de un nivel (solo como sugerencias)
export function getCoursesForLevel(level: SchoolLevel): string[] {
  const config = COURSE_CONFIG[level]
  if (!config) {
    console.warn(`School level not found: ${level}`)
    return ['1° A'] // Fallback
  }
  
  const courses: string[] = []
  
  config.grades.forEach(grade => {
    config.sections.forEach(section => {
      courses.push(`${grade} ${section}`)
    })
  })
  
  return courses
}

// Función para validar formato de curso - AHORA MÁS FLEXIBLE
export function validateCourseFormat(curso: string): boolean {
  // Solo validar que no esté vacío
  return !!(curso && curso.trim().length > 0)
}

// Función para generar sugerencias de curso basadas en el nivel
export function getCourseOptions(level: SchoolLevel): Array<{ value: string; label: string }> {
  const courses = getCoursesForLevel(level)
  return courses.map(course => ({
    value: course,
    label: course
  }))
}

// Función para obtener el nivel basado en un curso (útil para migración)
export function getLevelFromCourse(curso: string): SchoolLevel | null {
  const trimmedCourse = curso.trim()
  
  // Pre School
  if (trimmedCourse.toLowerCase().includes('pre-k') || 
      trimmedCourse.toLowerCase().includes('kinder') ||
      trimmedCourse.toLowerCase().includes('prekinder') ||
      trimmedCourse.toLowerCase().includes('pre kinder')) {
    return 'Pre School'
  }
  
  // Extraer número del grado
  const gradeMatch = trimmedCourse.match(/(\d+)/)
  if (gradeMatch) {
    const grade = parseInt(gradeMatch[1])
    
    if (grade >= 1 && grade <= 6) {
      return 'Lower School'
    } else if (grade >= 7 && grade <= 8) {
      return 'Middle School'
    } else if (grade >= 9 && grade <= 12) {
      return 'High School'
    }
  }
  
  // Si contiene "Medio" o "Media", es High School
  if (trimmedCourse.toLowerCase().includes('medio') || 
      trimmedCourse.toLowerCase().includes('media')) {
    return 'High School'
  }
  
  // Si contiene "Básico", determinar por número
  if (trimmedCourse.toLowerCase().includes('básico')) {
    const gradeMatch = trimmedCourse.match(/(\d+)/)
    if (gradeMatch) {
      const grade = parseInt(gradeMatch[1])
      if (grade >= 1 && grade <= 6) {
        return 'Lower School'
      } else if (grade >= 7 && grade <= 8) {
        return 'Middle School'
      }
    }
  }
  
  // Por defecto, asumir Lower School si no se puede determinar
  return 'Lower School'
}

// Función para migrar curso del formato antiguo al nuevo
export function migrateCourseFormat(oldCourse: string, currentLevel?: SchoolLevel): { curso: string; level: SchoolLevel } {
  const trimmedCourse = oldCourse.trim()
  
  // Si ya tenemos un nivel válido y el curso no está vacío, usar tal como está
  if (currentLevel && SCHOOL_LEVELS.includes(currentLevel) && trimmedCourse) {
    return { curso: trimmedCourse, level: currentLevel }
  }
  
  // Si no hay curso, usar valores por defecto
  if (!trimmedCourse) {
    return {
      curso: '',
      level: currentLevel || 'Lower School'
    }
  }
  
  // Intentar detectar el nivel automáticamente si no se proporciona
  const detectedLevel = currentLevel || getLevelFromCourse(trimmedCourse) || 'Lower School'
  
  return {
    curso: trimmedCourse,
    level: detectedLevel
  }
}

// Función para obtener el label amigable de un nivel
export function getSchoolLevelLabel(level: SchoolLevel): string {
  const config = getSchoolLevelInfo(level)
  return config.label
}

// Función para obtener la descripción de un nivel
export function getSchoolLevelDescription(level: SchoolLevel): string {
  const config = getSchoolLevelInfo(level)
  return config.description
}