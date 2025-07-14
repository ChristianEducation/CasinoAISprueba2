import { useState, useEffect, useCallback } from 'react'
import { MenuService } from '@/services/menuService'
import { DayMenuDisplay } from '@/types/menu'
import { WeekInfo } from '@/types/order'
import { User } from '@/types/panel'

interface WeekMenuData {
  weekInfo: WeekInfo & { weekLabel: string }
  weekMenu: DayMenuDisplay[]
  isLoading: boolean
  error: string | null
  hasMenus: boolean
}

interface UseMultiWeekMenuReturn {
  weeks: WeekMenuData[]
  isLoading: boolean
  error: string | null
  refreshWeek: (weekStart: string) => Promise<void>
  refreshAll: () => Promise<void>
}

export function useMultiWeekMenu(user: User | null, numberOfWeeks: number = 4): UseMultiWeekMenuReturn {
  const [weeks, setWeeks] = useState<WeekMenuData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Generar las fechas de inicio de las próximas semanas - MEJORADO
  const generateWeekStarts = useCallback((count: number): string[] => {
    return MenuService.getNextWeeks(count)
  }, [])

  // Cargar datos de una semana específica - MEJORADO
  const loadWeekData = useCallback(async (weekStart: string): Promise<WeekMenuData> => {
    if (!user) {
      const weekInfo = MenuService.getWeekInfo(weekStart)
      return {
        weekInfo: {
          ...weekInfo,
          weekLabel: weekInfo.weekLabel
        },
        weekMenu: [],
        isLoading: false,
        error: 'Usuario no disponible',
        hasMenus: false
      }
    }

    try {
      // Crear información de la semana usando el servicio mejorado
      const weekInfo = MenuService.getWeekInfo(weekStart)
      const weekInfoWithLabel = {
        ...weekInfo,
        weekLabel: weekInfo.weekLabel
      }

      // Verificar si hay menús para esta semana
      const hasMenus = await MenuService.hasMenusForWeek(weekStart)
      
      if (!hasMenus) {
        return {
          weekInfo: weekInfoWithLabel,
          weekMenu: [],
          isLoading: false,
          error: null,
          hasMenus: false
        }
      }

      // Cargar menú de la semana
      const weekMenu = await MenuService.getWeeklyMenuForUser(user, weekStart)

      return {
        weekInfo: weekInfoWithLabel,
        weekMenu,
        isLoading: false,
        error: null,
        hasMenus: true
      }

    } catch (err) {
      console.error(`Error loading week data for ${weekStart}:`, err)
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar el menú'
      
      const weekInfo = MenuService.getWeekInfo(weekStart)
      return {
        weekInfo: {
          ...weekInfo,
          weekLabel: 'Error al cargar'
        },
        weekMenu: [],
        isLoading: false,
        error: errorMessage,
        hasMenus: false
      }
    }
  }, [user])

  // Cargar todas las semanas - MEJORADO
  const loadAllWeeks = useCallback(async () => {
    if (!user) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const weekStarts = generateWeekStarts(numberOfWeeks)
      console.log('Loading weeks:', weekStarts)
      
      // Cargar todas las semanas en paralelo
      const weekPromises = weekStarts.map(weekStart => loadWeekData(weekStart))
      const weekResults = await Promise.all(weekPromises)

      // Ordenar por fecha de inicio de semana
      weekResults.sort((a, b) => a.weekInfo.weekStart.localeCompare(b.weekInfo.weekStart))

      setWeeks(weekResults)

    } catch (err) {
      console.error('Error loading all weeks:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar las semanas'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [user, numberOfWeeks, generateWeekStarts, loadWeekData])

  // Refrescar una semana específica
  const refreshWeek = useCallback(async (weekStart: string) => {
    console.log('Refreshing week:', weekStart)
    
    // Marcar la semana como cargando
    setWeeks(prevWeeks => 
      prevWeeks.map(week => 
        week.weekInfo.weekStart === weekStart 
          ? { ...week, isLoading: true, error: null }
          : week
      )
    )

    const weekData = await loadWeekData(weekStart)
    
    setWeeks(prevWeeks => 
      prevWeeks.map(week => 
        week.weekInfo.weekStart === weekStart ? weekData : week
      )
    )
  }, [loadWeekData])

  // Refrescar todas las semanas
  const refreshAll = useCallback(async () => {
    console.log('Refreshing all weeks')
    await loadAllWeeks()
  }, [loadAllWeeks])

  // Efecto para cargar datos iniciales
  useEffect(() => {
    if (user) {
      console.log('User changed, loading weeks for:', user.id)
      loadAllWeeks()
    } else {
      console.log('No user, clearing weeks')
      setWeeks([])
      setIsLoading(false)
    }
  }, [user, loadAllWeeks])

  // Debug logging
  useEffect(() => {
    console.log('useMultiWeekMenu state:', {
      weeksCount: weeks.length,
      isLoading,
      error,
      weekStarts: weeks.map(w => w.weekInfo.weekStart)
    })
  }, [weeks, isLoading, error])

  return {
    weeks,
    isLoading,
    error,
    refreshWeek,
    refreshAll
  }
}