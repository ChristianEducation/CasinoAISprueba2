"use client"
import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Calendar,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  ChefHat,
  Download,
  Eye
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useOrdersDashboard } from '@/hooks/useOrdersDashboard'
import { AdminOrderView } from '@/types/adminOrder'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

interface DailyOrdersQueryProps {
  onClose?: () => void
}

export function DailyOrdersQuery({ onClose }: DailyOrdersQueryProps) {
  const {
    orders,
    isLoading,
    error,
    exportKitchenData,
    isExporting
  } = useOrdersDashboard()

  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderView | null>(null)
  const [localFilters, setLocalFilters] = useState({
    userType: 'all',
    status: 'all',
    menuType: 'all',
    searchTerm: ''
  })

  // Filtrar pedidos por fecha seleccionada
  const dailyOrders = orders.filter(order => {
    const orderDate = format(order.createdAt, 'yyyy-MM-dd')
    const matchesDate = orderDate === selectedDate

    // Aplicar filtros adicionales
    const matchesUserType = localFilters.userType === 'all' || order.user.userType === localFilters.userType
    const matchesStatus = localFilters.status === 'all' || order.status === localFilters.status
    const matchesSearch = !localFilters.searchTerm || 
      `${order.user.firstName} ${order.user.lastName}`.toLowerCase().includes(localFilters.searchTerm.toLowerCase()) ||
      order.user.email.toLowerCase().includes(localFilters.searchTerm.toLowerCase())

    let matchesMenuType = true
    if (localFilters.menuType === 'almuerzo') {
      matchesMenuType = order.itemsSummary.totalAlmuerzos > 0
    } else if (localFilters.menuType === 'colacion') {
      matchesMenuType = order.itemsSummary.totalColaciones > 0
    }

    return matchesDate && matchesUserType && matchesStatus && matchesSearch && matchesMenuType
  })

  // Estadísticas del día
  const dailyStats = {
    total: dailyOrders.length,
    paid: dailyOrders.filter(o => o.status === 'paid').length,
    pending: dailyOrders.filter(o => o.status === 'pending').length,
    cancelled: dailyOrders.filter(o => o.status === 'cancelled').length,
    totalAlmuerzos: dailyOrders.reduce((sum, o) => sum + o.itemsSummary.totalAlmuerzos, 0),
    totalColaciones: dailyOrders.reduce((sum, o) => sum + o.itemsSummary.totalColaciones, 0),
    revenue: dailyOrders.filter(o => o.status === 'paid').reduce((sum, o) => sum + o.total, 0),
    students: dailyOrders.filter(o => o.user.userType === 'estudiante').length,
    staff: dailyOrders.filter(o => o.user.userType === 'funcionario').length
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
          <CheckCircle className="w-3 h-3 mr-1" />
          Pagado
        </Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
          <Clock className="w-3 h-3 mr-1" />
          Pendiente
        </Badge>
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
          <XCircle className="w-3 h-3 mr-1" />
          Cancelado
        </Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getUserTypeBadge = (userType: string) => {
    return userType === 'estudiante' ? (
      <Badge variant="outline" className="text-blue-600 border-blue-200">
        <Users className="w-3 h-3 mr-1" />
        Estudiante
      </Badge>
    ) : (
      <Badge variant="outline" className="text-purple-600 border-purple-200">
        <Users className="w-3 h-3 mr-1" />
        Funcionario
      </Badge>
    )
  }

  const handleExportDaily = async () => {
    if (dailyOrders.length === 0) return
    
    try {
      await exportKitchenData()
    } catch (error) {
      console.error('Error exporting daily orders:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header con controles */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span>Consulta por Día</span>
            </CardTitle>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportDaily}
                disabled={isExporting || dailyOrders.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                {isExporting ? 'Exportando...' : 'Exportar Día'}
              </Button>
              
              {onClose && (
                <Button variant="outline" size="sm" onClick={onClose}>
                  Cerrar
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Selector de fecha y filtros */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                Fecha
              </label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                Buscar
              </label>
              <Input
                placeholder="Nombre, email..."
                value={localFilters.searchTerm}
                onChange={(e) => setLocalFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                Estado
              </label>
              <Select
                value={localFilters.status}
                onValueChange={(value) => setLocalFilters(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                  <SelectItem value="paid">Pagados</SelectItem>
                  <SelectItem value="cancelled">Cancelados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                Tipo Usuario
              </label>
              <Select
                value={localFilters.userType}
                onValueChange={(value) => setLocalFilters(prev => ({ ...prev, userType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="estudiante">Estudiantes</SelectItem>
                  <SelectItem value="funcionario">Funcionarios</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                Tipo Menú
              </label>
              <Select
                value={localFilters.menuType}
                onValueChange={(value) => setLocalFilters(prev => ({ ...prev, menuType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="almuerzo">Solo Almuerzo</SelectItem>
                  <SelectItem value="colacion">Solo Colación</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Estadísticas del día */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{dailyStats.total}</div>
              <div className="text-sm text-blue-600">Total Pedidos</div>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{dailyStats.paid}</div>
              <div className="text-sm text-green-600">Pagados</div>
            </div>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{dailyStats.pending}</div>
              <div className="text-sm text-yellow-600">Pendientes</div>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{dailyStats.totalAlmuerzos}</div>
              <div className="text-sm text-purple-600">Almuerzos</div>
            </div>
            
            <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{dailyStats.totalColaciones}</div>
              <div className="text-sm text-orange-600">Colaciones</div>
            </div>
            
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg">
              <div className="text-2xl font-bold text-emerald-600">
                ${dailyStats.revenue.toLocaleString('es-CL')}
              </div>
              <div className="text-sm text-emerald-600">Ingresos</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de pedidos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ChefHat className="w-5 h-5 text-blue-600" />
            <span>Pedidos del {format(parseISO(selectedDate), 'dd \'de\' MMMM \'de\' yyyy', { locale: es })}</span>
          </CardTitle>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : dailyOrders.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                No hay pedidos para esta fecha
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                No se encontraron pedidos para el {format(parseISO(selectedDate), 'dd/MM/yyyy')}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Hora</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Detalle</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyOrders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <TableCell>
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white">
                            {order.user.firstName} {order.user.lastName}
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            {order.user.email}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {getUserTypeBadge(order.user.userType)}
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm font-medium text-slate-900 dark:text-white">
                          {format(order.createdAt, 'HH:mm')}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex flex-col space-y-1">
                          {order.itemsSummary.totalAlmuerzos > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {order.itemsSummary.totalAlmuerzos} Almuerzo{order.itemsSummary.totalAlmuerzos > 1 ? 's' : ''}
                            </Badge>
                          )}
                          {order.itemsSummary.totalColaciones > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {order.itemsSummary.totalColaciones} Colación{order.itemsSummary.totalColaciones > 1 ? 'es' : ''}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {getStatusBadge(order.status)}
                      </TableCell>
                      
                      <TableCell>
                        <div className="font-medium text-slate-900 dark:text-white">
                          ${order.total.toLocaleString('es-CL')}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de detalle de pedido */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Detalle del Pedido - {format(selectedOrder.createdAt, 'dd/MM/yyyy HH:mm')}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedOrder(null)}
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Usuario
                    </label>
                    <p className="text-slate-900 dark:text-white">
                      {selectedOrder.user.firstName} {selectedOrder.user.lastName}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {selectedOrder.user.email}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Tipo y Estado
                    </label>
                    <div className="flex space-x-2 mt-1">
                      {getUserTypeBadge(selectedOrder.user.userType)}
                      {getStatusBadge(selectedOrder.status)}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2 block">
                    Detalle de Items por Día
                  </label>
                  <div className="space-y-3">
                    {selectedOrder.itemsSummary.itemsDetail.map((detail, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-slate-900 dark:text-white capitalize">
                            {detail.dayName}
                          </h4>
                          <Badge variant="outline">
                            {format(new Date(detail.date), 'dd/MM/yyyy')}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          {detail.almuerzo && (
                            <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                              <div>
                                <span className="text-sm font-medium text-blue-600">
                                  {detail.almuerzo.code}
                                </span>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                  {detail.almuerzo.name}
                                </p>
                              </div>
                              <span className="font-medium">
                                ${detail.almuerzo.price.toLocaleString('es-CL')}
                              </span>
                            </div>
                          )}
                          
                          {detail.colacion && (
                            <div className="flex justify-between items-center bg-purple-50 dark:bg-purple-900/20 p-2 rounded">
                              <div>
                                <span className="text-sm font-medium text-purple-600">
                                  {detail.colacion.code}
                                </span>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                  {detail.colacion.name}
                                </p>
                              </div>
                              <span className="font-medium">
                                ${detail.colacion.price.toLocaleString('es-CL')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-slate-900 dark:text-white">
                      Total del Pedido:
                    </span>
                    <span className="text-xl font-bold text-slate-900 dark:text-white">
                      ${selectedOrder.total.toLocaleString('es-CL')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
