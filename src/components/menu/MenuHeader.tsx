"use client"

import { motion } from 'framer-motion'
import { ArrowLeft, Calendar, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface MenuHeaderProps {
  weekRange: string
  isLoading: boolean
  onRefresh: () => void
}

export function MenuHeader({ weekRange, isLoading, onRefresh }: MenuHeaderProps) {
  const router = useRouter()

  const handleBackToPanel = () => {
    router.push('/panel')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 mb-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Título y navegación */}
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBackToPanel}
            className="flex items-center space-x-2 text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Volver al Panel</span>
            <span className="sm:hidden">Volver</span>
          </Button>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>

          <div>
            <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 text-clean">
              Menú Semanal
            </h1>
            <div className="flex items-center space-x-2 mt-1">
              <Calendar size={16} className="text-slate-500 dark:text-slate-400" />
              <p className="text-sm text-slate-600 dark:text-slate-400 text-clean">
                {weekRange || 'Cargando fechas...'}
              </p>
            </div>
          </div>
        </div>

        {/* Controles */}
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center space-x-2"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            <span>Actualizar</span>
          </Button>
        </div>
      </div>

      {/* Descripción */}
      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-800 dark:text-blue-300 text-clean">
          Consulta el menú disponible para esta semana. Los precios pueden variar según tu tipo de usuario.
          Para realizar pedidos, dirígete a la sección &ldquo;Mi Pedido&rdquo; desde el panel principal.
        </p>
      </div>
    </motion.div>
  )
}
