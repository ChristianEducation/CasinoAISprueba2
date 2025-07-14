"use client"

import { motion } from 'framer-motion'
import { Crown, GraduationCap } from 'lucide-react'
import { DashboardUser } from '@/types/dashboard'
import { getGreetingMessage, getUserTypeLabel, getUserTypeBadgeColor } from '@/lib/dashboardUtils'

interface GreetingCardProps {
  user: DashboardUser
}

export function GreetingCard({ user }: GreetingCardProps) {
  const greeting = getGreetingMessage(user.firstName)
  const userTypeLabel = getUserTypeLabel(user.userType)
  const badgeColor = getUserTypeBadgeColor(user.userType)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="panel-card overflow-hidden relative"
    >
      {/* Fondo decorativo */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-emerald-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-700"></div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-emerald-100 dark:from-blue-900/20 dark:to-emerald-900/20 rounded-full -translate-y-16 translate-x-16 opacity-50"></div>
      
      <div className="panel-card-content relative">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Saludo principal */}
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 text-elegant mb-2"
            >
              {greeting}
            </motion.h1>
            
            {/* Información del usuario */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-2"
            >
              <p className="text-slate-600 dark:text-slate-400 text-clean">
                Bienvenido a tu panel de Casino Escolar
              </p>
              
              <div className="flex items-center space-x-3">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badgeColor}`}>
                  {user.userType === 'funcionario' ? (
                    <Crown className="w-4 h-4 mr-1.5" />
                  ) : (
                    <GraduationCap className="w-4 h-4 mr-1.5" />
                  )}
                  {userTypeLabel}
                </span>
                
                <span className="text-sm text-slate-500 dark:text-slate-400 text-clean">
                  {user.email}
                </span>
              </div>

              {/* Información de hijos para apoderados */}
              {user.userType === 'apoderado' && user.children && user.children.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-3 p-3 bg-white/50 dark:bg-slate-700/50 rounded-lg border border-slate-200/50 dark:border-slate-600/50"
                >
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 text-clean mb-1">
                    Estudiantes a cargo:
                  </p>
                  <div className="space-y-1">
                    {user.children.map((child) => (
                      <div key={child.id} className="flex items-center justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400 text-clean">
                          {child.name}
                        </span>
                        <span className="text-slate-500 dark:text-slate-500 text-clean">
                          {child.class} - {child.level === 'Pre School' || child.level === 'Lower School' ? 'Básica' : 'Media'}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* Avatar del usuario */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex-shrink-0 ml-4"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl text-clean">
                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}