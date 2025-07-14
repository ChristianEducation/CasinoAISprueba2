"use client"

import { motion } from 'framer-motion'
import { ShoppingCart, Trash2, CreditCard, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useOrderStore } from '@/store/orderStore'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

interface OrderSummaryProps {
  onProceedToPayment: () => void
  isProcessingPayment: boolean
}

export function OrderSummary({ onProceedToPayment, isProcessingPayment }: OrderSummaryProps) {
  const { getOrderSummary, removeSelection, userType } = useOrderStore()
  const summary = getOrderSummary()

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price)
  }

  // Actualizado: permitir pago con cualquier selección (almuerzo O colación)
  const hasAnyItems = summary.selections.length > 0 && 
    summary.selections.some(s => s.almuerzo || s.colacion)
  const canProceedToPayment = hasAnyItems

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 sticky top-6"
    >
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-lg flex items-center justify-center">
          <ShoppingCart className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 text-clean">
            Resumen del Pedido
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 text-clean">
            Usuario: {userType === 'apoderado' ? 'Apoderado' : 'Funcionario'}
          </p>
        </div>
      </div>

      {/* Selecciones */}
      {summary.selections.length === 0 ? (
        <div className="text-center py-8">
          <ShoppingCart className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400 text-clean">
            No has seleccionado ningún menú
          </p>
          <p className="text-sm text-slate-400 dark:text-slate-500 text-clean mt-1">
            Elige tus opciones para cada día
          </p>
        </div>
      ) : (
        <div className="space-y-4 mb-6">
          {summary.selections.map((selection) => {
            const date = parseISO(selection.date)
            return (
              <motion.div
                key={selection.date}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-slate-800 dark:text-slate-100 text-clean">
                      {format(date, 'EEEE dd MMM', { locale: es })}
                    </h4>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => removeSelection(selection.date)}
                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </div>

                <div className="space-y-2">
                  {selection.almuerzo && (
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 text-clean">
                          {selection.almuerzo.code} - {selection.almuerzo.name}
                        </span>
                        <p className="text-xs text-slate-500 dark:text-slate-400 text-clean">
                          Almuerzo
                        </p>
                      </div>
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-100 text-clean">
                        {formatPrice(selection.almuerzo.price)}
                      </span>
                    </div>
                  )}

                  {selection.colacion && (
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 text-clean">
                          {selection.colacion.code} - {selection.colacion.name}
                        </span>
                        <p className="text-xs text-slate-500 dark:text-slate-400 text-clean">
                          Colación
                        </p>
                      </div>
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-100 text-clean">
                        {formatPrice(selection.colacion.price)}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Totales */}
      {summary.selections.length > 0 && (
        <div className="border-t border-slate-200 dark:border-slate-600 pt-4 space-y-3">
          {summary.totalAlmuerzos > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400 text-clean">
                Almuerzos ({summary.totalAlmuerzos})
              </span>
              <span className="font-medium text-slate-800 dark:text-slate-100 text-clean">
                {formatPrice(summary.subtotalAlmuerzos)}
              </span>
            </div>
          )}

          {summary.totalColaciones > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400 text-clean">
                Colaciones ({summary.totalColaciones})
              </span>
              <span className="font-medium text-slate-800 dark:text-slate-100 text-clean">
                {formatPrice(summary.subtotalColaciones)}
              </span>
            </div>
          )}

          <div className="border-t border-slate-200 dark:border-slate-600 pt-3">
            <div className="flex justify-between">
              <span className="text-lg font-semibold text-slate-800 dark:text-slate-100 text-clean">
                Total
              </span>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 text-clean">
                {formatPrice(summary.total)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Validación y botón de pago */}
      <div className="mt-6 space-y-3">
        {/* Mensaje de estado actualizado */}
        {summary.selections.length > 0 && canProceedToPayment && (
          <div className="flex items-start space-x-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-green-700 dark:text-green-300 text-clean">
              {summary.totalAlmuerzos > 0 && summary.totalColaciones > 0 && (
                <>¡Perfecto! Tienes {summary.totalAlmuerzos} almuerzo(s) y {summary.totalColaciones} colación(es).</>
              )}
              {summary.totalAlmuerzos > 0 && summary.totalColaciones === 0 && (
                <>¡Perfecto! Tienes {summary.totalAlmuerzos} almuerzo(s) seleccionado(s).</>
              )}
              {summary.totalAlmuerzos === 0 && summary.totalColaciones > 0 && (
                <>¡Perfecto! Tienes {summary.totalColaciones} colación(es) seleccionada(s).</>
              )}
            </p>
          </div>
        )}

        {summary.selections.length > 0 && !canProceedToPayment && (
          <div className="flex items-start space-x-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-300 text-clean">
              Debes seleccionar al menos un almuerzo o colación para proceder
            </p>
          </div>
        )}

        <motion.div
          whileHover={canProceedToPayment ? { scale: 1.02 } : {}}
          whileTap={canProceedToPayment ? { scale: 0.98 } : {}}
        >
          <Button
            onClick={onProceedToPayment}
            disabled={!canProceedToPayment || isProcessingPayment}
            className={`w-full py-3 text-base font-medium transition-all duration-300 ${
              canProceedToPayment
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
            }`}
          >
            {isProcessingPayment ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Procesando...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <CreditCard className="w-4 h-4" />
                <span>Pagar Ahora</span>
              </div>
            )}
          </Button>
        </motion.div>

        <p className="text-xs text-slate-500 dark:text-slate-400 text-center text-clean">
          Pago seguro procesado por GetNet
        </p>
      </div>
    </motion.div>
  )
}