"use client"
import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Eye, 
  MoreHorizontal, 
  CheckCircle, 
  Clock, 
  Calendar,
  Trash2,
  XCircle,
  AlertTriangle,
  Timer,
  Package,
  Coffee,
  Utensils
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { AdminOrderView } from '@/types/adminOrder'
import { formatAdminCurrency, formatAdminDate, formatAdminTime } from '@/lib/adminUtils'
import { ExportToExcelButton } from './ExportToExcelButton'
import { differenceInDays, format } from 'date-fns'
import { es } from 'date-fns/locale'

interface OrdersTableProps {
  orders: AdminOrderView[]
  isLoading: boolean
  onViewDetail: (orderId: string) => void
  onUpdateStatus: (orderId: string, status: 'pending' | 'paid' | 'cancelled') => Promise<void>
  onDeleteOrder: (orderId: string) => Promise<void>
  filters?: {
    weekStart?: string
    status?: string
    userType?: string
    searchTerm?: string
  }
}

export function OrdersTable({ 
  orders, 
  isLoading, 
  onViewDetail, 
  onUpdateStatus,
  onDeleteOrder,
  filters
}: OrdersTableProps) {
  const [updatingOrders, setUpdatingOrders] = useState<Set<string>>(new Set())
  const [deletingOrders, setDeletingOrders] = useState<Set<string>>(new Set())

  const handleStatusUpdate = async (orderId: string, status: 'pending' | 'paid' | 'cancelled') => {
    setUpdatingOrders(prev => new Set(prev).add(orderId))
    try {
      await onUpdateStatus(orderId, status)
    } finally {
      setUpdatingOrders(prev => {
        const newSet = new Set(prev)
        newSet.delete(orderId)
        return newSet
      })
    }
  }

  const handleDeleteOrder = async (orderId: string) => {
    setDeletingOrders(prev => new Set(prev).add(orderId))
    try {
      await onDeleteOrder(orderId)
    } finally {
      setDeletingOrders(prev => {
        const newSet = new Set(prev)
        newSet.delete(orderId)
        return newSet
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-emerald-600" />
      case 'pending':
        return <Clock className="w-4 h-4 text-amber-600" />
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-slate-600" />
    }
  }

  const getStatusColor = (status: string, daysSincePending?: number) => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800'
      case 'pending':
        if ((daysSincePending || 0) > 3) {
          return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800 animate-pulse'
        }
        return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800'
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-300 dark:border-slate-800'
    }
  }

  const getUserTypeColor = (userType: string) => {
    return userType === 'estudiante' 
      ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
      : 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800'
  }

  const getDaysSincePending = (order: AdminOrderView) => {
    if (order.status !== 'pending') return 0
    return differenceInDays(new Date(), new Date(order.createdAt))
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Pagado'
      case 'pending': return 'Pendiente'
      case 'cancelled': return 'Cancelado'
      default: return status
    }
  }

  // Función para formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount)
  }

  const renderProductsDetail = (order: AdminOrderView) => {
    const { itemsSummary } = order
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="space-y-2 cursor-help">
              {/* Resumen básico */}
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <Package className="w-4 h-4 text-slate-500" />
                  <span className="font-medium text-slate-900 dark:text-white">
                    {order.itemsCount} items
                  </span>
                </div>
                
                <div className="flex items-center space-x-1">
                  {itemsSummary.totalAlmuerzos > 0 && (
                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      <Utensils className="w-3 h-3 mr-1" />
                      {itemsSummary.totalAlmuerzos}A
                    </Badge>
                  )}
                  
                  {itemsSummary.totalColaciones > 0 && (
                    <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                      <Coffee className="w-3 h-3 mr-1" />
                      {itemsSummary.totalColaciones}C
                    </Badge>
                  )}
                </div>
              </div>

              {/* Detalle por día (máximo 3 días visibles) */}
              <div className="space-y-1">
                {itemsSummary.itemsDetail.slice(0, 3).map((detail, idx) => (
                  <div key={idx} className="text-xs text-slate-600 dark:text-slate-400">
                    <span className="font-medium capitalize">{detail.dayName}:</span>
                    <span className="ml-1">
                      {detail.almuerzo && (
                        <span className="text-blue-600">{detail.almuerzo.code}</span>
                      )}
                      {detail.almuerzo && detail.colacion && <span className="mx-1">+</span>}
                      {detail.colacion && (
                        <span className="text-emerald-600">{detail.colacion.code}</span>
                      )}
                    </span>
                  </div>
                ))}
                {itemsSummary.itemsDetail.length > 3 && (
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    +{itemsSummary.itemsDetail.length - 3} días más...
                  </div>
                )}
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-sm">
            <div className="space-y-3">
              <div className="font-semibold text-sm">Detalle del pedido:</div>
              
              {/* Resumen financiero */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Almuerzos:</span>
                  <span>{itemsSummary.totalAlmuerzos} ({formatCurrency(itemsSummary.almuerzosPrice)})</span>
                </div>
                <div className="flex justify-between">
                  <span>Colaciones:</span>
                  <span>{itemsSummary.totalColaciones} ({formatCurrency(itemsSummary.colacionesPrice)})</span>
                </div>
                <hr className="my-1" />
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
              </div>
              
              {/* Detalle completo por día */}
              {itemsSummary.itemsDetail.length > 0 && (
                <div className="mt-2 pt-2 border-t">
                  <div className="font-semibold text-xs mb-1">Productos por día:</div>
                  <div className="space-y-1 text-xs max-h-32 overflow-y-auto">
                    {itemsSummary.itemsDetail.map((detail, idx) => (
                      <div key={idx} className="text-xs">
                        <div className="font-medium capitalize">{detail.dayName}:</div>
                        <div className="ml-2 space-y-0.5">
                          {detail.almuerzo && (
                            <div className="flex justify-between">
                              <span className="text-blue-600">• {detail.almuerzo.code} - {detail.almuerzo.name}</span>
                              <span>{formatCurrency(detail.almuerzo.price)}</span>
                            </div>
                          )}
                          {detail.colacion && (
                            <div className="flex justify-between">
                              <span className="text-emerald-600">• {detail.colacion.code} - {detail.colacion.name}</span>
                              <span>{formatCurrency(detail.colacion.price)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  if (isLoading) {
    return (
      <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-soft">
        <CardHeader>
          <CardTitle>Pedidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (orders.length === 0) {
    return (
      <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Pedidos</span>
            <ExportToExcelButton 
              orders={orders} 
              isLoading={isLoading}
              filters={filters}
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              No hay pedidos
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              No se encontraron pedidos con los filtros aplicados.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span>Tabla de Pedidos</span>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                  {orders.length} pedidos
                </Badge>
                {orders.filter(o => o.status === 'pending' && getDaysSincePending(o) > 3).length > 0 && (
                  <Badge variant="destructive" className="animate-pulse">
                    {orders.filter(o => o.status === 'pending' && getDaysSincePending(o) > 3).length} críticos
                  </Badge>
                )}
              </div>
            </div>
            <ExportToExcelButton 
              orders={orders} 
              isLoading={isLoading}
              filters={filters}
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Fecha del Pedido</TableHead>
                  <TableHead>Productos Comprados</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha de Pago</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order, index) => {
                  const daysSincePending = getDaysSincePending(order)
                  const isCritical = order.status === 'pending' && daysSincePending > 3
                  
                  return (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                        isCritical ? 'bg-red-50 dark:bg-red-900/10' : ''
                      }`}
                    >
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 bg-gradient-to-br ${
                            order.user.userType === 'estudiante' 
                              ? 'from-blue-500 to-blue-600' 
                              : 'from-purple-500 to-purple-600'
                          } rounded-full flex items-center justify-center text-white text-sm font-semibold`}>
                            {order.user.firstName.charAt(0)}{order.user.lastName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {order.user.firstName} {order.user.lastName}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {order.user.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge className={`border ${getUserTypeColor(order.user.userType)}`}>
                          {order.user.userType === 'estudiante' ? 'Estudiante' : 'Funcionario'}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {formatAdminDate(order.createdAt)}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {formatAdminTime(order.createdAt)}
                          </p>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {renderProductsDetail(order)}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Badge className={`border ${getStatusColor(order.status, daysSincePending)}`}>
                            <div className="flex items-center space-x-1">
                              {isCritical ? (
                                <AlertTriangle className="w-4 h-4" />
                              ) : (
                                getStatusIcon(order.status)
                              )}
                              <span>{getStatusText(order.status)}</span>
                            </div>
                          </Badge>
                          {order.status === 'pending' && daysSincePending > 0 && (
                            <div className="flex items-center space-x-1 text-xs text-slate-500 dark:text-slate-400">
                              <Timer className="w-3 h-3" />
                              <span>{daysSincePending}d</span>
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        {order.status === 'paid' && order.paidAt ? (
                          <div>
                            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                              {format(new Date(order.paidAt), 'dd/MM/yyyy', { locale: es })}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {format(new Date(order.paidAt), 'HH:mm', { locale: es })}
                            </p>
                          </div>
                        ) : order.status === 'cancelled' && order.cancelledAt ? (
                          <div>
                            <p className="text-sm font-medium text-red-700 dark:text-red-300">
                              Cancelado
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {format(new Date(order.cancelledAt), 'dd/MM/yyyy', { locale: es })}
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400 dark:text-slate-500">
                            Pendiente
                          </span>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-right">
                          <span className="font-semibold text-slate-900 dark:text-white text-lg">
                            {formatAdminCurrency(order.total)}
                          </span>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {order.itemsCount} items
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewDetail(order.id!)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={updatingOrders.has(order.id!) || deletingOrders.has(order.id!)}
                                className="text-slate-600 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-300 dark:hover:bg-slate-700"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {order.status === 'pending' && (
                                <DropdownMenuItem
                                  onClick={() => handleStatusUpdate(order.id!, 'paid')}
                                  className="text-emerald-600 focus:text-emerald-700"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Marcar como Pagado
                                </DropdownMenuItem>
                              )}
                              
                              {order.status === 'paid' && (
                                <DropdownMenuItem
                                  onClick={() => handleStatusUpdate(order.id!, 'pending')}
                                  className="text-amber-600 focus:text-amber-700"
                                >
                                  <Clock className="w-4 h-4 mr-2" />
                                  Marcar como Pendiente
                                </DropdownMenuItem>
                              )}
                              
                              {order.status !== 'cancelled' && (
                                <DropdownMenuItem
                                  onClick={() => handleStatusUpdate(order.id!, 'cancelled')}
                                  className="text-red-600 focus:text-red-700"
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Cancelar Pedido
                                </DropdownMenuItem>
                              )}
                              
                              <DropdownMenuSeparator />
                              
                              <DropdownMenuItem
                                onClick={() => handleDeleteOrder(order.id!)}
                                disabled={deletingOrders.has(order.id!)}
                                className="text-red-600 focus:text-red-700"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                {deletingOrders.has(order.id!) ? 'Eliminando...' : 'Eliminar Pedido'}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </motion.tr>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}