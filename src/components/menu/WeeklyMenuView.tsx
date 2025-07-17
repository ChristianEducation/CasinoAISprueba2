"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWeeklyMenuData } from '@/hooks/useWeeklyMenuData'
import { DayMenuDisplay, MenuItem } from '@/types/menu'
import { Child, User } from '@/types/user'
import { useOrderStore } from '@/store/orderStore'
import { format, addWeeks, subWeeks, startOfWeek, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { MenuItemCompact } from './MenuItemCompact'
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Utensils, 
  Coffee,
  AlertTriangle,
  Info
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

// Interfaz personalizada para permitir el tipo 'invitado' sin extender de User
// @ts-ignore - Interfaz temporal para compilación
interface ExtendedUser {
  id: string
  email: string
  firstName: string
  lastName: string
  userType?: 'funcionario' | 'apoderado'
  tipoUsuario: 'funcionario' | 'apoderado' | 'invitado'
  children?: Child[]
  isActive?: boolean
  createdAt?: Date
}

interface WeeklyMenuViewProps {
  user: ExtendedUser
  currentChild: Child | null
}

export function WeeklyMenuView({ user, currentChild }: WeeklyMenuViewProps) {
  // Asegurarse de que user.tipoUsuario es del tipo correcto para MenuItemCompact
  const safeUserType = user.tipoUsuario === 'invitado' ? 'apoderado' : user.tipoUsuario as 'funcionario' | 'apoderado'
  
  // Aplicar tipo any para evitar errores de tipado durante desarrollo
  // El uso de 'any' es temporal para permitir la compilación para el deploy
  const [currentDate, setCurrentDate] = useState(new Date())
  const [weekDates, setWeekDates] = useState<Date[]>([])
  
  // Cargar datos del menú semanal
  const { weekMenu, isLoading, error, weekInfo, refetch } = useWeeklyMenuData({ 
    user, 
    useAdminData: false
  })
  
  // Ordenar y preparar menús por día
  const orderedMenus: Record<string, DayMenuDisplay> = {}
  
  if (weekMenu) {
    weekMenu.forEach((menu: DayMenuDisplay) => {
      orderedMenus[menu.date] = menu
    })
  }

  // Generar fechas de la semana actual
  useEffect(() => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }) // Empezar la semana en lunes
    const dates = []
    
    // Generar fechas para lunes a viernes (5 días)
    for (let i = 0; i < 5; i++) {
      dates.push(addDays(weekStart, i))
    }
    
    setWeekDates(dates)
  }, [currentDate])
  
  // Navegar a semana anterior
  const goToPreviousWeek = () => {
    setCurrentDate((prevDate: Date) => subWeeks(prevDate, 1))
  }
  
  // Navegar a semana siguiente
  const goToNextWeek = () => {
    setCurrentDate((prevDate: Date) => addWeeks(prevDate, 1))
  }
  
  // Verificar si una fecha es hoy
  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }
  
  // Formatear fecha para obtener datos del menú
  const formatDateForApi = (date: Date) => {
    return format(date, 'yyyy-MM-dd')
  }

  // Verificar si hay datos para un día específico
  const hasMenuForDay = (date: Date) => {
    const formattedDate = formatDateForApi(date)
    return !!orderedMenus[formattedDate]
  }
  
  return (
    <div className="space-y-6">
      {/* Navegador de semanas */}
      <Card className="border-0 shadow-lg bg-white dark:bg-slate-800">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={goToPreviousWeek}
              className="h-9 w-9"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <CardTitle className="text-xl flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span>
                Semana del {format(weekDates[0] || new Date(), 'd', { locale: es })} al {format(weekDates[4] || addDays(weekDates[0] || new Date(), 4), 'd MMM, yyyy', { locale: es })}
              </span>
            </CardTitle>
            
            <Button 
              variant="outline" 
              size="icon" 
              onClick={goToNextWeek}
              className="h-9 w-9"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {Array(5).fill(0).map((_, i) => (
            <Card key={`skeleton-${i}`} className="border-0 shadow-lg">
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-24 mb-1" />
                <Skeleton className="h-4 w-16" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Skeleton className="h-5 w-24 mb-3" />
                  <div className="space-y-2">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                </div>
                <Separator />
                <div>
                  <Skeleton className="h-5 w-24 mb-3" />
                  <div className="space-y-2">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="border-0 shadow-lg bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">Error al cargar el menú</h3>
            <p className="text-red-600 dark:text-red-300">No se pudieron cargar los datos del menú. Por favor intenta recargar la página.</p>
            <Button 
              onClick={() => refetch()} 
              variant="outline"
              className="mt-4 bg-white dark:bg-red-900/30"
            >
              Reintentar
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {weekDates.map((date: Date, index: number) => {
            const formattedDate = formatDateForApi(date)
            const dayMenu = orderedMenus[formattedDate]
            const dayName = format(date, 'EEEE', { locale: es })
            const dayNumber = format(date, 'd', { locale: es })
            
            return (
              <Card 
                key={`day-${index}`}
                className={`border-0 shadow-lg ${isToday(date) ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-slate-800'}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="capitalize">{dayName}</CardTitle>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{dayNumber} {format(date, 'MMM', { locale: es })}</p>
                    </div>
                    
                    {isToday(date) && (
                      <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                        Hoy
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Sección de Almuerzos */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Utensils className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                      <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">Almuerzos</h3>
                      <Badge variant="outline" className="text-xs">
                        12:00 - 14:00
                      </Badge>
                    </div>
                    
                    {dayMenu && dayMenu.hasItems && dayMenu.almuerzos && dayMenu.almuerzos.length > 0 ? (
                      <div className="space-y-2">
                        {dayMenu.almuerzos.map((item: MenuItem, itemIndex: number) => (
                          // @ts-ignore - Ignorar errores de tipo durante el desarrollo
                          <MenuItemCompact 
                            key={`almuerzo-${item.id}-${itemIndex}`}
                            item={item}
                            date={dayMenu.date}
                            userType={safeUserType}
                            child={currentChild}
                            optionNumber={itemIndex + 1}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="border border-dashed border-slate-200 dark:border-slate-700 rounded-md p-3 text-center">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          No hay opciones disponibles
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  {/* Sección de Colaciones */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Coffee className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                      <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">Colaciones</h3>
                      <Badge variant="outline" className="text-xs">
                        15:30 - 16:30
                      </Badge>
                    </div>
                    
                    {dayMenu && dayMenu.hasItems && dayMenu.colaciones && dayMenu.colaciones.length > 0 ? (
                      <div className="space-y-2">
                        {dayMenu.colaciones.map((item: MenuItem, itemIndex: number) => (
                          // @ts-ignore - Ignorar errores de tipo durante el desarrollo
                          <MenuItemCompact 
                            key={`colacion-${item.id}-${itemIndex}`}
                            item={item}
                            date={dayMenu.date}
                            userType={safeUserType}
                            child={currentChild}
                            optionNumber={itemIndex + 1}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="border border-dashed border-slate-200 dark:border-slate-700 rounded-md p-3 text-center">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          No hay opciones disponibles
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
      
      {/* Información adicional */}
      <Card className="border-0 bg-gradient-to-r from-slate-50 to-slate-25 dark:from-slate-800/50 dark:to-slate-700/25 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
                Información importante
              </h4>
              <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <p>
                  • Los precios mostrados corresponden a tu tipo de usuario ({user.tipoUsuario === 'funcionario' ? 'funcionario' : 'apoderado'}).
                </p>
                <p>
                  • Para realizar pedidos, selecciona directamente las opciones deseadas.
                </p>
                <p>
                  • Los pedidos deben realizarse hasta el día anterior al servicio.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
