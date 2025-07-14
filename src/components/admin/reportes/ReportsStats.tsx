"use client"
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Users, ShoppingCart, DollarSign, Target, BarChart3, Percent } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ReportsStats } from '@/types/reports'
import { ExportUtils } from '@/lib/exportUtils'

interface ReportsStatsProps {
  stats: ReportsStats
}

export function ReportsStatsComponent({ stats }: ReportsStatsProps) {
  const statsCards = [
    {
      title: 'Total de Pedidos',
      value: stats.totalOrders.toLocaleString(),
      icon: ShoppingCart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      growth: stats.growthPercentage,
      description: 'Pedidos en el período'
    },
    {
      title: 'Ingresos Totales',
      value: ExportUtils.formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
      growth: stats.growthPercentage * 1.2,
      description: 'Ingresos confirmados'
    },
    {
      title: 'Usuarios Activos',
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      growth: stats.growthPercentage * 0.8,
      description: 'Usuarios con pedidos'
    },
    {
      title: 'Menús Seleccionados',
      value: stats.totalMenuItems.toLocaleString(),
      icon: BarChart3,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      growth: stats.growthPercentage * 1.1,
      description: 'Items de menú pedidos'
    },
    {
      title: 'Valor Promedio',
      value: ExportUtils.formatCurrency(stats.averageOrderValue),
      icon: Target,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
      growth: stats.growthPercentage * 0.6,
      description: 'Por pedido'
    },
    {
      title: 'Tasa de Conversión',
      value: `${stats.conversionRate.toFixed(1)}%`,
      icon: Percent,
      color: 'text-teal-600',
      bgColor: 'bg-teal-100 dark:bg-teal-900/30',
      growth: stats.growthPercentage * 0.9,
      description: 'Pedidos pagados vs total'
    }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon
          const isPositiveGrowth = stat.growth >= 0
          const GrowthIcon = isPositiveGrowth ? TrendingUp : TrendingDown
          
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
            >
              <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                        {stat.value}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {stat.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant="secondary" 
                        className={`${
                          isPositiveGrowth 
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' 
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                        }`}
                      >
                        <GrowthIcon className="w-3 h-3 mr-1" />
                        {Math.abs(stat.growth).toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
