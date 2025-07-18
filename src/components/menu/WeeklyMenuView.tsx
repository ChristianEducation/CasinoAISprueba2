"use client"

import { useState, useMemo, useEffect } from 'react'
import { useWeeklyMenuData } from '@/hooks/useWeeklyMenuData'
import { DayMenuDisplay, MenuItem } from '@/types/menu'
import { Child } from '@/types/user'
import { User } from '@/types/panel'
import { format, addWeeks, subWeeks, startOfWeek, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { 
  Card, 
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
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

interface ExtendedUser {
  id: string
  email: string
  firstName: string
  lastName: string
  userType?: 'funcionario' | 'apoderado'
  tipoUsuario: 'funcionario' | 'apoderado' | 'invitado'
  children?: Child[]
  active: boolean
  createdAt?: Date
}

interface WeeklyMenuViewProps {
  user: ExtendedUser
  currentChild: Child | null
}

export function WeeklyMenuView({ user, currentChild }: WeeklyMenuViewProps) {
  // Asegurarse de que user.tipoUsuario es del tipo correcto para MenuItemCompact
  const safeUserType = user.tipoUsuario === 'invitado' ? 'apoderado' : user.tipoUsuario as 'funcionario' | 'apoderado'
  
  // El uso de 'any' es temporal para permitir la compilación para el deploy
  const [currentDate, setCurrentDate] = useState(new Date())
  const [weekDates, setWeekDates] = useState<Date[]>([])
  
  // Preprocesar el usuario para useWeeklyMenuData para evitar renderizaciones innecesarias
  const safeUser = useMemo(() => {
    try {
      // Asegurarnos de que el usuario tiene todos los campos necesarios
      return {
        id: user.id,
        email: user.email,
        name: user.firstName + ' ' + user.lastName,
        tipoUsuario: user.tipoUsuario === 'invitado' ? 'apoderado' : user.tipoUsuario,
        active: true
      } as User
    } catch (e) {
      console.error("Error preparando usuario para hook:", e);
      // Devolver un usuario mínimo para evitar errores
      return null;
    }
  }, [user.id, user.email, user.tipoUsuario, user.firstName, user.lastName]);
  
  // Cargar datos del menú semanal
  const { weekMenu, isLoading, error } = useWeeklyMenuData({ 
    user: safeUser,
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
  const handlePreviousWeek = () => {
    setCurrentDate((prevDate: Date) => subWeeks(prevDate, 1))
  }
  
  // Navegar a semana siguiente
  const handleNextWeek = () => {
    setCurrentDate((prevDate: Date) => addWeeks(prevDate, 1))
  }
  
  return (
    <div className="space-y-6">
      {/* Navegación semanal */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-800 rounded-lg shadow-sm px-4 py-3">
        <button 
          onClick={handlePreviousWeek} 
          className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 transition"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <div className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-blue-500 dark:text-blue-400" />
          <span className="font-medium text-slate-700 dark:text-slate-300">
            Semana del {format(weekDates[0] || new Date(), 'd', { locale: es })} al {format(weekDates[4] || new Date(), 'd', { locale: es })} de {format(weekDates[0] || new Date(), 'MMMM', { locale: es })}
          </span>
        </div>
        
        <button 
          onClick={handleNextWeek} 
          className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 transition"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
      
      {/* Estado de carga, error o contenido */}
      {isLoading ? (
        <div className="space-y-4">
          <div className="flex justify-center items-center py-8">
            <div className="text-center">
              <Skeleton className="h-8 w-8 rounded-full mx-auto mb-4 animate-pulse" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Cargando menú semanal...
              </p>
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
            <p className="text-sm text-red-600 dark:text-red-400">
              Error al cargar el menú: {error || 'Error desconocido'}.
              Por favor, intenta de nuevo más tarde.
            </p>
          </div>
        </div>
      ) : weekMenu?.length === 0 ? (
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
            <p className="text-sm text-amber-600 dark:text-amber-400">
              No se encontró información de menú para esta semana. Por favor, inténtelo más tarde.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {weekDates.map((date: Date, index: number) => {
            const dayMenu = orderedMenus[format(date, 'yyyy-MM-dd')]
            const dayName = format(date, 'EEEE', { locale: es })
            const dayNumber = format(date, 'd', { locale: es })
            
            return (
              <Card 
                key={`day-${index}`}
                className={`overflow-hidden ${!dayMenu?.hasItems ? 'opacity-60' : ''}`}
              >
                <CardHeader className="pb-2 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800/80">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base font-medium text-slate-700 dark:text-slate-300">
                      {dayName}
                    </CardTitle>
                    <CardDescription className="text-sm font-normal">
                      {dayNumber} {format(date, 'MMM', { locale: es })}
                    </CardDescription>
                  </div>
                </CardHeader>
                
                <CardContent className="p-0">
                  {dayMenu && dayMenu.hasItems ? (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {/* Almuerzos */}
                      <div className="p-4">
                        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                          <Utensils className="w-4 h-4" />
                          <span>Almuerzos</span>
                          <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">
                            12:00 - 14:00
                          </span>
                        </h3>
                        
                        {dayMenu.almuerzos && dayMenu.almuerzos.length > 0 ? (
                          <div className="space-y-3">
                            {dayMenu.almuerzos.map((item: MenuItem, itemIndex: number) => (
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
                          <div className="text-center py-3 text-sm text-slate-500 dark:text-slate-400 italic">
                            No hay opciones disponibles
                          </div>
                        )}
                      </div>
                      
                      {/* Colaciones */}
                      <div className="p-4">
                        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                          <Coffee className="w-4 h-4" />
                          <span>Colaciones</span>
                          <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-1.5 py-0.5 rounded">
                            15:30 - 16:30
                          </span>
                        </h3>
                        
                        {dayMenu.colaciones && dayMenu.colaciones.length > 0 ? (
                          <div className="space-y-3">
                            {dayMenu.colaciones.map((item: MenuItem, itemIndex: number) => (
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
                          <div className="text-center py-3 text-sm text-slate-500 dark:text-slate-400 italic">
                            No hay opciones disponibles
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center">
                      <p className="text-slate-500 dark:text-slate-400">
                        No hay opciones disponibles para este día
                      </p>
                    </div>
                  )}
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
