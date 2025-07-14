"use client"

import { motion } from 'framer-motion'
import { Calendar, Clock, AlertTriangle, Utensils, Coffee, Info } from 'lucide-react'
import { DayMenuDisplay } from '@/types/menu'
import { MenuItemCard } from './MenuItemCard'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface DayMenuCardProps {
  dayMenu: DayMenuDisplay
  userType: 'apoderado' | 'funcionario'
  index: number
}

export function DayMenuCard({ dayMenu, userType }: DayMenuCardProps) {
  const isToday = () => {
    const today = new Date().toISOString().split('T')[0]
    return dayMenu.date === today
  }

  const isPastDay = () => {
    const today = new Date().toISOString().split('T')[0]
    return dayMenu.date < today
  }

  if (!dayMenu.hasItems) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="max-w-2xl mx-auto"
      >
        <Card className="border-0 bg-white dark:bg-slate-800 shadow-lg">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-800/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-3">
              Menú no disponible
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              El menú para {dayMenu.dayLabel.toLowerCase()} aún no ha sido publicado por la administración.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="space-y-6"
    >
      {/* Header del día */}
      <Card className={`border-0 shadow-lg ${
        isToday()
          ? 'bg-gradient-to-r from-blue-50 to-blue-25 dark:from-blue-900/20 dark:to-blue-800/10'
          : 'bg-white dark:bg-slate-800'
      } ${isPastDay() ? 'opacity-75' : ''}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isToday()
                  ? 'bg-blue-100 dark:bg-blue-900/30'
                  : 'bg-slate-100 dark:bg-slate-700'
              }`}>
                <Calendar className={`w-6 h-6 ${
                  isToday()
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-600 dark:text-slate-400'
                }`} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {dayMenu.dayLabel}
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  {dayMenu.dateFormatted}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {isToday() && (
                <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                  <Clock className="w-3 h-3 mr-1" />
                  Hoy
                </Badge>
              )}
              {isPastDay() && (
                <Badge variant="secondary" className="bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400">
                  Pasado
                </Badge>
              )}
            </div>
          </div>

          {/* Resumen del día */}
          <div className="flex items-center space-x-4 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            {dayMenu.almuerzos.length > 0 && (
              <div className="flex items-center space-x-2">
                <Utensils className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {dayMenu.almuerzos.length} Almuerzo{dayMenu.almuerzos.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
            {dayMenu.colaciones.length > 0 && (
              <div className="flex items-center space-x-2">
                <Coffee className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {dayMenu.colaciones.length} Colación{dayMenu.colaciones.length !== 1 ? 'es' : ''}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Almuerzos */}
      {dayMenu.almuerzos.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 bg-white dark:bg-slate-800 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <Utensils className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                    Almuerzos
                  </h3>
                  <div className="flex items-center space-x-3 mt-1">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      <Clock className="w-3 h-3 mr-1" />
                      12:00 - 14:00
                    </Badge>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      {dayMenu.almuerzos.length} opción{dayMenu.almuerzos.length !== 1 ? 'es' : ''} disponible{dayMenu.almuerzos.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="grid gap-4">
                {dayMenu.almuerzos.map((item, itemIndex) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    userType={userType}
                    index={itemIndex}
                    optionNumber={itemIndex + 1}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Colaciones */}
      {dayMenu.colaciones.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 bg-white dark:bg-slate-800 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                  <Coffee className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                    Colaciones
                  </h3>
                  <div className="flex items-center space-x-3 mt-1">
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                      <Clock className="w-3 h-3 mr-1" />
                      15:30 - 16:30
                    </Badge>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      {dayMenu.colaciones.length} opción{dayMenu.colaciones.length !== 1 ? 'es' : ''} disponible{dayMenu.colaciones.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="grid gap-4">
                {dayMenu.colaciones.map((item, itemIndex) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    userType={userType}
                    index={itemIndex}
                    optionNumber={itemIndex + 1}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Información adicional */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="border-0 bg-gradient-to-r from-slate-50 to-slate-25 dark:from-slate-800/50 dark:to-slate-700/25 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
                  Información importante
                </h4>
                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <p>
                    • Los precios mostrados corresponden a tu tipo de usuario ({userType === 'funcionario' ? 'funcionario' : 'apoderado'}).
                  </p>
                  <p>
                    • Para realizar pedidos, dirígete a la sección &quot;Mi Pedido&quot; desde el panel principal.
                  </p>
                  <p>
                    • Los pedidos deben realizarse hasta el día anterior al servicio.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}