"use client"

import { useState, useEffect } from 'react'
import { updateProfile, updateEmail, sendEmailVerification } from 'firebase/auth'
import { auth } from '@/app/lib/firebase'
import useAuth from '@/hooks/useAuth'
import { SchoolLevel, migrateCourseFormat, SCHOOL_LEVELS } from '@/lib/courseUtils'
import { fetchUserProfile, updateUserProfile } from '@/services/profileService'

interface ProfileFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
}

export interface ExtendedChild {
  id: string
  name: string
  curso: string
  active: boolean
  edad: number
  age: number
  level: SchoolLevel
}

interface UseProfileFormReturn {
  formData: ProfileFormData
  children: ExtendedChild[]
  isLoading: boolean
  isSaving: boolean
  hasChanges: boolean
  emailVerified: boolean
  errors: Record<string, string>
  isResendingVerification: boolean
  canResendVerification: boolean
  resendCooldownTime: number
  updateFormData: (field: keyof ProfileFormData, value: string) => void
  addChild: () => void
  updateChild: (id: string, field: keyof ExtendedChild, value: string | number | boolean | SchoolLevel) => void
  removeChild: (id: string) => void
  updateChildren: (children: ExtendedChild[]) => void
  saveChanges: () => Promise<boolean>
  resendEmailVerification: () => Promise<boolean>
  validateForm: () => boolean
}

const RESEND_COOLDOWN_SECONDS = 60 // 1 minute cooldown
const MAX_RETRY_ATTEMPTS = 3
const RETRY_DELAYS = [1000, 3000, 5000] // Progressive delays in milliseconds

// Helper function to safely trim strings
function safeTrim(value: string | number | null | undefined): string {
  if (typeof value === 'string') {
    return value.trim()
  }
  return String(value || '').trim()
}

// Helper function to clean data for Firestore (remove undefined values)
function cleanDataForFirestore<T extends Record<string, unknown>>(obj: T): Partial<T> {
  if (obj === null || obj === undefined) {
    return {}
  }
  
  const cleaned: Partial<T> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (Array.isArray(value)) {
        cleaned[key as keyof T] = value.map(item => 
          typeof item === 'object' && item !== null 
            ? cleanDataForFirestore(item as Record<string, unknown>)
            : item
        ) as T[keyof T]
      } else if (typeof value === 'object' && value !== null) {
        cleaned[key as keyof T] = cleanDataForFirestore(value as Record<string, unknown>) as T[keyof T]
      } else {
        cleaned[key as keyof T] = value as T[keyof T]
      }
    }
  }
  return cleaned
}

export function useProfileForm(): UseProfileFormReturn {
  const { user } = useAuth()
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  })
  const [children, setChildren] = useState<ExtendedChild[]>([])
  const [originalData, setOriginalData] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  })
  const [originalChildren, setOriginalChildren] = useState<ExtendedChild[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [emailVerified, setEmailVerified] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isResendingVerification, setIsResendingVerification] = useState(false)
  const [resendCooldownTime, setResendCooldownTime] = useState<number>(0)

  // Cargar datos del usuario directamente desde Firestore
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return
      const profile = await fetchUserProfile(user.id)
      const userData = {
        firstName: profile?.firstName || '',
        lastName: profile?.lastName || '',
        email: profile?.email || '',
        phone: profile?.phone || ''
      }
      
      // Transform children to include edad and level properties with migration
      // Ahora tanto apoderados como funcionarios pueden tener hijos
      const transformedChildren: ExtendedChild[] = (profile?.children || []).map(child => {
        // Migrar curso y nivel si es necesario
        const { curso: migratedCourse, level: migratedLevel } = migrateCourseFormat(
          child.curso || '',
          child.level as SchoolLevel
        )
        
        return {
          id: child.id || Date.now().toString(),
          name: child.name || '',
          curso: migratedCourse,
          active: child.active !== undefined ? child.active : true,
          edad: child.edad || child.age || 0,
          age: child.age || child.edad || 0,
          level: migratedLevel
        }
      }).filter(child => child.name.trim() !== '') // Solo incluir hijos con nombre
      
      setFormData(userData)
      setOriginalData(userData)
      setChildren(transformedChildren)
      setOriginalChildren(transformedChildren)
      setEmailVerified(auth.currentUser?.emailVerified || false)
      setIsLoading(false)
    }

    loadProfile()
  }, [user])

  // Cooldown timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (resendCooldownTime > 0) {
      interval = setInterval(() => {
        setResendCooldownTime(prev => {
          if (prev <= 1) {
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [resendCooldownTime])

  // Check if user can resend verification
  const canResendVerification = resendCooldownTime === 0 && !isResendingVerification

  // Verificar si hay cambios
  const hasChanges = 
    JSON.stringify(formData) !== JSON.stringify(originalData) ||
    JSON.stringify(children) !== JSON.stringify(originalChildren)

  const updateFormData = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const addChild = () => {
    const newChild: ExtendedChild = {
      id: Date.now().toString(),
      name: '',
      curso: '',
      active: true,
      edad: 0,
      age: 0,
      level: 'Lower School' // Usar el nuevo sistema de niveles
    }
    setChildren(prev => [...prev, newChild])
  }

  const updateChild = (id: string, field: keyof ExtendedChild, value: string | number | boolean | SchoolLevel) => {
    setChildren(prev => prev.map(child => {
      if (child.id === id) {
        const updatedChild = { ...child, [field]: value }
        
        // Sincronizar age y edad
        if (field === 'edad') {
          updatedChild.age = value as number
        } else if (field === 'age') {
          updatedChild.edad = value as number
        }
        
        // Si se cambia el nivel, NO limpiar el curso - permitir que el usuario mantenga lo que escribió
        
        return updatedChild
      }
      return child
    }))
    
    // Clear error for this field
    const errorKey = `child_${id}_${field}`
    if (errors[errorKey]) {
      setErrors(prev => ({ ...prev, [errorKey]: '' }))
    }
  }

  const removeChild = (id: string) => {
    setChildren(prev => prev.filter(child => child.id !== id))
    
    // Remove any errors for this child
    setErrors(prev => {
      const newErrors = { ...prev }
      Object.keys(newErrors).forEach(key => {
        if (key.startsWith(`child_${id}_`)) {
          delete newErrors[key]
        }
      })
      return newErrors
    })
  }

  const updateChildren = (newChildren: ExtendedChild[]) => {
    setChildren(newChildren)
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Validar campos requeridos
    if (!safeTrim(formData.firstName)) {
      newErrors.firstName = 'El nombre es requerido'
    }
    if (!safeTrim(formData.lastName)) {
      newErrors.lastName = 'El apellido es requerido'
    }
    if (!safeTrim(formData.email)) {
      newErrors.email = 'El correo electrónico es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(safeTrim(formData.email))) {
      newErrors.email = 'Formato de correo electrónico inválido'
    }

    // Validar teléfono si se proporciona
    const phoneValue = safeTrim(formData.phone)
    if (phoneValue) {
      // Basic phone validation - allow various formats
      const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,15}$/
      if (!phoneRegex.test(phoneValue)) {
        newErrors.phone = 'Formato de teléfono inválido'
      }
    }

    // Validar hijos si se han agregado
    if (children.length > 0) {
      // Para apoderados, al menos un hijo es obligatorio
      if (user?.tipoUsuario === 'apoderado') {
        const validChildren = children.filter(child => safeTrim(child.name))
        if (validChildren.length === 0) {
          newErrors.general = 'Los apoderados deben tener al menos un hijo registrado'
        }
      }
      
      // Validar cada hijo que tenga información
      children.forEach((child, index) => {
        const childName = safeTrim(child.name)
        
        // Si el hijo tiene nombre, validar todos sus campos
        if (childName) {
          if (!child.edad || child.edad < 1 || child.edad > 18) {
            newErrors[`child_${child.id}_edad`] = `Edad del hijo ${index + 1} debe estar entre 1 y 18 años`
          }
          
          // VALIDACIÓN SIMPLIFICADA DEL CURSO - solo verificar que no esté vacío
          if (!safeTrim(child.curso)) {
            newErrors[`child_${child.id}_curso`] = `Curso del hijo ${index + 1} es requerido`
          }
          
          if (!child.level || !SCHOOL_LEVELS.includes(child.level)) {
            newErrors[`child_${child.id}_level`] = `Nivel educativo del hijo ${index + 1} es requerido`
          }
          
        }
      })
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const saveChanges = async (): Promise<boolean> => {
    if (!validateForm() || !user || !auth.currentUser) {
      return false
    }

    setIsSaving(true)
    try {
      const currentUser = auth.currentUser

      // Safely trim form data
      const trimmedFirstName = safeTrim(formData.firstName)
      const trimmedLastName = safeTrim(formData.lastName)
      const trimmedEmail = safeTrim(formData.email)
      const trimmedPhone = safeTrim(formData.phone)

      // Actualizar perfil en Firebase Auth si cambió el nombre
      if (trimmedFirstName !== safeTrim(originalData.firstName) || 
          trimmedLastName !== safeTrim(originalData.lastName)) {
        await updateProfile(currentUser, {
          displayName: `${trimmedFirstName} ${trimmedLastName}`
        })
      }

      // Actualizar email si cambió
      if (trimmedEmail !== safeTrim(originalData.email)) {
        await updateEmail(currentUser, trimmedEmail)
        await sendEmailVerification(currentUser)
        setEmailVerified(false)
      }

      // Transform children back to the format expected by the database
      // Filtrar solo hijos con nombre válido
      const transformedChildren = children
        .filter(child => safeTrim(child.name)) // Solo hijos con nombre
        .map(child => {
          const childName = safeTrim(child.name)
          const childCurso = safeTrim(child.curso)

          const childData: {
            id: string
            name: string
            curso: string
            active: boolean
            age: number
            edad: number
            level: SchoolLevel
          } = {
            id: child.id,
            name: childName,
            curso: childCurso,
            active: child.active !== undefined ? child.active : true,
            age: child.edad || child.age || 0,
            edad: child.edad || child.age || 0,
            level: child.level
          }

          return childData
        })

      // Prepare update data, ensuring no undefined values
      const updateData: {
        firstName: string
        lastName: string
        email: string
        children: typeof transformedChildren
        updatedAt: Date
        phone?: string
      } = {
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        email: trimmedEmail,
        children: transformedChildren,
        updatedAt: new Date()
      }

      // Only include phone if it has a value
      if (trimmedPhone) {
        updateData.phone = trimmedPhone
      }

      // Clean the data to remove any undefined values and ensure proper typing
      const cleanedUpdateData = cleanDataForFirestore(updateData)


      await updateUserProfile(user.id, cleanedUpdateData)

      // Actualizar datos originales
      setOriginalData({
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        email: trimmedEmail,
        phone: trimmedPhone
      })
      setOriginalChildren([...children])

      // Clear any previous errors
      setErrors({})

      return true
    } catch (error) {
      console.error('Error al guardar cambios:', error)
      const firebaseError = error as { code?: string; message?: string }
      
      if (firebaseError.code === 'auth/email-already-in-use') {
        setErrors({ email: 'Este correo electrónico ya está en uso' })
      } else if (firebaseError.code === 'auth/invalid-email') {
        setErrors({ email: 'Formato de correo electrónico inválido' })
      } else if (firebaseError.code === 'auth/requires-recent-login') {
        setErrors({ email: 'Debes volver a iniciar sesión para cambiar tu correo' })
      } else if (error instanceof TypeError && error.message.includes('trim')) {
        setErrors({ general: 'Error en el formato de los datos. Verifica que todos los campos estén completos.' })
      } else if (firebaseError.message?.includes('invalid data')) {
        setErrors({ general: 'Error en los datos proporcionados. Verifica que todos los campos estén completos correctamente.' })
      } else {
        setErrors({ general: 'Error al guardar los cambios. Intenta nuevamente.' })
      }
      return false
    } finally {
      setIsSaving(false)
    }
  }

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  const resendEmailVerification = async (): Promise<boolean> => {
    if (!auth.currentUser || !canResendVerification) {
      return false
    }

    setIsResendingVerification(true)
    setErrors(prev => ({ ...prev, verification: '' })) // Clear previous verification errors

    try {
      // Attempt to send verification with retry logic
      let lastError: { code?: string; message?: string } | null = null
      
      for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt++) {
        try {
          await sendEmailVerification(auth.currentUser)
          
          // Success - set cooldown
          setResendCooldownTime(RESEND_COOLDOWN_SECONDS)
          return true
        } catch (error) {
          lastError = error as { code?: string; message?: string }
          const firebaseError = error as { code?: string; message?: string }
          
          // If it's a rate limiting error, don't retry immediately
          if (firebaseError.code === 'auth/too-many-requests') {
            // Set a longer cooldown for rate limiting
            const cooldownTime = Math.min(RESEND_COOLDOWN_SECONDS * (attempt + 1), 300) // Max 5 minutes
            setResendCooldownTime(cooldownTime)
            setErrors(prev => ({ ...prev,
              verification: `Demasiadas solicitudes. Intenta nuevamente en ${cooldownTime} segundos.` 
            }))
            break // Don't retry for rate limiting
          }
          
          // Wait before retrying for other errors
          if (attempt < MAX_RETRY_ATTEMPTS - 1) {
            await sleep(RETRY_DELAYS[attempt])
          }
        }
      }
      
      // If we get here, all attempts failed
      const firebaseError = lastError as { code?: string; message?: string }
      
      if (firebaseError.code === 'auth/too-many-requests') {
        setErrors({ 
          verification: 'Se han enviado demasiadas solicitudes de verificación. Espera un momento antes de intentar nuevamente.' 
        })
      } else if (firebaseError.code === 'auth/user-not-found') {
        setErrors({ 
          verification: 'Usuario no encontrado. Intenta cerrar sesión e iniciar sesión nuevamente.' 
        })
      } else if (firebaseError.code === 'auth/invalid-email') {
        setErrors({ 
          verification: 'El correo electrónico no es válido.' 
        })
      } else {
        setErrors({ 
          verification: 'Error al enviar el correo de verificación. Verifica tu conexión a internet e intenta nuevamente.' 
        })
      }
      
      return false
    } catch (error) {
      console.error('Error al reenviar verificación:', error)
      setErrors({ 
        verification: 'Error inesperado. Intenta nuevamente más tarde.' 
      })
      return false
    } finally {
      setIsResendingVerification(false)
    }
  }

  return {
    formData,
    children,
    isLoading,
    isSaving,
    hasChanges,
    emailVerified,
    errors,
    isResendingVerification,
    canResendVerification,
    resendCooldownTime,
    updateFormData,
    addChild,
    updateChild,
    removeChild,
    updateChildren,
    saveChanges,
    resendEmailVerification,
    validateForm
  }
}