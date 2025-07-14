"use client"
import { useState, useEffect, useCallback, useRef } from 'react'
import { AdminService } from '@/services/adminService'
import { AdminDashboardData, SystemAlert, WeeklyOrderData } from '@/types/admin'
import { generateSystemAlerts } from '@/lib/adminUtils'

interface UseAdminDashboardReturn {
  dashboardData: AdminDashboardData | null
  isLoading: boolean
  error: string | null
  refreshData: () => Promise<void>
  isRefreshing: boolean
}

export function useAdminDashboard(): UseAdminDashboardReturn {
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Usar ref para evitar dependencias circulares
  const dashboardDataRef = useRef<AdminDashboardData | null>(null)
  
  // Actualizar ref cuando cambie dashboardData
  useEffect(() => {
    dashboardDataRef.current = dashboardData
  }, [dashboardData])

  const loadDashboardData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }
      setError(null)

      // Obtener información de la semana actual
      const currentWeek = AdminService.getCurrentWeekInfo()
      
      // Ejecutar consultas críticas en paralelo para mejor rendimiento
      const [isMenuPublished, stats, weeklyData] = await Promise.allSettled([
        AdminService.checkMenuStatus(currentWeek.start),
        AdminService.getWeeklyStats(currentWeek.start),
        AdminService.getWeeklyOrderData(currentWeek.start)
      ])

      // Manejar resultados de las consultas críticas
      let menuPublished = false
      let weeklyStats = null
      let orderData: WeeklyOrderData[] = []

      if (isMenuPublished.status === 'fulfilled') {
        menuPublished = isMenuPublished.value
      } else {
        console.warn('Error checking menu status:', isMenuPublished.reason)
      }

      if (stats.status === 'fulfilled') {
        weeklyStats = stats.value
      } else {
        console.error('Error loading weekly stats:', stats.reason)
        throw new Error('No se pudieron cargar las estadísticas principales')
      }

      if (weeklyData.status === 'fulfilled') {
        orderData = weeklyData.value
      } else {
        console.warn('Error loading weekly data:', weeklyData.reason)
        // No es crítico, continuar con array vacío
      }

      // Obtener estadísticas de tipos de usuario (no crítico)
      let userTypeStats = {
        estudiantes: { total: 0, withOrders: 0, revenue: 0 },
        funcionarios: { total: 0, withOrders: 0, revenue: 0 }
      }

      try {
        const usersWithOrders: string[] = [] // Se calculará dentro de getWeeklyStats
        userTypeStats = await AdminService.getUserTypeStats(usersWithOrders)
      } catch (userStatsError) {
        console.warn('Error loading user type stats:', userStatsError)
        // Continuar con valores por defecto
      }
      
      // Generar alertas del sistema
      const weekInfo = { ...currentWeek, isMenuPublished: menuPublished }
      let alerts: SystemAlert[] = []
      
      try {
        alerts = generateSystemAlerts(weeklyStats, weekInfo)
      } catch (alertsError) {
        console.warn('Error generating system alerts:', alertsError)
        // Continuar sin alertas
      }

      const newDashboardData: AdminDashboardData = {
        stats: weeklyStats,
        weeklyData: orderData,
        userTypeStats,
        alerts,
        currentWeek: weekInfo,
        isLoading: false,
        lastUpdated: new Date()
      }

      setDashboardData(newDashboardData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar datos del dashboard'
      setError(errorMessage)
      console.error('Error loading admin dashboard:', err)
      
      // En caso de error crítico, mantener datos anteriores si existen
      if (!dashboardDataRef.current) {
        // Solo establecer datos vacíos si no hay datos previos
        const fallbackData: AdminDashboardData = {
          stats: {
            totalOrdersWeek: 0,
            totalStudentsWithOrder: 0,
            totalStaffWithOrder: 0,
            totalRevenueWeek: 0,
            pendingOrders: 0,
            paidOrders: 0,
            averageOrderValue: 0,
            popularMenuItems: []
          },
          weeklyData: [],
          userTypeStats: {
            estudiantes: { total: 0, withOrders: 0, revenue: 0 },
            funcionarios: { total: 0, withOrders: 0, revenue: 0 }
          },
          alerts: [],
          currentWeek: {
            start: '',
            end: '',
            isMenuPublished: false,
            orderDeadline: new Date()
          },
          isLoading: false,
          lastUpdated: new Date()
        }
        setDashboardData(fallbackData)
      }
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, []) // Sin dependencias para evitar bucles infinitos

  const refreshData = useCallback(async () => {
    await loadDashboardData(true)
  }, [loadDashboardData])

  useEffect(() => {
    loadDashboardData()
    
    // Actualizar datos cada 3 minutos
    const interval = setInterval(() => loadDashboardData(true), 3 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [loadDashboardData])

  // Limpiar cache cuando el componente se desmonte
  useEffect(() => {
    return () => {
      AdminService.clearCache()
    }
  }, [])

  return {
    dashboardData,
    isLoading,
    error,
    refreshData,
    isRefreshing
  }
}