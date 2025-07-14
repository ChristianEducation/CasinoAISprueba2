"use client"

import { Clock, Calendar, AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { WeekInfo } from '@/types/order'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface OrderHeaderProps {
  weekInfo: WeekInfo
  weekDisplayText: string
}

export function OrderHeader({ weekInfo, weekDisplayText }: OrderHeaderProps) {
  const timeUntilDeadline = weekInfo.orderDeadline.getTime() - new Date().getTime()
  const hoursUntilDeadline = Math.floor(timeUntilDeadline / (1000 * 60 * 60))
  
  return (
    <div className="space-y-6">
      {/* Título principal */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          Mi pedido semanal
        </h1>
        <div className="flex items-center justify-center gap-2 text-lg text-slate-600 dark:text-slate-400">
          <Calendar className="w-5 h-5" />
          <span>{weekDisplayText}</span>
        </div>
      </div>

      {/* Información contextual */}
      <div className="max-w-2xl mx-auto">
        {weekInfo.isOrderingAllowed ? (
          <Alert variant="info">
            <Clock className="h-4 w-4" />
            <AlertDescription>
              Selecciona tu opción de almuerzo y colación para cada día antes del{' '}
              <strong>
                {format(weekInfo.orderDeadline, "EEEE d 'de' MMMM 'a las' HH:mm 'h'", { locale: es })}
              </strong>
              {hoursUntilDeadline > 0 && hoursUntilDeadline < 48 && (
                <span className="block mt-1 text-sm">
                  Quedan aproximadamente {hoursUntilDeadline} horas para realizar tu pedido.
                </span>
              )}
            </AlertDescription>
          </Alert>
        ) : (
          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              El tiempo para realizar pedidos ha expirado. Los pedidos deben realizarse antes del{' '}
              <strong>miércoles a las 13:00 h</strong>.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}
