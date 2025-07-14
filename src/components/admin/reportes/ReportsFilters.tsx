"use client"
import { motion } from 'framer-motion'
import { Filter, RotateCcw, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ReportsFilters } from '@/types/reports'

interface ReportsFiltersProps {
  filters: ReportsFilters
  onFiltersChange: (filters: Partial<ReportsFilters>) => void
  onReset: () => void
  onExportPDF: () => void
  onExportExcel: () => void
  isLoading: boolean
}

export function ReportsFiltersComponent({ 
  filters, 
  onFiltersChange, 
  onReset, 
  onExportPDF, 
  onExportExcel,
  isLoading 
}: ReportsFiltersProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-blue-600" />
            <span>Filtros de Consulta</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {/* Fecha inicio */}
            <div className="space-y-2">
              <Label htmlFor="startDate">Fecha Inicio</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.dateRange.start}
                onChange={(e) => onFiltersChange({
                  dateRange: { ...filters.dateRange, start: e.target.value }
                })}
                className="w-full"
              />
            </div>

            {/* Fecha fin */}
            <div className="space-y-2">
              <Label htmlFor="endDate">Fecha Fin</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.dateRange.end}
                onChange={(e) => onFiltersChange({
                  dateRange: { ...filters.dateRange, end: e.target.value }
                })}
                className="w-full"
              />
            </div>

            {/* Tipo de usuario */}
            <div className="space-y-2">
              <Label>Tipo de Usuario</Label>
              <Select
                value={filters.userType}
                onValueChange={(value) => onFiltersChange({ userType: value as ReportsFilters['userType'] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="estudiante">Estudiantes</SelectItem>
                  <SelectItem value="funcionario">Funcionarios</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Estado del pedido */}
            <div className="space-y-2">
              <Label>Estado del Pedido</Label>
              <Select
                value={filters.orderStatus}
                onValueChange={(value) => onFiltersChange({ orderStatus: value as ReportsFilters['orderStatus'] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="paid">Pagados</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tipo de menú */}
            <div className="space-y-2">
              <Label>Tipo de Menú</Label>
              <Select
                value={filters.menuType}
                onValueChange={(value) => onFiltersChange({ menuType: value as ReportsFilters['menuType'] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar menú" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="almuerzo">Almuerzo</SelectItem>
                  <SelectItem value="colacion">Colación</SelectItem>
                  <SelectItem value="both">Ambos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Button
              onClick={onReset}
              variant="outline"
              className="flex items-center space-x-2"
              disabled={isLoading}
            >
              <RotateCcw className="w-4 h-4" />
              <span>Restablecer Filtros</span>
            </Button>

            <div className="flex items-center space-x-3">
              <Button
                onClick={onExportPDF}
                variant="outline"
                className="flex items-center space-x-2 text-red-600 border-red-200 hover:bg-red-50"
                disabled={isLoading}
              >
                <Download className="w-4 h-4" />
                <span>Descargar PDF</span>
              </Button>

              <Button
                onClick={onExportExcel}
                variant="outline"
                className="flex items-center space-x-2 text-green-600 border-green-200 hover:bg-green-50"
                disabled={isLoading}
              >
                <Download className="w-4 h-4" />
                <span>Descargar Excel</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
