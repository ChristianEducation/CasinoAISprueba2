"use client"
import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Coffee, 
  Calendar, 
  CalendarDays, 
  AlertCircle, 
  CheckCircle2,
  Loader2,
  Clock,
  DollarSign
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { AdminMenuService } from '@/services/adminMenuService'
import { DefaultColacionesService } from '@/services/defaultColacionesService'
import { DefaultColacionesManager } from './DefaultColacionesManager'
import { ColacionesDiagnostic } from './ColacionesDiagnostic'
import { BulkColacionesDelete } from './BulkColacionesDelete'
import { useToast } from '@/hooks/use-toast'

interface DefaultColacion {
  code: string
  description: string
  price: number
  active: boolean
}

interface DefaultColacionesActionsProps {
  weekStart: string
  onMenuUpdated: () => void
}

export function DefaultColacionesActions({ 
  weekStart, 
  onMenuUpdated 
}: DefaultColacionesActionsProps) {
  const [isCreatingWeek, setIsCreatingWeek] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [defaultColaciones, setDefaultColaciones] = useState<DefaultColacion[]>([])
  const [isLoadingColaciones, setIsLoadingColaciones] = useState(false)
  const { toast } = useToast()

  // Cargar colaciones predeterminadas
  const loadDefaultColaciones = async () => {
    setIsLoadingColaciones(true)
    try {
      const colaciones = await DefaultColacionesService.getDefaultColaciones()
      setDefaultColaciones(colaciones.filter(c => c.active && c.description).map(c => ({
        ...c,
        description: c.description!
      })))
    } catch (error) {
      console.error('Error loading default colaciones:', error)
    } finally {
      setIsLoadingColaciones(false)
    }
  }

  const handleCreateWeekColaciones = async () => {
    setIsCreatingWeek(true)
    try {
      console.log('🔄 Creating default colaciones for week:', weekStart)
      
      const result = await AdminMenuService.createDefaultColacionesWeek(weekStart)
      
      if (result.success) {
        toast({
          title: "¡Colaciones creadas!",
          description: result.message,
        })
        onMenuUpdated()
        setIsDialogOpen(false)
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error creating default colaciones:', error)
      toast({
        title: "Error",
        description: "Error al crear las colaciones predeterminadas",
        variant: "destructive",
      })
    } finally {
      setIsCreatingWeek(false)
    }
  }

  // Cargar colaciones al abrir el diálogo
  const handleDialogOpen = (open: boolean) => {
    setIsDialogOpen(open)
    if (open) {
      loadDefaultColaciones()
    }
  }

  return (
    <div className="space-y-4">
      {/* Botones de acción */}
      <div className="flex flex-wrap gap-3">
        {/* Gestor de colaciones predeterminadas */}
        <DefaultColacionesManager 
          onConfigUpdated={() => {
            // Recargar colaciones cuando se actualice la configuración
            loadDefaultColaciones()
          }}
        />

        {/* Componente de diagnóstico */}
        <ColacionesDiagnostic 
          weekStart={weekStart}
          onDiagnosticComplete={onMenuUpdated}
        />

        {/* Componente de eliminación masiva */}
        <BulkColacionesDelete 
          weekStart={weekStart}
          onMenuUpdated={onMenuUpdated}
        />

        <Dialog open={isDialogOpen} onOpenChange={handleDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              className="flex items-center space-x-2 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border-emerald-200 text-emerald-700"
            >
              <CalendarDays className="w-4 h-4" />
              <span>Aplicar Colaciones Predeterminadas</span>
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0 pb-4">
              <DialogTitle className="flex items-center space-x-2 text-lg">
                <Coffee className="w-5 h-5 text-emerald-600" />
                <span>Menú de Colaciones Predeterminado</span>
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto space-y-4">
              {/* Información compacta */}
              <Alert className="border-emerald-200 bg-emerald-50">
                <AlertCircle className="h-4 w-4 text-emerald-600" />
                <AlertDescription className="text-sm text-emerald-700">
                  <strong>Se aplicará automáticamente de lunes a viernes</strong> para la semana seleccionada. 
                  Las colaciones se publican automáticamente y aparecen inmediatamente en los pedidos.
                </AlertDescription>
              </Alert>

              {/* Vista previa compacta de las colaciones */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                    Colaciones que se crearán ({defaultColaciones.length} opciones):
                  </h4>
                  {isLoadingColaciones && (
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                  )}
                </div>
                
                {defaultColaciones.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                    {defaultColaciones.map((colacion, index) => (
                      <motion.div
                        key={colacion.code}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm"
                      >
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          <Badge variant="secondary" className="font-mono text-xs flex-shrink-0">
                            {colacion.code}
                          </Badge>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm text-slate-900 dark:text-white truncate">
                              {colacion.description}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <div className="flex items-center space-x-1">
                                <DollarSign className="w-3 h-3 text-green-600" />
                                <span className="text-xs font-bold text-green-600">
                                  ${colacion.price.toLocaleString('es-CL')}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="w-3 h-3 text-blue-600" />
                                <span className="text-xs text-blue-600">5 días</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <Coffee className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-slate-600 dark:text-slate-400 mb-2 font-medium">
                      No hay colaciones predeterminadas activas
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-500">
                      Configura las colaciones predeterminadas primero
                    </p>
                  </div>
                )}
              </div>

              {/* Resumen de la operación */}
              {defaultColaciones.length > 0 && (
                <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-blue-800 dark:text-blue-200 text-sm mb-2">
                          Resumen de la operación:
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                          <div className="text-center">
                            <div className="font-bold text-blue-700 dark:text-blue-300 text-lg">
                              {defaultColaciones.length}
                            </div>
                            <div className="text-blue-600 dark:text-blue-400">Opciones</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-blue-700 dark:text-blue-300 text-lg">5</div>
                            <div className="text-blue-600 dark:text-blue-400">Días</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-blue-700 dark:text-blue-300 text-lg">
                              {defaultColaciones.length * 5}
                            </div>
                            <div className="text-blue-600 dark:text-blue-400">Items totales</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-blue-700 dark:text-blue-300 text-lg">
                              ${Math.min(...defaultColaciones.map(c => c.price)).toLocaleString('es-CL')} - ${Math.max(...defaultColaciones.map(c => c.price)).toLocaleString('es-CL')}
                            </div>
                            <div className="text-blue-600 dark:text-blue-400">Rango precios</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Botones de acción fijos */}
            <div className="flex-shrink-0 flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isCreatingWeek}
                className="px-6"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateWeekColaciones}
                disabled={isCreatingWeek || defaultColaciones.length === 0}
                className="flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 px-6"
              >
                {isCreatingWeek ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creando...</span>
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4" />
                    <span>Crear y Publicar Menú</span>
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Información sobre las colaciones predeterminadas */}
      <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200 dark:border-emerald-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center space-x-2 text-emerald-800 dark:text-emerald-200">
            <Coffee className="w-4 h-4" />
            <span>Menú de Colaciones Predeterminado</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-3">
            Aplica automáticamente un menú completo de colaciones con precios personalizados para toda la semana (lunes a viernes).
            Las colaciones se publican automáticamente y aparecen inmediatamente en los pedidos.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs bg-white/50">
              {defaultColaciones.length} colaciones activas
            </Badge>
            {defaultColaciones.length > 0 && (
              <>
                <Badge variant="outline" className="text-xs bg-white/50">
                  Precios desde ${Math.min(...defaultColaciones.map(c => c.price)).toLocaleString('es-CL')}
                </Badge>
                <Badge variant="outline" className="text-xs bg-white/50">
                  Lunes a Viernes
                </Badge>
                <Badge variant="outline" className="text-xs bg-white/50">
                  Publicación automática
                </Badge>
                <Badge variant="outline" className="text-xs bg-white/50">
                  Totalmente editable
                </Badge>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
