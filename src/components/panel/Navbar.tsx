"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import Image from 'next/image'
import { 
  User, 
  LogOut, 
  Sun, 
  Moon, 
  Menu, 
  X, 
  ChevronDown,
  ShoppingCart,
  BookOpen,
  UserCircle,
  LayoutDashboard
} from 'lucide-react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/app/lib/firebase'

interface NavbarUser {
  id: string
  firstName: string
  lastName: string
  email: string
  userType: 'funcionario' | 'estudiante'
  children?: Array<{
    id: string
    name: string
    age: number
    class: string
    level: 'basico' | 'medio'
  }>
}

interface NavbarProps {
  onLogout?: () => void
}

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  description: string
}

const navigationItems: NavigationItem[] = [
  {
    name: 'Panel',
    href: '/panel',
    icon: LayoutDashboard,
    description: 'Vista general y resumen'
  },
  {
    name: 'Menú',
    href: '/menu',
    icon: BookOpen,
    description: 'Menú semanal disponible'
  },
  {
    name: 'Hacer Pedido',
    href: '/mi-pedido',
    icon: ShoppingCart,
    description: 'Gestionar pedido semanal'
  },
  {
    name: 'Perfil',
    href: '/perfil',
    icon: UserCircle,
    description: 'Información personal'
  }
]

export function Navbar({ onLogout }: NavbarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [user, setUser] = useState<NavbarUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Verificar si el componente está montado (para evitar hydration issues)
  useEffect(() => {
    setMounted(true)
  }, [])

  // Verificar autenticación y cargar datos del usuario
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
          if (userDoc.exists()) {
            const userData = userDoc.data() as NavbarUser
            setUser({
              ...userData,
              id: firebaseUser.uid
            })
          } else {
            // Usuario no encontrado en Firestore, redirigir al registro
            router.push('/auth/registro')
          }
        } catch (error) {
          console.error('Error al obtener datos del usuario:', error)
          router.push('/auth/login')
        }
      } else {
        // No hay usuario autenticado, redirigir al login
        router.push('/auth/login')
      }
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [router])

  const handleLogout = async () => {
    try {
      await signOut(auth)
      if (onLogout) {
        onLogout()
      }
      router.push('/')
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen)
  }

  // Cerrar menús al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = () => {
      setIsUserMenuOpen(false)
      setIsMobileMenuOpen(false)
    }

    if (isUserMenuOpen || isMobileMenuOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [isUserMenuOpen, isMobileMenuOpen])

  // Determinar el tipo de usuario para mostrar
  const getUserTypeLabel = () => {
    if (!user) return ''
    return user.userType === 'funcionario' ? 'Funcionario' : 'Apoderado'
  }

  const getUserTypeColor = () => {
    if (!user) return 'bg-slate-100 text-slate-600'
    return user.userType === 'funcionario' 
      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
  }

  // Verificar si una ruta está activa
  const isActiveRoute = (href: string) => {
    if (href === '/panel') {
      return pathname === '/panel' || pathname === '/'
    }
    return pathname === href
  }


  if (!mounted || isLoading) {
    return (
      <div className="sticky top-0 z-50 w-full h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-center h-full">
          <div className="loading-spinner w-6 h-6"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-50 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 shadow-sm"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center cursor-pointer"
          >
            <Link href="/panel" className="flex items-center">
              <div className="relative w-20 h-12 sm:w-24 sm:h-14 flex-shrink-0 p-1">
                <Image
                  src="/logo-colores.png"
                  alt="Casino Escolar"
                  fill
                  className={`object-contain transition-all duration-300 ${
                    theme === 'dark' 
                      ? 'brightness-125 contrast-125 saturate-110' 
                      : 'invert brightness-90 contrast-110 saturate-105'
                  }`}
                  priority
                />
              </div>
            </Link>
          </motion.div>

          {/* Navegación principal - Desktop */}
          <div className="hidden lg:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = isActiveRoute(item.href)
              
              return (
                <Link key={item.href} href={item.href}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    <Icon size={18} className="mr-2" />
                    {item.name}
                  </motion.div>
                </Link>
              )
            })}
          </div>

          {/* Controles del usuario - Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            
            {/* Bienvenida personalizada */}
            <div className="text-right">
              <p className="text-sm text-slate-600 dark:text-slate-300 text-clean">
                Hola, <span className="font-medium text-slate-800 dark:text-slate-100">{user.firstName}</span>
              </p>
              <div className="flex items-center justify-end space-x-2 mt-1">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getUserTypeColor()}`}>
                  {getUserTypeLabel()}
                </span>
              </div>
            </div>

            {/* Toggle tema */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200"
              aria-label="Cambiar tema"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </motion.button>

            {/* Menú de usuario */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={(e) => {
                  e.stopPropagation()
                  toggleUserMenu()
                }}
                className="flex items-center space-x-2 p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-medium text-sm text-clean">
                    {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                  </span>
                </div>
                <ChevronDown 
                  size={16} 
                  className={`transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} 
                />
              </motion.button>

              {/* Dropdown del menú de usuario */}
              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Información del usuario */}
                    <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100 text-clean">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 text-clean">
                        {user.email}
                      </p>
                      <div className="mt-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getUserTypeColor()}`}>
                          {getUserTypeLabel()}
                        </span>
                      </div>
                    </div>

                    {/* Opciones del menú */}
                    <div className="py-1">
                      <Link href="/perfil">
                        <button className="w-full flex items-center px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200">
                          <User size={16} className="mr-3" />
                          Ver Perfil
                        </button>
                      </Link>
                      <div className="border-t border-slate-200 dark:border-slate-700 mt-1 pt-1">
                        <button 
                          onClick={handleLogout}
                          className="w-full flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                        >
                          <LogOut size={16} className="mr-3" />
                          Cerrar Sesión
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Controles móviles */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Toggle tema móvil */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              aria-label="Cambiar tema"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </motion.button>

            {/* Menú hamburguesa */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation()
                toggleMobileMenu()
              }}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              aria-label="Menú"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </motion.button>
          </div>
        </div>

        {/* Menú móvil */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden border-t border-slate-200 dark:border-slate-700 py-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Información del usuario móvil */}
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg mb-4">
                <div className="flex items-center space-x-3">
                  <div className="relative w-12 h-12 flex-shrink-0 p-1">
                    <Image
                      src="/logo-colores.png"
                      alt="Casino Escolar"
                      fill
                      className={`object-contain rounded-lg transition-all duration-300 ${
                        theme === 'dark' 
                          ? 'brightness-125 contrast-125 saturate-110' 
                          : 'invert brightness-90 contrast-110 saturate-105'
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100 text-clean">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 text-clean">
                      {user.email}
                    </p>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getUserTypeColor()}`}>
                        {getUserTypeLabel()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navegación móvil */}
              <div className="space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon
                  const isActive = isActiveRoute(item.href)
                  
                  return (
                    <Link 
                      key={item.href}
                      href={item.href} 
                      className={`flex items-center px-4 py-3 rounded-lg transition-colors duration-200 ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Icon size={18} className="mr-3" />
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{item.description}</div>
                      </div>
                    </Link>
                  )
                })}
                
                <div className="border-t border-slate-200 dark:border-slate-700 pt-2 mt-2">
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                  >
                    <LogOut size={18} className="mr-3" />
                    <div>
                      <div className="font-medium">Cerrar Sesión</div>
                      <div className="text-xs text-red-500 dark:text-red-400">Salir de la cuenta</div>
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  )
}