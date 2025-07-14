"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/app/lib/firebase'
import { AdminUser } from '@/types/admin'

interface UseAdminAuthReturn {
  adminUser: AdminUser | null
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
}

export function useAdminAuth(): UseAdminAuthReturn {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      setIsLoading(true)
      
      if (!firebaseUser) {
        setAdminUser(null)
        setIsLoading(false)
        router.push('/auth/login')
        return
      }

      try {
        // Verificar si el usuario existe en Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid)
        const userDoc = await getDoc(userDocRef)
        
        if (!userDoc.exists()) {
          setAdminUser(null)
          setIsLoading(false)
          router.push('/auth/registro')
          return
        }

        const userData = userDoc.data()
        
        // Verificar si el usuario tiene rol de administrador
        if (userData.role !== 'admin' && userData.role !== 'super_admin') {
          setAdminUser(null)
          setIsLoading(false)
          router.push('/panel') // Redirigir al panel normal
          return
        }

        // Usuario es administrador válido
        const adminUserData: AdminUser = {
          id: firebaseUser.uid,
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: firebaseUser.email || '',
          role: userData.role,
          createdAt: userData.createdAt?.toDate() || new Date(),
          lastLogin: new Date()
        }

        setAdminUser(adminUserData)
        
        // Actualizar último login
        // await updateDoc(userDocRef, { lastLogin: new Date() })
        
      } catch (error) {
        console.error('Error verificando usuario administrador:', error)
        setAdminUser(null)
        router.push('/auth/login')
      } finally {
        setIsLoading(false)
      }
    })

    return () => unsubscribe()
  }, [router])

  return {
    adminUser,
    isLoading,
    isAuthenticated: !!adminUser,
    isAdmin: !!adminUser && (adminUser.role === 'admin' || adminUser.role === 'super_admin')
  }
}
