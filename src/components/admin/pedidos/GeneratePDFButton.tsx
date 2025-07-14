"use client"
import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Download, 
  FileText, 
  Printer, 
  Calendar, 
  ChefHat,
} from 'lucide-react'
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AdminOrderView, OrderMetrics } from '@/types/adminOrder'
import { KitchenPdfUtils } from '@/lib/kitchenPdfUtils'
import { ExportUtils } from '@/lib/exportUtils'
import { format, parseISO, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { useToast } from '@/hooks/use-toast'

interface GeneratePDFButtonProps {
  orders: AdminOrderView[]
  metrics: OrderMetrics | null
  weekStart: string
  adminUser: { firstName?: string; lastName?: string }
  filters: {
    status?: string
    userType?: string
    searchTerm?: string
  }
}

export function GeneratePDFButton({ 
  orders, 
  metrics, 
  weekStart, 
  adminUser, 
  filters 
}: GeneratePDFButtonProps) {
  const { toast } = useToast()
  const [isGenerating, setIsGenerating] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // Generar opciones de días de la semana
  const generateDayOptions = () => {
    if (!weekStart) return []
    
    const startDate = parseISO(weekStart)
    const days = []
    
    for (let i = 0; i < 5; i++) {
      const date = addDays(startDate, i)
      const dateStr = format(date, 'yyyy-MM-dd')
      const dayName = format(date, 'EEEE', { locale: es })
      const formattedDate = format(date, "d 'de' MMMM", { locale: es })
      
      // Calcular cuántos items hay para este día
      const dayOrders = orders.filter(order => order.status === 'paid')
      let itemsForDay = 0
      
      dayOrders.forEach(order => {
        order.itemsSummary.itemsDetail.forEach(detail => {
          if (detail.date === dateStr) {
            itemsForDay += (detail.almuerzo ? 1 : 0) + (detail.colacion ? 1 : 0)
          }
        })
      })
      
      days.push({
        value: dateStr,
        label: `${dayName} - ${formattedDate}`,
        dayName,
        itemsCount: itemsForDay
      })
    }
    
    return days
  }

  const dayOptions = generateDayOptions()

  const handleGenerateDailyPDF = async (targetDate: string) => {
    setIsGenerating(true)
    try {
      await KitchenPdfUtils.generateAndDownloadDailyPDF(orders, targetDate, adminUser)
      toast({
        title: "PDF generado",
        description: "La lista de preparación diaria ha sido generada exitosamente.",
      })
    } catch (error) {
      console.error('Error generating daily PDF:', error)
      toast({
        title: "Error",
        description: "No se pudo generar el PDF diario.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateWeeklyPDF = async () => {
    setIsGenerating(true)
    try {
      await KitchenPdfUtils.generateAndDownloadWeeklyPDF(orders, weekStart, adminUser)
      toast({
        title: "PDF semanal generado",
        description: "El resumen semanal de cocina ha sido generado exitosamente.",
      })
    } catch (error) {
      console.error('Error generating weekly PDF:', error)
      toast({
        title: "Error",
        description: "No se pudo generar el PDF semanal.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateOrdersPDF = async () => {
    if (!metrics) return
    
    setIsGenerating(true)
    try {
      const exportFilters = {
        ...filters,
        dateRange: weekStart ? {
          start: weekStart,
          end: format(addDays(parseISO(weekStart), 4), 'yyyy-MM-dd')
        } : undefined
      }
      
      await ExportUtils.exportOrdersToPDF(orders, metrics, exportFilters, adminUser)
      toast({
        title: "PDF de pedidos generado",
        description: "El reporte de pedidos ha sido generado exitosamente.",
      })
    } catch (error) {
      console.error('Error generating orders PDF:', error)
      toast({
        title: "Error",
        description: "No se pudo generar el PDF de pedidos.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateOrdersExcel = async () => {
    if (!metrics) return
    
    setIsGenerating(true)
    try {
      const exportFilters = {
        ...filters,
        dateRange: weekStart ? {
          start: weekStart,
          end: format(addDays(parseISO(weekStart), 4), 'yyyy-MM-dd')
        } : undefined
      }
      
      await ExportUtils.exportOrdersToExcel(orders, metrics, exportFilters, adminUser)
      toast({
        title: "Excel generado",
        description: "El reporte de pedidos en Excel ha sido generado exitosamente.",
      })
    } catch (error) {
      console.error('Error generating orders Excel:', error)
      toast({
        title: "Error",
        description: "No se pudo generar el archivo Excel.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const getWeekSummary = () => {
    if (!weekStart) return null
    return KitchenPdfUtils.generateWeeklySummary(orders, weekStart)
  }

  const weekSummary = getWeekSummary()

  return (
    <div className="flex items-center space-x-2">
      {/* Botón principal de exportación */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            disabled={isGenerating || orders.length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            {isGenerating ? 'Generando...' : 'Exportar'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>Reportes Administrativos</span>
          </DropdownMenuLabel>
          
          <DropdownMenuItem onClick={handleGenerateOrdersPDF}>
            <FileText className="w-4 h-4 mr-2" />
            PDF - Lista de Pedidos
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleGenerateOrdersExcel}>
            <Download className="w-4 h-4 mr-2" />
            Excel - Datos de Pedidos
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuLabel className="flex items-center space-x-2">
            <ChefHat className="w-4 h-4" />
            <span>Reportes para Cocina</span>
          </DropdownMenuLabel>
          
          <DropdownMenuItem onClick={handleGenerateWeeklyPDF}>
            <Calendar className="w-4 h-4 mr-2" />
            PDF - Resumen Semanal
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuLabel className="text-xs text-slate-500">
            Listas Diarias de Preparación
          </DropdownMenuLabel>
          
          {dayOptions.map((day) => (
            <DropdownMenuItem 
              key={day.value}
              onClick={() => handleGenerateDailyPDF(day.value)}
              disabled={day.itemsCount === 0}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-2">
                  <Printer className="w-4 h-4" />
                  <span className="text-sm">{day.dayName}</span>
                </div>
                <Badge 
                  variant={day.itemsCount > 0 ? "default" : "secondary"} 
                  className="text-xs"
                >
                  {day.itemsCount}
                </Badge>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Botón de vista previa */}
      {weekSummary && (
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <FileText className="w-4 h-4 mr-2" />
              Vista Previa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Vista Previa - Resumen Semanal</span>
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Resumen general */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Resumen de la Semana</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {weekSummary.weeklyTotals.totalOrders}
                      </div>
                      <div className="text-sm text-slate-600">Pedidos</div>
                    </div>
                    <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-emerald-600">
                        {weekSummary.weeklyTotals.totalItems}
                      </div>
                      <div className="text-sm text-slate-600">Items</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {weekSummary.weeklyTotals.totalAlmuerzos}
                      </div>
                      <div className="text-sm text-slate-600">Almuerzos</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {weekSummary.weeklyTotals.totalColaciones}
                      </div>
                      <div className="text-sm text-slate-600">Colaciones</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Resumen por día */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Desglose por Día</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {weekSummary.dailySummaries.map((daily, index) => (
                      <motion.div
                        key={daily.date}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="border border-slate-200 dark:border-slate-700 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-slate-900 dark:text-white">
                            {daily.dayName} - {format(parseISO(daily.date), "d 'de' MMMM", { locale: es })}
                          </h4>
                          <Badge variant="outline">
                            {daily.totals.totalItems} items
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h5 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                              🍽️ Almuerzos ({daily.totals.totalAlmuerzos})
                            </h5>
                            {daily.menuItems.almuerzos.length > 0 ? (
                              <ul className="text-sm space-y-1">
                                {daily.menuItems.almuerzos.map((item, idx) => (
                                  <li key={idx} className="flex justify-between">
                                    <span>{item.code} - {item.name}</span>
                                    <Badge variant="secondary" className="text-xs">
                                      {item.quantity}
                                    </Badge>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-slate-500 italic">Sin almuerzos</p>
                            )}
                          </div>
                          
                          <div>
                            <h5 className="text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-2">
                              ☕ Colaciones ({daily.totals.totalColaciones})
                            </h5>
                            {daily.menuItems.colaciones.length > 0 ? (
                              <ul className="text-sm space-y-1">
                                {daily.menuItems.colaciones.map((item, idx) => (
                                  <li key={idx} className="flex justify-between">
                                    <span>{item.code} - {item.name}</span>
                                    <Badge variant="secondary" className="text-xs">
                                      {item.quantity}
                                    </Badge>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-slate-500 italic">Sin colaciones</p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Items más populares */}
              {weekSummary.weeklyTotals.popularItems.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Items Más Populares</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {weekSummary.weeklyTotals.popularItems.slice(0, 5).map((item, index) => (
                        <div key={`${item.code}-${item.type}`} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded">
                          <div className="flex items-center space-x-3">
                            <Badge variant="outline" className="font-mono text-xs">
                              #{index + 1}
                            </Badge>
                            <div>
                              <span className="font-medium">{item.code}</span>
                              <span className="text-sm text-slate-600 dark:text-slate-400 ml-2">
                                {item.name}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={item.type === 'almuerzo' ? 'bg-blue-600' : 'bg-emerald-600'}>
                              {item.type === 'almuerzo' ? '🍽️' : '☕'} {item.totalQuantity}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
