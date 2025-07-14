"use client"
import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { AdminNavigation } from '@/components/admin/AdminNavigation'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'

interface AdminLayoutProps {
  children: ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { isLoading, isAdmin } = useAdminAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="flex">
          {/* Sidebar skeleton */}
          <div className="hidden lg:block w-64 h-screen bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700">
            <div className="p-4">
              <Skeleton className="h-8 w-full mb-3" />
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            </div>
          </div>
          
          {/* Main content skeleton */}
          <div className="flex-1">
            <div className="p-6">
              <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-24" />
                  ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2">
                    <Skeleton className="h-80" />
                  </div>
                  <div>
                    <Skeleton className="h-80" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="max-w-md w-full px-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No tienes permisos para acceder al panel administrativo.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <motion.div 
      className="min-h-screen bg-slate-50 dark:bg-slate-900"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex">
        {/* Navigation Sidebar */}
        <AdminNavigation />
        
        {/* Main Content - Margen correcto para el sidebar */}
        <div className="flex-1 lg:ml-64">
          <motion.main
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen"
          >
            {children}
          </motion.main>
        </div>
      </div>
    </motion.div>
  )
}