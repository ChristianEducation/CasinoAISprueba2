import { useState, useEffect, useCallback } from 'react'
import { MenuService } from '@/services/menuService'
import { AdminMenuService } from '@/services/adminMenuService'
import { DayMenuDisplay } from '@/types/menu'
import { WeekInfo } from '@/types/order'
import { User } from '@/types/panel'

interface UseWeeklyMenuDataProps {
  user: User | null
  weekStart?: string
  useAdminData?: boolean // Si true, usa datos de admin (incluye no publicados)
}

interface WeekInfoExtended extends WeekInfo {
  weekLabel: string
}

interface UseWeeklyMenuDataReturn {
  weekMenu: DayMenuDisplay[]
  isLoading: boolean
  error: string | null
  weekInfo: WeekInfoExtended | null
  refetch: () => Promise<void>
}

export function useWeeklyMenuData({ 
  user, 
  weekStart, 
  useAdminData = false 
}: UseWeeklyMenuDataProps): UseWeeklyMenuDataReturn {
  const [weekMenu, setWeekMenu] = useState<DayMenuDisplay[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [weekInfo, setWeekInfo] = useState<WeekInfoExtended | null>(null)

  const loadMenuData = useCallback(async () => {
    if (!user) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Obtener información de la semana
      const currentWeekInfo = MenuService.getCurrentWeekInfo()
      const targetWeekStart = weekStart || currentWeekInfo.weekStart
      
      // Crear weekInfo extendido con weekLabel
      const extendedWeekInfo: WeekInfoExtended = {
        ...currentWeekInfo,
        weekStart: targetWeekStart,
        weekLabel: MenuService.getWeekDisplayText(
          targetWeekStart, 
          MenuService.getFormattedDate(
            new Date(new Date(targetWeekStart).getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          )
        )
      }
      
      setWeekInfo(extendedWeekInfo)

      let menuData: DayMenuDisplay[]

      if (useAdminData) {
        // Para admin: obtener todos los menús (publicados y no publicados)
        const adminMenu = await AdminMenuService.getWeeklyMenu(targetWeekStart)
        if (adminMenu) {
          // Convertir formato de admin a formato de usuario
          menuData = adminMenu.days.map(day => ({
            date: day.date,
            day: day.day,
            dayLabel: day.dayName,
            dateFormatted: MenuService.getDayDisplayName(day.date),
            almuerzos: day.almuerzos.map(item => ({
              id: item.id || '',
              code: item.code,
              name: item.description ?? '',
              description: item.description ?? '',
              type: item.type,
              price: user.tipoUsuario === 'funcionario' ? 4875 : 5500,
              available: item.active,
              date: item.date,
              dia: item.day,
              active: item.active
            })),
            colaciones: day.colaciones.map(item => ({
              id: item.id || '',
              code: item.code,
              name: item.description ?? '',
              description: item.description ?? '',
              type: item.type,
              price: user.tipoUsuario === 'funcionario' ? 4875 : 5500,
              available: item.active,
              date: item.date,
              dia: item.day,
              active: item.active
            })),
            hasItems: day.almuerzos.length > 0 || day.colaciones.length > 0,
            isAvailable: day.almuerzos.length > 0 && MenuService.isDayOrderingAllowed(day.date)
          }))
        } else {
          menuData = []
        }
      } else {
        // Para usuarios: solo menús publicados
        menuData = await MenuService.getWeeklyMenuForUser(user, targetWeekStart)
      }

      setWeekMenu(menuData)

    } catch (err) {
      console.error('Error loading menu data:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar el menú'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [user, weekStart, useAdminData])

  const refetch = async () => {
    await loadMenuData()
  }

  useEffect(() => {
    loadMenuData()
  }, [loadMenuData])

  return {
    weekMenu,
    isLoading,
    error,
    weekInfo,
    refetch
  }
}