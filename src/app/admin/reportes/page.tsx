"use client"
import { motion } from 'framer-motion'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { ReportsHeader } from '@/components/admin/reportes/ReportsHeader'
import { ReportsFiltersComponent } from '@/components/admin/reportes/ReportsFilters'
import { ReportsStatsComponent } from '@/components/admin/reportes/ReportsStats'
import { ReportsCharts } from '@/components/admin/reportes/ReportsCharts'
import { useReports } from '@/hooks/useReports'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { ExportUtils } from '@/lib/exportUtils'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, FileBarChart } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export default function ReportsPage() {
  const { adminUser } = useAdminAuth()
  const { 
    filters, 
    data, 
    isLoading, 
    error, 
    updateFilters, 
    resetFilters, 
    refreshData 
  } = useReports()

  const handleExportPDF = async () => {
    if (!data || !adminUser) return
    
    try {
      await ExportUtils.exportToPDF(data, filters, adminUser)
    } catch (error) {
      console.error('Error exporting PDF:', error)
    }
  }

  const handleExportExcel = async () => {
    if (!data || !adminUser) return
    
    try {
      await ExportUtils.exportToExcel(data, filters, adminUser)
    } catch (error) {
      console.error('Error exporting Excel:', error)
    }
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header */}
          <ReportsHeader
            lastUpdated={data?.lastUpdated}
            onRefresh={refreshData}
            isRefreshing={isLoading}
            dateRange={filters.dateRange}
          />

          {/* Filtros */}
          <ReportsFiltersComponent
            filters={filters}
            onFiltersChange={updateFilters}
            onReset={resetFilters}
            onExportPDF={handleExportPDF}
            onExportExcel={handleExportExcel}
            isLoading={isLoading}
          />

          {isLoading ? (
            /* Skeleton loading */
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Skeleton className="h-96" />
                <Skeleton className="h-96" />
              </div>
              <Skeleton className="h-96" />
            </div>
          ) : data ? (
            <>
              {/* Estadísticas principales */}
              <ReportsStatsComponent stats={data.stats} />

              {/* Gráficos y visualizaciones */}
              <ReportsCharts data={data} />

              {/* Información adicional */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                <Card className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-blue-900/20 border-slate-200 dark:border-slate-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-center space-x-4 text-center">
                      <FileBarChart className="w-8 h-8 text-blue-600" />
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                          Reporte Generado Exitosamente
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Los datos mostrados corresponden al período seleccionado y se actualizan en tiempo real.
                          Utiliza los filtros para personalizar la vista y los botones de exportación para descargar reportes detallados.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </>
          ) : (
            <div className="text-center py-12">
              <FileBarChart className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                No hay datos disponibles
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Ajusta los filtros para ver los reportes correspondientes.
              </p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
