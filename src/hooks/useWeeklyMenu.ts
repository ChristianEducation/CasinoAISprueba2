"use client"

import { useState, useEffect, useCallback } from 'react'
import { MenuService } from '@/services/menuService'
import { DayMenuDisplay, MenuLoadingState, MenuError } from '@/types/menu'
import useAuth from '@/hooks/useAuth'

interface UseWeeklyMenuReturn {
  weekMenu: DayMenuDisplay[]
  isLoading: boolean
  error: MenuError | null
  weekRange: string
  refreshMenu: () => Promise<void>
  isEmpty: boolean
}

export function useWeeklyMenu(): UseWeeklyMenuReturn {
  const { user } = useAuth()
  const [weekMenu, setWeekMenu] = useState<DayMenuDisplay[]>([])
  const [loadingState, setLoadingState] = useState<MenuLoadingState>('idle')
  const [error, setError] = useState<MenuError | null>(null)
  const [weekRange, setWeekRange] = useState('')

  const loadWeekMenu = useCallback(async () => {
    if (!user) return

    setLoadingState('loading')
    setError(null)

    try {
      // Obtener información de la semana actual
      const weekInfo = MenuService.getCurrentWeekInfo()
      
      // Formatear rango de fechas para mostrar
      setWeekRange(MenuService.getWeekDisplayText(weekInfo.weekStart, weekInfo.weekEnd))

      // Cargar menú con precios según tipo de usuario
      const menuData = await MenuService.getWeeklyMenuForUser(
        user.tipoUsuario || user.userType || user.tipo_usuario || user.type || 'apoderado',
        weekInfo.weekStart
      )
      
      setWeekMenu(menuData)
      setLoadingState('success')

    } catch (err) {
      console.error('Error al cargar el menú:', err)
      setError({
        type: 'network',
        message: 'No se pudo cargar el menú semanal. Por favor, intenta nuevamente.',
        code: 'MENU_LOAD_ERROR'
      })
      setLoadingState('error')
    }
  }, [user])

  const refreshMenu = useCallback(async () => {
    await loadWeekMenu()
  }, [loadWeekMenu])

  useEffect(() => {
    if (user) {
      loadWeekMenu()
    }
  }, [user, loadWeekMenu])

  return {
    weekMenu,
    isLoading: loadingState === 'loading',
    error,
    weekRange,
    refreshMenu,
    isEmpty: weekMenu.length === 0 && loadingState === 'success'
  }
}