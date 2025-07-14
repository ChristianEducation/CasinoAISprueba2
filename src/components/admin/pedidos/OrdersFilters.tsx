"use client"
import { motion } from 'framer-motion'
import { Search, Filter, X, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { OrderFilters } from '@/types/adminOrder'
import { AdminOrderService } from '@/services/adminOrderService'

interface OrdersFiltersProps {
  filters: OrderFilters
  onFiltersChange: (filters: Partial<OrderFilters>) => void
  totalResults: number
}

export function OrdersFilters({ filters, onFiltersChange, totalResults }: OrdersFiltersProps) {
  const weekOptions = AdminOrderService.generateWeekOptions()
  
  const dayOptions = [
    { value: 'none', label: 'Todos los días' },
    { value: 'lunes', label: 'Lunes' },
    { value: 'martes', label: 'Martes' },
    { value: 'miércoles', label: 'Miércoles' },
    { value: 'jueves', label: 'Jueves' },
    { value: 'viernes', label: 'Viernes' }
  ]

  const userTypeOptions = [
    { value: 'all', label: 'Todos los usuarios' },
    { value: 'estudiante', label: 'Estudiantes' },
    { value: 'funcionario', label: 'Funcionarios' }
  ]

  const statusOptions = [
    { 
      value: 'all', 
      label: 'Todos los estados', 
      icon: Filter,
      color: 'text-slate-600'
    },
    { 
      value: 'pending', 
      label: 'Pendientes de pago', 
      icon: Clock,
      color: 'text-amber-600'
    },
    { 
      value: 'paid', 
      label: 'Pagados', 
      icon: CheckCircle,
      color: 'text-emerald-600'
    },
    { 
      value: 'cancelled', 
      label: 'Cancelados', 
      icon: XCircle,
      color: 'text-red-600'
    }
  ]

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.day && filters.day !== 'none') count++
    if (filters.userType && filters.userType !== 'all') count++
    if (filters.status && filters.status !== 'all') count++
    if (filters.searchTerm && filters.searchTerm.trim()) count++
    return count
  }

  const clearAllFilters = () => {
    onFiltersChange({
      day: 'none',
      userType: 'all',
      status: 'all',
      searchTerm: ''
    })
  }

  const getStatusButtonStyle = (status: string) => {
    const isActive = filters.status === status
    
    switch (status) {
      case 'pending':
        return isActive 
          ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600' 
          : 'text-amber-600 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20'
      case 'paid':
        return isActive 
          ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600' 
          : 'text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
      case 'cancelled':
        return isActive 
          ? 'bg-red-600 hover:bg-red-700 text-white border-red-600' 
          : 'text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20'
      default:
        return isActive 
          ? 'bg-slate-600 hover:bg-slate-700 text-white border-slate-600' 
          : 'text-slate-600 border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/20'
    }
  }

  const activeFiltersCount = getActiveFiltersCount()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-soft">
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Encabezado de filtros */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Filtros de Búsqueda
                </h3>
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    {activeFiltersCount} filtro{activeFiltersCount !== 1 ? 's' : ''} activo{activeFiltersCount !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Resultados:
                  </span>
                  <Badge variant="outline" className="font-semibold">
                    {totalResults}
                  </Badge>
                </div>
                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Limpiar filtros
                  </Button>
                )}
              </div>
            </div>

            {/* Filtros rápidos por estado mejorados */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Filtros Rápidos por Estado
              </label>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((option) => {
                  const Icon = option.icon
                  const isActive = filters.status === option.value
                  
                  return (
                    <Button
                      key={option.value}
                      variant={isActive ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onFiltersChange({ status: option.value as 'all' | 'pending' | 'paid' | 'cancelled' })}
                      className={`text-xs transition-all duration-200 ${getStatusButtonStyle(option.value)}`}
                    >
                      <Icon className="w-3 h-3 mr-1" />
                      {option.value === 'all' ? 'Todos' : 
                       option.value === 'pending' ? 'Pendientes' :
                       option.value === 'paid' ? 'Pagados' : 'Cancelados'}
                    </Button>
                  )
                })}
              </div>
            </div>

            {/* Filtros principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Selector de semana */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Semana
                </label>
                <Select
                  value={filters.weekStart || 'none'}
                  onValueChange={(value) => onFiltersChange({ weekStart: value === 'none' ? undefined : value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar semana" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Todas las semanas</SelectItem>
                    {weekOptions.map((week) => (
                      <SelectItem key={week.value} value={week.value}>
                        <div className="flex items-center space-x-2">
                          <span>{week.label}</span>
                          {week.isCurrent && (
                            <Badge variant="secondary" className="text-xs">
                              Actual
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por día */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Día específico
                </label>
                <Select
                  value={filters.day || 'none'}
                  onValueChange={(value) => onFiltersChange({ day: value === 'none' ? undefined : value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Todos los días" />
                  </SelectTrigger>
                  <SelectContent>
                    {dayOptions.map((day) => (
                      <SelectItem key={day.value} value={day.value}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por tipo de usuario */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Tipo de usuario
                </label>
                <Select
                  value={filters.userType || 'all'}
                  onValueChange={(value) => onFiltersChange({ userType: value as 'all' | 'estudiante' | 'funcionario' })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {userTypeOptions.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por estado detallado */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Estado detallado
                </label>
                <Select
                  value={filters.status || 'all'}
                  onValueChange={(value) => onFiltersChange({ status: value as 'all' | 'pending' | 'paid' | 'cancelled' })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => {
                      const Icon = status.icon
                      return (
                        <SelectItem key={status.value} value={status.value}>
                          <div className="flex items-center space-x-2">
                            <Icon className={`w-4 h-4 ${status.color}`} />
                            <span>{status.label}</span>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Búsqueda por nombre mejorada */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Buscar por nombre o email
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar cliente por nombre o email..."
                  value={filters.searchTerm || ''}
                  onChange={(e) => onFiltersChange({ searchTerm: e.target.value })}
                  className="pl-10 pr-10"
                />
                {filters.searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onFiltersChange({ searchTerm: '' })}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Información adicional según filtros */}
            {filters.status === 'pending' && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    Mostrando solo pedidos pendientes de pago
                  </span>
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  Los pedidos con más de 3 días pendientes aparecen resaltados como críticos.
                </p>
              </div>
            )}

            {filters.status === 'paid' && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                    Mostrando solo pedidos pagados
                  </span>
                </div>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                  Estos pedidos han sido confirmados y procesados exitosamente.
                </p>
              </div>
            )}

            {filters.status === 'cancelled' && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <span className="text-sm font-medium text-red-800 dark:text-red-200">
                    Mostrando solo pedidos cancelados
                  </span>
                </div>
                <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                  Estos pedidos fueron cancelados y no generan ingresos.
                </p>
              </div>
            )}

            {filters.searchTerm && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Search className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Búsqueda activa: &quot;{filters.searchTerm}&quot;
                  </span>
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  Mostrando resultados que coinciden con el término de búsqueda.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}