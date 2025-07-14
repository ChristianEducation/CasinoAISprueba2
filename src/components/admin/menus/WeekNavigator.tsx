"use client"
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Calendar, Clock, Users, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { WeekNavigation } from '@/types/adminMenu'

interface WeekNavigatorProps {
  navigation: WeekNavigation
  onNavigate: (direction: 'prev' | 'next') => void
  isLoading?: boolean
}

export function WeekNavigator({ 
  navigation, 
  onNavigate, 
  isLoading = false 
}: WeekNavigatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-gradient-to-r from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 border-slate-200 dark:border-slate-700 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Navigation Controls */}
            <div className="flex items-center justify-between lg:justify-start lg:space-x-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate('prev')}
                disabled={!navigation.canGoBack || isLoading}
                className="flex items-center space-x-2 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Anterior</span>
              </Button>
              
              <div className="flex items-center space-x-3 px-6 py-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div className="text-center">
                  <span className="font-bold text-lg text-slate-900 dark:text-white">
                    {navigation.weekLabel}
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Semana de gestión
                  </p>
                </div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate('next')}
                disabled={!navigation.canGoForward || isLoading}
                className="flex items-center space-x-2 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                <span>Siguiente</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
                <Clock className="w-4 h-4" />
                <span>Tiempo real</span>
              </div>
              
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300">
                <Users className="w-3 h-3 mr-1" />
                Conectado
              </Badge>
              
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300">
                <TrendingUp className="w-3 h-3 mr-1" />
                Sincronizado
              </Badge>
            </div>
          </div>

          {/* Week Status Indicator */}
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <span className="text-slate-600 dark:text-slate-400">Estado de la semana:</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-600 dark:text-green-400 font-medium">Activa</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400">
                <span>Última actualización: hace 2 min</span>
                <span>•</span>
                <span>Usuarios conectados: 247</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}