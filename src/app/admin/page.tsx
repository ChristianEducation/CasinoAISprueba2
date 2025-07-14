"use client"
import { motion } from 'framer-motion'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { StatsCards } from '@/components/admin/StatsCards'
import { OrdersManagementSection } from '@/components/admin/dashboard/OrdersManagementSection'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { useAdminDashboard } from '@/hooks/useAdminDashboard'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, RefreshCw, BarChart3, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatAdminCurrency } from '@/lib/adminUtils'

export default function AdminPage() {
  const { adminUser } = useAdminAuth()
  const { dashboardData, isLoading, error, refreshData } = useAdminDashboard()

  if (error) {
    return (
      <AdminLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshData}
                className="ml-4"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reintentar
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </AdminLayout>
    )
  }

  if (isLoading || !dashboardData || !adminUser) {
    return (
      <AdminLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Skeleton className="h-96" />
              <Skeleton className="h-96" />
            </div>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      {/* Header del panel administrativo */}
      <AdminHeader
        adminUser={adminUser}
        lastUpdated={dashboardData.lastUpdated}
        onRefresh={refreshData}
        isRefreshing={isLoading}
      />

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Tarjetas de estadísticas principales */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <StatsCards stats={dashboardData.stats} />
          </motion.div>

          {/* Sección principal de gestión de pedidos */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <OrdersManagementSection />
          </motion.div>

          {/* Gráficos y visualizaciones */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Gráfico de pedidos por día */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    <span>Pedidos por Día de la Semana</span>
                  </CardTitle>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Distribución de pedidos durante la semana actual
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData.weeklyData.map((day) => (
                      <div key={day.date} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-16 text-sm font-medium text-slate-600 dark:text-slate-400 capitalize">
                            {day.day}
                          </div>
                          <div className="flex-1">
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                                style={{ 
                                  width: `${Math.max((day.orderCount / Math.max(...dashboardData.weeklyData.map(d => d.orderCount))) * 100, 5)}%` 
                                }}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-slate-900 dark:text-white">
                            {day.orderCount} pedidos
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {formatAdminCurrency(day.revenue)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Items más populares */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                    <span>Menús Más Populares</span>
                  </CardTitle>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Los platos más solicitados esta semana
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData.stats.popularMenuItems.length > 0 ? (
                      dashboardData.stats.popularMenuItems.map((item, index) => (
                        <div key={item.itemCode} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white text-sm font-bold rounded-lg">
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-medium text-slate-900 dark:text-white">
                                {item.itemCode}
                              </div>
                              <div className="text-sm text-slate-600 dark:text-slate-400 line-clamp-1">
                                {item.itemName}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-slate-900 dark:text-white">
                              {item.orderCount} pedidos
                            </div>
                            <Badge 
                              variant="secondary" 
                              className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                            >
                              {item.percentage.toFixed(1)}%
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-slate-500 dark:text-slate-400">
                          No hay datos de popularidad disponibles
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Información adicional del sistema */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-blue-900/20 border-slate-200 dark:border-slate-700">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                      {dashboardData.userTypeStats.estudiantes.total + dashboardData.userTypeStats.funcionarios.total}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Total de usuarios registrados
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                      {dashboardData.currentWeek.isMenuPublished ? 'Publicado' : 'Pendiente'}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Estado del menú semanal
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                      {formatAdminCurrency(dashboardData.stats.averageOrderValue)}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Valor promedio por pedido
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </AdminLayout>
  )
}