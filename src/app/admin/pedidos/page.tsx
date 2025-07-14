"use client"
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { OrdersFilters } from '@/components/admin/pedidos/OrdersFilters'
import { OrdersMetrics } from '@/components/admin/pedidos/OrdersMetrics'
import { OrdersTable } from '@/components/admin/pedidos/OrdersTable'
import { OrderDetailModal } from '@/components/admin/pedidos/OrderDetailModal'
import { DailyMenuSummary } from '@/components/admin/pedidos/DailyMenuSummary'
import { GeneratePDFButton } from '@/components/admin/pedidos/GeneratePDFButton'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { useAdminOrders } from '@/hooks/useAdminOrders'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertTriangle, RefreshCw, FileText, Calendar, Clock, CheckCircle, XCircle, AlertCircle, ChefHat, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function AdminPedidosPage() {
  const { adminUser, isLoading: authLoading } = useAdminAuth()
  const { toast } = useToast()
  const {
    orders,
    metrics,
    isLoading,
    error,
    filters,
    updateFilters,
    refreshOrders,
    updateOrderStatus,
    deleteOrder
  } = useAdminOrders()

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  // Actualizar datos cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      refreshOrders()
    }, 30000)

    return () => clearInterval(interval)
  }, [refreshOrders])

  const handleViewDetail = (orderId: string) => {
    setSelectedOrderId(orderId)
    setIsDetailModalOpen(true)
  }

  const handleCloseDetail = () => {
    setSelectedOrderId(null)
    setIsDetailModalOpen(false)
  }

  const handleStatusUpdate = async (orderId: string, status: 'pending' | 'paid' | 'cancelled') => {
    try {
      await updateOrderStatus(orderId, status)
      toast({
        title: "Estado actualizado",
        description: `El pedido ha sido marcado como ${
          status === 'paid' ? 'pagado' : 
          status === 'cancelled' ? 'cancelado' : 'pendiente'
        }.`,
      })
    } catch (error) {
      console.error('Error updating order status:', error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del pedido.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este pedido? Esta acción no se puede deshacer.')) {
      return
    }

    try {
      await deleteOrder(orderId)
      toast({
        title: "Pedido eliminado",
        description: "El pedido ha sido eliminado correctamente.",
      })
    } catch (error) {
      console.error('Error deleting order:', error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el pedido.",
        variant: "destructive",
      })
    }
  }

  const handleQuickFilter = (status: 'all' | 'pending' | 'paid' | 'cancelled') => {
    updateFilters({ status })
  }

  // Calcular contadores para filtros rápidos basados en datos actuales
  const getFilterCounts = () => {
    if (!metrics) {
      return {
        all: orders.length,
        pending: 0,
        paid: 0,
        cancelled: 0
      }
    }

    return {
      all: metrics.totalOrders,
      pending: metrics.pendingOrders,
      paid: metrics.paidOrders,
      cancelled: metrics.cancelledOrders
    }
  }

  const filterCounts = getFilterCounts()

  // Loading state para autenticación
  if (authLoading) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
              <p className="text-slate-600 dark:text-slate-400 text-clean">
                Verificando autenticación...
              </p>
            </div>
          </div>
        </div>
      </AdminLayout>
    )
  }

  // No autorizado
  if (!adminUser) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center justify-center min-h-screen">
            <Card className="shadow-soft-lg border-0 bg-white dark:bg-slate-800 max-w-md mx-auto">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 text-elegant mb-2">
                  Acceso no autorizado
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-clean">
                  No tienes permisos para acceder a esta sección.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            {/* Encabezado mejorado */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Título principal */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20 shadow-soft">
                    <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 text-elegant">
                      Gestión de Pedidos
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 text-clean mt-1">
                      Administra y supervisa todos los pedidos del casino escolar
                    </p>
                  </div>
                </div>

                {/* Acciones rápidas */}
                <div className="flex items-center gap-3">
                  <Button
                    onClick={refreshOrders}
                    variant="outline"
                    disabled={isLoading}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Actualizar
                  </Button>
                  
                  <GeneratePDFButton
                    orders={orders}
                    metrics={metrics}
                    weekStart={filters.weekStart || ''}
                    adminUser={adminUser}
                    filters={{
                      status: filters.status,
                      userType: filters.userType,
                      searchTerm: filters.searchTerm
                    }}
                  />
                </div>
              </div>

              {/* Información de la semana actual */}
              {filters.weekStart && (
                <Card className="border-0 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 shadow-soft">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <div>
                          <p className="font-medium text-slate-800 dark:text-slate-100 text-clean">
                            Semana seleccionada
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400 text-clean">
                            {format(new Date(filters.weekStart), "'Semana del' d 'de' MMMM yyyy", { locale: es })}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" className="bg-white dark:bg-slate-800">
                          {filterCounts.all} pedidos
                        </Badge>
                        {metrics && (
                          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                            ${metrics.totalRevenue.toLocaleString()} CLP
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Filtros rápidos por estado */}
              <Card className="border-0 bg-white dark:bg-slate-800 shadow-soft">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Filtros rápidos:
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        variant={filters.status === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleQuickFilter('all')}
                        className="text-xs"
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        Todos ({filterCounts.all})
                      </Button>
                      <Button
                        variant={filters.status === 'pending' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleQuickFilter('pending')}
                        className={`text-xs ${
                          filters.status === 'pending' 
                            ? 'bg-amber-600 hover:bg-amber-700' 
                            : 'text-amber-600 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                        }`}
                      >
                        <Clock className="w-3 h-3 mr-1" />
                        Pendientes ({filterCounts.pending})
                        {(metrics?.criticalPendingOrders || 0) > 0 && (
                          <Badge variant="destructive" className="ml-1 text-xs animate-pulse">
                            {metrics?.criticalPendingOrders}
                          </Badge>
                        )}
                      </Button>
                      <Button
                        variant={filters.status === 'paid' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleQuickFilter('paid')}
                        className={`text-xs ${
                          filters.status === 'paid' 
                            ? 'bg-emerald-600 hover:bg-emerald-700' 
                            : 'text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                        }`}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Pagados ({filterCounts.paid})
                      </Button>
                      <Button
                        variant={filters.status === 'cancelled' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleQuickFilter('cancelled')}
                        className={`text-xs ${
                          filters.status === 'cancelled' 
                            ? 'bg-red-600 hover:bg-red-700' 
                            : 'text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20'
                        }`}
                      >
                        <XCircle className="w-3 h-3 mr-1" />
                        Cancelados ({filterCounts.cancelled})
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Estado de error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Alert variant="destructive" className="shadow-soft">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <span>{error}</span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={refreshOrders}
                      className="ml-4"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Reintentar
                    </Button>
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}

            {/* Alerta para pedidos críticos */}
            {metrics && (metrics.criticalPendingOrders || 0) > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 shadow-soft">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <span>
                      <strong>{metrics.criticalPendingOrders}</strong> pedidos llevan más de 3 días pendientes de pago
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive" className="animate-pulse">
                        Requiere atención
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickFilter('pending')}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        Ver pendientes
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}

            {/* Tabs principales */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3">
                  <TabsTrigger value="overview" className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    <span className="hidden sm:inline">Vista General</span>
                    <span className="sm:hidden">General</span>
                  </TabsTrigger>
                  <TabsTrigger value="kitchen" className="flex items-center gap-2">
                    <ChefHat className="w-4 h-4" />
                    <span className="hidden sm:inline">Resúmenes Cocina</span>
                    <span className="sm:hidden">Cocina</span>
                  </TabsTrigger>
                  <TabsTrigger value="orders" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span className="hidden sm:inline">Lista de Pedidos</span>
                    <span className="sm:hidden">Pedidos</span>
                  </TabsTrigger>
                </TabsList>

                {/* Vista General */}
                <TabsContent value="overview" className="space-y-6">
                  {/* Métricas */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <OrdersMetrics 
                      metrics={metrics} 
                      isLoading={isLoading} 
                    />
                  </motion.div>

                  {/* Filtros */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <OrdersFilters
                      filters={filters}
                      onFiltersChange={updateFilters}
                      totalResults={orders.length}
                    />
                  </motion.div>
                </TabsContent>

                {/* Resúmenes para Cocina */}
                <TabsContent value="kitchen" className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <DailyMenuSummary
                      orders={orders}
                      weekStart={filters.weekStart || ''}
                      adminUser={adminUser}
                    />
                  </motion.div>
                </TabsContent>

                {/* Lista de Pedidos */}
                <TabsContent value="orders" className="space-y-6">
                  {/* Filtros */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <OrdersFilters
                      filters={filters}
                      onFiltersChange={updateFilters}
                      totalResults={orders.length}
                    />
                  </motion.div>

                  {/* Tabla de pedidos */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <OrdersTable
                      orders={orders}
                      isLoading={isLoading}
                      onViewDetail={handleViewDetail}
                      onUpdateStatus={handleStatusUpdate}
                      onDeleteOrder={handleDeleteOrder}
                      filters={filters}
                    />
                  </motion.div>

                  {/* Estado vacío */}
                  {!isLoading && !error && orders.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="max-w-2xl mx-auto"
                    >
                      <Card className="shadow-soft-lg border-0 bg-white dark:bg-slate-800">
                        <CardContent className="p-12 text-center">
                          <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-700 dark:to-slate-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-soft">
                            <FileText className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                          </div>
                          <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-3 text-elegant">
                            No hay pedidos
                          </h3>
                          <p className="text-slate-600 dark:text-slate-400 text-clean mb-6">
                            No se encontraron pedidos con los filtros aplicados. 
                            Intenta ajustar los criterios de búsqueda.
                          </p>
                          <Button
                            onClick={() => updateFilters({ 
                              userType: 'all', 
                              status: 'all', 
                              searchTerm: '',
                              day: undefined 
                            })}
                            variant="outline"
                          >
                            Limpiar filtros
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </TabsContent>
              </Tabs>
            </motion.div>

            {/* Modal de detalle */}
            <OrderDetailModal
              orderId={selectedOrderId}
              isOpen={isDetailModalOpen}
              onClose={handleCloseDetail}
              onStatusUpdate={handleStatusUpdate}
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}