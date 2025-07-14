"use client"

import { motion } from 'framer-motion'
import { Calendar, CheckCircle, Clock, AlertTriangle, ArrowRight, Info } from 'lucide-react'
import { WeeklyMenuInfo } from '@/types/dashboard'
import { getWeekDateRange } from '@/lib/dashboardUtils'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface WeeklyMenuInfoCardProps {
  weeklyMenuInfo: WeeklyMenuInfo
}

export function WeeklyMenuInfoCard({ weeklyMenuInfo }: WeeklyMenuInfoCardProps) {
  const isPublished = weeklyMenuInfo.isPublished
  const weekRange = weeklyMenuInfo.weekStart && weeklyMenuInfo.weekEnd 
    ? getWeekDateRange(weeklyMenuInfo.weekStart, weeklyMenuInfo.weekEnd)
    : 'Semana actual'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="panel-card"
    >
      <div className="panel-card-content">
        {/* Header mejorado */}
        <div className="flex items-center space-x-3 mb-6">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
            isPublished 
              ? 'bg-gradient-to-br from-emerald-500 to-green-500'
              : 'bg-gradient-to-br from-amber-500 to-orange-500'
          }`}>
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 text-clean">
              Menú Semanal
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-clean truncate">
              {weekRange}
            </p>
          </div>
        </div>

        {/* Estado del menú mejorado */}
        <div className="space-y-6">
          <div className="flex items-start space-x-4">
            <div className={`p-3 rounded-xl ${
              isPublished 
                ? 'bg-emerald-100 dark:bg-emerald-900/30' 
                : 'bg-amber-100 dark:bg-amber-900/30'
            }`}>
              {isPublished ? (
                <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold border ${
                isPublished
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
              }`}>
                {isPublished ? 'Menú disponible' : 'Menú no disponible'}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 text-clean mt-2 leading-relaxed">
                {isPublished 
                  ? 'El menú está publicado y listo para realizar pedidos'
                  : 'El menú aún no ha sido publicado por la administración'
                }
              </p>
            </div>
          </div>

          {/* Información adicional mejorada */}
          {isPublished && weeklyMenuInfo.publishedAt && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center space-x-3 mb-3">
                <Info className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span className="font-semibold text-emerald-700 dark:text-emerald-300 text-clean">
                  Información del menú
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-emerald-600 dark:text-emerald-400 text-clean">
                    Publicado:
                  </span>
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300 text-clean">
                    {format(weeklyMenuInfo.publishedAt, "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
                  </span>
                </div>
                {weeklyMenuInfo.lastUpdated && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-emerald-600 dark:text-emerald-400 text-clean">
                      Última actualización:
                    </span>
                    <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300 text-clean">
                      {format(weeklyMenuInfo.lastUpdated, "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {!isPublished && (
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
              <div className="flex items-center space-x-3 mb-3">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <span className="font-semibold text-amber-700 dark:text-amber-300 text-clean">
                  Estado del menú
                </span>
              </div>
              <p className="text-sm text-amber-600 dark:text-amber-400 text-clean leading-relaxed">
                El equipo de cocina está preparando el menú para esta semana. 
                Te notificaremos automáticamente cuando esté disponible para realizar pedidos.
              </p>
            </div>
          )}

          {/* Botón de acción mejorado */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link href={isPublished ? "/panel" : "/menu"} className="block">
              <Button 
                className={`w-full h-12 text-base font-semibold rounded-xl ${
                  isPublished
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl'
                    : 'bg-amber-600 hover:bg-amber-700 text-white shadow-lg hover:shadow-xl'
                } transition-all duration-300`}
              >
                <span>
                  {isPublished ? 'Ver menú completo' : 'Ver menús anteriores'}
                </span>
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </motion.div>

          {/* Información adicional para usuarios */}
          <div className="text-center bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
            <p className="text-sm text-slate-500 dark:text-slate-400 text-clean leading-relaxed">
              {isPublished 
                ? 'Puedes realizar cambios en tu pedido hasta el miércoles a las 13:00'
                : 'Los menús se publican generalmente los domingos por la tarde'
              }
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}