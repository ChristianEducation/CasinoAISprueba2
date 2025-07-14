"use client"
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Users, 
  ShoppingCart,
  Edit,
  Trash2,
  MailCheck,
  Clock,
  DollarSign,
  TrendingUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { UserDetailView } from '@/types/adminUser'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface UserDetailModalProps {
  user: UserDetailView | null
  isOpen: boolean
  isLoading: boolean
  onClose: () => void
  onEdit: (user: UserDetailView) => void
  onDelete: (user: UserDetailView) => void
  onResendVerification: (user: UserDetailView) => void
}

export function UserDetailModal({
  user,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onResendVerification
}: UserDetailModalProps) {
  if (!user) return null

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
      case 'pending':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
      case 'cancelled':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'Pagado'
      case 'pending': return 'Pendiente'
      case 'cancelled': return 'Cancelado'
      default: return status
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {user.firstName} {user.lastName}
                </h2>
                <Badge className={getRoleColor(user.role, user.userType)}>
                  {getRoleLabel(user.role, user.userType)}
                </Badge>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(user)}
                className="flex items-center space-x-2"
              >
                <Edit className="w-4 h-4" />
                <span>Editar</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información Personal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Información Personal</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
                    <Mail className="w-4 h-4" />
                    <span>Correo electrónico</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-900 dark:text-white">{user.email}</span>
                    <Badge className={user.emailVerified ? 
                      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                    }>
                      {user.emailVerified ? (
                        <>
                          <MailCheck className="w-3 h-3 mr-1" />
                          Verificado
                        </>
                      ) : (
                        <>
                          <Mail className="w-3 h-3 mr-1" />
                          No verificado
                        </>
                      )}
                    </Badge>
                  </div>
                  {!user.emailVerified && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onResendVerification(user)}
                      className="mt-2"
                    >
                      Reenviar verificación
                    </Button>
                  )}
                </div>

                {user.phone && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
                      <Phone className="w-4 h-4" />
                      <span>Teléfono</span>
                    </div>
                    <span className="text-slate-900 dark:text-white">{user.phone}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
                    <Calendar className="w-4 h-4" />
                    <span>Fecha de registro</span>
                  </div>
                  <span className="text-slate-900 dark:text-white">
                    {format(user.createdAt, 'dd/MM/yyyy HH:mm', { locale: es })}
                  </span>
                </div>

                {user.lastLogin && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
                      <Clock className="w-4 h-4" />
                      <span>Último acceso</span>
                    </div>
                    <span className="text-slate-900 dark:text-white">
                      {format(user.lastLogin, 'dd/MM/yyyy HH:mm', { locale: es })}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Hijos (si es apoderado) */}
          {user.children && user.children.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Hijos Registrados</span>
                  <Badge variant="secondary">{user.children.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {user.children.map((child) => (
                    <div key={child.id} className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                      <div className="font-medium text-slate-900 dark:text-white mb-2">
                        {child.name}
                      </div>
                      <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                        <div>Edad: {child.age} años</div>
                        <div>Curso: {child.class}</div>
                        <div>Nivel: {child.level}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Estadísticas de Pedidos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <ShoppingCart className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                      {user.ordersCount}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Total de pedidos
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                      ${user.totalSpent.toLocaleString()}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Total gastado
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                      ${user.averageOrderValue.toLocaleString()}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Promedio por pedido
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Historial de Pedidos Recientes */}
          {user.recentOrders.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ShoppingCart className="w-5 h-5" />
                  <span>Pedidos Recientes</span>
                  <Badge variant="secondary">{user.recentOrders.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {user.recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="font-medium text-slate-900 dark:text-white">
                            Semana del {format(new Date(order.weekStart), 'dd/MM/yyyy', { locale: es })}
                          </div>
                          <Badge className={getStatusColor(order.status)}>
                            {getStatusLabel(order.status)}
                          </Badge>
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {order.itemsCount} items • {format(order.createdAt, 'dd/MM/yyyy HH:mm', { locale: es })}
                        </div>
                      </div>
                      <div className="text-lg font-semibold text-slate-900 dark:text-white">
                        ${order.total.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Acciones Peligrosas */}
          <Card className="border-red-200 dark:border-red-800">
            <CardHeader>
              <CardTitle className="text-red-600 dark:text-red-400">Zona de Peligro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-white">Eliminar Usuario</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Esta acción eliminará permanentemente al usuario y todos sus datos asociados.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => onDelete(user)}
                  className="flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Eliminar Usuario</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
