"use client"
import { motion } from 'framer-motion'
import { 
  ShoppingCart, 
  DollarSign, 
  Users, 
  Clock,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AdminStats } from '@/types/admin'
import { formatAdminCurrency } from '@/lib/adminUtils'

interface StatsCardsProps {
  stats: AdminStats
}

export function StatsCards({ stats }: StatsCardsProps) {
  const statsData = [
    {
      title: 'Pedidos de la Semana',
      value: stats.totalOrdersWeek.toString(),
      subtitle: `${stats.paidOrders} pagados, ${stats.pendingOrders} pendientes`,
      icon: ShoppingCart,
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-blue-100',
      darkBgGradient: 'from-blue-900/20 to-blue-800/20',
      change: null
    },
    {
      title: 'Recaudación Semanal',
      value: formatAdminCurrency(stats.totalRevenueWeek),
      subtitle: `Promedio: ${formatAdminCurrency(stats.averageOrderValue)} por pedido`,
      icon: DollarSign,
      gradient: 'from-emerald-500 to-emerald-600',
      bgGradient: 'from-emerald-50 to-emerald-100',
      darkBgGradient: 'from-emerald-900/20 to-emerald-800/20',
      change: null
    },
    {
      title: 'Usuarios con Pedido',
      value: (stats.totalStudentsWithOrder + stats.totalStaffWithOrder).toString(),
      subtitle: `${stats.totalStudentsWithOrder} estudiantes, ${stats.totalStaffWithOrder} funcionarios`,
      icon: Users,
      gradient: 'from-purple-500 to-purple-600',
      bgGradient: 'from-purple-50 to-purple-100',
      darkBgGradient: 'from-purple-900/20 to-purple-800/20',
      change: null
    },
    {
      title: 'Pedidos Pendientes',
      value: stats.pendingOrders.toString(),
      subtitle: 'Requieren confirmación de pago',
      icon: Clock,
      gradient: 'from-amber-500 to-amber-600',
      bgGradient: 'from-amber-50 to-amber-100',
      darkBgGradient: 'from-amber-900/20 to-amber-800/20',
      change: null
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsData.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          whileHover={{ y: -4, scale: 1.02 }}
          className="group"
        >
          <Card className="relative overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-white dark:bg-slate-800 h-full">
            {/* Gradiente de fondo sutil */}
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} dark:${stat.darkBgGradient} opacity-30 group-hover:opacity-50 transition-opacity duration-300`} />
            
            {/* Línea decorativa superior */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-br ${stat.gradient} dark:${stat.darkBgGradient} opacity-30 group-hover:opacity-50 transition-opacity duration-300`} />
            
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.gradient}`}>
                <stat.icon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            
            <CardContent className="relative z-10">
              <div className="flex items-baseline space-x-2">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {stat.value}
                </div>
                {stat.change && (
                  <div className={`flex items-center text-sm ${
                    stat.change > 0 ? 'text-emerald-600' : 
                    stat.change < 0 ? 'text-red-600' : 'text-slate-500'
                  }`}>
                    {stat.change > 0 ? (
                      <TrendingUp className="w-3 h-3 mr-1" />
                    ) : stat.change < 0 ? (
                      <TrendingDown className="w-3 h-3 mr-1" />
                    ) : (
                      <Minus className="w-3 h-3 mr-1" />
                    )}
                    {Math.abs(stat.change)}%
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {stat.subtitle}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}