"use client"
import { motion } from 'framer-motion'
import { 
  ChevronUp, 
  ChevronDown, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  Mail, 
  MailCheck,
  User,
  ShoppingCart
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AdminUserView, SortField, SortDirection } from '@/types/adminUser'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface UsersTableProps {
  users: AdminUserView[]
  isLoading: boolean
  sortField: SortField
  sortDirection: SortDirection
  onSort: (field: SortField) => void
  onViewUser: (user: AdminUserView) => void
  onEditUser: (user: AdminUserView) => void
  onDeleteUser: (user: AdminUserView) => void
  onResendVerification: (user: AdminUserView) => void
  hasMore: boolean
  onLoadMore: () => void
}

export function UsersTable({
  users,
  isLoading,
  sortField,
  sortDirection,
  onSort,
  onViewUser,
  onEditUser,
  onDeleteUser,
  onResendVerification,
  hasMore,
  onLoadMore
}: UsersTableProps) {
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4" /> : 
      <ChevronDown className="w-4 h-4" />
  }

  const getRoleColor = (role: string, userType: string) => {
    if (role === 'admin' || role === 'super_admin') {
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
    }
    return userType === 'funcionario' 
      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
  }

  const getRoleLabel = (role: string, userType: string) => {
    if (role === 'admin') return 'Administrador'
    if (role === 'super_admin') return 'Super Admin'
    return userType === 'funcionario' ? 'Funcionario' : 'Apoderado'
  }

  const getEmailStatusColor = (verified: boolean) => {
    return verified 
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
  }

  if (isLoading && users.length === 0) {
    return (
      <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle>Usuarios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-8 w-8" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <User className="w-5 h-5" />
          <span>Lista de Usuarios</span>
          <Badge variant="secondary" className="ml-2">
            {users.length} usuarios
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-200 dark:border-slate-700">
                <TableHead 
                  className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  onClick={() => onSort('firstName')}
                >
                  <div className="flex items-center space-x-2">
                    <span>Nombre</span>
                    {getSortIcon('firstName')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  onClick={() => onSort('email')}
                >
                  <div className="flex items-center space-x-2">
                    <span>Correo</span>
                    {getSortIcon('email')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  onClick={() => onSort('role')}
                >
                  <div className="flex items-center space-x-2">
                    <span>Rol</span>
                    {getSortIcon('role')}
                  </div>
                </TableHead>
                <TableHead>Estado Email</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  onClick={() => onSort('createdAt')}
                >
                  <div className="flex items-center space-x-2">
                    <span>Registro</span>
                    {getSortIcon('createdAt')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  onClick={() => onSort('ordersCount')}
                >
                  <div className="flex items-center space-x-2">
                    <span>Pedidos</span>
                    {getSortIcon('ordersCount')}
                  </div>
                </TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user, index) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">
                          {user.firstName} {user.lastName}
                        </div>
                        {user.children && user.children.length > 0 && (
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {user.children.length} hijo{user.children.length > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-slate-900 dark:text-white">
                      {user.email}
                    </div>
                    {user.phone && (
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {user.phone}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={getRoleColor(user.role, user.userType)}>
                      {getRoleLabel(user.role, user.userType)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Badge className={getEmailStatusColor(user.emailVerified)}>
                        {user.emailVerified ? (
                          <>
                            <MailCheck className="w-3 h-3 mr-1" />
                            Verificado
                          </>
                        ) : (
                          <>
                            <Mail className="w-3 h-3 mr-1" />
                            Pendiente
                          </>
                        )}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-slate-900 dark:text-white">
                      {format(user.createdAt, 'dd/MM/yyyy', { locale: es })}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {format(user.createdAt, 'HH:mm', { locale: es })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <ShoppingCart className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-900 dark:text-white">
                        {user.ordersCount}
                      </span>
                    </div>
                    {user.lastOrderDate && (
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Último: {format(user.lastOrderDate, 'dd/MM', { locale: es })}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => onViewUser(user)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver perfil
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEditUser(user)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar usuario
                        </DropdownMenuItem>
                        {!user.emailVerified && (
                          <DropdownMenuItem onClick={() => onResendVerification(user)}>
                            <Mail className="mr-2 h-4 w-4" />
                            Reenviar verificación
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => onDeleteUser(user)}
                          className="text-red-600 dark:text-red-400"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar usuario
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Load More Button */}
        {hasMore && (
          <div className="p-6 border-t border-slate-200 dark:border-slate-700">
            <Button
              variant="outline"
              onClick={onLoadMore}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Cargando...' : 'Cargar más usuarios'}
            </Button>
          </div>
        )}

        {/* Empty State */}
        {users.length === 0 && !isLoading && (
          <div className="p-12 text-center">
            <User className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              No se encontraron usuarios
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              Intenta ajustar los filtros de búsqueda
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
