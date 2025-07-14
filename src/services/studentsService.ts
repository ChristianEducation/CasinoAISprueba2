// src/services/studentsService.ts
import { db } from '@/app/lib/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'

export interface Student {
  id: string
  name: string
  curso: string
  level: string
  age: number
  edad: number
  active: boolean
  rut?: string
}

// Alias para mantener compatibilidad con el código del registro
export type StudentRecord = Student

const studentsCol = collection(db, 'students')

/** Devuelve todos los niveles únicos registrados en students */
export async function getLevels(): Promise<string[]> {
  const snap = await getDocs(studentsCol)
  const levels = snap.docs.map(d => (d.data() as Student).level)
  return Array.from(new Set(levels)).sort()
}

/** Dado un nivel, devuelve todos los cursos (grado+letra) únicos */
export async function getCursosByLevel(level: string): Promise<string[]> {
  const q = query(studentsCol, where('level', '==', level))
  const snap = await getDocs(q)
  const cursos = snap.docs.map(d => (d.data() as Student).curso)
  return Array.from(new Set(cursos)).sort()
}

/** Dado nivel y curso, devuelve la lista de estudiantes */
export async function getStudentsByLevelAndCurso(
  level: string,
  curso: string
): Promise<Student[]> {
  const q = query(
    studentsCol,
    where('level', '==', level),
    where('curso', '==', curso)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => {
    const data = d.data() as Student
    return {
      id: d.id,
      name: data.name,
      curso: data.curso,
      level: data.level,
      age: data.age,
      edad: data.edad,
      active: data.active,
      rut: data.rut
    }
  })
}
