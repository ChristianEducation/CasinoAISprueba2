"use client"
import { motion } from 'framer-motion'
import { 
  Users, 
  UserCheck, 
  Shield, 
  Mail, 
  MailX,
  TrendingUp,
  Heart
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { UserStats } from '@/types/adminUser'

interface UsersStatsProps {
  stats: UserStats | null
  isLoading: boolean
}

export function UsersStats({ stats, isLoading }: UsersStatsProps) {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Helper function to safely format numbers
  const formatNumber = (value: number | undefined | null): string => {
    if (value === undefined || value === null || isNaN(value)) {
      return '0'
    }
    return value.toLocaleString()
  }

  // Helper function to safely calculate percentage
  const calculatePercentage = (part: number | undefined | null, total: number | undefined | null): number => {
    if (!part || !total || total === 0) return 0
    return Math.round((part / total) * 100)
  }

  const statsCards = [
    {
      title: 'Total Usuarios',
      value: stats.totalUsers || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      description: 'Usuarios registrados'
    },
    {
      title: 'Apoderados',
      value: stats.apoderados || 0,
      icon: Heart,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
      description: 'Padres y apoderados'
    },
    {
      title: 'Funcionarios',
      value: stats.funcionarios || 0,
      icon: UserCheck,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      description: 'Personal del colegio'
    },
    {
      title: 'Estudiantes',
      value: stats.estudiantes || 0,
      icon: UserCheck,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
      description: 'Estudiantes directos'
    },
    {
      title: 'Administradores',
      value: stats.admins || 0,
      icon: Shield,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      description: 'Usuarios admin'
    },
    {
      title: 'Emails Verificados',
      value: stats.verifiedEmails || 0,
      icon: Mail,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      description: `${calculatePercentage(stats.verifiedEmails, stats.totalUsers)}% del total`
    },
    {
      title: 'Sin Verificar',
      value: stats.unverifiedEmails || 0,
      icon: MailX,
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      description: 'Requieren verificación'
    },
    {
      title: 'Nuevos (Semana)',
      value: stats.newUsersThisWeek || 0,
      icon: TrendingUp,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
      description: 'Últimos 7 días'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statsCards.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {stat.title}
                </span>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {formatNumber(stat.value)}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {stat.description}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}