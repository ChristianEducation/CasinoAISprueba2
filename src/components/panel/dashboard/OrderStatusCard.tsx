"use client"

import { motion } from 'framer-motion'
import { ShoppingCart, ArrowRight, Clock, CheckCircle, Edit, CreditCard, AlertTriangle, Calendar, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { OrderStatus } from '@/types/dashboard'
import { getOrderStatusInfo, getProgressPercentage } from '@/lib/dashboardUtils'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface OrderStatusCardProps {
  orderStatus: OrderStatus
}

const StatusIcon = ({ iconName, className }: { iconName: string; className?: string }) => {
  const icons = {
    Clock: Clock,
    Edit: Edit,
    CheckCircle: CheckCircle,
    CreditCard: CreditCard,
    AlertTriangle: AlertTriangle,
    Calendar: Calendar,
    Package: Package
  }
  
  const IconComponent = icons[iconName as keyof typeof icons] || Clock
  return <IconComponent className={className} />
}

export function OrderStatusCard({ orderStatus }: OrderStatusCardProps) {
  const statusInfo = getOrderStatusInfo(orderStatus)
  const progressPercentage = getProgressPercentage(orderStatus.daysSelected, orderStatus.totalDays)

  // Verificar si la fecha límite ha pasado
  const now = new Date()
  const isDeadlinePassed = orderStatus.paymentDeadline && now > orderStatus.paymentDeadline
  const isNearDeadline = orderStatus.paymentDeadline && 
    now < orderStatus.paymentDeadline && 
    (orderStatus.paymentDeadline.getTime() - now.getTime()) < 24 * 60 * 60 * 1000 // 24 horas

  // Determinar si el pedido está completo
  const isOrderComplete = orderStatus.status === 'paid'
  const isOrderReady = orderStatus.status === 'confirmed'
  const isOrderInProgress = orderStatus.status === 'in_progress'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="panel-card"
    >
      <div className="panel-card-content">
        {/* Header mejorado */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
              isOrderComplete 
                ? 'bg-gradient-to-br from-emerald-500 to-green-500'
                : isOrderReady
                ? 'bg-gradient-to-br from-blue-500 to-indigo-500'
                : 'bg-gradient-to-br from-slate-400 to-slate-500'
            }`}>
              {isOrderComplete ? (
                <Package className="w-6 h-6 text-white" />
              ) : (
                <ShoppingCart className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 text-clean">
                Estado del Pedido
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 text-clean">
                {isOrderComplete ? 'Pedido completado' : 'Semana actual'}
              </p>
            </div>
          </div>
          
          {/* Indicador visual del estado */}
          {isOrderComplete && (
            <div className="flex items-center space-x-2 bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">COMPLETO</span>
            </div>
          )}
        </div>

        {/* Estado actual mejorado */}
        <div className="space-y-6">
          <div className="flex items-start space-x-4">
            <div className={`p-3 rounded-xl ${
              isDeadlinePassed 
                ? 'bg-red-100 dark:bg-red-900/30' 
                : isOrderComplete
                ? 'bg-emerald-100 dark:bg-emerald-900/30'
                : 'bg-slate-100 dark:bg-slate-700'
            }`}>
              <StatusIcon 
                iconName={
                  isDeadlinePassed 
                    ? 'AlertTriangle' 
                    : isOrderComplete 
                    ? 'Package'
                    : statusInfo.iconName
                } 
                className={`w-6 h-6 ${
                  isDeadlinePassed 
                    ? 'text-red-600 dark:text-red-400' 
                    : isOrderComplete
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-600 dark:text-slate-400'
                }`} 
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold ${
                isDeadlinePassed 
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800' 
                  : statusInfo.color
              }`}>
                {isDeadlinePassed ? 'Fecha límite vencida' : statusInfo.label}
              </div>
              
              {/* Descripción mejorada según el estado */}
              <div className="mt-2 space-y-1">
                <p className="text-sm text-slate-600 dark:text-slate-400 text-clean leading-relaxed">
                  {isDeadlinePassed 
                    ? 'Contacta al administrador para realizar cambios en tu pedido' 
                    : isOrderComplete
                    ? '¡Tu pedido está listo! Los almuerzos serán servidos según tu selección.'
                    : isOrderReady
                    ? 'Tu pedido está completo y listo para pagar. Una vez pagado, estará confirmado.'
                    : isOrderInProgress
                    ? `Has seleccionado ${orderStatus.daysSelected} de ${orderStatus.totalDays} días. Completa tu selección.`
                    : statusInfo.description
                  }
                </p>
                
                {/* Información adicional para pedido completo */}
                {isOrderComplete && (
                  <div className="flex items-center space-x-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg px-3 py-2 mt-2">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-medium">
                      Pedido confirmado para {orderStatus.daysSelected} días de la semana
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Barra de progreso mejorada */}
          {orderStatus.status !== 'not_started' && !isDeadlinePassed && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400 text-clean">
                  {isOrderComplete ? 'Días confirmados' : 'Progreso semanal'}
                </span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100 text-clean">
                  {orderStatus.daysSelected}/{orderStatus.totalDays} días
                </span>
              </div>
              <div className="relative">
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`h-3 rounded-full ${
                      isOrderComplete
                        ? 'bg-gradient-to-r from-emerald-500 to-green-500'
                        : isOrderReady
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                        : 'bg-gradient-to-r from-amber-500 to-orange-500'
                    }`}
                  />
                </div>
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/20 to-transparent pointer-events-none" />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 text-clean">
                  {progressPercentage}% {isOrderComplete ? 'confirmado' : 'completado'}
                </span>
                {!isOrderComplete && (
                  <span className="text-slate-500 dark:text-slate-400 text-clean">
                    {orderStatus.totalDays - orderStatus.daysSelected} días restantes
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Información de fecha límite mejorada */}
          {orderStatus.paymentDeadline && !isOrderComplete && (
            <div className={`flex items-start space-x-3 p-4 rounded-xl border ${
              isDeadlinePassed 
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                : isNearDeadline
                ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
            }`}>
              <Clock className={`w-5 h-5 mt-0.5 ${
                isDeadlinePassed 
                  ? 'text-red-600 dark:text-red-400'
                  : isNearDeadline
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-blue-600 dark:text-blue-400'
              }`} />
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm ${
                  isDeadlinePassed 
                    ? 'text-red-700 dark:text-red-300'
                    : isNearDeadline
                    ? 'text-amber-700 dark:text-amber-300'
                    : 'text-blue-700 dark:text-blue-300'
                } text-clean`}>
                  {isDeadlinePassed ? 'Fecha límite vencida' : 'Fecha límite para cambios'}
                </p>
                <p className={`text-xs mt-1 ${
                  isDeadlinePassed 
                    ? 'text-red-600 dark:text-red-400'
                    : isNearDeadline
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-blue-600 dark:text-blue-400'
                } text-clean`}>
                  {format(orderStatus.paymentDeadline, "EEEE dd 'de' MMMM 'a las' HH:mm", { locale: es })}
                </p>
              </div>
            </div>
          )}

          {/* Información adicional */}
          {orderStatus.lastModified && (
            <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
              <Calendar className="w-4 h-4" />
              <span className="text-clean">
                {isOrderComplete ? 'Pedido confirmado el' : 'Última modificación'}: {format(orderStatus.lastModified, "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
              </span>
            </div>
          )}

          {/* Botón de acción mejorado */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link href={isOrderComplete ? "/panel" : "/mi-pedido"} className="block">
              <Button 
                className={`w-full h-12 text-base font-semibold rounded-xl ${
                  isDeadlinePassed 
                    ? 'bg-slate-400 hover:bg-slate-500 text-white cursor-not-allowed'
                    : isOrderComplete
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl'
                    : isOrderReady
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                    : 'bg-amber-600 hover:bg-amber-700 text-white shadow-lg hover:shadow-xl'
                } transition-all duration-300`}
                disabled={isDeadlinePassed}
              >
                <span>
                  {isDeadlinePassed 
                    ? 'Fecha límite vencida' 
                    : isOrderComplete 
                    ? 'Ver detalles del pedido'
                    : isOrderReady
                    ? 'Proceder al pago'
                    : 'Continuar selección'
                  }
                </span>
                {!isDeadlinePassed && <ArrowRight className="w-5 h-5 ml-2" />}
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}