"use client"
import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Search,
  Wrench,
  Info,
  Loader2
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
import { useToast } from '@/hooks/use-toast'

interface ColacionesDiagnosticProps {
  weekStart: string
  onDiagnosticComplete?: () => void
}

interface DiagnosticResult {
  totalItems: number
  publishedItems: number
  activeItems: number
  issues: string[]
  recommendations: string[]
}

export function ColacionesDiagnostic({ weekStart, onDiagnosticComplete }: ColacionesDiagnosticProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [isFixing, setIsFixing] = useState(false)
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null)
  const { toast } = useToast()

  const runDiagnostic = async () => {
    setIsRunning(true)
    try {
      console.log('🔍 Running diagnostic for week:', weekStart)
      
      const result = await AdminMenuService.diagnosePublicationIssues(weekStart)
      setDiagnosticResult(result)
      
      console.log('📊 Diagnostic results:', result)
      
      if (result.issues.length === 0) {
        toast({
          title: "Diagnóstico completado",
          description: "No se encontraron problemas con las colaciones",
        })
      } else {
        toast({
          title: "Problemas detectados",
          description: `Se encontraron ${result.issues.length} problema(s)`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('❌ Error running diagnostic:', error)
      toast({
        title: "Error",
        description: "Error al ejecutar el diagnóstico",
        variant: "destructive",
      })
    } finally {
      setIsRunning(false)
    }
  }

  const fixIssues = async () => {
    if (!diagnosticResult) return
    
    setIsFixing(true)
    try {
      console.log('🔧 Fixing publication issues for week:', weekStart)
      
      const result = await AdminMenuService.fixUnpublishedDefaultColaciones(weekStart)
      
      if (result.success) {
        toast({
          title: "Problemas corregidos",
          description: result.message,
        })
        
        // Ejecutar diagnóstico nuevamente para verificar
        await runDiagnostic()
        onDiagnosticComplete?.()
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('❌ Error fixing issues:', error)
      toast({
        title: "Error",
        description: "Error al corregir los problemas",
        variant: "destructive",
      })
    } finally {
      setIsFixing(false)
    }
  }

  const handleDialogOpen = (open: boolean) => {
    setIsOpen(open)
    if (open) {
      // Ejecutar diagnóstico automáticamente al abrir
      runDiagnostic()
    } else {
      // Limpiar resultados al cerrar
      setDiagnosticResult(null)
    }
  }

  const getStatusColor = () => {
    if (!diagnosticResult) return 'gray'
    if (diagnosticResult.issues.length === 0) return 'green'
    if (diagnosticResult.publishedItems > 0) return 'yellow'
    return 'red'
  }

  const getStatusIcon = () => {
    if (!diagnosticResult) return <Search className="w-4 h-4" />
    if (diagnosticResult.issues.length === 0) return <CheckCircle2 className="w-4 h-4" />
    return <AlertTriangle className="w-4 h-4" />
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-blue-200 text-blue-700"
        >
          <Search className="w-4 h-4" />
          <span>Diagnosticar Colaciones</span>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Search className="w-5 h-5" />
            <span>Diagnóstico de Colaciones</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Este diagnóstico verifica que las colaciones estén correctamente publicadas y disponibles para los usuarios.
            </AlertDescription>
          </Alert>

          {/* Estado del diagnóstico */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h4 className="font-medium">Estado del diagnóstico:</h4>
              {isRunning && <Loader2 className="w-4 h-4 animate-spin" />}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={runDiagnostic}
              disabled={isRunning || isFixing}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
              <span>Ejecutar Diagnóstico</span>
            </Button>
          </div>

          {/* Resultados del diagnóstico */}
          {diagnosticResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Resumen */}
              <Card className={`border-l-4 ${
                getStatusColor() === 'green' ? 'border-l-green-500 bg-green-50 dark:bg-green-900/20' :
                getStatusColor() === 'yellow' ? 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' :
                getStatusColor() === 'red' ? 'border-l-red-500 bg-red-50 dark:bg-red-900/20' :
                'border-l-gray-500 bg-gray-50 dark:bg-gray-900/20'
              }`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center space-x-2">
                    {getStatusIcon()}
                    <span>Resumen del Diagnóstico</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-900 dark:text-white">
                        {diagnosticResult.totalItems}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        Total Items
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {diagnosticResult.publishedItems}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        Publicados
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {diagnosticResult.activeItems}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        Activos
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Problemas detectados */}
              {diagnosticResult.issues.length > 0 && (
                <Card className="border-red-200 dark:border-red-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center space-x-2 text-red-800 dark:text-red-200">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Problemas Detectados</span>
                      <Badge variant="destructive" className="text-xs">
                        {diagnosticResult.issues.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {diagnosticResult.issues.map((issue, index) => (
                        <div key={index} className="flex items-start space-x-2 text-sm">
                          <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <span className="text-red-700 dark:text-red-300">{issue}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recomendaciones */}
              {diagnosticResult.recommendations.length > 0 && (
                <Card className="border-blue-200 dark:border-blue-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center space-x-2 text-blue-800 dark:text-blue-200">
                      <Info className="w-4 h-4" />
                      <span>Recomendaciones</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {diagnosticResult.recommendations.map((recommendation, index) => (
                        <div key={index} className="flex items-start space-x-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span className="text-blue-700 dark:text-blue-300">{recommendation}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Estado exitoso */}
              {diagnosticResult.issues.length === 0 && diagnosticResult.totalItems > 0 && (
                <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                      <div>
                        <h4 className="font-medium text-green-800 dark:text-green-200">
                          ¡Todo está funcionando correctamente!
                        </h4>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          Todas las colaciones están activas y publicadas correctamente.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}

          {/* Botones de acción */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div>
              {diagnosticResult && diagnosticResult.issues.length > 0 && (
                <Button
                  onClick={fixIssues}
                  disabled={isFixing || isRunning}
                  className="flex items-center space-x-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                >
                  {isFixing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Corrigiendo...</span>
                    </>
                  ) : (
                    <>
                      <Wrench className="w-4 h-4" />
                      <span>Corregir Automáticamente</span>
                    </>
                  )}
                </Button>
              )}
            </div>
            
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isRunning || isFixing}
            >
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}