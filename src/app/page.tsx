"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"

export default function HomePage() {
  const [mounted, setMounted] = useState(false)
  const { theme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0">
        {/* Soft geometric shapes */}
        <motion.div
          className="absolute top-10 right-10 w-64 h-64 bg-gradient-to-br from-blue-100/30 to-indigo-100/30 dark:from-blue-900/15 dark:to-indigo-900/15 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        <motion.div
          className="absolute bottom-10 left-10 w-56 h-56 bg-gradient-to-br from-emerald-100/30 to-teal-100/30 dark:from-emerald-900/15 dark:to-teal-900/15 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 py-8">
        
        {/* Logo Section */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Logo */}
          <motion.div
            className="flex justify-center mb-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
            whileHover={{ scale: 1.03 }}
          >
            <div className="relative w-48 h-28 sm:w-56 sm:h-32 md:w-64 md:h-36 lg:w-72 lg:h-40">
              <Image
                src="/logo-colores.png"
                alt="Casino Escolar"
                fill
                className={`object-contain transition-all duration-500 ${
                  theme === 'dark' 
                    ? 'brightness-125 contrast-125 saturate-110 drop-shadow-[0_0_20px_rgba(255,255,255,0.25)]' 
                    : 'invert brightness-90 contrast-110 saturate-105 drop-shadow-[0_0_15px_rgba(0,0,0,0.12)]'
                }`}
                priority
              />
            </div>
          </motion.div>

          {/* Elegant separator */}
          <motion.div
            className="flex items-center justify-center mb-4"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
          >
            <div className="w-8 h-px bg-slate-300 dark:bg-slate-600" />
            <div className="mx-3 w-2 h-2 bg-emerald-400 dark:bg-emerald-500 rounded-full" />
            <div className="w-8 h-px bg-slate-300 dark:bg-slate-600" />
          </motion.div>

          {/* Subtitle */}
          <motion.p
            className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed font-light"
            style={{
              fontFamily: "'Inter', sans-serif",
            }}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
          >
            Gestión inteligente de alimentación escolar
            <br />
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Nutrición • Organización • Bienestar</span>
          </motion.p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
        >
          {/* Login Button */}
          <Link href="/auth/login">
            <motion.div
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group"
            >
              <Button
                size="lg"
                className="px-8 py-3 text-base font-medium bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-0"
                style={{
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Iniciar Sesión
                <motion.div
                  className="ml-2 w-4 h-4"
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  →
                </motion.div>
              </Button>
            </motion.div>
          </Link>

          {/* Register Button */}
          <Link href="/auth/registro">
            <motion.div
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group"
            >
              <Button
                size="lg"
                variant="outline"
                className="px-8 py-3 text-base font-medium bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-2 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 hover:border-emerald-300 dark:hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                style={{
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Crear Cuenta
                <motion.div
                  className="ml-2 w-4 h-4"
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  +
                </motion.div>
              </Button>
            </motion.div>
          </Link>
        </motion.div>

        {/* Feature highlights - Compact */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8, ease: "easeOut" }}
        >
          {/* Feature 1 */}
          <motion.div
            className="text-center group"
            whileHover={{ y: -3, scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/50 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:shadow-lg transition-all duration-300">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-2">Gestión Simple</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Administra menús y pedidos de forma intuitiva
            </p>
          </motion.div>

          {/* Feature 2 */}
          <motion.div
            className="text-center group"
            whileHover={{ y: -3, scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/50 dark:to-emerald-800/50 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:shadow-lg transition-all duration-300">
              <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-2">Alimentación Saludable</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Promovemos hábitos nutricionales balanceados
            </p>
          </motion.div>

          {/* Feature 3 */}
          <motion.div
            className="text-center group"
            whileHover={{ y: -3, scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/50 dark:to-amber-800/50 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:shadow-lg transition-all duration-300">
              <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-2">Comunidad Educativa</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Conecta familias, estudiantes y administración
            </p>
          </motion.div>
        </motion.div>

        {/* Bottom accent - Compact */}
        <motion.div
          className="mt-6 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.0 }}
        >
          <motion.div
            className="flex items-center justify-center space-x-2 text-slate-400 dark:text-slate-500 text-xs"
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="w-1 h-1 bg-slate-400 dark:bg-slate-500 rounded-full" />
            <span style={{ fontFamily: "'Inter', sans-serif" }}>Sistema de gestión educativa</span>
            <div className="w-1 h-1 bg-slate-400 dark:bg-slate-500 rounded-full" />
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}