"use client"
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Trash2, 
  AlertTriangle, 
  Loader2,
  Coffee,
  Calendar,
  CalendarDays,
  Target,
  Layers
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'

interface BulkColacionesDeleteProps {
  weekStart: string
  onMenuUpdated: () => void
}

interface DeletionStats {
  totalColaciones: number
  defaultColaciones: number
  customColaciones: number
  colacionesByDay: Record<string, number>
  dayNames: Record<string, string>
}

type DeletionMode = 'all' | 'default' | 'custom' | 'byDay'

export function BulkColacionesDelete({ weekStart, onMenuUpdated }: BulkColacionesDeleteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [deletionStats, setDeletionStats] = useState<DeletionStats | null>(null)
  const [selectedMode, setSelectedMode] = useState<DeletionMode>('all')
  const [selectedDays, setSelectedDays] = useState<string[]>([])
  const { toast } = useToast()

  // Cargar estadísticas de eliminación
  const loadDeletionStats = async () => {
    setIsLoading(true)
    try {
      // TODO: Implement getColacionesDeletionStats method in AdminMenuService
      // For now, using mock data structure with weekStart parameter
      console.log('Loading deletion stats for week:', weekStart)
      const stats: DeletionStats = {
        totalColaciones: 0,
        defaultColaciones: 0,
        customColaciones: 0,
        colacionesByDay: {},
        dayNames: {}
      }
      setDeletionStats(stats)
      
      // Inicializar días seleccionados con todos los días que tienen colaciones
      setSelectedDays(Object.keys(stats.colacionesByDay))
    } catch (error) {
      console.error('Error loading deletion stats:', error)
      toast({
        title: "Error",
        description: "Error al cargar las estadísticas de colaciones",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Ejecutar eliminación según el modo seleccionado
  const executeDeletion = async () => {
    if (!deletionStats) return

    setIsDeleting(true)
    try {
      let result

      switch (selectedMode) {
        case 'all':
          // TODO: Implement deleteAllColacionesFromWeek method in AdminMenuService
          result = { success: false, message: 'Method not implemented yet' }
          break
        case 'default':
          // TODO: Implement deleteDefaultColacionesFromWeek method in AdminMenuService
          result = { success: false, message: 'Method not implemented yet' }
          break
        case 'byDay':
          // Eliminar colaciones de días seleccionados
          const deletePromises = selectedDays.map(() => 
            // TODO: Replace with actual AdminMenuService method when implemented
            Promise.resolve({ success: false, message: 'Method not implemented yet' })
          )
          const results = await Promise.all(deletePromises)
          
          const successCount = results.filter(r => r.success).length
          const totalDeleted = results.reduce((sum, r) => {
            const match = r.message.match(/(\d+) colación/)
            return sum + (match ? parseInt(match[1]) : 0)
          }, 0)

          result = {
            success: successCount > 0,
            message: successCount === selectedDays.length 
              ? `${totalDeleted} colación(es) eliminada(s) exitosamente de ${successCount} día(s)`
              : `${totalDeleted} colación(es) eliminada(s) de ${successCount}/${selectedDays.length} día(s)`
          }
          break
        default:
          result = { success: false, message: 'Modo de eliminación no válido' }
      }

      if (result.success) {
        toast({
          title: "Colaciones eliminadas",
          description: result.message,
        })
        onMenuUpdated()
        setIsOpen(false)
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error deleting colaciones:', error)
      toast({
        title: "Error",
        description: "Error al eliminar las colaciones",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setShowConfirmDialog(false)
    }
  }

  // Manejar apertura del diálogo
  const handleDialogOpen = (open: boolean) => {
    setIsOpen(open)
    if (open) {
      loadDeletionStats()
    } else {
      setDeletionStats(null)
      setSelectedMode('all')
      setSelectedDays([])
    }
  }

  // Manejar selección de días
  const handleDayToggle = (date: string, checked: boolean) => {
    if (checked) {
      setSelectedDays([...selectedDays, date])
    } else {
      setSelectedDays(selectedDays.filter(d => d !== date))
    }
  }

  // Obtener información del modo de eliminación
  const getDeletionModeInfo = () => {
    if (!deletionStats) return { count: 0, description: '' }

    switch (selectedMode) {
      case 'all':
        return {
          count: deletionStats.totalColaciones,
          description: 'Todas las colaciones de la semana'
        }
      case 'default':
        return {
          count: deletionStats.defaultColaciones,
          description: 'Solo colaciones predeterminadas'
        }
      case 'custom':
        return {
          count: deletionStats.customColaciones,
          description: 'Solo colaciones personalizadas'
        }
      case 'byDay':
        const dayCount = selectedDays.reduce((sum, date) => 
          sum + (deletionStats.colacionesByDay[date] || 0), 0
        )
        return {
          count: dayCount,
          description: `Colaciones de ${selectedDays.length} día(s) seleccionado(s)`
        }
      default:
        return { count: 0, description: '' }
    }
  }

  const modeInfo = getDeletionModeInfo()
  const canDelete = modeInfo.count > 0 && (selectedMode !== 'byDay' || selectedDays.length > 0)

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className="flex items-center space-x-2 bg-gradient-to-r from-red-50 to-pink-50 hover:from-red-100 hover:to-pink-100 border-red-200 text-red-700"
          >
            <Trash2 className="w-4 h-4" />
            <span>Eliminar Colaciones</span>
          </Button>
        </DialogTrigger>
        
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Trash2 className="w-5 h-5" />
              <span>Eliminación Masiva de Colaciones</span>
            </DialogTitle>
            <DialogDescription>
              Selecciona las colaciones que deseas eliminar de la semana. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Advertencia */}
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>¡Atención!</strong> Esta acción eliminará permanentemente las colaciones seleccionadas. 
                Esta operación no se puede deshacer.
              </AlertDescription>
            </Alert>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span>Cargando estadísticas...</span>
              </div>
            ) : deletionStats ? (
              <>
                {/* Estadísticas generales */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center space-x-2">
                      <Coffee className="w-4 h-4" />
                      <span>Resumen de Colaciones</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                          {deletionStats.totalColaciones}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400">
                          Total
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {deletionStats.defaultColaciones}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400">
                          Predeterminadas
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {deletionStats.customColaciones}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400">
                          Personalizadas
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {deletionStats.totalColaciones > 0 ? (
                  <>
                    {/* Modos de eliminación */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-slate-900 dark:text-white">
                        Selecciona qué eliminar:
                      </h4>
                      
                      <div className="space-y-3">
                        {/* Eliminar todas */}
                        <Card 
                          className={`cursor-pointer transition-all ${
                            selectedMode === 'all' 
                              ? 'ring-2 ring-red-500 bg-red-50 dark:bg-red-900/20' 
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                          onClick={() => setSelectedMode('all')}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-3">
                              <Checkbox 
                                checked={selectedMode === 'all'}
                                onChange={() => setSelectedMode('all')}
                              />
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <Layers className="w-4 h-4" />
                                  <span className="font-medium">Eliminar todas las colaciones</span>
                                  <Badge variant="destructive">
                                    {deletionStats.totalColaciones} items
                                  </Badge>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                  Elimina todas las colaciones de la semana (predeterminadas y personalizadas)
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Eliminar solo predeterminadas */}
                        {deletionStats.defaultColaciones > 0 && (
                          <Card 
                            className={`cursor-pointer transition-all ${
                              selectedMode === 'default' 
                                ? 'ring-2 ring-red-500 bg-red-50 dark:bg-red-900/20' 
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                            onClick={() => setSelectedMode('default')}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center space-x-3">
                                <Checkbox 
                                  checked={selectedMode === 'default'}
                                  onChange={() => setSelectedMode('default')}
                                />
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <Coffee className="w-4 h-4" />
                                    <span className="font-medium">Solo colaciones predeterminadas</span>
                                    <Badge variant="secondary">
                                      {deletionStats.defaultColaciones} items
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                    Elimina solo las colaciones creadas con el menú predeterminado
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Eliminar por días */}
                        <Card 
                          className={`cursor-pointer transition-all ${
                            selectedMode === 'byDay' 
                              ? 'ring-2 ring-red-500 bg-red-50 dark:bg-red-900/20' 
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                          onClick={() => setSelectedMode('byDay')}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-3">
                              <Checkbox 
                                checked={selectedMode === 'byDay'}
                                onChange={() => setSelectedMode('byDay')}
                              />
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <CalendarDays className="w-4 h-4" />
                                  <span className="font-medium">Eliminar por días específicos</span>
                                  <Badge variant="outline">
                                    Personalizable
                                  </Badge>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                  Selecciona días específicos para eliminar sus colaciones
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>

                    {/* Selección de días */}
                    <AnimatePresence>
                      {selectedMode === 'byDay' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm text-blue-800 dark:text-blue-200">
                                Seleccionar días
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              {Object.entries(deletionStats.colacionesByDay).map(([date, count]) => (
                                <div key={date} className="flex items-center space-x-3">
                                  <Checkbox
                                    checked={selectedDays.includes(date)}
                                    onCheckedChange={(checked: boolean) => handleDayToggle(date, checked)}
                                  />
                                  <div className="flex-1 flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      <Calendar className="w-4 h-4" />
                                      <span className="font-medium capitalize">
                                        {deletionStats.dayNames[date]}
                                      </span>
                                      <span className="text-sm text-slate-600 dark:text-slate-400">
                                        ({date})
                                      </span>
                                    </div>
                                    <Badge variant="outline">
                                      {count} colación{count !== 1 ? 'es' : ''}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                              
                              <Separator />
                              
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-600 dark:text-slate-400">
                                  {selectedDays.length} día(s) seleccionado(s)
                                </span>
                                <div className="space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedDays(Object.keys(deletionStats.colacionesByDay))}
                                  >
                                    Seleccionar todos
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedDays([])}
                                  >
                                    Deseleccionar todos
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Resumen de eliminación */}
                    {canDelete && (
                      <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3">
                            <Target className="w-5 h-5 text-red-600 dark:text-red-400" />
                            <div>
                              <h4 className="font-medium text-red-800 dark:text-red-200">
                                Se eliminarán {modeInfo.count} colación{modeInfo.count !== 1 ? 'es' : ''}
                              </h4>
                              <p className="text-sm text-red-700 dark:text-red-300">
                                {modeInfo.description}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                ) : (
                  <Card className="bg-slate-50 dark:bg-slate-800">
                    <CardContent className="p-8 text-center">
                      <Coffee className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                      <h3 className="font-medium text-slate-900 dark:text-white mb-2">
                        No hay colaciones para eliminar
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Esta semana no tiene colaciones configuradas
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : null}

            {/* Botones de acción */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              {deletionStats && deletionStats.totalColaciones > 0 && (
                <Button
                  variant="destructive"
                  onClick={() => setShowConfirmDialog(true)}
                  disabled={!canDelete || isDeleting}
                  className="flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Eliminar {modeInfo.count} Colación{modeInfo.count !== 1 ? 'es' : ''}</span>
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span>¿Confirmar eliminación?</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de eliminar <strong>{modeInfo.count} colación{modeInfo.count !== 1 ? 'es' : ''}</strong> ({modeInfo.description}).
              <br /><br />
              <strong>Esta acción no se puede deshacer.</strong> ¿Estás seguro de que quieres continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={executeDeletion}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Sí, eliminar
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}