"use client"

import { useState, useEffect } from 'react'
import { AdminService } from '@/services/adminService'

interface UseMenuAdminReturn {
  menuPublished: boolean
  publishMenu: () => Promise<void>
  hideMenu: () => Promise<void>
  isLoading: boolean
  error: string | null
}

/**
 * Hook personalizado para manejar la publicación y visibilidad del menú
 * para usuarios administradores
 */
export function useMenuAdmin(): UseMenuAdminReturn {
  const [menuPublished, setMenuPublished] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar el estado inicial del menú
  useEffect(() => {
    async function loadMenuStatus() {
      try {
        setIsLoading(true)
        const currentWeek = AdminService.getCurrentWeekInfo()
        const isPublished = await AdminService.checkMenuStatus(currentWeek.start)
        setMenuPublished(isPublished)
      } catch (err) {
        console.error('Error al cargar el estado del menú:', err)
        setError('No se pudo determinar si el menú está publicado')
      } finally {
        setIsLoading(false)
      }
    }

    loadMenuStatus()
  }, [])

  // Publicar menú
  const publishMenu = async () => {
    try {
      setIsLoading(true)
      const currentWeek = AdminService.getCurrentWeekInfo()
      await AdminService.publishMenu(currentWeek.start)
      setMenuPublished(true)
    } catch (err) {
      console.error('Error al publicar el menú:', err)
      setError('No se pudo publicar el menú')
    } finally {
      setIsLoading(false)
    }
  }

  // Ocultar menú
  const hideMenu = async () => {
    try {
      setIsLoading(true)
      const currentWeek = AdminService.getCurrentWeekInfo()
      await AdminService.hideMenu(currentWeek.start)
      setMenuPublished(false)
    } catch (err) {
      console.error('Error al ocultar el menú:', err)
      setError('No se pudo ocultar el menú')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    menuPublished,
    publishMenu,
    hideMenu,
    isLoading,
    error
  }
}
