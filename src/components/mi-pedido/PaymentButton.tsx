"use client"

import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { OrderService } from '@/services/orderService'
import { OrderSummaryByChild, User } from '@/types/panel'
import { 
  CreditCard, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Shield,
  Users,
  User as UserIcon,
  Info
} from 'lucide-react'

interface PaymentButtonProps {
  summary: OrderSummaryByChild
  weekDays: string[]
  isOrderingAllowed: boolean
  onProceedToPayment: () => void
  isProcessingPayment: boolean
  isReadOnly: boolean
  user: User
}

export function PaymentButton({
  summary,
  weekDays,
  isOrderingAllowed,
  onProceedToPayment,
  isProcessingPayment,
  isReadOnly,
  user
}: PaymentButtonProps) {
  
  // Validar pedido con nueva lógica flexible
  const validation = OrderService.validateOrderByChild(
    summary.selections,
    weekDays,
    isOrderingAllowed,
    user
  )

  if (isReadOnly) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
            <CheckCircle className="w-5 h-5" />
            Pedido Confirmado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="default" className="border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20">
            <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <AlertDescription className="text-emerald-800 dark:text-emerald-200">
              Tu pedido ha sido confirmado y pagado exitosamente. Podrás ver los detalles en tu historial de pedidos.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const isLoading = isProcessingPayment
  const canProceed = validation.canProceedToPayment && !isLoading && summary.total > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Confirmar Pedido
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Información sobre pedidos flexibles */}
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            <strong>¡Máxima flexibilidad!</strong> Ahora puedes pedir solo almuerzos, solo colaciones, o ambos. 
            No hay restricciones entre tipos de menú.
          </AlertDescription>
        </Alert>

        {/* Errores críticos */}
        {validation.errors.length > 0 && (
          <div className="space-y-2">
            {validation.errors.map((error, index) => (
              <Alert key={index} variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Advertencias informativas (no bloquean el pago) */}
        {validation.warnings.length > 0 && (
          <div className="space-y-2">
            {validation.warnings.map((warning, index) => (
              <Alert key={index} variant="default" className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
                <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertDescription className="text-amber-800 dark:text-amber-200">
                  {warning}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Información de deadline */}
        {!isOrderingAllowed && (
          <Alert variant="destructive">
            <Clock className="h-4 w-4" />
            <AlertDescription>
              El tiempo para realizar pedidos ha expirado. Los pedidos cierran los miércoles a las 13:00.
            </AlertDescription>
          </Alert>
        )}

        {/* Resumen de validación para apoderados */}
        {user.tipoUsuario === 'apoderado' && summary.selections.length > 0 && (
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Resumen por hijo
              </span>
            </div>
            <div className="space-y-1 text-xs">
              {Object.values(summary.resumenPorHijo).map((resumen) => (
                <div key={resumen.hijo.id} className="flex justify-between text-blue-800 dark:text-blue-200">
                  <span>{resumen.hijo.name}</span>
                  <span>{resumen.almuerzos} almuerzo(s), {resumen.colaciones} colación(es)</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resumen para funcionarios */}
        {user.tipoUsuario === 'funcionario' && summary.selections.length > 0 && (
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-2">
              <UserIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-900 dark:text-green-100">
                Pedido personal
              </span>
            </div>
            <div className="text-xs text-green-800 dark:text-green-200">
              {summary.totalAlmuerzos} almuerzo(s) • {summary.totalColaciones} colación(es)
            </div>
          </div>
        )}

        {/* Estado del pedido - Actualizado para mostrar flexibilidad */}
        {(summary.totalAlmuerzos > 0 || summary.totalColaciones > 0) && (
          <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              {summary.totalAlmuerzos > 0 && summary.totalColaciones > 0 && (
                <>¡Perfecto! Tienes {summary.totalAlmuerzos} almuerzo(s) y {summary.totalColaciones} colación(es) seleccionados. Puedes proceder con el pago.</>
              )}
              {summary.totalAlmuerzos > 0 && summary.totalColaciones === 0 && (
                <>¡Perfecto! Tienes {summary.totalAlmuerzos} almuerzo(s) seleccionado(s). Puedes proceder con el pago.</>
              )}
              {summary.totalAlmuerzos === 0 && summary.totalColaciones > 0 && (
                <>¡Perfecto! Tienes {summary.totalColaciones} colación(es) seleccionada(s). Puedes proceder con el pago.</>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Información de seguridad */}
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
              Pago Seguro
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Tu pago será procesado de forma segura. Una vez confirmado, recibirás un comprobante por email.
          </p>
        </div>

        {/* Botón de pago */}
        <Button
          onClick={onProceedToPayment}
          disabled={!canProceed}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Procesando Pago...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 mr-2" />
              {summary.total > 0 
                ? `Pagar $${summary.total.toLocaleString('es-CL')}`
                : 'Selecciona al menos un almuerzo o colación'
              }
            </>
          )}
        </Button>

        {/* Texto de ayuda */}
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
          {user.tipoUsuario === 'apoderado' 
            ? 'Al confirmar, estarás realizando el pedido para todos los hijos seleccionados'
            : 'Al confirmar, estarás realizando tu pedido personal para la semana'
          }
        </p>

        {/* Información sobre flexibilidad - Actualizada */}
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
          <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
            <p className="font-medium">🎉 Pedidos completamente flexibles:</p>
            <p>• Puedes pedir solo almuerzos</p>
            <p>• Puedes pedir solo colaciones</p>
            <p>• Puedes combinar ambos como prefieras</p>
            <p>• No hay restricciones entre tipos de menú</p>
            <p>• Agrega más días después del pago cuando quieras</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}