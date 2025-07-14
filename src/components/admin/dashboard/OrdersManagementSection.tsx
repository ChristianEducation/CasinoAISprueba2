"use client"
import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  Calendar,
  Users,
  ShoppingCart,
  Filter,
  ChefHat,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Utensils,
  Coffee,
  Package,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { ExportToExcelButton } from '@/components/admin/pedidos/ExportToExcelButton'
import { AdminOrderView } from '@/types/adminOrder'
import { useAdminOrdersSimple } from '@/hooks/useAdminOrdersSimple'
import { format, parseISO, startOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'

// Define the OrderHistoryItem type locally since it's not exported from the hook
interface OrderHistoryItem {
  id?: string
  userId: string
  tipoUsuario: 'apoderado' | 'funcionario'
  weekStart: string
  resumenPedido: Array<{
    date: string
    dia: string
    fecha: string
    hijo: { id: string; name: string; curso: string; rut?: string; active: boolean } | null
    almuerzo?: {
      id: string
      code: string
      name: string
      description: string
      type: 'almuerzo'
      price: number
      available: boolean
      date: string
      dia: string
      active: boolean
    }
    colacion?: {
      id: string
      code: string
      name: string
      description: string
      type: 'colacion'
      price: number
      available: boolean
      date: string
      dia: string
      active: boolean
    }
  }>
  total: number
  status: 'pendiente' | 'pagado' | 'cancelado' | 'procesando_pago'
  createdAt: Date
  paidAt?: Date
  paymentId?: string
  weekLabel: string
  formattedDate: string
  itemsCount: number
  hasColaciones: boolean
  user?: {
    id: string
    firstName: string
    lastName: string
    email: string
    userType: string
  }
  daysSincePending?: number
}

interface OrderFilters {
  status: 'all' | 'pendiente' | 'pagado' | 'cancelado'
  userType: 'all' | 'apoderado' | 'funcionario'
  searchTerm: string
  weekStart?: string
}

export function OrdersManagementSection() {
  const { orders, isLoading, error, refreshOrders, updateOrderStatus } = useAdminOrdersSimple()
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState<OrderFilters>({
    status: 'all',
    userType: 'all',
    searchTerm: '',
    weekStart: format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  })
  const [showFilters, setShowFilters] = useState(false)

  // Función para alternar la expansión de un pedido
  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(orderId)) {
        newSet.delete(orderId)
      } else {
        newSet.add(orderId)
      }
      return newSet
    })
  }

  // Filtrar pedidos
  const filteredOrders = useMemo(() => {
    let filtered = [...orders]

    // Filtrar por estado
    if (filters.status !== 'all') {
      filtered = filtered.filter(order => order.status === filters.status)
    }

    // Filtrar por tipo de usuario
    if (filters.userType !== 'all') {
      filtered = filtered.filter(order => order.tipoUsuario === filters.userType)
    }

    // Filtrar por término de búsqueda
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase()
      filtered = filtered.filter(order => {
        const fullName = `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.toLowerCase()
        const email = (order.user?.email || '').toLowerCase()
        return fullName.includes(searchLower) || email.includes(searchLower)
      })
    }

    // Filtrar por semana
    if (filters.weekStart) {
      filtered = filtered.filter(order => order.weekStart === filters.weekStart)
    }

    return filtered
  }, [orders, filters])

  // Función para actualizar filtros
  const updateFilters = (newFilters: Partial<OrderFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  // Convertir pedidos al formato AdminOrderView para la exportación
  const convertToAdminOrderView = (orders: OrderHistoryItem[]): AdminOrderView[] => {
    return orders.map(order => {
      // Determinar el userType correcto
      const getUserType = (tipoUsuario: string | undefined): 'funcionario' | 'estudiante' => {
        if (tipoUsuario === 'funcionario') return 'funcionario'
        return 'estudiante' // apoderado se mapea a estudiante para el admin
      }

      // Procesar itemsDetail desde resumenPedido
      const itemsDetail = order.resumenPedido?.map((selection) => {
        try {
          return {
            date: selection.date,
            dayName: format(parseISO(selection.date), 'EEEE', { locale: es }),
            almuerzo: selection.almuerzo ? {
              code: selection.almuerzo.code || 'ALM',
              name: selection.almuerzo.name || selection.almuerzo.description || 'Almuerzo',
              price: Number(selection.almuerzo.price) || 0
            } : undefined,
            colacion: selection.colacion ? {
              code: selection.colacion.code || 'COL',
              name: selection.colacion.name || selection.colacion.description || 'Colación',
              price: Number(selection.colacion.price) || 0
            } : undefined
          }
        } catch (error) {
          console.error('Error processing selection for export:', selection, error)
          return {
            date: selection.date || '',
            dayName: 'Fecha inválida',
            almuerzo: undefined,
            colacion: undefined
          }
        }
      }) || []

      // Calcular totales
      const totalAlmuerzos = order.resumenPedido?.filter((s) => s.almuerzo).length || 0
      const totalColaciones = order.resumenPedido?.filter((s) => s.colacion).length || 0
      const almuerzosPrice = order.resumenPedido?.reduce((sum, s) => 
        sum + (Number(s.almuerzo?.price) || 0), 0) || 0
      const colacionesPrice = order.resumenPedido?.reduce((sum, s) => 
        sum + (Number(s.colacion?.price) || 0), 0) || 0

      // Map local status to AdminOrderView status
      const mapStatus = (status: string): 'pending' | 'draft' | 'cancelled' | 'paid' => {
        switch (status) {
          case 'pendiente':
            return 'pending'
          case 'pagado':
            return 'paid'
          case 'cancelado':
            return 'cancelled'
          // You can map 'procesando_pago' to 'pending' or another appropriate value
          case 'procesando_pago':
            return 'pending'
          default:
            return 'pending'
        }
      }

      const adminOrder: AdminOrderView = {
        id: order.id,
        userId: order.userId,
        weekStart: order.weekStart,
        selections: order.resumenPedido || [],
        total: Number(order.total) || 0,
        status: mapStatus(order.status),
        createdAt: order.createdAt,
        paidAt: order.paidAt,
        cancelledAt: order.paidAt, // Note: using paidAt as fallback since cancelledAt might not exist
        daysSincePending: order.daysSincePending,
        paymentId: order.paymentId,
        user: {
          id: order.user?.id || order.userId,
          firstName: order.user?.firstName || '',
          lastName: order.user?.lastName || '',
          email: order.user?.email || '',
          userType: getUserType(order.user?.userType || order.tipoUsuario)
        },
        dayName: format(order.createdAt, 'EEEE', { locale: es }),
        formattedDate: format(order.createdAt, 'dd/MM/yyyy HH:mm'),
        itemsCount: totalAlmuerzos + totalColaciones,
        hasColaciones: totalColaciones > 0,
        itemsSummary: {
          totalAlmuerzos,
          totalColaciones,
          almuerzosPrice,
          colacionesPrice,
          itemsDetail
        }
      }

      return adminOrder
    })
  }

  // Función para obtener el color del estado
  const getStatusColor = (status: string, daysSincePending?: number) => {
    switch (status) {
      case 'pagado':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
      case 'pendiente':
        if ((daysSincePending || 0) > 3) {
          return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 animate-pulse'
        }
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
      case 'cancelado':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
      case 'procesando_pago':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
    }
  }

  // Función para obtener el icono del estado
  const getStatusIcon = (status: string, daysSincePending?: number) => {
    switch (status) {
      case 'pagado':
        return <CheckCircle className="w-4 h-4" />
      case 'pendiente':
        if ((daysSincePending || 0) > 3) {
          return <AlertTriangle className="w-4 h-4" />
        }
        return <Clock className="w-4 h-4" />
      case 'cancelado':
        return <XCircle className="w-4 h-4" />
      case 'procesando_pago':
        return <RefreshCw className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  // Función para obtener el label del estado
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pagado':
        return 'Pagado'
      case 'pendiente':
        return 'Pendiente'
      case 'cancelado':
        return 'Cancelado'
      case 'procesando_pago':
        return 'Procesando'
      default:
        return 'Desconocido'
    }
  }

  // Función para formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount)
  }

  // Función para obtener el día de la semana
  const getDayOfWeek = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'EEEE', { locale: es })
    } catch {
      return 'Fecha inválida'
    }
  }

  // Función para formatear fecha
  const getFormattedDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy', { locale: es })
    } catch {
      return dateString
    }
  }

  // Calcular estadísticas
  const stats = {
    totalFiltered: filteredOrders.length,
    todayOrders: filteredOrders.filter(order => {
      const today = new Date()
      const orderDate = order.createdAt
      return orderDate.toDateString() === today.toDateString()
    }).length,
    criticalOrders: filteredOrders.filter(order => 
      order.status === 'pendiente' && (order.daysSincePending || 0) > 3
    ).length,
    byMenuType: {
      almuerzo: filteredOrders.filter(order => 
        order.resumenPedido.some(s => s.almuerzo)
      ).length,
      colacion: filteredOrders.filter(order => 
        order.resumenPedido.some(s => s.colacion)
      ).length
    }
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={refreshOrders}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Reintentar
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Pedidos</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {stats.totalFiltered}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Hoy</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {stats.todayOrders}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Críticos</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {stats.criticalOrders}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Coffee className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Con Colaciones</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {stats.byMenuType.colacion}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles y filtros */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <CardTitle className="flex items-center space-x-2">
              <ChefHat className="w-5 h-5 text-blue-600" />
              <span>Gestión de Pedidos para Cocina</span>
              {isLoading && (
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              )}
            </CardTitle>
            
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </Button>
              
              <Button variant="outline" size="sm" onClick={refreshOrders} disabled={isLoading}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualizar
              </Button>

              {/* Botón de exportación a Excel */}
              <ExportToExcelButton 
                orders={convertToAdminOrderView(filteredOrders as OrderHistoryItem[])} 
                isLoading={isLoading}
                filters={{
                  weekStart: filters.weekStart,
                  status: filters.status === 'all' ? undefined : filters.status,
                  userType: filters.userType === 'all' ? undefined : filters.userType,
                  searchTerm: filters.searchTerm
                }}
              />
            </div>
          </div>
        </CardHeader>

        {showFilters && (
          <CardContent className="border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                  Buscar
                </label>
                <Input
                  placeholder="Nombre, email..."
                  value={filters.searchTerm}
                  onChange={(e) => updateFilters({ searchTerm: e.target.value })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                  Estado
                </label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => updateFilters({ status: value as OrderFilters['status'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pendiente">Pendientes</SelectItem>
                    <SelectItem value="pagado">Pagados</SelectItem>
                    <SelectItem value="cancelado">Cancelados</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                  Tipo Usuario
                </label>
                <Select
                  value={filters.userType}
                  onValueChange={(value) => updateFilters({ userType: value as OrderFilters['userType'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="apoderado">Apoderados</SelectItem>
                    <SelectItem value="funcionario">Funcionarios</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                  Semana
                </label>
                <Input
                  type="date"
                  value={filters.weekStart || ''}
                  onChange={(e) => updateFilters({ weekStart: e.target.value })}
                  className="w-full"
                />
              </div>
            </div>
          </CardContent>
        )}

        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                No hay pedidos
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {orders.length === 0 
                  ? "No se encontraron pedidos en la base de datos."
                  : "No hay pedidos que coincidan con los filtros aplicados."
                }
              </p>
              <Button onClick={refreshOrders} className="mt-4">
                <RefreshCw className="w-4 h-4 mr-2" />
                Recargar
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Mostrando {filteredOrders.length} de {orders.length} pedidos
              </p>
              
              {filteredOrders.map((order) => {
                const isExpanded = expandedOrders.has(order.id!)
                
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    {/* Header del pedido */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-slate-800 dark:text-slate-100">
                              {order.user?.firstName} {order.user?.lastName}
                            </h4>
                            <Badge className={getStatusColor(order.status, order.daysSincePending)}>
                              {getStatusIcon(order.status, order.daysSincePending)}
                              <span className="ml-1">{getStatusLabel(order.status)}</span>
                            </Badge>
                            {order.daysSincePending && order.daysSincePending > 3 && (
                              <Badge variant="destructive" className="text-xs">
                                {order.daysSincePending} días
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {order.user?.email} • {order.weekLabel}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-500">
                            Pedido realizado el {order.formattedDate}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                            {formatCurrency(order.total)}
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            {order.itemsCount} elemento{order.itemsCount !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>

                      <Separator className="my-3" />

                      {/* Resumen del pedido */}
                      <div className="space-y-2">
                        {order.tipoUsuario === 'apoderado' ? (
                          // Para apoderados: agrupar por hijo
                          Object.entries(
                            order.resumenPedido.reduce((acc, selection) => {
                              const childKey = selection.hijo ? selection.hijo.id : 'funcionario'
                              const childName = selection.hijo ? selection.hijo.name : 'Funcionario'
                              
                              if (!acc[childKey]) {
                                acc[childKey] = { name: childName, almuerzos: 0, colaciones: 0 }
                              }
                              
                              if (selection.almuerzo) acc[childKey].almuerzos++
                              if (selection.colacion) acc[childKey].colaciones++
                              
                              return acc
                            }, {} as Record<string, { name: string; almuerzos: number; colaciones: number }>)
                          ).map(([childId, data]) => (
                            <div key={childId} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-slate-400" />
                                <span className="text-slate-700 dark:text-slate-300">{data.name}</span>
                              </div>
                              <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400">
                                {data.almuerzos > 0 && (
                                  <div className="flex items-center gap-1">
                                    <Utensils className="w-3 h-3" />
                                    <span>{data.almuerzos} almuerzo{data.almuerzos !== 1 ? 's' : ''}</span>
                                  </div>
                                )}
                                {data.colaciones > 0 && (
                                  <div className="flex items-center gap-1">
                                    <Coffee className="w-3 h-3" />
                                    <span>{data.colaciones} colación{data.colaciones !== 1 ? 'es' : ''}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          // Para funcionarios: mostrar resumen simple
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-slate-400" />
                              <span className="text-slate-700 dark:text-slate-300">Funcionario</span>
                            </div>
                            <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400">
                              {order.resumenPedido.filter(s => s.almuerzo).length > 0 && (
                                <div className="flex items-center gap-1">
                                  <Utensils className="w-3 h-3" />
                                  <span>{order.resumenPedido.filter(s => s.almuerzo).length} almuerzo{order.resumenPedido.filter(s => s.almuerzo).length !== 1 ? 's' : ''}</span>
                                </div>
                              )}
                              {order.resumenPedido.filter(s => s.colacion).length > 0 && (
                                <div className="flex items-center gap-1">
                                  <Coffee className="w-3 h-3" />
                                  <span>{order.resumenPedido.filter(s => s.colacion).length} colación{order.resumenPedido.filter(s => s.colacion).length !== 1 ? 'es' : ''}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Botones de acción y expansión */}
                      <div className="flex justify-between items-center mt-4">
                        <div className="flex gap-2">
                          {order.status === 'pendiente' && (
                            <Button
                              size="sm"
                              onClick={() => updateOrderStatus(order.id!, 'pagado')}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Marcar Pagado
                            </Button>
                          )}
                          {order.status !== 'cancelado' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateOrderStatus(order.id!, 'cancelado')}
                              className="text-red-600 border-red-300 hover:bg-red-50"
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              Cancelar
                            </Button>
                          )}
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleOrderExpansion(order.id!)}
                          className="flex items-center gap-2 text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                        >
                          <Package className="w-4 h-4" />
                          <span>{isExpanded ? 'Ocultar detalles' : 'Ver detalles del menú'}</span>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    {/* Detalles expandibles del pedido */}
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-slate-200 dark:border-slate-700 bg-orange-50/50 dark:bg-orange-900/10"
                      >
                        <div className="p-4">
                          <h5 className="font-medium text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                            <ChefHat className="w-4 h-4 text-orange-600" />
                            Lista de Preparación por Día
                          </h5>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {order.resumenPedido.map((selection, index) => (
                              <motion.div
                                key={`${selection.date}-${index}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg p-3"
                              >
                                {/* Encabezado del día */}
                                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">
                                  <div>
                                    <h6 className="font-bold text-slate-800 dark:text-slate-100 capitalize">
                                      {getDayOfWeek(selection.date)}
                                    </h6>
                                    <p className="text-xs text-slate-600 dark:text-slate-400">
                                      {getFormattedDate(selection.date)}
                                    </p>
                                  </div>
                                  {selection.hijo && (
                                    <Badge variant="outline" className="text-xs">
                                      {selection.hijo.name}
                                    </Badge>
                                  )}
                                </div>

                                {/* Items del día */}
                                <div className="space-y-2">
                                  {/* Almuerzo */}
                                  {selection.almuerzo ? (
                                    <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-md p-2">
                                      <div className="flex items-center gap-2 mb-1">
                                        <Utensils className="w-3 h-3 text-blue-600" />
                                        <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                                          ALMUERZO
                                        </span>
                                      </div>
                                      <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                          <p className="font-bold text-blue-900 dark:text-blue-100 text-sm">
                                            {selection.almuerzo.code}
                                          </p>
                                          <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs">
                                            {formatCurrency(selection.almuerzo.price)}
                                          </Badge>
                                        </div>
                                        <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
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
                                    <div className="bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-md p-2 text-center">
                                      <Utensils className="w-3 h-3 text-slate-400 mx-auto mb-1" />
                                      <p className="text-xs text-slate-500">Sin almuerzo</p>
                                    </div>
                                  )}

                                  {/* Colación */}
                                  {selection.colacion ? (
                                    <div className="bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-800 rounded-md p-2">
                                      <div className="flex items-center gap-2 mb-1">
                                        <Coffee className="w-3 h-3 text-emerald-600" />
                                        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                                          COLACIÓN
                                        </span>
                                      </div>
                                      <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                          <p className="font-bold text-emerald-900 dark:text-emerald-100 text-sm">
                                            {selection.colacion.code}
                                          </p>
                                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-xs">
                                            {formatCurrency(selection.colacion.price)}
                                          </Badge>
                                        </div>
                                        <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
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
                                    <div className="bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-md p-2 text-center">
                                      <Coffee className="w-3 h-3 text-slate-400 mx-auto mb-1" />
                                      <p className="text-xs text-slate-500">Sin colación</p>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}