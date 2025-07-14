"use client"
import { motion } from 'framer-motion'
import { 
  Filter, 
  X, 
  Calendar,
  Mail,
  Shield,
  Users
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { UserFilters } from '@/types/adminUser'

interface UsersFiltersProps {
  filters: UserFilters
  onFiltersChange: (filters: Partial<UserFilters>) => void
  onClearFilters: () => void
  isOpen: boolean
  onToggle: () => void
}

export function UsersFilters({ 
  filters, 
  onFiltersChange, 
  onClearFilters, 
  isOpen, 
  onToggle 
}: UsersFiltersProps) {
  const activeFiltersCount = Object.values(filters).filter(value => 
    value !== undefined && value !== 'all' && value !== '' && value !== 'none'
  ).length

  const handleDateRangeChange = (value: string) => {
    onFiltersChange({ 
      dateRange: value === 'none' ? undefined : value as 'week' | 'month' | 'custom',
      customStartDate: undefined,
      customEndDate: undefined
    })
  }

  return (
    <div className="mb-6">
      {/* Toggle Button */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          onClick={onToggle}
          className="flex items-center space-x-2"
        >
          <Filter className="w-4 h-4" />
          <span>Filtros</span>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>

        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="flex items-center space-x-2 text-slate-500 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
            <span>Limpiar filtros</span>
          </Button>
        )}
      </div>

      {/* Filters Panel */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Filtro por Rol */}
                <div className="space-y-2">
                  <Label className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-slate-500" />
                    <span>Tipo de Usuario</span>
                  </Label>
                  <Select
                    value={filters.role || 'all'}
                    onValueChange={(value) => onFiltersChange({ role: value as 'all' | 'estudiante' | 'funcionario' | 'admin' })}
                  >
                    <SelectTrigger className="bg-slate-50 dark:bg-slate-700">
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los usuarios</SelectItem>
                      <SelectItem value="estudiante">Apoderados</SelectItem>
                      <SelectItem value="funcionario">Funcionarios</SelectItem>
                      <SelectItem value="admin">Administradores</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro por Estado de Email */}
                <div className="space-y-2">
                  <Label className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-slate-500" />
                    <span>Estado del Correo</span>
                  </Label>
                  <Select
                    value={filters.emailVerified?.toString() || 'all'}
                    onValueChange={(value) => 
                      onFiltersChange({ 
                        emailVerified: value === 'all' ? 'all' : value === 'true' 
                      })
                    }
                  >
                    <SelectTrigger className="bg-slate-50 dark:bg-slate-700">
                      <SelectValue placeholder="Estado del correo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="true">Verificado</SelectItem>
                      <SelectItem value="false">No verificado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro por Fecha de Registro */}
                <div className="space-y-2">
                  <Label className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span>Fecha de Registro</span>
                  </Label>
                  <Select
                    value={filters.dateRange || 'none'}
                    onValueChange={handleDateRangeChange}
                  >
                    <SelectTrigger className="bg-slate-50 dark:bg-slate-700">
                      <SelectValue placeholder="Seleccionar período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Cualquier fecha</SelectItem>
                      <SelectItem value="week">Últimos 7 días</SelectItem>
                      <SelectItem value="month">Este mes</SelectItem>
                      <SelectItem value="custom">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro por Estado de Cuenta */}
                <div className="space-y-2">
                  <Label className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-slate-500" />
                    <span>Estado de Cuenta</span>
                  </Label>
                  <Select
                    value={filters.isActive?.toString() || 'all'}
                    onValueChange={(value) => 
                      onFiltersChange({ 
                        isActive: value === 'all' ? 'all' : value === 'true' 
                      })
                    }
                  >
                    <SelectTrigger className="bg-slate-50 dark:bg-slate-700">
                      <SelectValue placeholder="Estado de cuenta" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las cuentas</SelectItem>
                      <SelectItem value="true">Activas</SelectItem>
                      <SelectItem value="false">Deshabilitadas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Filtros de Fecha Personalizada */}
              {filters.dateRange === 'custom' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.3 }}
                  className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Fecha de inicio</Label>
                      <Input
                        type="date"
                        value={filters.customStartDate || ''}
                        onChange={(e) => onFiltersChange({ customStartDate: e.target.value })}
                        className="bg-slate-50 dark:bg-slate-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha de fin</Label>
                      <Input
                        type="date"
                        value={filters.customEndDate || ''}
                        onChange={(e) => onFiltersChange({ customEndDate: e.target.value })}
                        className="bg-slate-50 dark:bg-slate-700"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Resumen de Filtros Activos */}
              {activeFiltersCount > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Filtros activos ({activeFiltersCount})
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {filters.role && filters.role !== 'all' && (
                        <Badge variant="secondary" className="flex items-center space-x-1">
                          <span>
                            {filters.role === 'estudiante' ? 'Apoderados' : 
                             filters.role === 'funcionario' ? 'Funcionarios' : 
                             'Administradores'}
                          </span>
                          <X 
                            className="w-3 h-3 cursor-pointer" 
                            onClick={() => onFiltersChange({ role: 'all' })}
                          />
                        </Badge>
                      )}
                      
                      {filters.emailVerified !== undefined && filters.emailVerified !== 'all' && (
                        <Badge variant="secondary" className="flex items-center space-x-1">
                          <span>{filters.emailVerified ? 'Verificado' : 'No verificado'}</span>
                          <X 
                            className="w-3 h-3 cursor-pointer" 
                            onClick={() => onFiltersChange({ emailVerified: 'all' })}
                          />
                        </Badge>
                      )}
                      
                      {filters.dateRange && (
                        <Badge variant="secondary" className="flex items-center space-x-1">
                          <span>
                            {filters.dateRange === 'week' ? 'Últimos 7 días' :
                             filters.dateRange === 'month' ? 'Este mes' :
                             'Fecha personalizada'}
                          </span>
                          <X 
                            className="w-3 h-3 cursor-pointer" 
                            onClick={() => onFiltersChange({ 
                              dateRange: undefined,
                              customStartDate: undefined,
                              customEndDate: undefined
                            })}
                          />
                        </Badge>
                      )}
                      
                      {filters.isActive !== undefined && filters.isActive !== 'all' && (
                        <Badge variant="secondary" className="flex items-center space-x-1">
                          <span>{filters.isActive ? 'Activas' : 'Deshabilitadas'}</span>
                          <X 
                            className="w-3 h-3 cursor-pointer" 
                            onClick={() => onFiltersChange({ isActive: 'all' })}
                          />
                        </Badge>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}