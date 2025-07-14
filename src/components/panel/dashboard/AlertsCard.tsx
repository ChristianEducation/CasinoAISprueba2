"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X, ArrowRight, Info, XCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DashboardAlert } from '@/types/dashboard'
import { getAlertIconName, getAlertColor } from '@/lib/dashboardUtils'
import Link from 'next/link'

interface AlertsCardProps {
  alerts: DashboardAlert[]
}

const AlertIcon = ({ iconName, className }: { iconName: string; className?: string }) => {
  const icons = {
    AlertTriangle: AlertTriangle,
    Info: Info,
    XCircle: XCircle,
    CheckCircle: CheckCircle
  }
  
  const IconComponent = icons[iconName as keyof typeof icons] || AlertTriangle
  return <IconComponent className={className} />
}

export function AlertsCard({ alerts }: AlertsCardProps) {
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([])

  const visibleAlerts = alerts.filter(alert => !dismissedAlerts.includes(alert.id))
  const sortedAlerts = visibleAlerts.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    return priorityOrder[b.priority] - priorityOrder[a.priority]
  })

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => [...prev, alertId])
  }

  if (sortedAlerts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="panel-card"
      >
        <div className="panel-card-content">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 text-clean">
                Alertas y Recordatorios
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 text-clean">
                Todo al día
              </p>
            </div>
          </div>

          <div className="text-center py-6">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-clean">
              No tienes alertas pendientes
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-500 text-clean mt-1">
              Todo está en orden
            </p>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="panel-card"
    >
      <div className="panel-card-content">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 text-clean">
              Alertas y Recordatorios
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-clean">
              {sortedAlerts.length} pendiente{sortedAlerts.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Alertas */}
        <div className="space-y-3">
          <AnimatePresence>
            {sortedAlerts.map((alert, index) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: 0.1 * index }}
                className={`p-4 rounded-lg border ${getAlertColor(alert.type)}`}
              >
                <div className="flex items-start space-x-3">
                  <AlertIcon 
                    iconName={getAlertIconName(alert.type)} 
                    className="w-5 h-5 flex-shrink-0 mt-0.5" 
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-clean mb-1">
                          {alert.title}
                        </h4>
                        <p className="text-sm text-clean opacity-90">
                          {alert.message}
                        </p>
                      </div>
                      
                      {alert.dismissible && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => dismissAlert(alert.id)}
                          className="ml-2 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </motion.button>
                      )}
                    </div>

                    {alert.actionText && alert.actionUrl && (
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="mt-3"
                      >
                        <Link href={alert.actionUrl}>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-xs border-current hover:bg-current hover:text-white"
                          >
                            {alert.actionText}
                            <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        </Link>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}