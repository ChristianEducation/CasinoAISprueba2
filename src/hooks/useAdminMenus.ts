import { useState, useEffect, useCallback } from 'react'
import { AdminMenuService } from '@/services/adminMenuService'
import { 
  AdminMenuItem, 
  AdminWeekMenu, 
  MenuModalState, 
  MenuOperationResult 
} from '@/types/adminMenu'
import { useToast } from '@/hooks/use-toast'

interface WeekStats {
  totalItems: number
  activeItems: number
  publishedItems: number
  daysWithMenus: number
  almuerzoCount: number
  colacionCount: number
}

export function useAdminMenus() {
  const [currentWeek, setCurrentWeek] = useState<string>('')
  const [weekMenu, setWeekMenu] = useState<AdminWeekMenu | null>(null)
  const [weekStats, setWeekStats] = useState<WeekStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [modalState, setModalState] = useState<MenuModalState>({
    isOpen: false,
    mode: 'create',
    date: '',
    day: ''
  })

  const { toast } = useToast()

  // Cargar datos del menú semanal
  const loadWeekMenu = useCallback(async (weekStart: string) => {
    if (!weekStart) return

    setIsLoading(true)
    setError(null)

    try {
      const [menuData, statsData] = await Promise.all([
        AdminMenuService.getWeeklyMenu(weekStart),
        AdminMenuService.getWeekStats(weekStart)
      ])

      setWeekMenu(menuData)
      
      if (statsData) {
        setWeekStats({
          totalItems: statsData.totalItems,
          activeItems: statsData.activeDays,
          publishedItems: statsData.publishedItems,
          daysWithMenus: statsData.activeDays,
          almuerzoCount: statsData.almuerzos,
          colacionCount: statsData.colaciones
        })
      }
    } catch (err) {
      console.error('Error loading week menu:', err)
      setError('Error al cargar el menú semanal')
      toast({
        title: "Error",
        description: "Error al cargar el menú semanal",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  // Navegar entre semanas
  const navigateWeek = useCallback((direction: 'prev' | 'next') => {
    if (!currentWeek) return

    const newWeek = direction === 'next' 
      ? AdminMenuService.getNextWeek(currentWeek)
      : AdminMenuService.getPreviousWeek(currentWeek)
    
    setCurrentWeek(newWeek)
  }, [currentWeek])

  // Obtener navegación de semana
  const getWeekNavigation = useCallback(() => {
    try {
      if (!currentWeek) {
        return {
          currentWeek: '',
          canGoBack: false,
          canGoForward: false,
          weekLabel: 'Sin semana'
        }
      }

      return AdminMenuService.getWeekNavigation(currentWeek)
    } catch (err) {
      console.error('Error getting week navigation:', err)
      // Fallback navigation
      return {
        currentWeek,
        canGoBack: true,
        canGoForward: true,
        weekLabel: 'Semana actual'
      }
    }
  }, [currentWeek])

  // Abrir modal
  const openModal = useCallback((
    mode: 'create' | 'edit' | 'view',
    date: string,
    day: string,
    type?: 'almuerzo' | 'colacion',
    item?: AdminMenuItem
  ) => {
    setModalState({
      isOpen: true,
      mode,
      date,
      day,
      type,
      item
    })
  }, [])

  // Cerrar modal
  const closeModal = useCallback(() => {
    setModalState(prev => ({ ...prev, isOpen: false }))
  }, [])

  // Crear item de menú
  const createMenuItem = useCallback(async (itemData: Omit<AdminMenuItem, 'id'>): Promise<MenuOperationResult> => {
    try {
      const result = await AdminMenuService.createMenuItem(
        itemData.weekStart,
        itemData.date,
        itemData.day,
        itemData.type,
        itemData.code,
        itemData.title,
        itemData.description || '',
        itemData.active,
        itemData.price
      )
      
      if (result.success) {
        await loadWeekMenu(currentWeek)
        toast({
          title: "Menú creado",
          description: result.message,
        })
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
      
      return result
    } catch (error) {
      console.error('Error creating menu item:', error)
      const errorResult = {
        success: false,
        message: 'Error al crear el menú'
      }
      
      toast({
        title: "Error",
        description: errorResult.message,
        variant: "destructive",
      })
      
      return errorResult
    }
  }, [currentWeek, loadWeekMenu, toast])

  // Actualizar item de menú
  const updateMenuItem = useCallback(async (id: string, updates: Partial<AdminMenuItem>): Promise<MenuOperationResult> => {
    try {
      const result = await AdminMenuService.updateMenuItem(id, updates)
      
      if (result.success) {
        await loadWeekMenu(currentWeek)
        toast({
          title: "Menú actualizado",
          description: result.message,
        })
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
      
      return result
    } catch (error) {
      console.error('Error updating menu item:', error)
      const errorResult = {
        success: false,
        message: 'Error al actualizar el menú'
      }
      
      toast({
        title: "Error",
        description: errorResult.message,
        variant: "destructive",
      })
      
      return errorResult
    }
  }, [currentWeek, loadWeekMenu, toast])

  // Eliminar item de menú
  const deleteMenuItem = useCallback(async (id: string): Promise<MenuOperationResult> => {
    try {
      const result = await AdminMenuService.deleteMenuItem(id)
      
      if (result.success) {
        await loadWeekMenu(currentWeek)
        toast({
          title: "Menú eliminado",
          description: result.message,
        })
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
      
      return result
    } catch (error) {
      console.error('Error deleting menu item:', error)
      const errorResult = {
        success: false,
        message: 'Error al eliminar el menú'
      }
      
      toast({
        title: "Error",
        description: errorResult.message,
        variant: "destructive",
      })
      
      return errorResult
    }
  }, [currentWeek, loadWeekMenu, toast])

  // Duplicar semana
  const duplicateWeek = useCallback(async (sourceWeek: string, targetWeek: string): Promise<MenuOperationResult> => {
    try {
      const result = await AdminMenuService.duplicateWeekMenu(sourceWeek, targetWeek)
      
      if (result.success) {
        await loadWeekMenu(currentWeek)
        toast({
          title: "Menú duplicado",
          description: result.message,
        })
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
      
      return result
    } catch (error) {
      console.error('Error duplicating week menu:', error)
      const errorResult = {
        success: false,
        message: 'Error al duplicar el menú'
      }
      
      toast({
        title: "Error",
        description: errorResult.message,
        variant: "destructive",
      })
      
      return errorResult
    }
  }, [currentWeek, loadWeekMenu, toast])

  // Crear colaciones predeterminadas para la semana
  const createDefaultColacionesWeek = useCallback(async (): Promise<MenuOperationResult> => {
    try {
      const result = await AdminMenuService.createDefaultColacionesWeek(currentWeek)
      
      if (result.success) {
        await loadWeekMenu(currentWeek)
        toast({
          title: "Colaciones creadas",
          description: result.message,
        })
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
      
      return result
    } catch (error) {
      console.error('Error creating default colaciones week:', error)
      const errorResult = {
        success: false,
        message: 'Error al crear las colaciones predeterminadas'
      }
      
      toast({
        title: "Error",
        description: errorResult.message,
        variant: "destructive",
      })
      
      return errorResult
    }
  }, [currentWeek, loadWeekMenu, toast])

  // Crear colaciones predeterminadas para un día
  const createDefaultColacionesDay = useCallback(async (date: string, day: string): Promise<MenuOperationResult> => {
    try {
      const result = await AdminMenuService.createDefaultColacionesDay(currentWeek, date, day)
      
      if (result.success) {
        await loadWeekMenu(currentWeek)
        toast({
          title: "Colaciones creadas",
          description: result.message,
        })
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
      
      return result
    } catch (error) {
      console.error('Error creating default colaciones day:', error)
      const errorResult = {
        success: false,
        message: 'Error al crear las colaciones predeterminadas'
      }
      
      toast({
        title: "Error",
        description: errorResult.message,
        variant: "destructive",
      })
      
      return errorResult
    }
  }, [currentWeek, loadWeekMenu, toast])

  // Alternar publicación de semana
  const toggleWeekPublication = useCallback(async (publish: boolean): Promise<MenuOperationResult> => {
    try {
      const result = await AdminMenuService.toggleWeekPublication(currentWeek, publish)
      
      if (result.success) {
        await loadWeekMenu(currentWeek)
        toast({
          title: publish ? "Menú publicado" : "Menú despublicado",
          description: result.message,
        })
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
      
      return result
    } catch (error) {
      console.error('Error toggling week publication:', error)
      const errorResult = {
        success: false,
        message: 'Error al cambiar el estado de publicación'
      }
      
      toast({
        title: "Error",
        description: errorResult.message,
        variant: "destructive",
      })
      
      return errorResult
    }
  }, [currentWeek, loadWeekMenu, toast])

  // Eliminar menú semanal
  const deleteWeekMenu = useCallback(async (): Promise<MenuOperationResult> => {
    try {
      const result = await AdminMenuService.deleteWeekMenu(currentWeek)
      
      if (result.success) {
        await loadWeekMenu(currentWeek)
        toast({
          title: "Menú eliminado",
          description: result.message,
        })
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
      
      return result
    } catch (error) {
      console.error('Error deleting week menu:', error)
      const errorResult = {
        success: false,
        message: 'Error al eliminar el menú semanal'
      }
      
      toast({
        title: "Error",
        description: errorResult.message,
        variant: "destructive",
      })
      
      return errorResult
    }
  }, [currentWeek, loadWeekMenu, toast])

  // Refrescar menú
  const refreshMenu = useCallback(() => {
    if (currentWeek) {
      loadWeekMenu(currentWeek)
    }
  }, [currentWeek, loadWeekMenu])

  // Inicializar semana actual
  useEffect(() => {
    const weekStart = AdminMenuService.getCurrentWeekStart()
    setCurrentWeek(weekStart)
  }, [])

  // Cargar menú cuando cambia la semana
  useEffect(() => {
    if (currentWeek) {
      loadWeekMenu(currentWeek)
    }
  }, [currentWeek, loadWeekMenu])

  return {
    // Estado
    currentWeek,
    weekMenu,
    weekStats,
    isLoading,
    error,
    modalState,
    
    // Navegación
    navigateWeek,
    getWeekNavigation,
    
    // Modal
    openModal,
    closeModal,
    
    // CRUD Operations
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    duplicateWeek,
    
    // Colaciones predeterminadas
    createDefaultColacionesWeek,
    createDefaultColacionesDay,
    
    // Operaciones de semana
    toggleWeekPublication,
    deleteWeekMenu,
    
    // Utilidades
    refreshMenu
  }
}