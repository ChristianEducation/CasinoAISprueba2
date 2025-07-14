"use client"
import { motion } from 'framer-motion'
import { Plus, Calendar, Clock, ChefHat } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AdminDayMenu, AdminMenuItem } from '@/types/adminMenu'
import { MenuItemCard } from './MenuItemCard'
import { formatDateShort } from '@/lib/utils'

interface DayMenuContainerProps {
  dayMenu: AdminDayMenu
  onAddItem: (type: 'almuerzo' | 'colacion') => void
  onEditItem: (item: AdminMenuItem) => void
  onDeleteItem: (item: AdminMenuItem) => void
  isLoading?: boolean
}

export function DayMenuContainer({ 
  dayMenu, 
  onAddItem, 
  onEditItem, 
  onDeleteItem,
  isLoading = false 
}: DayMenuContainerProps) {
  const totalItems = dayMenu.almuerzos.length + dayMenu.colaciones.length
  const activeItems = [...dayMenu.almuerzos, ...dayMenu.colaciones].filter(item => item.active).length

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="h-full admin-card-container menu-card-compact"
    >
      <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 h-full flex flex-col shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
        <CardHeader className="pb-3 flex-shrink-0 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <div className="p-1.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex-shrink-0">
                <Calendar className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-white capitalize text-truncate-1">
                  {dayMenu.dayName}
                </CardTitle>
                <p className="text-xs text-slate-600 dark:text-slate-400 text-truncate-1">
                  {formatDateShort(dayMenu.date)}
                </p>
              </div>
            </div>
            
            {totalItems > 0 && (
              <div className="flex items-center space-x-1 flex-shrink-0">
                <Badge 
                  variant="secondary" 
                  className="text-xs bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                >
                  {activeItems}/{totalItems}
                </Badge>
                {!dayMenu.isEditable && (
                  <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                    Solo lectura
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-3 ultra-compact-spacing overflow-hidden admin-card-content">
          {/* Sección de Almuerzos */}
          <div className="compact-spacing flex-1 min-h-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 min-w-0 flex-1">
                <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded flex-shrink-0">
                  <ChefHat className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xs font-semibold text-blue-700 dark:text-blue-300 text-truncate-1">
                  Almuerzos
                </h3>
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200 flex-shrink-0">
                  {dayMenu.almuerzos.length}
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAddItem('almuerzo')}
                disabled={isLoading || !dayMenu.isEditable}
                className="h-6 px-2 text-xs hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 flex-shrink-0"
              >
                <Plus className="w-3 h-3 mr-0.5" />
                +
              </Button>
            </div>
            
            <div className="compact-spacing overflow-y-auto max-h-44 scroll-container scroll-smooth-custom">
              {dayMenu.almuerzos.length > 0 ? (
                dayMenu.almuerzos.map((item, index) => (
                  <div key={item.id || index} className="w-full admin-card-container">
                    <MenuItemCard
                      item={item}
                      optionNumber={index + 1}
                      onEdit={onEditItem}
                      onDelete={onDeleteItem}
                      isLoading={isLoading}
                    />
                  </div>
                ))
              ) : (
                <div className="p-3 border-2 border-dashed border-blue-200 dark:border-blue-800 rounded-lg text-center bg-blue-50/30 dark:bg-blue-900/10">
                  <ChefHat className="w-6 h-6 text-blue-400 mx-auto mb-1" />
                  <p className="text-xs text-blue-600 dark:text-blue-400 mb-1 font-medium">
                    Sin almuerzos
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onAddItem('almuerzo')}
                    disabled={isLoading || !dayMenu.isEditable}
                    className="h-6 px-2 text-xs text-blue-600 hover:bg-blue-100"
                  >
                    <Plus className="w-3 h-3 mr-0.5" />
                    Agregar
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Separador más delgado */}
          <div className="border-t border-slate-200 dark:border-slate-700 flex-shrink-0 my-2"></div>

          {/* Sección de Colaciones */}
          <div className="compact-spacing flex-1 min-h-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 min-w-0 flex-1">
                <div className="p-1 bg-emerald-100 dark:bg-emerald-900/30 rounded flex-shrink-0">
                  <Clock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 text-truncate-1">
                  Colaciones
                </h3>
                <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-600 border-emerald-200 flex-shrink-0">
                  {dayMenu.colaciones.length}
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAddItem('colacion')}
                disabled={isLoading || !dayMenu.isEditable}
                className="h-6 px-2 text-xs hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 flex-shrink-0"
              >
                <Plus className="w-3 h-3 mr-0.5" />
                +
              </Button>
            </div>
            
            <div className="compact-spacing overflow-y-auto max-h-44 scroll-container scroll-smooth-custom">
              {dayMenu.colaciones.length > 0 ? (
                dayMenu.colaciones.map((item, index) => (
                  <div key={item.id || index} className="w-full admin-card-container">
                    <MenuItemCard
                      item={item}
                      optionNumber={index + 1}
                      onEdit={onEditItem}
                      onDelete={onDeleteItem}
                      isLoading={isLoading}
                    />
                  </div>
                ))
              ) : (
                <div className="p-3 border-2 border-dashed border-emerald-200 dark:border-emerald-800 rounded-lg text-center bg-emerald-50/30 dark:bg-emerald-900/10">
                  <Clock className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1 font-medium">
                    Sin colaciones
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onAddItem('colacion')}
                    disabled={isLoading || !dayMenu.isEditable}
                    className="h-6 px-2 text-xs text-emerald-600 hover:bg-emerald-100"
                  >
                    <Plus className="w-3 h-3 mr-0.5" />
                    Agregar
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}