"use client"
import { motion } from 'framer-motion'
import { BarChart3, RefreshCw, Calendar, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface ReportsHeaderProps {
  lastUpdated?: Date
  onRefresh: () => void
  isRefreshing: boolean
  dateRange: {
    start: string
    end: string
  }
}

export function ReportsHeader({ 
  lastUpdated, 
  onRefresh, 
  isRefreshing, 
  dateRange 
}: ReportsHeaderProps) {
  const formatDateRange = () => {
    const start = format(new Date(dateRange.start), 'dd/MM/yyyy')
    const end = format(new Date(dateRange.end), 'dd/MM/yyyy')
    return `${start} - ${end}`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-gradient-to-r from-blue-600 to-blue-700 border-0 text-white">
        <CardContent className="p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center space-x-4 mb-4 lg:mb-0">
              <div className="flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Centro de Reportes
                </h1>
                <p className="text-blue-100 text-lg">
                  Consultá métricas clave y generá reportes descargables para la gestión del casino escolar
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-2 text-blue-100">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Período: {formatDateRange()}
                </span>
              </div>

              {lastUpdated && (
                <div className="flex items-center space-x-2 text-blue-100">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">
                    Actualizado: {format(lastUpdated, 'dd/MM/yyyy HH:mm', { locale: es })}
                  </span>
                </div>
              )}

              <Button
                onClick={onRefresh}
                disabled={isRefreshing}
                variant="secondary"
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Actualizando...' : 'Actualizar'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
