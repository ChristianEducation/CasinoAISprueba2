"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/app/lib/firebase'
import { User } from '@/types/panel'

interface ChildData {
  id?: string
  name?: string
  nombre?: string
  curso?: string
  class?: string
  rut?: string
  active?: boolean
  age?: number
  edad?: number
  level?: string
}

interface UseAuthReturn {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}

export default function useAuth(): UseAuthReturn {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
          if (userDoc.exists()) {
            const userData = userDoc.data()
            
            // Mapear y limpiar los datos de los hijos
            const children = (userData.children || userData.hijos || []).map((child: ChildData) => ({
              id: child.id || Date.now().toString(),
              name: child.name || child.nombre || '',
              curso: child.curso || child.class || '',
              rut: child.rut || null, // Usar null en lugar de undefined
              active: child.active !== undefined ? child.active : true,
              age: child.age || child.edad || 0,
              edad: child.edad || child.age || 0,
              level: child.level || 'Lower School'
            })).filter((child: ChildData & { name: string }) => child.name.trim() !== '')
            
            // Mapear los datos del usuario al formato esperado
            const mappedUser: User = {
              id: firebaseUser.uid,
              email: userData.email || firebaseUser.email || '',
              firstName: userData.firstName || userData.nombre || '',
              lastName: userData.lastName || userData.apellido || '',
              tipoUsuario: userData.tipoUsuario || userData.userType || 'apoderado',
              children: children,
              active: userData.active !== false,
              createdAt: userData.createdAt?.toDate() || new Date(),
              phone: userData.phone || null // Usar null en lugar de undefined
            }
            
            setUser(mappedUser)
          } else {
            // Usuario no encontrado en Firestore
            setUser(null)
            router.push('/auth/registro')
          }
        } catch (error) {
          console.error('Error al obtener datos del usuario:', error)
          setUser(null)
          router.push('/auth/login')
        }
      } else {
        setUser(null)
        router.push('/auth/login')
      }
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [router])

  return {
    user,
    isLoading,
    isAuthenticated: !!user
  }
}