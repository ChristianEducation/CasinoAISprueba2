"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle, 
  Zap, 
  CalendarX,
  Menu as MenuIcon,
  X,
  ChevronRight,
  Utensils,
  Coffee
} from 'lucide-react'
import useAuth from '@/hooks/useAuth'
import { useWeeklyMenuData } from '@/hooks/useWeeklyMenuData'
import { Navbar } from '@/components/panel/Navbar'
import { DayMenuCard } from '@/components/menu/DayMenuCard'
import { MenuSkeleton } from '@/components/menu/MenuSkeleton'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export default function MenuPage() {
  const router = useRouter()
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()
  const { 
    weekMenu, 
    isLoading, 
    error, 
    weekInfo, 
    refetch 
  } = useWeeklyMenuData({ 
    user, 
    useAdminData: false
  })

  const [selectedDayIndex, setSelectedDayIndex] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Redireccionar si no está autenticado
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [authLoading, isAuthenticated, router])

  // Seleccionar día actual por defecto
  useEffect(() => {
    if (weekMenu.length > 0) {
      const today = new Date().toISOString().split('T')[0]
      const todayIndex = weekMenu.findIndex(day => day.date === today)
      if (todayIndex !== -1) {
        setSelectedDayIndex(todayIndex)
      }
    }
  }, [weekMenu])

  const handleLogout = async () => {
    try {
      router.push('/')
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  const getDayStatus = (dayMenu: { date: string }) => {
    const today = new Date().toISOString().split('T')[0]
    if (dayMenu.date === today) return 'today'
    if (dayMenu.date < today) return 'past'
    return 'future'
  }

  const getDayIcon = (index: number) => {
    return index < 5 ? <Utensils className="w-4 h-4" /> : <Coffee className="w-4 h-4" />
  }

  // Loading state para autenticación
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400 text-clean">
              Verificando autenticación...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const selectedDay = weekMenu[selectedDayIndex]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar onLogout={handleLogout} />

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <div className={cn(
          "fixed inset-y-0 left-0 z-50 w-80 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="flex flex-col h-full">
            {/* Header del sidebar */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Menú Semanal
                  </h2>
                  {weekInfo && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      {weekInfo.weekLabel}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Badges de información */}
              <div className="flex flex-wrap gap-2 mt-4">
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Publicado
                </Badge>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                  {user.tipoUsuario === 'funcionario' ? 'Funcionario' : 'Apoderado'}
                </Badge>
              </div>
            </div>

            {/* Lista de días */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(7)].map((_, i) => (
                    <div key={i} className="h-16 bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : weekMenu.length > 0 ? (
                weekMenu.map((dayMenu, index) => {
                  const status = getDayStatus(dayMenu)
                  const isSelected = selectedDayIndex === index
                  
                  return (
                    <motion.button
                      key={dayMenu.date}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => {
                        setSelectedDayIndex(index)
                        setSidebarOpen(false)
                      }}
                      className={cn(
                        "w-full p-4 rounded-lg border text-left transition-all duration-200 hover:shadow-md",
                        isSelected
                          ? "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 shadow-sm"
                          : "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600",
                        status === 'past' && "opacity-60"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center",
                            status === 'today'
                              ? "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400"
                              : status === 'past'
                              ? "bg-slate-100 dark:bg-slate-600 text-slate-500 dark:text-slate-400"
                              : "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400"
                          )}>
                            {getDayIcon(index)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-medium text-slate-900 dark:text-slate-100 truncate">
                                {dayMenu.dayLabel}
                              </h3>
                              {status === 'today' && (
                                <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs">
                                  Hoy
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                              {dayMenu.dateFormatted}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              {dayMenu.hasItems ? (
                                <>
                                  {dayMenu.almuerzos.length > 0 && (
                                    <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                                      {dayMenu.almuerzos.length} almuerzo{dayMenu.almuerzos.length !== 1 ? 's' : ''}
                                    </span>
                                  )}
                                  {dayMenu.colaciones.length > 0 && (
                                    <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                                      {dayMenu.colaciones.length} colación{dayMenu.colaciones.length !== 1 ? 'es' : ''}
                                    </span>
                                  )}
                                </>
                              ) : (
                                <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">
                                  Sin menú
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {isSelected && (
                          <ChevronRight className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        )}
                      </div>
                    </motion.button>
                  )
                })
              ) : (
                <div className="text-center py-8">
                  <CalendarX className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    No hay menús disponibles
                  </p>
                </div>
              )}
            </div>

            {/* Footer del sidebar */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Almuerzo:</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    ${user.tipoUsuario === 'funcionario' ? '4.875' : '5.500'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Colación:</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    ${user.tipoUsuario === 'funcionario' ? '4.875' : '5.500'}
                  </span>
                </div>
                <Button
                  onClick={() => router.push('/mi-pedido')}
                  className="w-full mt-3"
                  size="sm"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Hacer Pedido
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Overlay para móvil */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Contenido principal */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header del contenido principal */}
          <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden"
                >
                  <MenuIcon className="w-4 h-4" />
                </Button>
                <div>
                  <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                    {selectedDay ? selectedDay.dayLabel : 'Selecciona un día'}
                  </h1>
                  {selectedDay && (
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {selectedDay.dateFormatted}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refetch}
                  disabled={isLoading}
                >
                  <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/panel')}
                >
                  Volver al Panel
                </Button>
              </div>
            </div>
          </div>

          {/* Contenido del día seleccionado */}
          <div className="flex-1 overflow-y-auto p-6">
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <MenuSkeleton />
                </motion.div>
              ) : error ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Alert variant="destructive" className="max-w-2xl mx-auto">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                      <span>{error}</span>
                      <Button variant="outline" size="sm" onClick={refetch} className="ml-4">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Reintentar
                      </Button>
                    </AlertDescription>
                  </Alert>
                </motion.div>
              ) : weekMenu.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="max-w-2xl mx-auto"
                >
                  <Card className="shadow-soft-lg border-0 bg-white dark:bg-slate-800">
                    <CardContent className="p-12 text-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-800/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <CalendarX className="w-10 h-10 text-amber-600 dark:text-amber-400" />
                      </div>
                      <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-3">
                        Menú no disponible
                      </h2>
                      <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed mb-8">
                        El menú para esta semana aún no ha sido publicado.
                        Por favor, vuelve a consultar más tarde.
                      </p>
                      <Button onClick={refetch} className="flex items-center space-x-2 px-6 py-3">
                        <RefreshCw size={18} />
                        <span>Verificar</span>
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : selectedDay ? (
                <motion.div
                  key={`day-${selectedDayIndex}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="max-w-4xl mx-auto"
                >
                  <DayMenuCard
                    dayMenu={selectedDay}
                    userType={user.tipoUsuario}
                    index={selectedDayIndex}
                  />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}