"use client"

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Navbar } from '@/components/panel/Navbar'
import { GreetingCard } from '@/components/panel/dashboard/GreetingCard'
import { MyOrdersSection } from '@/components/panel/MyOrdersSection'
import { useDashboardData } from '@/hooks/useDashboardData'
import { useOrderStore } from '@/store/orderStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Clock, Phone, Mail, MapPin, Calendar, Users } from 'lucide-react'

export default function PanelPage() {
  const router = useRouter()
  const { dashboardData, isLoading, error } = useDashboardData()
  const { clearSelections } = useOrderStore()

  const handleLogout = async () => {
    try {
      clearSelections()
      router.push('/')
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400 text-clean">
              Cargando panel...
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md mx-auto px-4">
            <Card className="shadow-soft-lg border-0 bg-white dark:bg-slate-800">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 text-elegant mb-2">
                  Error al cargar el panel
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-clean mb-6">
                  {error}
                </p>
                <Button 
                  onClick={() => window.location.reload()}
                  className="flex items-center space-x-2"
                >
                  <RefreshCw size={16} />
                  <span>Reintentar</span>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // No data state
  if (!dashboardData) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Navbar */}
      <Navbar onLogout={handleLogout} />

      {/* Contenido principal con espaciado mejorado */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8 mb-12"
        >
          {/* Saludo personalizado */}
          <GreetingCard user={dashboardData.user} />

          {/* Sección de Mis Pedidos */}
          <MyOrdersSection user={dashboardData.user} />
        </motion.div>

        {/* Información adicional - Tarjetas organizadas y compactas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Horarios de Servicio - Versión compacta */}
          <motion.div
            whileHover={{ y: -2, scale: 1.01 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="group h-full"
          >
            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-50 via-emerald-25 to-teal-50 dark:from-emerald-950/40 dark:via-emerald-900/30 dark:to-teal-950/40 shadow-xl hover:shadow-2xl transition-all duration-500 backdrop-blur-sm h-full">
              {/* Decorative background elements */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-200/30 to-teal-200/30 dark:from-emerald-800/20 dark:to-teal-800/20 rounded-full blur-xl transform translate-x-12 -translate-y-12 group-hover:scale-110 transition-transform duration-700"></div>
              <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-emerald-300/20 to-teal-300/20 dark:from-emerald-700/15 dark:to-teal-700/15 rounded-full blur-lg transform -translate-x-10 translate-y-10 group-hover:scale-110 transition-transform duration-700"></div>
              
              <CardContent className="relative p-6 h-full flex flex-col">
                {/* Header compacto */}
                <div className="flex items-center gap-3 mb-6">
                  <motion.div 
                    className="relative p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg group-hover:shadow-xl transition-all duration-300"
                    whileHover={{ rotate: 5, scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Clock className="w-5 h-5 text-white" />
                  </motion.div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                      Horarios de Servicio
                    </h3>
                    <p className="text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                      Servicios disponibles
                    </p>
                  </div>
                </div>

                {/* Horarios compactos */}
                <div className="space-y-3 flex-1">
                  <motion.div 
                    className="group/item flex justify-between items-center p-4 bg-white/80 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-emerald-100/50 dark:border-emerald-800/30 hover:bg-white/90 dark:hover:bg-slate-800/80 transition-all duration-300"
                    whileHover={{ x: 2 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"></div>
                      <span className="text-slate-700 dark:text-slate-300 font-semibold text-sm">Almuerzo</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-lg text-slate-800 dark:text-slate-100">
                        12:00 - 14:00
                      </span>
                    </div>
                  </motion.div>

                  <motion.div 
                    className="group/item flex justify-between items-center p-4 bg-white/80 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-emerald-100/50 dark:border-emerald-800/30 hover:bg-white/90 dark:hover:bg-slate-800/80 transition-all duration-300"
                    whileHover={{ x: 2 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full"></div>
                      <span className="text-slate-700 dark:text-slate-300 font-semibold text-sm">Colación</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-lg text-slate-800 dark:text-slate-100">
                        15:30 - 16:30
                      </span>
                    </div>
                  </motion.div>
                </div>

                {/* Footer compacto */}
                <div className="mt-4 p-3 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/5 dark:to-teal-500/5 rounded-xl border border-emerald-200/30 dark:border-emerald-700/30">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                      Lunes a viernes
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Contacto - Versión compacta */}
          <motion.div
            whileHover={{ y: -2, scale: 1.01 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="group h-full"
          >
            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-50 via-violet-25 to-indigo-50 dark:from-purple-950/40 dark:via-violet-900/30 dark:to-indigo-950/40 shadow-xl hover:shadow-2xl transition-all duration-500 backdrop-blur-sm h-full">
              {/* Decorative background elements */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-200/30 to-indigo-200/30 dark:from-purple-800/20 dark:to-indigo-800/20 rounded-full blur-xl transform translate-x-12 -translate-y-12 group-hover:scale-110 transition-transform duration-700"></div>
              <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-violet-300/20 to-purple-300/20 dark:from-violet-700/15 dark:to-purple-700/15 rounded-full blur-lg transform -translate-x-10 translate-y-10 group-hover:scale-110 transition-transform duration-700"></div>
              
              <CardContent className="relative p-6 h-full flex flex-col">
                {/* Header compacto */}
                <div className="flex items-center gap-3 mb-6">
                  <motion.div 
                    className="relative p-3 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 shadow-lg group-hover:shadow-xl transition-all duration-300"
                    whileHover={{ rotate: -5, scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Phone className="w-5 h-5 text-white" />
                  </motion.div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                      Contacto
                    </h3>
                    <p className="text-purple-600 dark:text-purple-400 text-xs font-medium">
                      Estamos aquí para ayudarte
                    </p>
                  </div>
                </div>

                {/* Información de contacto compacta */}
                <div className="space-y-3 flex-1">
                  <motion.div 
                    className="group/item p-4 bg-white/80 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-purple-100/50 dark:border-purple-800/30 hover:bg-white/90 dark:hover:bg-slate-800/80 transition-all duration-300"
                    whileHover={{ x: 2 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 dark:from-purple-500/5 dark:to-indigo-500/5 rounded-lg">
                        <Phone className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-600 dark:text-slate-400 text-xs font-medium">Teléfono</p>
                        <p className="font-bold text-slate-800 dark:text-slate-100 truncate">
                          +56 2 2345 6789
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div 
                    className="group/item p-4 bg-white/80 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-purple-100/50 dark:border-purple-800/30 hover:bg-white/90 dark:hover:bg-slate-800/80 transition-all duration-300"
                    whileHover={{ x: 2 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 dark:from-purple-500/5 dark:to-indigo-500/5 rounded-lg">
                        <Mail className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-600 dark:text-slate-400 text-xs font-medium">Email</p>
                        <p className="font-bold text-slate-800 dark:text-slate-100 truncate">
                          casino@colegio.cl
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div 
                    className="group/item p-4 bg-white/80 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-purple-100/50 dark:border-purple-800/30 hover:bg-white/90 dark:hover:bg-slate-800/80 transition-all duration-300"
                    whileHover={{ x: 2 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 dark:from-purple-500/5 dark:to-indigo-500/5 rounded-lg">
                        <MapPin className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-600 dark:text-slate-400 text-xs font-medium">Ubicación</p>
                        <p className="font-bold text-slate-800 dark:text-slate-100 truncate">
                          Casino Escolar
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Footer compacto */}
                <div className="mt-4 p-3 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 dark:from-purple-500/5 dark:to-indigo-500/5 rounded-xl border border-purple-200/30 dark:border-purple-700/30">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <p className="text-xs text-purple-800 dark:text-purple-300 font-medium">
                      Equipo disponible para consultas
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}