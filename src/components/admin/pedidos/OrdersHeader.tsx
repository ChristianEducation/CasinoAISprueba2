"use client"
import { motion } from 'framer-motion'
import { Download, RefreshCw, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExportUtils } from '@/lib/exportUtils'
import { AdminOrderView, OrderMetrics } from '@/types/adminOrder'
import { AdminUser } from '@/types/user'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

interface OrderFilters {
  status?: string
  searchTerm?: string
  dateRange?: {
    from: Date
    to: Date
  }
}

interface OrdersHeaderProps {
  selectedWeek: string
  metrics: OrderMetrics | null
  orders: AdminOrderView[]
  filters: OrderFilters
  onRefresh: () => void
  isLoading: boolean
  adminUser: AdminUser
}
export function OrdersHeader({ 
  selectedWeek, 
  metrics, 
  orders, 
  filters, 
  onRefresh, 
  isLoading,
  adminUser 
}: OrdersHeaderProps) {
  const handleExport = async (format: 'excel' | 'pdf') => {
    if (!metrics) return
    
    // Convert filters to match expected format
    const exportFilters = {
      ...filters,
      dateRange: filters.dateRange ? {
        start: filters.dateRange.from.toISOString(),
        end: filters.dateRange.to.toISOString()
      } : undefined
    }
    
    // Use the order-specific export methods
    if (format === 'excel') {
      await ExportUtils.exportOrdersToExcel(orders, metrics, exportFilters, adminUser)
    } else {
      await ExportUtils.exportOrdersToPDF(orders, metrics, exportFilters, adminUser)
    }
  }

  const getWeekLabel = () => {
    if (!selectedWeek) return 'Todas las semanas'
    
    try {
      const startDate = parseISO(selectedWeek)
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 4) // Viernes
      
      return `Semana del ${format(startDate, 'd')} al ${format(endDate, 'd')} de ${format(endDate, 'MMMM', { locale: es })}`
    } catch {
      return 'Semana seleccionada'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Título y descripción */}
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Gestión de Pedidos
                </h1>
                {metrics && (
                  <Badge 
                    variant="secondary" 
                    className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                  >
                    {metrics.totalOrders} pedidos
                  </Badge>
                )}
              </div>
              
              <p className="text-slate-600 dark:text-slate-400 mb-2">
                Visualizá todos los pedidos confirmados para la semana actual
              </p>
              
              <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
                <Calendar className="w-4 h-4" />
                <span>{getWeekLabel()}</span>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isLoading}
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Actualizar</span>
              </Button>
              
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('excel')}
                  disabled={!metrics || orders.length === 0}
                  className="flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Excel</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('pdf')}
                  disabled={!metrics || orders.length === 0}
                  className="flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>PDF</span>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}