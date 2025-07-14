"use client"
import { motion } from 'framer-motion'
import { 
  Users, 
  Download, 
  RefreshCw, 
  Search
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UserStats } from '@/types/adminUser'

interface UsersHeaderProps {
  userStats: UserStats | null
  searchTerm: string
  onSearchChange: (value: string) => void
  onRefresh: () => void
  onExport: () => void
  isRefreshing: boolean
}

export function UsersHeader({ 
  userStats, 
  searchTerm, 
  onSearchChange, 
  onRefresh, 
  onExport,
  isRefreshing 
}: UsersHeaderProps) {
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
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
                  Gestión de Usuarios
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  Visualiza y administra todos los usuarios registrados
                </p>
              </div>
            </div>
            
            {userStats && (
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{userStats.totalUsers} usuarios</span>
                  <span>•</span>
                  <span>{userStats.apoderados} apoderados</span>
                  <span>•</span>
                  <span>{userStats.funcionarios} funcionarios</span>
                  <span>•</span>
                  <span>{userStats.estudiantes} estudiantes</span>
                  <span>•</span>
                  <span>{userStats.admins} administradores</span>
                </div>
              </div>
            )}
          </div>

          {/* Controles */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            {/* Búsqueda */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Buscar por nombre o correo..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600"
              />
            </div>

            {/* Botones de acción */}
            <div className="flex items-center space-x-2">
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
              
              <Button
                variant="outline"
                size="sm"
                onClick={onExport}
                className="flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Exportar</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}