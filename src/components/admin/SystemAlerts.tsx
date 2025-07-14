"use client"
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  XCircle,
  X,
  ArrowRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SystemAlert } from '@/types/admin'
import { getAlertPriorityColor } from '@/lib/adminUtils'

interface SystemAlertsProps {
  alerts: SystemAlert[]
  onDismissAlert?: (alertId: string) => void
}

export function SystemAlerts({ alerts, onDismissAlert }: SystemAlertsProps) {
  const getAlertIcon = (type: SystemAlert['type']) => {
    switch (type) {
      case 'warning':
        return AlertTriangle
      case 'error':
        return XCircle
      case 'info':
        return Info
      case 'success':
        return CheckCircle
      default:
        return Info
    }
  }

  const getPriorityBadgeColor = (priority: SystemAlert['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
      case 'medium':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
      case 'low':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300'
    }
  }

  if (alerts.length === 0) {
    return (
      <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
            Alertas del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">
              No hay alertas activas en el sistema
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
              Todo funciona correctamente
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
            Alertas del Sistema
          </CardTitle>
          <Badge variant="secondary" className="bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
            {alerts.length} {alerts.length === 1 ? 'alerta' : 'alertas'}
          </Badge>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Notificaciones importantes que requieren atención
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <AnimatePresence>
            {alerts.map((alert, index) => {
              const AlertIcon = getAlertIcon(alert.type)
              
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={`
                    relative p-4 rounded-lg border-l-4 
                    ${getAlertPriorityColor(alert.priority)}
                  `}
                >
                  <div className="flex items-start space-x-3">
                    <AlertIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-sm">
                          {alert.title}
                        </h4>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getPriorityBadgeColor(alert.priority)}`}
                          >
                            {alert.priority === 'high' ? 'Alta' : 
                             alert.priority === 'medium' ? 'Media' : 'Baja'}
                          </Badge>
                          {alert.dismissible && onDismissAlert && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDismissAlert(alert.id)}
                              className="h-6 w-6 p-0 hover:bg-slate-200 dark:hover:bg-slate-700"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-sm mb-3">
                        {alert.message}
                      </p>
                      
                      {alert.actionUrl && alert.actionText && (
                        <Link href={alert.actionUrl}>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-xs h-8"
                          >
                            {alert.actionText}
                            <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  )
}
