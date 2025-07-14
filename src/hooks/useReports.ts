"use client"
import { useState, useEffect, useCallback } from 'react'
import { ReportsService } from '@/services/reportsService'
import { ReportsFilters, ReportsData } from '@/types/reports'

export function useReports() {
  const [filters, setFilters] = useState<ReportsFilters>(ReportsService.getDefaultFilters())
  const [data, setData] = useState<ReportsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReportsData = useCallback(async (currentFilters: ReportsFilters) => {
    try {
      setIsLoading(true)
      setError(null)
      const reportsData = await ReportsService.getReportsData(currentFilters)
      setData(reportsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los reportes')
      console.error('Error fetching reports:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateFilters = useCallback((newFilters: Partial<ReportsFilters>) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)
    fetchReportsData(updatedFilters)
  }, [filters, fetchReportsData])

  const resetFilters = useCallback(() => {
    const defaultFilters = ReportsService.getDefaultFilters()
    setFilters(defaultFilters)
    fetchReportsData(defaultFilters)
  }, [fetchReportsData])

  const refreshData = useCallback(() => {
    fetchReportsData(filters)
  }, [filters, fetchReportsData])

  useEffect(() => {
    fetchReportsData(filters)
  }, [fetchReportsData, filters]) // Solo ejecutar al montar el componente

  return {
    filters,
    data,
    isLoading,
    error,
    updateFilters,
    resetFilters,
    refreshData
  }
}
