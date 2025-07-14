"use client"
import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  ChefHat, 
  Calendar, 
  ShoppingBag, 
  Coffee, 
  Users, 
  TrendingUp,
  FileText,
  Printer
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AdminOrderView } from '@/types/adminOrder'
import { KitchenPdfUtils } from '@/lib/kitchenPdfUtils'
import { format, parseISO, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { useToast } from '@/hooks/use-toast'

interface DailyMenuSummaryProps {
  orders: AdminOrderView[]
  weekStart: string
  adminUser: { firstName?: string; lastName?: string }
}

export function DailyMenuSummary({ orders, weekStart, adminUser }: DailyMenuSummaryProps) {
  const { toast } = useToast()
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)

  // Generar opciones de días de la semana
  const generateDayOptions = () => {
    const startDate = parseISO(weekStart)
    const days = []
    
    for (let i = 0; i < 5; i++) {
      const date = addDays(startDate, i)
      const dateStr = format(date, 'yyyy-MM-dd')
      const dayName = format(date, 'EEEE', { locale: es })
      const formattedDate = format(date, "d 'de' MMMM", { locale: es })
      
      days.push({
        value: dateStr,
        label: `${dayName} - ${formattedDate}`,
        dayName
      })
    }
    
    return days
  }

  const dayOptions = generateDayOptions()

  // Generar resumen para el día seleccionado
  const generateDaySummary = (targetDate: string) => {
    if (!targetDate) return null
    return KitchenPdfUtils.generateDailySummary(orders, targetDate)
  }

  const selectedSummary = selectedDate ? generateDaySummary(selectedDate) : null

  const handleGenerateDailyPDF = async () => {
    if (!selectedDate) {
      toast({
        title: "Selecciona un día",
        description: "Debes seleccionar un día para generar el PDF.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    try {
      await KitchenPdfUtils.generateAndDownloadDailyPDF(orders, selectedDate, adminUser)
      toast({
        title: "PDF generado",
        description: "La lista de preparación ha sido generada exitosamente.",
      })
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast({
        title: "Error",
        description: "No se pudo generar el PDF. Inténtalo nuevamente.",
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
        description: "No se pudo generar el PDF semanal. Inténtalo nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Encabezado */}
      <Card className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-orange-700 dark:text-orange-300">
            <ChefHat className="w-6 h-6" />
            <span>Resúmenes para Cocina</span>
          </CardTitle>
          <p className="text-orange-600 dark:text-orange-400 text-sm">
            Genera listas de preparación y resúmenes operativos para el equipo de cocina
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex-1">
              <div className="flex items-center space-x-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                    Seleccionar día específico
                  </label>
                  <Select value={selectedDate} onValueChange={setSelectedDate}>
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Selecciona un día..." />
                    </SelectTrigger>
                    <SelectContent>
                      {dayOptions.map((day) => (
                        <SelectItem key={day.value} value={day.value}>
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4" />
                            <span>{day.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <Button
                onClick={handleGenerateDailyPDF}
                disabled={!selectedDate || isGenerating}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Printer className="w-4 h-4 mr-2" />
                {isGenerating ? 'Generando...' : 'PDF del Día'}
              </Button>
              
              <Button
                onClick={handleGenerateWeeklyPDF}
                disabled={isGenerating}
                variant="outline"
                className="border-orange-300 text-orange-700 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-900/20"
              >
                <FileText className="w-4 h-4 mr-2" />
                {isGenerating ? 'Generando...' : 'PDF Semanal'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vista previa del resumen del día seleccionado */}
      {selectedSummary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span>Vista Previa - {selectedSummary.dayName}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {format(parseISO(selectedSummary.date), "d 'de' MMMM, yyyy", { locale: es })}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Resumen rápido */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <ShoppingBag className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {selectedSummary.totals.totalAlmuerzos}
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    Almuerzos
                  </div>
                </div>
                
                <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <Coffee className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {selectedSummary.totals.totalColaciones}
                  </div>
                  <div className="text-sm text-emerald-700 dark:text-emerald-300">
                    Colaciones
                  </div>
                </div>
                
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <TrendingUp className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {selectedSummary.totals.totalItems}
                  </div>
                  <div className="text-sm text-purple-700 dark:text-purple-300">
                    Total Items
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Detalles por tipo */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Almuerzos */}
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
                    <ShoppingBag className="w-4 h-4 mr-2 text-blue-600" />
                    Almuerzos ({selectedSummary.totals.totalAlmuerzos})
                  </h4>
                  {selectedSummary.menuItems.almuerzos.length > 0 ? (
                    <div className="space-y-3">
                      {selectedSummary.menuItems.almuerzos.map((item, index) => (
                        <div key={index} className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="font-mono text-xs">
                                {item.code}
                              </Badge>
                              <span className="font-medium text-slate-900 dark:text-white">
                                {item.name}
                              </span>
                            </div>
                            <Badge className="bg-blue-600 text-white">
                              {item.quantity}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                            <span>Est: {item.userTypes.estudiante} | Func: {item.userTypes.funcionario}</span>
                            <span>{Object.keys(item.courses).length} curso(s)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                      <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No hay almuerzos para este día</p>
                    </div>
                  )}
                </div>

                {/* Colaciones */}
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
                    <Coffee className="w-4 h-4 mr-2 text-emerald-600" />
                    Colaciones ({selectedSummary.totals.totalColaciones})
                  </h4>
                  {selectedSummary.menuItems.colaciones.length > 0 ? (
                    <div className="space-y-3">
                      {selectedSummary.menuItems.colaciones.map((item, index) => (
                        <div key={index} className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="font-mono text-xs">
                                {item.code}
                              </Badge>
                              <span className="font-medium text-slate-900 dark:text-white">
                                {item.name}
                              </span>
                            </div>
                            <Badge className="bg-emerald-600 text-white">
                              {item.quantity}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                            <span>Est: {item.userTypes.estudiante} | Func: {item.userTypes.funcionario}</span>
                            <span>{Object.keys(item.courses).length} curso(s)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                      <Coffee className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No hay colaciones para este día</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Resumen por tipo de usuario */}
              <Separator className="my-6" />
              
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  Distribución por Tipo de Usuario
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {selectedSummary.totals.byUserType.estudiante}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Estudiantes
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                      {selectedSummary.totals.byUserType.funcionario}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Funcionarios
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  )
}
