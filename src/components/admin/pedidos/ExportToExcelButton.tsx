"use client"
import { useState } from 'react'
import { Download, FileSpreadsheet, Settings, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { AdminOrderView } from '@/types/adminOrder'
import { ExcelExportUtils, ExcelExportOptions } from '@/lib/excelExportUtils'
import { useToast } from '@/hooks/use-toast'

interface ExportToExcelButtonProps {
  orders: AdminOrderView[]
  isLoading?: boolean
  filters?: {
    weekStart?: string
    status?: string
    userType?: string
    searchTerm?: string
  }
}

export function ExportToExcelButton({ orders, isLoading = false, filters }: ExportToExcelButtonProps) {
  const { toast } = useToast()
  const [isExporting, setIsExporting] = useState(false)
  const [exportOptions, setExportOptions] = useState<ExcelExportOptions>({
    includeDetails: true,
    groupByDay: false
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleQuickExport = async () => {
    if (orders.length === 0) {
      toast({
        title: "Sin datos",
        description: "No hay pedidos para exportar.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsExporting(true)
      
      ExcelExportUtils.exportOrdersToExcel(orders, {
        includeDetails: true,
        groupByDay: false
      })
      
      toast({
        title: "Exportación exitosa",
        description: `Se exportaron ${orders.length} pedidos a Excel.`,
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: "Error al exportar",
        description: "No se pudo exportar el archivo Excel.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleCustomExport = async () => {
    if (orders.length === 0) {
      toast({
        title: "Sin datos",
        description: "No hay pedidos para exportar.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsExporting(true)
      
      ExcelExportUtils.exportOrdersToExcel(orders, exportOptions)
      
      toast({
        title: "Exportación exitosa",
        description: `Se exportaron ${orders.length} pedidos a Excel con opciones personalizadas.`,
      })
      
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: "Error al exportar",
        description: "No se pudo exportar el archivo Excel.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleStatsExport = async () => {
    if (orders.length === 0) {
      toast({
        title: "Sin datos",
        description: "No hay pedidos para exportar estadísticas.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsExporting(true)
      
      ExcelExportUtils.exportQuickStats(orders)
      
      toast({
        title: "Estadísticas exportadas",
        description: "Se exportaron las estadísticas a Excel.",
      })
    } catch (error) {
      console.error('Stats export error:', error)
      toast({
        title: "Error al exportar",
        description: "No se pudieron exportar las estadísticas.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const getFilterSummary = () => {
    const activeFilters = []
    if (filters?.weekStart) activeFilters.push(`Semana: ${filters.weekStart}`)
    if (filters?.status && filters.status !== 'all') activeFilters.push(`Estado: ${filters.status}`)
    if (filters?.userType && filters.userType !== 'all') activeFilters.push(`Tipo: ${filters.userType}`)
    if (filters?.searchTerm) activeFilters.push(`Búsqueda: ${filters.searchTerm}`)
    
    return activeFilters.length > 0 ? activeFilters.join(', ') : 'Sin filtros aplicados'
  }

  return (
    <div className="flex items-center space-x-2">
      {/* Botón de exportación rápida */}
      <Button
        onClick={handleQuickExport}
        disabled={isLoading || isExporting || orders.length === 0}
        className="flex items-center space-x-2"
        variant="outline"
      >
        {isExporting ? (
          <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        <span>Exportar Excel</span>
        {orders.length > 0 && (
          <Badge variant="secondary" className="ml-1">
            {orders.length}
          </Badge>
        )}
      </Button>

      {/* Menú de opciones avanzadas */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading || isExporting || orders.length === 0}
            className="px-2"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Opciones de Exportación</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleQuickExport}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Exportación Completa
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleStatsExport}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Solo Estadísticas
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Settings className="w-4 h-4 mr-2" />
                Opciones Personalizadas
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Opciones de Exportación</DialogTitle>
                <DialogDescription>
                  Personaliza qué información incluir en el archivo Excel.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* Información de filtros */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Datos a exportar:
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {orders.length} pedidos
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {getFilterSummary()}
                  </p>
                </div>

                {/* Opciones de exportación */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="includeDetails"
                      checked={exportOptions.includeDetails}
                      onChange={(e) => setExportOptions(prev => ({
                        ...prev,
                        includeDetails: e.target.checked
                      }))}
                      className="rounded border-slate-300"
                    />
                    <label htmlFor="includeDetails" className="text-sm font-medium">
                      Incluir detalle de productos
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="groupByDay"
                      checked={exportOptions.groupByDay}
                      onChange={(e) => setExportOptions(prev => ({
                        ...prev,
                        groupByDay: e.target.checked
                      }))}
                      className="rounded border-slate-300"
                    />
                    <label htmlFor="groupByDay" className="text-sm font-medium">
                      Incluir resumen diario
                    </label>
                  </div>
                </div>

                {/* Vista previa de hojas */}
                <div className="p-3 border rounded-lg">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Hojas que se incluirán:
                  </p>
                  <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                    <li className="flex items-center space-x-1">
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Pedidos (información principal)</span>
                    </li>
                    {exportOptions.includeDetails && (
                      <li className="flex items-center space-x-1">
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Detalle de Productos</span>
                      </li>
                    )}
                    {exportOptions.groupByDay && (
                      <li className="flex items-center space-x-1">
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Resumen Diario</span>
                      </li>
                    )}
                    <li className="flex items-center space-x-1">
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Estadísticas</span>
                    </li>
                  </ul>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isExporting}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCustomExport}
                  disabled={isExporting}
                  className="flex items-center space-x-2"
                >
                  {isExporting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>Exportar</span>
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
