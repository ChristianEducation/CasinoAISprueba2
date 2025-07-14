"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  ShoppingCart, 
  Plus, 
  Filter, 
  User as UserIcon, 
  CheckCircle, 
  Clock, 
  XCircle,
  Receipt,
  Utensils,
  Coffee,
  RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useOrderHistory } from '@/hooks/useOrderHistory'
import { User } from '@/types/panel'

interface MyOrdersSectionProps {
    user: User
    

}

export function MyOrdersSection({ user }: MyOrdersSectionProps) {
  const router = useRouter()
  const {
    filteredOrders,
    isLoading,
    error,
    filters,
    setFilters,
    refreshOrders,
    totalOrders,
    totalSpent,
    paidOrders,
    pendingOrders
  } = useOrderHistory(user)

  const [showFilters, setShowFilters] = useState(false)

  // Función para obtener el color del estado
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pagado':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
      case 'pendiente':
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
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pagado':
        return <CheckCircle className="w-4 h-4" />
      case 'pendiente':
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

  // Función para navegar a nuevo pedido
  const handleNewOrder = () => {
    router.push('/mi-pedido')
  }

  if (isLoading) {
    return (
      <Card className="border-0 bg-white dark:bg-slate-800 shadow-soft-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl font-semibold text-slate-800 dark:text-slate-100">
            <ShoppingCart className="w-5 h-5" />
            Mis Pedidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600 dark:text-slate-400">Cargando historial...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-0 bg-white dark:bg-slate-800 shadow-soft-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl font-semibold text-slate-800 dark:text-slate-100">
            <ShoppingCart className="w-5 h-5" />
            Mis Pedidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
            <Button onClick={refreshOrders} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="space-y-6"
    >
      {/* Header con estadísticas */}
      <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-25 dark:from-blue-900/20 dark:to-blue-800/10 shadow-soft-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-xl font-semibold text-slate-800 dark:text-slate-100">
              <ShoppingCart className="w-5 h-5" />
              Mis Pedidos
            </CardTitle>
            <Button onClick={handleNewOrder} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nuevo Pedido
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-white dark:bg-slate-800/50 rounded-lg">
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {totalOrders}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Total Pedidos
              </div>
            </div>
            <div className="text-center p-4 bg-white dark:bg-slate-800/50 rounded-lg">
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {paidOrders}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Pagados
              </div>
            </div>
            <div className="text-center p-4 bg-white dark:bg-slate-800/50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {pendingOrders}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Pendientes
              </div>
            </div>
            <div className="text-center p-4 bg-white dark:bg-slate-800/50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(totalSpent)}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Total Gastado
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filtros
            </Button>
            {(filters.childId !== 'all' || filters.status !== 'all' || filters.dateRange !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilters({ childId: 'all', status: 'all', dateRange: 'all' })}
              >
                Limpiar filtros
              </Button>
            )}
          </div>

          {/* Panel de filtros */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white dark:bg-slate-800/50 rounded-lg mb-4"
            >
              {/* Filtro por hijo */}
              {user.tipoUsuario === 'apoderado' && user.children && user.children.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                    Filtrar por hijo
                  </label>
                  <Select
                    value={filters.childId || 'all'}
                    onValueChange={(value) => setFilters({ ...filters, childId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los hijos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los hijos</SelectItem>
                      {user.children.map((child) => (
                        <SelectItem key={child.id} value={child.id}>
                          {child.name} - {child.curso}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Filtro por estado */}
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                  Estado del pedido
                </label>
                <Select
                  value={filters.status || 'all'}
                  onValueChange={(value) => setFilters({ ...filters, status: value as 'all' | 'pagado' | 'pendiente' | 'cancelado' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="pagado">Pagados</SelectItem>
                    <SelectItem value="pendiente">Pendientes</SelectItem>
                    <SelectItem value="cancelado">Cancelados</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por fecha */}
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                  Período
                </label>
                <Select
                  value={filters.dateRange || 'all'}
                  onValueChange={(value) => setFilters({ ...filters, dateRange: value as 'all' | 'last_month' | 'last_3_months' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todo el período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todo el período</SelectItem>
                    <SelectItem value="last_month">Último mes</SelectItem>
                    <SelectItem value="last_3_months">Últimos 3 meses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Lista de pedidos */}
      <Card className="border-0 bg-white dark:bg-slate-800 shadow-soft-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            Historial de Pedidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-800 dark:text-slate-100 mb-2">
                No hay pedidos
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                {totalOrders === 0 
                  ? "Aún no has realizado ningún pedido."
                  : "No hay pedidos que coincidan con los filtros seleccionados."
                }
              </p>
              <Button onClick={handleNewOrder} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Hacer mi primer pedido
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-slate-800 dark:text-slate-100">
                          {order.weekLabel}
                        </h4>
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1">{getStatusLabel(order.status)}</span>
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
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
                    {user.tipoUsuario === 'apoderado' ? (
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
                            <UserIcon className="w-4 h-4 text-slate-400" />
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
                          <UserIcon className="w-4 h-4 text-slate-400" />
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
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
