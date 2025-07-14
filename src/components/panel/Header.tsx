"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, LogOut, Bell, Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  user: {
    firstName: string
    lastName: string
    email: string
  }
  onLogout: () => void
}

export function Header({ user, onLogout }: HeaderProps) {
  const [isDarkMode, setIsDarkMode] = useState(false)

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle('dark')
  }

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-6 py-4"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo y título */}
        <div className="flex items-center space-x-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center space-x-3"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">CE</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100 text-clean">
                Casino Escolar
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 text-clean">
                Panel de Pedidos
              </p>
            </div>
          </motion.div>
        </div>

        {/* Bienvenida y controles */}
        <div className="flex items-center space-x-4">
          {/* Mensaje de bienvenida */}
          <div className="hidden md:block text-right">
            <p className="text-sm text-slate-600 dark:text-slate-300 text-clean">
              Hola, <span className="font-medium text-slate-800 dark:text-slate-100">{user.firstName}</span>
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 text-clean">
              {user.email}
            </p>
          </div>

          {/* Controles */}
          <div className="flex items-center space-x-2">
            {/* Toggle tema */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </motion.button>

            {/* Notificaciones */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors relative"
            >
              <Bell size={18} />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </motion.button>

            {/* Perfil */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <User size={18} />
            </motion.button>

            {/* Logout */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={onLogout}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Salir</span>
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.header>
  )
}
