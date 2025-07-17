"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  AlertTriangle, 
  Menu as MenuIcon,
  X
} from 'lucide-react'
import useAuth from '@/hooks/useAuth'
import { useOrderManagement } from '@/hooks/useOrderManagement'
import { Navbar } from '@/components/panel/Navbar'
import { MenuSkeleton } from '@/components/menu/MenuSkeleton'
import { ChildSelector } from '@/components/mi-pedido/ChildSelector'
import { FunctionaryChildSelector } from '@/components/mi-pedido/FunctionaryChildSelector'
import { OrderSummary } from '@/components/mi-pedido/OrderSummary'
import { WeeklyMenuView } from '@/components/menu/WeeklyMenuView'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useOrderStore } from '@/store/orderStore'

interface ExtendedUser {
  id: string
  email: string
  tipoUsuario: string
  userType: string
  firstName: string
  lastName: string
  isActive: boolean
  createdAt: Date
}

export default function MenuPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  // Extraemos lo que necesitamos del hook de orden y manejo de menú
  const { menuPublished, publishMenu, hideMenu, loading: loadingMenu } = useOrderManagement()
  // El estado de pedido y sus utilidades
  const { currentChild, setCurrentChild, children, loading: loadingChildren } = useOrderStore()
  // Estado para controlar sidebar en móvil
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  // Estado para el procesamiento de pagos
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  useEffect(() => {
    // Si no está autenticado y termina la carga, redireccionar
    if (!user && !authLoading) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  // Manejo de selección de niño
  const handleChildSelect = (childId: string | null) => {
    const child = children.find((c: { id: string }) => c.id === childId) || null;
    setCurrentChild(child);
    // Cerrar sidebar en móvil al seleccionar
    setMobileSidebarOpen(false);
  }

  // Toggle para funcionarios entre menú personal y de hijos
  const handlePersonalToggle = (usePersonal: boolean) => {
    // Cerrar sidebar en móvil al seleccionar
    setMobileSidebarOpen(false);
  }
  
  // Manejar la acción de proceder al pago
  const handleProceedToPayment = async () => {
    setIsProcessingPayment(true);
    try {
      // Aquí iría la lógica de procesamiento de pago
      await new Promise(resolve => setTimeout(resolve, 1500));
    } catch (error) {
      console.error('Error en el proceso de pago:', error);
    } finally {
      setIsProcessingPayment(false);
    }
  }

  // Mostrar esqueleto durante la carga
  if (authLoading) {
    return <MenuSkeleton />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container px-4 py-4 md:py-8 max-w-screen-xl mx-auto">
        {/* Alerta para administradores sobre estado de publicación del menú */}
        {user?.tipo === 'admin' && (
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {menuPublished 
                ? "El menú está actualmente publicado y visible para todos los usuarios."
                : "El menú está oculto y solo visible para administradores."}
              <div className="mt-2">
                <Button 
                  variant={menuPublished ? "destructive" : "default"}
                  size="sm"
                  onClick={menuPublished ? hideMenu : publishMenu}
                >
                  {menuPublished ? "Ocultar Menú" : "Publicar Menú"}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        {/* Vista principal con sidebar y menú */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Botón para mostrar sidebar en móvil */}
          <Button
            variant="outline"
            size="icon"
            className="lg:hidden self-start mb-2"
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          >
            {mobileSidebarOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <MenuIcon className="h-4 w-4" />
            )}
          </Button>

          {/* Sidebar con selección de niño y resumen de pedido */}
          <AnimatePresence>
            {(mobileSidebarOpen || (!mobileSidebarOpen && typeof window !== 'undefined' && window.innerWidth >= 1024)) && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={cn(
                  "w-full lg:w-72 shrink-0",
                  mobileSidebarOpen ? "fixed inset-0 bg-white z-50 p-4 overflow-auto" : "relative"
                )}
              >
                <Card className="mb-4">
                  <CardContent className="p-4">
                    <h2 className="font-bold text-lg mb-4">Seleccionar niño</h2>
                    
                    {loadingChildren ? (
                      <p>Cargando...</p>
                    ) : user?.tipoUsuario === 'apoderado' && user ? (
                      <ChildSelector 
                        user={user}
                        isReadOnly={false}
                        onChildSelect={handleChildSelect}
                      />
                    ) : user?.tipoUsuario === 'funcionario' && user ? (
                      <FunctionaryChildSelector 
                        user={user}
                        isReadOnly={false}
                        onChildSelect={handleChildSelect}
                        onPersonalToggle={handlePersonalToggle}
                      />
                    ) : null}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <OrderSummary 
                      user={user || { 
                        id: '0', 
                        email: '', 
                        tipoUsuario: 'invitado', 
                        userType: 'apoderado',
                        firstName: '', 
                        lastName: '',
                        isActive: true,
                        createdAt: new Date()
                      } as ExtendedUser} 
                      onProceedToPayment={handleProceedToPayment}
                      isProcessingPayment={isProcessingPayment}
                    />
                  </CardContent>
                </Card>
                {/* Botón para cerrar sidebar en móvil */}
                {mobileSidebarOpen && (
                  <Button 
                    className="mt-4 w-full" 
                    onClick={() => setMobileSidebarOpen(false)}
                  >
                    Cerrar
                  </Button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Menú semanal */}
          <div className="flex-grow">
            {user?.tipo === 'admin' && (
              <div className="mb-4">
                <h1 className="text-2xl font-bold">Gestión de Menú</h1>
              </div>
            )}
            
            {/* Vista de Menú Semanal */}
            {loadingMenu ? (
              <MenuSkeleton />
            ) : (
              <WeeklyMenuView 
                user={user || { 
                  id: '0', 
                  email: '', 
                  tipoUsuario: 'invitado',
                  userType: 'apoderado',
                  firstName: '', 
                  lastName: '',
                  isActive: true,
                  createdAt: new Date()
                } as ExtendedUser}
                currentChild={currentChild}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
