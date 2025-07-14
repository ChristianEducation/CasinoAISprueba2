"use client"
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Settings, 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  X, 
  RotateCcw,
  Coffee,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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
import { DefaultColacionConfig } from '@/types/adminMenu'
import { DefaultColacionesService } from '@/services/defaultColacionesService'
import { useToast } from '@/hooks/use-toast'

interface DefaultColacionesManagerProps {
  onConfigUpdated?: () => void
}

export function DefaultColacionesManager({ onConfigUpdated }: DefaultColacionesManagerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [colaciones, setColaciones] = useState<DefaultColacionConfig[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [newColacion, setNewColacion] = useState<DefaultColacionConfig>({
    code: '',
    title: '',
    description: '',
    price: 0,
    active: true
  })

  const { toast } = useToast()

  // Cargar colaciones predeterminadas
  const loadColaciones = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await DefaultColacionesService.getDefaultColaciones()
      setColaciones(data)
    } catch (error) {
      console.error('Error loading default colaciones:', error)
      toast({
        title: "Error",
        description: "Error al cargar las colaciones predeterminadas",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  // Guardar configuración
  const handleSave = async () => {
    setIsLoading(true)
    try {
      const result = await DefaultColacionesService.saveDefaultColaciones(colaciones)
      
      if (result.success) {
        toast({
          title: "Configuración guardada",
          description: result.message,
        })
        onConfigUpdated?.()
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error saving configuration:', error)
      toast({
        title: "Error",
        description: "Error al guardar la configuración",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Agregar nueva colación
  const handleAddColacion = () => {
    if (!newColacion.code || !newColacion.description || newColacion.price <= 0) {
      toast({
        title: "Error",
        description: "Todos los campos son requeridos y el precio debe ser mayor a 0",
        variant: "destructive",
      })
      return
    }

    if (colaciones.some(c => c.code === newColacion.code)) {
      toast({
        title: "Error",
        description: "Ya existe una colación con ese código",
        variant: "destructive",
      })
      return
    }

    setNewColacion({ code: '', title: '', description: '', price: 0, active: true })
    setShowAddForm(false)
    
    toast({
      title: "Colación agregada",
      description: "La colación se agregó a la lista. Recuerda guardar los cambios.",
    })
  }

  // Actualizar colación
  const handleUpdateColacion = (index: number, updates: Partial<DefaultColacionConfig>) => {
    const updated = [...colaciones]
    updated[index] = { ...updated[index], ...updates }
    setColaciones(updated)
  }

  // Eliminar colación
  const handleDeleteColacion = (index: number) => {
    const updated = colaciones.filter((_, i) => i !== index)
    setColaciones(updated)
    setEditingIndex(null)
    
    toast({
      title: "Colación eliminada",
      description: "La colación se eliminó de la lista. Recuerda guardar los cambios.",
    })
  }

  // Restablecer a valores predeterminados
  const handleReset = async () => {
    setIsLoading(true)
    try {
      const result = await DefaultColacionesService.resetToDefaults()
      
      if (result.success) {
        await loadColaciones()
        toast({
          title: "Configuración restablecida",
          description: result.message,
        })
        onConfigUpdated?.()
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error resetting configuration:', error)
      toast({
        title: "Error",
        description: "Error al restablecer la configuración",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setShowResetDialog(false)
    }
  }

  // Cargar datos al abrir el modal
  useEffect(() => {
    if (isOpen) {
      loadColaciones()
    }
  }, [isOpen, loadColaciones])

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            className="flex items-center space-x-2 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border-purple-200 text-purple-700"
          >
            <Settings className="w-4 h-4" />
            <span>Gestionar Colaciones Predeterminadas</span>
          </Button>
        </DialogTrigger>
        
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Coffee className="w-5 h-5" />
              <span>Gestión de Colaciones Predeterminadas</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Información */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Estas colaciones se utilizarán como plantilla al crear menús predeterminados. 
                Los cambios aquí afectarán solo a los nuevos menús que se creen.
              </AlertDescription>
            </Alert>

            {/* Controles superiores */}
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Badge variant="outline">
                  {colaciones.length} colaciones configuradas
                </Badge>
                <Badge variant="outline">
                  {colaciones.filter(c => c.active).length} activas
                </Badge>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddForm(true)}
                  disabled={isLoading}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowResetDialog(true)}
                  disabled={isLoading}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Restablecer
                </Button>
              </div>
            </div>

            {/* Formulario para agregar nueva colación */}
            <AnimatePresence>
              {showAddForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-blue-800 dark:text-blue-200">
                        Agregar Nueva Colación
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <Label htmlFor="new-code">Código</Label>
                          <Input
                            id="new-code"
                            value={newColacion.code}
                            onChange={(e) => setNewColacion({ ...newColacion, code: e.target.value.toUpperCase() })}
                            placeholder="C7"
                            className="font-mono"
                          />
                        </div>
                        
                        <div className="md:col-span-2">
                          <Label htmlFor="new-description">Descripción</Label>
                          <Input
                            id="new-description"
                            value={newColacion.description}
                            onChange={(e) => setNewColacion({ ...newColacion, description: e.target.value })}
                            placeholder="Descripción de la colación"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="new-price">Precio</Label>
                          <Input
                            id="new-price"
                            type="number"
                            value={newColacion.price}
                            onChange={(e) => setNewColacion({ ...newColacion, price: parseInt(e.target.value) || 0 })}
                            placeholder="0"
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={newColacion.active}
                            onCheckedChange={(checked) => setNewColacion({ ...newColacion, active: checked })}
                          />
                          <Label>Activa por defecto</Label>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setShowAddForm(false)
                              setNewColacion({ code: '', title: '', description: '', price: 0, active: true })
                            }}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleAddColacion}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Agregar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Lista de colaciones */}
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span>Cargando colaciones...</span>
              </div>
            ) : (
              <div className="space-y-3">
                {colaciones.map((colacion, index) => (
                  <motion.div
                    key={colacion.code}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className={`${!colacion.active ? 'opacity-60' : ''}`}>
                      <CardContent className="p-4">
                        {editingIndex === index ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              <div>
                                <Label>Código</Label>
                                <Input
                                  value={colacion.code}
                                  onChange={(e) => handleUpdateColacion(index, { code: e.target.value.toUpperCase() })}
                                  className="font-mono"
                                />
                              </div>
                              
                              <div className="md:col-span-2">
                                <Label>Descripción</Label>
                                <Input
                                  value={colacion.description}
                                  onChange={(e) => handleUpdateColacion(index, { description: e.target.value })}
                                />
                              </div>
                              
                              <div>
                                <Label>Precio</Label>
                                <Input
                                  type="number"
                                  value={colacion.price}
                                  onChange={(e) => handleUpdateColacion(index, { price: parseInt(e.target.value) || 0 })}
                                />
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={colacion.active}
                                  onCheckedChange={(checked) => handleUpdateColacion(index, { active: checked })}
                                />
                                <Label>Activa</Label>
                              </div>
                              
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingIndex(null)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => setEditingIndex(null)}
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Badge variant="secondary" className="font-mono">
                                {colacion.code}
                              </Badge>
                              <div>
                                <p className="font-medium text-sm">
                                  {colacion.description}
                                </p>
                                <p className="text-xs text-slate-600 dark:text-slate-400">
                                  {colacion.active ? 'Activa' : 'Inactiva'}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-3">
                              <div className="text-right">
                                <p className="font-bold text-green-600 dark:text-green-400">
                                  ${colacion.price.toLocaleString('es-CL')}
                                </p>
                              </div>
                              
                              <div className="flex space-x-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingIndex(index)}
                                >
                                  <Edit3 className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteColacion(index)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="flex items-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Guardar Configuración</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación para restablecer */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Restablecer configuración?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción restablecerá todas las colaciones predeterminadas a los valores originales del sistema. 
              Se perderán todas las personalizaciones realizadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Restableciendo...
                </>
              ) : (
                'Restablecer'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
