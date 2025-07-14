"use client"
import { motion } from 'framer-motion'
import { 
  ShoppingCart, 
  DollarSign, 
  Users, 
  Clock,
  TrendingUp,
  Calendar,
  CheckCircle,
  AlertTriangle,
  XCircle,
  AlertCircle,
  Target,
  Percent
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { OrderMetrics } from '@/types/adminOrder'
import { formatAdminCurrency } from '@/lib/adminUtils'

interface OrdersMetricsProps {
  metrics: OrderMetrics | null
  isLoading: boolean
}

export function OrdersMetrics({ metrics, isLoading }: OrdersMetricsProps) {
  if (isLoading || !metrics) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const mainMetricCards = [
    {
      title: 'Total de Pedidos',
      value: metrics.totalOrders.toString(),
      icon: ShoppingCart,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      subtitle: `${metrics.paidOrders} pagados, ${metrics.pendingOrders} pendientes`
    },
    {
      title: 'Recaudación Total',
      value: formatAdminCurrency(metrics.totalRevenue),
      icon: DollarSign,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
      borderColor: 'border-emerald-200 dark:border-emerald-800',
      subtitle: 'Solo pedidos pagados'
    },
    {
      title: 'Valor Promedio',
      value: formatAdminCurrency(metrics.averageOrderValue),
      icon: TrendingUp,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      borderColor: 'border-purple-200 dark:border-purple-800',
      subtitle: 'Por pedido pagado'
    },
    {
      title: 'Pedidos Críticos',
      value: metrics.criticalPendingOrders?.toString() || '0',
      icon: AlertTriangle,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      subtitle: 'Más de 3 días pendientes',
      badge: (metrics.criticalPendingOrders || 0) > 0 ? metrics.criticalPendingOrders : undefined
    }
  ]

  const statusMetricCards = [
    {
      title: 'Pedidos Pagados',
      count: metrics.paidOrders,
      revenue: metrics.revenueByStatus?.paid || 0,
      icon: CheckCircle,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
      borderColor: 'border-emerald-200 dark:border-emerald-800',
      percentage: metrics.totalOrders > 0 ? Math.round((metrics.paidOrders / metrics.totalOrders) * 100) : 0
    },
    {
      title: 'Pedidos Pendientes',
      count: metrics.pendingOrders,
      revenue: metrics.revenueByStatus?.pending || 0,
      icon: Clock,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      borderColor: 'border-amber-200 dark:border-amber-800',
      percentage: metrics.totalOrders > 0 ? Math.round((metrics.pendingOrders / metrics.totalOrders) * 100) : 0
    },
    {
      title: 'Pedidos Cancelados',
      count: metrics.cancelledOrders || 0,
      revenue: metrics.revenueByStatus?.cancelled || 0,
      icon: XCircle,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      percentage: metrics.totalOrders > 0 ? Math.round(((metrics.cancelledOrders || 0) / metrics.totalOrders) * 100) : 0
    }
  ]

  // Calcular tasa de conversión
  const conversionRate = metrics.totalOrders > 0 
    ? Math.round((metrics.paidOrders / metrics.totalOrders) * 100) 
    : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="space-y-6"
    >
      {/* Alerta para pedidos críticos */}
      {(metrics.criticalPendingOrders || 0) > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                <strong>{metrics.criticalPendingOrders}</strong> pedidos llevan más de 3 días pendientes de pago y requieren atención inmediata
              </span>
              <Badge variant="destructive" className="ml-4 animate-pulse">
                Crítico
              </Badge>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mainMetricCards.map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className={`${metric.bgColor} ${metric.borderColor} border-2 shadow-soft hover:shadow-md transition-shadow`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <metric.icon className={`w-5 h-5 ${metric.color}`} />
                      {metric.badge && (
                        <Badge variant="destructive" className="text-xs animate-pulse">
                          {metric.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                      {metric.title}
                    </p>
                    <p className={`text-2xl font-bold ${metric.color} mb-1`}>
                      {metric.value}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {metric.subtitle}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Métricas por estado de pago */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statusMetricCards.map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
          >
            <Card className={`${metric.bgColor} ${metric.borderColor} border-2 shadow-soft hover:shadow-md transition-shadow`}>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <metric.icon className={`w-5 h-5 ${metric.color}`} />
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        {metric.title}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Percent className="w-3 h-3 text-slate-400" />
                      <Badge variant="outline" className={`${metric.color.replace('text-', 'border-').replace('dark:text-', 'dark:border-')} text-xs`}>
                        {metric.percentage}%
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Cantidad:</span>
                      <span className={`text-xl font-bold ${metric.color}`}>
                        {metric.count}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Valor total:</span>
                      <span className={`text-lg font-semibold ${metric.color}`}>
                        {formatAdminCurrency(metric.revenue)}
                      </span>
                    </div>
                  </div>

                  {/* Barra de progreso mejorada */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>Proporción del total</span>
                      <span>{metric.percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-700 ease-out ${
                          metric.title.includes('Pagados') ? 'bg-emerald-500' :
                          metric.title.includes('Pendientes') ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.max(metric.percentage, 2)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Métricas adicionales mejoradas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tasa de conversión */}
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              <span>Tasa de Conversión</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <div className={`text-4xl font-bold ${
                conversionRate >= 80 ? 'text-emerald-600' :
                conversionRate >= 60 ? 'text-amber-600' : 'text-red-600'
              }`}>
                {conversionRate}%
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                De pedidos creados a pagados
              </p>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-700 ${
                    conversionRate >= 80 ? 'bg-emerald-500' :
                    conversionRate >= 60 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.max(conversionRate, 2)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Distribución por tipo de usuario */}
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              <span>Recaudación por Usuario</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Estudiantes
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    {formatAdminCurrency(metrics.totalByUserType.estudiante || 0)}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {metrics.totalRevenue > 0 ? 
                      Math.round(((metrics.totalByUserType.estudiante || 0) / metrics.totalRevenue) * 100) : 0}%
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Funcionarios
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    {formatAdminCurrency(metrics.totalByUserType.funcionario || 0)}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {metrics.totalRevenue > 0 ? 
                      Math.round(((metrics.totalByUserType.funcionario || 0) / metrics.totalRevenue) * 100) : 0}%
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Distribución por día */}
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              <span>Pedidos por Día</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(metrics.totalByDay).map(([day, count]) => {
                const maxCount = Math.max(...Object.values(metrics.totalByDay))
                const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0
                
                return (
                  <div key={day} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="w-16 text-sm font-medium text-slate-600 dark:text-slate-400 capitalize">
                        {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                      </div>
                      <div className="flex-1">
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(percentage, 5)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white ml-3 min-w-[2rem] text-right">
                      {count}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}