"use client"
import { useState } from 'react'
import { motion } from 'framer-motion'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { UsersHeader } from '@/components/admin/usuarios/UsersHeader'
import { UsersStats } from '@/components/admin/usuarios/UsersStats'
import { UsersFilters } from '@/components/admin/usuarios/UsersFilters'
import { UsersTable } from '@/components/admin/usuarios/UsersTable'
import { UserDetailModal } from '@/components/admin/usuarios/UserDetailModal'
import { useAdminUsers } from '@/hooks/useAdminUsers'
import { AdminUserView } from '@/types/adminUser'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, CheckCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export default function AdminUsersPage() {
  const {
    users,
    userStats,
    selectedUser,
    isLoading,
    isLoadingStats,
    isLoadingDetail,
    error,
    hasMore,
    filters,
    sortConfig,
    loadUserDetail,
    updateFilters,
    updateSort,
    deleteUser,
    resendEmailVerification,
    clearSelectedUser,
    refreshData,
    loadMoreUsers
  } = useAdminUsers()

  // Estados locales
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<AdminUserView | null>(null)
  const [actionMessage, setActionMessage] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  // Handlers
  const handleSearchChange = (searchTerm: string) => {
    updateFilters({ searchTerm })
  }

  const handleViewUser = async (user: AdminUserView) => {
    await loadUserDetail(user.id)
  }

  const handleEditUser = (user: AdminUserView) => {
    // TODO: Implementar modal de edición
    console.log('Edit user:', user)
  }

  const handleDeleteUser = (user: AdminUserView) => {
    setUserToDelete(user)
  }

  const confirmDeleteUser = async () => {
    if (!userToDelete) return

    const result = await deleteUser(userToDelete.id)
    
    if (result.success) {
      setActionMessage({
        type: 'success',
        message: 'Usuario eliminado correctamente'
      })
    } else {
      setActionMessage({
        type: 'error',
        message: result.message
      })
    }
    
    setUserToDelete(null)
    
    // Auto-hide message after 5 seconds
    setTimeout(() => setActionMessage(null), 5000)
  }

  const handleResendVerification = async (user: AdminUserView) => {
    const result = await resendEmailVerification(user.email)
    
    if (result.success) {
      setActionMessage({
        type: 'success',
        message: 'Correo de verificación enviado correctamente'
      })
    } else {
      setActionMessage({
        type: 'error',
        message: result.message
      })
    }
    
    // Auto-hide message after 5 seconds
    setTimeout(() => setActionMessage(null), 5000)
  }

  const handleExport = () => {
    // TODO: Implementar exportación
    console.log('Export users')
  }

  const clearFilters = () => {
    updateFilters({
      role: 'all',
      emailVerified: 'all',
      dateRange: undefined,
      customStartDate: undefined,
      customEndDate: undefined,
      searchTerm: '',
      isActive: 'all'
    })
  }

  return (
    <AdminLayout>
      {/* Header */}
      <UsersHeader
        userStats={userStats}
        searchTerm={filters.searchTerm || ''}
        onSearchChange={handleSearchChange}
        onRefresh={refreshData}
        onExport={handleExport}
        isRefreshing={isLoading}
      />

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Mensaje de acción */}
          {actionMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Alert variant={actionMessage.type === 'error' ? 'destructive' : 'default'}>
                {actionMessage.type === 'success' ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
                <AlertDescription className="flex items-center justify-between">
                  <span>{actionMessage.message}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActionMessage(null)}
                    className="ml-4 h-auto p-1"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {/* Error general */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{error}</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={refreshData}
                  className="ml-4"
                >
                  Reintentar
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Estadísticas */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <UsersStats stats={userStats} isLoading={isLoadingStats} />
          </motion.div>

          {/* Filtros */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <UsersFilters
              filters={filters}
              onFiltersChange={updateFilters}
              onClearFilters={clearFilters}
              isOpen={isFiltersOpen}
              onToggle={() => setIsFiltersOpen(!isFiltersOpen)}
            />
          </motion.div>

          {/* Tabla de usuarios */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <UsersTable
              users={users}
              isLoading={isLoading}
              sortField={sortConfig.field}
              sortDirection={sortConfig.direction}
              onSort={updateSort}
              onViewUser={handleViewUser}
              onEditUser={handleEditUser}
              onDeleteUser={handleDeleteUser}
              onResendVerification={handleResendVerification}
              hasMore={hasMore}
              onLoadMore={loadMoreUsers}
            />
          </motion.div>
        </div>
      </div>

      {/* Modal de detalle de usuario */}
      <UserDetailModal
        user={selectedUser}
        isOpen={!!selectedUser}
        isLoading={isLoadingDetail}
        onClose={clearSelectedUser}
        onEdit={handleEditUser}
        onDelete={handleDeleteUser}
        onResendVerification={handleResendVerification}
      />

      {/* Dialog de confirmación de eliminación */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente al usuario{' '}
              <strong>{userToDelete?.firstName} {userToDelete?.lastName}</strong>{' '}
              y todos sus datos asociados, incluyendo pedidos y configuraciones.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteUser}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Eliminar Usuario
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  )
}
