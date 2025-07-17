"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Página de redirección de Mi Pedido
 * Esta página ahora redirige automáticamente a la página de menú
 * ya que toda la funcionalidad se ha integrado allí
 */
export default function MiPedidoPage() {
  const router = useRouter()
  
  // Redireccionar automáticamente a la página de menú
  useEffect(() => {
    router.push('/menu')
  }, [router])

  // Mostrar pantalla de carga mientras se redirecciona
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-16 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <Skeleton className="h-32 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6, 7].map(i => (
                <Skeleton key={i} className="h-96 w-full" />
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
