"use client"
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, 
  CreditCard, 
  Clock,
  CheckCircle,
  AlertCircle,
  Mail,
  Package,
  DollarSign,
  ShoppingBag,
  Coffee,
  Printer,
  Download,
  ChefHat,
  Utensils
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { AdminOrderService } from '@/services/adminOrderService'
import { OrderDetailView } from '@/types/adminOrder'
import { formatAdminCurrency, formatAdminDate, formatAdminTime } from '@/lib/adminUtils'
import { Skeleton } from '@/components/ui/skeleton'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

interface OrderDetailModalProps {
  orderId: string | null
  isOpen: boolean
  onClose: () => void
  onStatusUpdate: (orderId: string, status: 'pending' | 'paid' | 'cancelled') => Promise<void>
}

export function OrderDetailModal({ 
  orderId, 
  isOpen, 
  onClose, 
  onStatusUpdate 
}: OrderDetailModalProps) {
  const [orderDetail, setOrderDetail] = useState<OrderDetailView | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPrinting, setIsPrinting] = useState(false)

  const loadOrderDetail = useCallback(async () => {
    if (!orderId) return

    setIsLoading(true)
    setError(null)
    
    try {
      const detail = await AdminOrderService.getOrderDetail(orderId)
      setOrderDetail(detail)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el detalle')
    } finally {
      setIsLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    if (isOpen && orderId) {
      loadOrderDetail()
    } else if (!isOpen) {
      // Limpiar estado cuando se cierra el modal
      setOrderDetail(null)
      setError(null)
    }
  }, [isOpen, orderId, loadOrderDetail])

  const handleStatusUpdate = async (newStatus: 'pending' | 'paid' | 'cancelled') => {
    if (!orderId) return

    setIsUpdating(true)
    try {
      await onStatusUpdate(orderId, newStatus)
      await loadOrderDetail() // Recargar detalles
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el estado')
    } finally {
      setIsUpdating(false)
    }
  }

  const handlePrintOrder = () => {
    setIsPrinting(true)
    // Simular impresión
    setTimeout(() => {
      setIsPrinting(false)
      // Aquí implementarías la lógica real de impresión
      window.print()
    }, 1000)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-emerald-600" />
      case 'pending':
        return <Clock className="w-4 h-4 text-amber-600" />
      case 'cancelled':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-slate-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800'
      case 'pending':
        return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800'
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-300 dark:border-slate-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Pagado'
      case 'pending':
        return 'Pendiente'
      case 'cancelled':
        return 'Cancelado'
      default:
        return status
    }
  }

  const getUserTypeColor = (userType: string) => {
    return userType === 'estudiante' 
      ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
      : 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800'
  }

  const getUserTypeLabel = (userType: string) => {
    return userType === 'estudiante' ? 'Estudiante' : 'Funcionario'
  }

  const getDayOfWeek = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'EEEE', { locale: es })
    } catch {
      return 'Fecha inválida'
    }
  }

  const getFormattedDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy', { locale: es })
    } catch {
      return dateString
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-blue-600" />
              <span>Detalle del Pedido para Entrega</span>
              {orderDetail && (
                <Badge className={`border-2 ${getStatusColor(orderDetail.status)}`}>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(orderDetail.status)}
                    <span>{getStatusLabel(orderDetail.status)}</span>
                  </div>
                </Badge>
              )}
            </div>
            {orderDetail && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrintOrder}
                  disabled={isPrinting}
                  className="text-slate-600 hover:text-slate-700"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  {isPrinting ? 'Imprimiendo...' : 'Imprimir'}
                </Button>
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
              </div>
              <Skeleton className="h-64 w-full" />
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-12"
            >
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Error al cargar el pedido
              </h3>
              <p className="text-red-600 dark:text-red-400 mb-6">{error}</p>
              <Button onClick={loadOrderDetail} className="bg-blue-600 hover:bg-blue-700">
                <Clock className="w-4 h-4 mr-2" />
                Reintentar
              </Button>
            </motion.div>
          ) : orderDetail ? (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Información principal del pedido */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Información del cliente */}
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-blue-700 dark:text-blue-300">
                      <User className="w-5 h-5" />
                      <span>Cliente</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-lg font-bold">
                        {orderDetail.user.firstName.charAt(0)}{orderDetail.user.lastName.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                          {orderDetail.user.firstName} {orderDetail.user.lastName}
                        </h3>
                        <Badge className={`border ${getUserTypeColor(orderDetail.user.userType)}`}>
                          {getUserTypeLabel(orderDetail.user.userType)}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Mail className="w-4 h-4 text-slate-500" />
                        <div className="flex-1">
                          <p className="text-xs text-slate-600 dark:text-slate-400">Email</p>
                          <p className="font-medium text-slate-900 dark:text-white text-sm">
                            {orderDetail.user.email}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Package className="w-4 h-4 text-slate-500" />
                        <div className="flex-1">
                          <p className="text-xs text-slate-600 dark:text-slate-400">ID del pedido</p>
                          <p className="font-mono text-xs text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                            {orderDetail.id}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Resumen del pedido */}
                <Card className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-emerald-200 dark:border-emerald-800">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-300">
                      <ChefHat className="w-5 h-5" />
                      <span>Resumen</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-lg">
                        <ShoppingBag className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          {orderDetail.itemsSummary?.totalAlmuerzos || 0}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Almuerzos
                        </p>
                      </div>
                      <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-lg">
                        <Coffee className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                        <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                          {orderDetail.itemsSummary?.totalColaciones || 0}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Colaciones
                        </p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-lg">
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Total</p>
                      <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        {formatAdminCurrency(orderDetail.total)}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {orderDetail.itemsCount} items total
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Estado del pago */}
                <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-700/50 border-slate-200 dark:border-slate-700">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
                      <CreditCard className="w-5 h-5" />
                      <span>Estado del Pago</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-3">
                        <div className={`p-3 rounded-full ${
                          orderDetail.status === 'paid' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                          orderDetail.status === 'pending' ? 'bg-amber-100 dark:bg-amber-900/30' :
                          'bg-red-100 dark:bg-red-900/30'
                        }`}>
                          {getStatusIcon(orderDetail.status)}
                        </div>
                      </div>
                      <Badge className={`border-2 ${getStatusColor(orderDetail.status)} text-sm px-3 py-1`}>
                        {getStatusLabel(orderDetail.status)}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-center">
                      <div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">Creado</p>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {formatAdminDate(orderDetail.createdAt)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatAdminTime(orderDetail.createdAt)}
                        </p>
                      </div>
                      
                      {orderDetail.paidAt && (
                        <div className="pt-2 border-t">
                          <p className="text-xs text-emerald-600 dark:text-emerald-400">Pagado</p>
                          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                            {formatAdminDate(orderDetail.paidAt)}
                          </p>
                          <p className="text-xs text-emerald-600 dark:text-emerald-400">
                            {formatAdminTime(orderDetail.paidAt)}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Lista de preparación por día */}
              <Card className="border-2 border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-900/10">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-orange-700 dark:text-orange-300">
                    <Utensils className="w-5 h-5" />
                    <span>Lista de Preparación por Día</span>
                  </CardTitle>
                  <p className="text-sm text-orange-600 dark:text-orange-400">
                    Detalles específicos para la preparación y entrega de cada día
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {orderDetail.selections.map((selection, index) => (
                      <motion.div
                        key={selection.date}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-lg transition-all"
                      >
                        {/* Encabezado del día */}
                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
                          <div>
                            <h4 className="font-bold text-slate-900 dark:text-white capitalize text-lg">
                              {getDayOfWeek(selection.date)}
                            </h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {getFormattedDate(selection.date)}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs font-mono">
                            Día {index + 1}
                          </Badge>
                        </div>
                        
                        {/* Items del día */}
                        <div className="space-y-3">
                          {/* Almuerzo */}
                          {selection.almuerzo ? (
                            <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-3">
                              <div className="flex items-center space-x-2 mb-2">
                                <ShoppingBag className="w-4 h-4 text-blue-600" />
                                <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                                  ALMUERZO
                                </span>
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <p className="font-bold text-blue-900 dark:text-blue-100 text-lg">
                                    {selection.almuerzo.code}
                                  </p>
                                  <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-mono">
                                    {formatAdminCurrency(selection.almuerzo.price)}
                                  </Badge>
                                </div>
                                <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                                  {selection.almuerzo.name}
                                </p>
                                {selection.almuerzo.description && (
                                  <p className="text-xs text-blue-600 dark:text-blue-400">
                                    {selection.almuerzo.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-3 text-center">
                              <ShoppingBag className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                              <p className="text-sm text-slate-500">Sin almuerzo</p>
                            </div>
                          )}
                          
                          {/* Colación */}
                          {selection.colacion ? (
                            <div className="bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
                              <div className="flex items-center space-x-2 mb-2">
                                <Coffee className="w-4 h-4 text-emerald-600" />
                                <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                                  COLACIÓN
                                </span>
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <p className="font-bold text-emerald-900 dark:text-emerald-100 text-lg">
                                    {selection.colacion.code}
                                  </p>
                                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 font-mono">
                                    {formatAdminCurrency(selection.colacion.price)}
                                  </Badge>
                                </div>
                                <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">
                                  {selection.colacion.name}
                                </p>
                                {selection.colacion.description && (
                                  <p className="text-xs text-emerald-600 dark:text-emerald-400">
                                    {selection.colacion.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-3 text-center">
                              <Coffee className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                              <p className="text-sm text-slate-500">Sin colación</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Resumen financiero detallado */}
              {orderDetail.financialSummary && (
                <Card className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-700/50 border-slate-200 dark:border-slate-700">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
                      <DollarSign className="w-5 h-5" />
                      <span>Resumen Financiero</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-lg border">
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Almuerzos</p>
                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          {formatAdminCurrency(orderDetail.financialSummary.subtotalAlmuerzos)}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-lg border">
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Colaciones</p>
                        <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                          {formatAdminCurrency(orderDetail.financialSummary.subtotalColaciones)}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-lg border">
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Items</p>
                        <p className="text-lg font-bold text-slate-700 dark:text-slate-300">
                          {orderDetail.financialSummary.totalItems}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-lg border">
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Promedio</p>
                        <p className="text-lg font-bold text-slate-700 dark:text-slate-300">
                          {formatAdminCurrency(orderDetail.financialSummary.averageItemPrice)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Acciones administrativas */}
              <Card className="border-slate-200 dark:border-slate-700">
                <CardHeader>
                  <CardTitle className="text-slate-900 dark:text-white">
                    Acciones Administrativas
                  </CardTitle>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Gestiona el estado del pedido y realiza acciones administrativas
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {orderDetail.status === 'pending' && (
                      <Button
                        onClick={() => handleStatusUpdate('paid')}
                        disabled={isUpdating}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Marcar como Pagado
                      </Button>
                    )}
                    
                    {orderDetail.status === 'paid' && (
                      <Button
                        variant="outline"
                        onClick={() => handleStatusUpdate('pending')}
                        disabled={isUpdating}
                        className="border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/20"
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        Marcar como Pendiente
                      </Button>
                    )}
                    
                    {orderDetail.status !== 'cancelled' && (
                      <Button
                        variant="destructive"
                        onClick={() => handleStatusUpdate('cancelled')}
                        disabled={isUpdating}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Cancelar Pedido
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      onClick={handlePrintOrder}
                      disabled={isPrinting}
                      className="border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {isPrinting ? 'Generando...' : 'Exportar PDF'}
                    </Button>
                  </div>
                  
                  {isUpdating && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          Actualizando estado del pedido...
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}