"use client"

import { motion } from 'framer-motion'
import { BookOpen, ShoppingCart, User, ArrowRight, CreditCard } from 'lucide-react'
import Link from 'next/link'

interface QuickAction {
  title: string
  description: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
  isExternal?: boolean
}

const quickActions: QuickAction[] = [
  {
    title: 'Ver menú semanal',
    description: 'Revisa las opciones disponibles',
    href: '/menu',
    icon: BookOpen,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50'
  },
  {
    title: 'Realizar pedido',
    description: 'Gestiona tus selecciones',
    href: '/mi-pedido',
    icon: ShoppingCart,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30 hover:bg-emerald-200 dark:hover:bg-emerald-900/50'
  },
  {
    title: 'Mi perfil',
    description: 'Actualiza tu información',
    href: '/perfil',
    icon: User,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50'
  },
  {
    title: 'Historial de pagos',
    description: 'Revisa tus transacciones',
    href: '/panel#historial',
    icon: CreditCard,
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-200 dark:hover:bg-indigo-900/50'
  }
]

export function QuickActionsCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="panel-card"
    >
      <div className="panel-card-content">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
            <ArrowRight className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 text-clean">
              Acciones Rápidas
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-clean">
              Accesos destacados
            </p>
          </div>
        </div>

        {/* Acciones en grid */}
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action, index) => {
            const Icon = action.icon
            const ActionComponent = action.isExternal ? 'a' : Link
            const actionProps = action.isExternal 
              ? { href: action.href, target: '_blank', rel: 'noopener noreferrer' }
              : { href: action.href }

            return (
              <motion.div
                key={`${action.title}-${index}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <ActionComponent {...actionProps}>
                  <div className={`p-4 rounded-lg border border-slate-200 dark:border-slate-600 transition-all duration-200 cursor-pointer ${action.bgColor}`}>
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${action.bgColor}`}>
                        <Icon className={`w-5 h-5 ${action.color}`} />
                      </div>
                      <div>
                        <h4 className={`font-medium text-sm ${action.color} text-clean`}>
                          {action.title}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 text-clean mt-1">
                          {action.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </ActionComponent>
              </motion.div>
            )
          })}
        </div>

        {/* Información adicional */}
        <div className="mt-6 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
          <p className="text-xs text-slate-600 dark:text-slate-400 text-center text-clean">
            ¿Necesitas ayuda? Contacta al equipo de soporte en{' '}
            <a 
              href="mailto:casino@colegio.cl" 
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              casino@colegio.cl
            </a>
          </p>
        </div>
      </div>
    </motion.div>
  )
}