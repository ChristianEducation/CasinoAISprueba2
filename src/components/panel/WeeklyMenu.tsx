"use client"

import { motion } from 'framer-motion'
import { Calendar, Clock, CheckCircle2, Circle } from 'lucide-react'
import { DayMenu, MenuItem } from '@/types/panel'
import { useOrderStore } from '@/store/orderStore'
import { format, isToday, isPast, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

interface WeeklyMenuProps {
  weekMenu: DayMenu[]
  isLoading: boolean
}

export function WeeklyMenu({ weekMenu, isLoading }: WeeklyMenuProps) {
  const { selections, updateSelection } = useOrderStore()

  const getSelectionForDate = (date: string) => {
    return selections.find(s => s.date === date)
  }

  const handleMenuSelection = (date: string, type: 'almuerzo' | 'colacion', item: MenuItem) => {
    updateSelection(date, type, item)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-48 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded mb-4 animate-pulse"></div>
              <div className="space-y-3">
                <div className="h-20 bg-slate-100 dark:bg-slate-700 rounded animate-pulse"></div>
                <div className="h-20 bg-slate-100 dark:bg-slate-700 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center">
          <Calendar className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 text-clean">
            Menú de la Semana
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 text-clean">
            Selecciona tus opciones para cada día
          </p>
        </div>
      </div>

      {/* Menú por días */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {weekMenu.map((dayMenu, index) => {
          const dayDate = parseISO(dayMenu.date)
          const isPastDay = isPast(dayDate) && !isToday(dayDate)
          const selection = getSelectionForDate(dayMenu.date)

          return (
            <motion.div
              key={dayMenu.date}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-white dark:bg-slate-800 rounded-xl p-4 border transition-all duration-300 ${
                isPastDay 
                  ? 'border-slate-200 dark:border-slate-700 opacity-50' 
                  : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg'
              }`}
            >
              {/* Header del día */}
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-slate-800 dark:text-slate-100 text-clean">
                    {dayMenu.day}
                  </h3>
                  {isToday(dayDate) && (
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs rounded-full">
                      Hoy
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 text-clean">
                  {format(dayDate, 'dd MMM', { locale: es })}
                </p>
              </div>

              {isPastDay ? (
                <div className="text-center py-8">
                  <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-500 dark:text-slate-400 text-clean">
                    Día pasado
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Almuerzos */}
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 text-clean">
                      Almuerzo
                    </h4>
                    <div className="space-y-2">
                      {dayMenu.almuerzos.map((item) => (
                        <MenuItemCard
                          key={item.id}
                          item={item}
                          isSelected={selection?.almuerzo?.id === item.id}
                          onSelect={() => handleMenuSelection(dayMenu.date, 'almuerzo', item)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Colaciones */}
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 text-clean">
                      Colación
                    </h4>
                    <div className="space-y-2">
                      {dayMenu.colaciones.map((item) => (
                        <MenuItemCard
                          key={item.id}
                          item={item}
                          isSelected={selection?.colacion?.id === item.id}
                          onSelect={() => handleMenuSelection(dayMenu.date, 'colacion', item)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

interface MenuItemCardProps {
  item: MenuItem
  isSelected: boolean
  onSelect: () => void
}

function MenuItemCard({ item, isSelected, onSelect }: MenuItemCardProps) {
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
        isSelected
          ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
          : 'border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 hover:border-slate-300 dark:hover:border-slate-500'
      }`}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-1">
          {isSelected ? (
            <CheckCircle2 className="w-4 h-4 text-blue-500 dark:text-blue-400" />
          ) : (
            <Circle className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-600 px-2 py-1 rounded">
              {item.code}
            </span>
          </div>
          <h5 className="text-sm font-medium text-slate-800 dark:text-slate-100 text-clean mb-1">
            {item.name}
          </h5>
          <p className="text-xs text-slate-600 dark:text-slate-400 text-clean line-clamp-2">
            {item.description}
          </p>
        </div>
      </div>
    </motion.div>
  )
}
