"use client"
import { motion } from 'framer-motion'
import { useTheme } from 'next-themes'
import { 
  Crown, 
  Sun, 
  Moon, 
  RefreshCw, 
  Calendar,
  Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AdminUser } from '@/types/admin'
import { getAdminGreeting, formatAdminDate, formatAdminTime } from '@/lib/adminUtils'

interface AdminHeaderProps {
  adminUser: AdminUser
  lastUpdated: Date
  onRefresh: () => void
  isRefreshing?: boolean
}

export function AdminHeader({ 
  adminUser, 
  lastUpdated, 
  onRefresh, 
  isRefreshing = false 
}: AdminHeaderProps) {
  const { theme, setTheme } = useTheme()
  const currentDate = new Date()

  return (
    <motion.div 
      className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Información principal */}
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
                  Panel Administrativo
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  Resumen del estado actual del sistema
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>{formatAdminDate(currentDate)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>{formatAdminTime(currentDate)}</span>
              </div>
            </div>
          </div>

          {/* Información del administrador y controles */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            {/* Saludo personalizado */}
            <div className="text-right">
              <p className="text-lg font-semibold text-slate-900 dark:text-white">
                {getAdminGreeting(adminUser.firstName)}
              </p>
              <div className="flex items-center space-x-2">
                <Badge 
                  variant="secondary" 
                  className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                >
                  <Crown className="w-3 h-3 mr-1" />
                  {adminUser.role === 'super_admin' ? 'Super Admin' : 'Administrador'}
                </Badge>
              </div>
            </div>

            {/* Controles */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Actualizar</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Última actualización */}
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Última actualización: {formatAdminTime(lastUpdated)} - {formatAdminDate(lastUpdated)}
          </p>
        </div>
      </div>
    </motion.div>
  )
}
