"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useOrderStore } from '@/store/orderStore'
import { MenuService } from '@/services/menuService'
import { User } from '@/types/panel'
import { 
  ShoppingCart, 
  Trash2, 
  CreditCard, 
  AlertCircle, 
  Utensils, 
  Coffee,
  User as UserIcon,
  Users,
  CheckCircle,
  Info,
  Sparkles
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface OrderSummaryProps {
  user: User
  onProceedToPayment: () => void
  isProcessingPayment: boolean
}

export function OrderSummary({ user, onProceedToPayment, isProcessingPayment }: OrderSummaryProps) {
  const { 
    getOrderSummaryByChild, 
    removeSelectionByChild,
  } = useOrderStore()

  const summary = getOrderSummaryByChild()
  const hasSelections = summary.selections.length > 0
  const hasAlmuerzos = summary.totalAlmuerzos > 0
  const hasColaciones = summary.totalColaciones > 0
  const hasAnyItems = hasAlmuerzos || hasColaciones

  const handleRemoveSelection = (date: string, childId?: string) => {
    removeSelectionByChild(date, childId)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price)
  }

  // Función mejorada para mostrar el nombre del día
  const getDayName = (date: string) => {
    try {
      return MenuService.getDayDisplayName(date)
    } catch (error) {
      console.error('Error formatting date:', date, error)
      return date
    }
  }

  // Agrupar selecciones por hijo
  const selectionsByChildGroup = summary.selections.reduce((acc, selection) => {
    const childKey = selection.hijo?.id || 'funcionario'
    if (!acc[childKey]) {
      acc[childKey] = []
    }
    acc[childKey].push(selection)
    return acc
  }, {} as Record<string, typeof summary.selections>)

  return (
    <div className="space-y-6">
      <Card className="w-full shadow-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShoppingCart className="w-5 h-5 flex-shrink-0" />
            <span className="truncate">Resumen del Pedido</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 p-4">
          {!hasSelections ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm font-medium mb-2">No has seleccionado ningún menú</p>
              <p className="text-xs leading-relaxed">
                {user.tipoUsuario === 'apoderado' 
                  ? 'Selecciona un hijo y elige los menús para cada día'
                  : 'Elige los menús para cada día de la semana'
                }
              </p>
            </div>
          ) : (
            <>
              {/* Información sobre pedidos flexibles */}
              <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 p-3">
                <Info className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <AlertDescription className="text-blue-800 dark:text-blue-200 text-xs leading-relaxed">
                  <strong>¡Máxima flexibilidad!</strong> Puedes pagar solo almuerzos, solo colaciones, o ambos. 
                  No hay restricciones entre tipos de menú.
                </AlertDescription>
              </Alert>

              {/* Selecciones agrupadas por hijo */}
              <div className="space-y-4">
                {Object.entries(selectionsByChildGroup).map(([childKey, selections]) => {
                  const child = selections[0]?.hijo
                  const isPersonal = childKey === 'funcionario'
                  
                  return (
                    <motion.div
                      key={childKey}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3"
                    >
                      {/* Header del hijo/funcionario */}
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
                        {isPersonal ? (
                          <>
                            <UserIcon className="w-4 h-4 text-slate-600 dark:text-slate-400 flex-shrink-0" />
                            <span className="font-medium text-slate-900 dark:text-slate-100 text-sm truncate">
                              Pedido Personal
                            </span>
                            <Badge variant="secondary" className="text-xs px-2 py-0.5 flex-shrink-0">
                              Funcionario
                            </Badge>
                          </>
                        ) : (
                          <>
                            <Users className="w-4 h-4 text-slate-600 dark:text-slate-400 flex-shrink-0" />
                            <span className="font-medium text-slate-900 dark:text-slate-100 text-sm truncate">
                              {child?.name}
                            </span>
                            <Badge variant="outline" className="text-xs px-2 py-0.5 flex-shrink-0">
                              {child?.curso}
                            </Badge>
                          </>
                        )}
                      </div>

                      {/* Selecciones del hijo ordenadas por fecha */}
                      <AnimatePresence>
                        {selections
                          .sort((a, b) => a.date.localeCompare(b.date))
                          .map((selection) => (
                          <motion.div
                            key={`${selection.date}-${childKey}`}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <div className="font-medium text-sm text-slate-900 dark:text-slate-100 capitalize truncate flex-1 mr-2">
                                {getDayName(selection.date)}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveSelection(selection.date, child?.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 h-auto p-1.5 flex-shrink-0"
                                disabled={isProcessingPayment}
                                title="Eliminar selección"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                            
                            {selection.almuerzo && (
                              <div className="flex items-center justify-between text-sm gap-2">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <Utensils className="w-3 h-3 text-slate-500 flex-shrink-0" />
                                  <span className="text-slate-600 dark:text-slate-400 truncate">
                                    {selection.almuerzo.name}
                                  </span>
                                </div>
                                <span className="text-slate-900 dark:text-slate-100 font-medium flex-shrink-0">
                                  {formatPrice(selection.almuerzo.price)}
                                </span>
                              </div>
                            )}
                            
                            {selection.colacion && (
                              <div className="flex items-center justify-between text-sm gap-2">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <Coffee className="w-3 h-3 text-slate-500 flex-shrink-0" />
                                  <span className="text-slate-600 dark:text-slate-400 truncate">
                                    {selection.colacion.name}
                                  </span>
                                </div>
                                <span className="text-slate-900 dark:text-slate-100 font-medium flex-shrink-0">
                                  {formatPrice(selection.colacion.price)}
                                </span>
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </AnimatePresence>

                      {/* Subtotal por hijo */}
                      {summary.resumenPorHijo[childKey] && (
                        <div className="p-3 rounded bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                          <div className="flex justify-between text-sm">
                            <span className="text-blue-800 dark:text-blue-200 truncate flex-1 mr-2">
                              Subtotal {isPersonal ? 'personal' : child?.name}
                            </span>
                            <span className="font-medium text-blue-900 dark:text-blue-100 flex-shrink-0">
                              {formatPrice(summary.resumenPorHijo[childKey].subtotal)}
                            </span>
                          </div>
                          <div className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                            {summary.resumenPorHijo[childKey].almuerzos} almuerzo(s) • {summary.resumenPorHijo[childKey].colaciones} colación(es)
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>

              <Separator />

              {/* Resumen total */}
              <div className="space-y-3">
                {hasAlmuerzos && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400 truncate flex-1 mr-2">
                      Total Almuerzos ({summary.totalAlmuerzos})
                    </span>
                    <span className="text-slate-900 dark:text-slate-100 flex-shrink-0">
                      {formatPrice(summary.subtotalAlmuerzos)}
                    </span>
                  </div>
                )}
                
                {hasColaciones && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400 truncate flex-1 mr-2">
                      Total Colaciones ({summary.totalColaciones})
                    </span>
                    <span className="text-slate-900 dark:text-slate-100 flex-shrink-0">
                      {formatPrice(summary.subtotalColaciones)}
                    </span>
                  </div>
                )}

                <Separator />

                <div className="flex justify-between text-xl font-bold">
                  <span className="text-slate-900 dark:text-slate-100 truncate flex-1 mr-2">Total</span>
                  <span className="text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                    {formatPrice(summary.total)}
                  </span>
                </div>
              </div>

              {/* Validación y botón de pago */}
              <div className="space-y-4">
                {/* Mensaje de validación actualizado */}
                {!hasAnyItems ? (
                  <Alert variant="destructive" className="p-3">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <AlertDescription className="text-sm">
                      Debes seleccionar al menos un almuerzo o colación para proceder.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 p-3">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <AlertDescription className="text-green-800 dark:text-green-200 text-sm">
                      {hasAlmuerzos && hasColaciones && (
                        <>¡Perfecto! Tienes {summary.totalAlmuerzos} almuerzo(s) y {summary.totalColaciones} colación(es) seleccionados.</>
                      )}
                      {hasAlmuerzos && !hasColaciones && (
                        <>¡Perfecto! Tienes {summary.totalAlmuerzos} almuerzo(s) seleccionado(s).</>
                      )}
                      {!hasAlmuerzos && hasColaciones && (
                        <>¡Perfecto! Tienes {summary.totalColaciones} colación(es) seleccionada(s).</>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Botón de pago con estilo premium */}
                <Button
                  onClick={onProceedToPayment}
                  disabled={!hasAnyItems || isProcessingPayment}
                  className={`w-full relative overflow-hidden transition-all duration-300 h-14 text-lg font-semibold ${
                    hasAnyItems 
                      ? 'bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 hover:from-emerald-600 hover:via-emerald-700 hover:to-emerald-800 shadow-lg hover:shadow-xl transform hover:scale-[1.02] border-0' 
                      : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  {isProcessingPayment ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3 flex-shrink-0" />
                      <span className="truncate">Procesando pago...</span>
                    </>
                  ) : hasAnyItems ? (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 animate-pulse" />
                      <Sparkles className="w-5 h-5 mr-3 flex-shrink-0 animate-pulse" />
                      <span className="truncate">
                        Pagar {formatPrice(summary.total)}
                      </span>
                      <CreditCard className="w-5 h-5 ml-3 flex-shrink-0" />
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                      <span className="truncate">
                        Selecciona menús para continuar
                      </span>
                    </>
                  )}
                </Button>

                <p className="text-xs text-slate-500 dark:text-slate-400 text-center leading-relaxed">
                  {user.tipoUsuario === 'apoderado' 
                    ? 'Al confirmar, estarás realizando el pedido para todos los hijos seleccionados'
                    : 'Al confirmar, estarás realizando tu pedido personal para la semana'
                  }
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Información adicional sobre flexibilidad */}
      <Card className="border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 dark:border-slate-700">
        <CardContent className="p-4">
          <div className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-blue-500" />
              <span className="font-medium text-slate-900 dark:text-slate-100">Información útil</span>
            </div>
            <div className="space-y-1 text-xs">
              <p>• <strong>Pedidos completamente flexibles:</strong> Puedes pedir solo almuerzos, solo colaciones, o ambos</p>
              <p>• <strong>Sin restricciones:</strong> No hay dependencias entre tipos de menú</p>
              <p>• <strong>Agregar después:</strong> Podrás añadir más días posteriormente</p>
              <p>• <strong>Pago seguro:</strong> Procesado con GetNet y Firebase</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}