"use client"
import { motion } from 'framer-motion'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { WeekNavigator } from '@/components/admin/menus/WeekNavigator'
import { DayMenuContainer } from '@/components/admin/menus/DayMenuContainer'
import { MenuItemModal } from '@/components/admin/menus/MenuItemModal'
import { DefaultColacionesActions } from '@/components/admin/menus/DefaultColacionesActions'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  AlertTriangle, 
  RefreshCw, 
  Calendar, 
  Plus,
  Eye,
  ExternalLink,
  BarChart3
} from 'lucide-react'
import { AdminMenuItem } from '@/types/adminMenu'
import { useAdminMenus } from '@/hooks/useAdminMenus'

export default function AdminMenusPage() {
  const {
    currentWeek,
    weekMenu,
    weekStats,
    isLoading,
    error,
    modalState,
    navigateWeek,
    getWeekNavigation,
    openModal,
    closeModal,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    duplicateWeek,
    toggleWeekPublication,
    refreshMenu
  } = useAdminMenus()

  const navigation = getWeekNavigation()

  // Obtener códigos existentes para validación
  const existingCodes = weekMenu?.days.flatMap(day => 
    [...day.almuerzos, ...day.colaciones].map(item => item.code)
  ) || []

  const handleAddItem = (date: string, day: string, type: 'almuerzo' | 'colacion') => {
    openModal('create', date, day, type)
  }

  const handleEditItem = (item: AdminMenuItem) => {
    openModal('edit', item.date, item.day, item.type, item)
  }

  const handleDuplicateWeek = async () => {
    if (!currentWeek) return
    
    const nextWeek = new Date(currentWeek)
    nextWeek.setDate(nextWeek.getDate() + 7)
    const targetWeek = nextWeek.toISOString().split('T')[0]
    
    await duplicateWeek(currentWeek, targetWeek)
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshMenu}
                className="ml-4"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reintentar
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      {/* Header ultra compacto */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
            {/* Información principal compacta */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                <div className="p-1.5 bg-gradient-to-br from-blue-500 to-emerald-600 rounded-lg flex-shrink-0">
                  <BarChart3 className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                    Gestión de Menús
                  </h1>
                  <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                    Administra las opciones de almuerzos y colaciones
                  </p>
                </div>
              </div>
              
              {/* Stats rápidas compactas */}
              {weekMenu && weekStats && (
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 flex-shrink-0 text-xs px-2 py-0.5">
                    {weekStats.totalItems} items
                  </Badge>
                  <Badge variant="outline" className="bg-green-50 text-green-700 flex-shrink-0 text-xs px-2 py-0.5">
                    {weekStats.activeItems} activos
                  </Badge>
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 flex-shrink-0 text-xs px-2 py-0.5">
                    {weekStats.daysWithMenus}/5 días
                  </Badge>
                  {weekMenu.isPublished ? (
                    <Badge className="bg-green-100 text-green-700 flex-shrink-0 text-xs px-2 py-0.5">
                      <Eye className="w-2.5 h-2.5 mr-1" />
                      Publicado
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="flex-shrink-0 text-xs px-2 py-0.5">
                      No publicado
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Controles compactos */}
            <div className="flex items-center space-x-1.5 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshMenu}
                disabled={isLoading}
                className="h-7 px-2 text-xs"
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('/menu', '_blank')}
                className="h-7 px-2 text-xs"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Ver Sitio
              </Button>
              
              {weekMenu && (
                <>
                  <Button
                    variant={weekMenu.isPublished ? "secondary" : "default"}
                    size="sm"
                    onClick={() => toggleWeekPublication(!weekMenu.isPublished)}
                    className="h-7 px-2 text-xs"
                  >
                    {weekMenu.isPublished ? 'Despublicar' : 'Publicar'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDuplicateWeek}
                    className="h-7 px-2 text-xs"
                  >
                    Duplicar
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal compacto */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4">
        <div className="space-y-4">
          {/* Navegador de semanas compacto */}
          <WeekNavigator
            navigation={navigation}
            onNavigate={navigateWeek}
            isLoading={isLoading}
          />

          {/* Acciones de colaciones predeterminadas compactas */}
          <DefaultColacionesActions
            weekStart={currentWeek}
            onMenuUpdated={refreshMenu}
          />

          {/* Resumen rápido compacto */}
          {weekStats && weekMenu && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-900/20 dark:to-emerald-900/20">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {weekMenu.weekLabel}
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                          {weekStats.totalItems} items • {weekStats.activeItems} activos
                        </p>
                      </div>
                    </div>
                    
                    {weekStats.totalItems === 0 && weekMenu.days.length > 0 && (
                      <Button
                        size="sm"
                        onClick={() => handleAddItem(weekMenu.days[0].date, weekMenu.days[0].day, 'almuerzo')}
                        className="flex-shrink-0 h-7 px-2 text-xs"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Agregar Primer Menú
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Grid de días - Ultra compacto */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-[500px]" />
              ))}
            </div>
          ) : weekMenu ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3"
            >
              {weekMenu.days.map((dayMenu, index) => (
                <motion.div
                  key={dayMenu.date}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * index }}
                  className="min-w-0 h-[500px]" // Altura más compacta
                >
                  <DayMenuContainer
                    dayMenu={dayMenu}
                    onAddItem={(type: 'almuerzo' | 'colacion') => handleAddItem(dayMenu.date, dayMenu.day, type)}
                    onEditItem={handleEditItem}
                    onDeleteItem={(item: AdminMenuItem) => item.id && deleteMenuItem(item.id)}
                    isLoading={isLoading}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-medium text-slate-900 dark:text-slate-100 mb-2">
                No hay datos de menú disponibles
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                Comienza agregando menús para esta semana
              </p>
              <Button onClick={refreshMenu} className="gap-2 h-8 px-3 text-sm">
                <RefreshCw className="w-4 h-4" />
                Actualizar
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Modal para agregar/editar menús */}
      <MenuItemModal
        modalState={modalState}
        onClose={closeModal}
        onSave={createMenuItem}
        onUpdate={updateMenuItem}
        existingCodes={existingCodes}
        weekStart={currentWeek}
      />
    </AdminLayout>
  )
}