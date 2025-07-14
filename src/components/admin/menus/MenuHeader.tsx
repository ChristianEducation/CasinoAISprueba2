"use client"
import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  BookOpen, 
  Calendar,
  Download,
  Copy,
  RefreshCw,
  Eye,
  EyeOff,
  Trash2,
  BarChart3,
  ExternalLink,
  Users,
  Activity,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AdminWeekMenu } from '@/types/adminMenu'
import { getWeekSummary, exportWeekMenuToCSV, downloadCSV } from '@/lib/adminMenuUtils'

interface WeekStats {
  totalItems: number
  activeItems: number
  totalAlmuerzos: number
  totalColaciones: number
  daysWithMenus: number
}

interface MenuHeaderProps {
  weekMenu: AdminWeekMenu | null
  weekStats: WeekStats | null
  isLoading: boolean
  onRefresh: () => void
  onDuplicateWeek: () => void
  onTogglePublication: (publish: boolean) => void
  onDeleteWeek: () => void
  onTogglePreview?: () => void
  showUserPreview?: boolean
}

export function MenuHeader({ 
  weekMenu, 
  weekStats,
  isLoading, 
  onRefresh, 
  onDuplicateWeek,
  onTogglePublication,
  onDeleteWeek,
  onTogglePreview,
  showUserPreview = false
}: MenuHeaderProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showStatsDialog, setShowStatsDialog] = useState(false)
  const summary = weekMenu ? getWeekSummary(weekMenu) : null

  const handleExportCSV = () => {
    if (!weekMenu) return
    
    const csvContent = exportWeekMenuToCSV(weekMenu)
    const filename = `menu-${weekMenu.weekStart}.csv`
    downloadCSV(csvContent, filename)
  }

  const handleTogglePublication = () => {
    if (!weekMenu) return
    onTogglePublication(!weekMenu.isPublished)
  }

  const handleDeleteWeek = () => {
    setShowDeleteDialog(true)
  }

  const confirmDeleteWeek = () => {
    onDeleteWeek()
    setShowDeleteDialog(false)
  }

  return (
    <>
      <motion.div 
        className="bg-gradient-to-r from-white via-blue-50 to-indigo-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-700 border-b border-slate-200 dark:border-slate-700 shadow-lg"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0">
            {/* Información principal */}
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-emerald-600 rounded-2xl shadow-lg">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white">
                    Gestión de Menús Semanales
                  </h1>
                  <p className="text-lg text-slate-600 dark:text-slate-400 mt-1">
                    Administra las opciones de almuerzos y colaciones para cada día
                  </p>
                </div>
              </div>
              
              {/* Información de la semana actual */}
              {weekMenu && (
                <div className="flex flex-wrap items-center gap-6 text-sm">
                  <div className="flex items-center space-x-3 bg-white dark:bg-slate-800 px-4 py-2 rounded-lg shadow-sm">
                    <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span className="font-semibold text-slate-900 dark:text-white">{weekMenu.weekLabel}</span>
                  </div>
                  
                  {summary && (
                    <div className="flex items-center space-x-4">
                      <Badge 
                        variant="secondary" 
                        className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-3 py-1"
                      >
                        {summary.totalAlmuerzos} Almuerzos
                      </Badge>
                      <Badge 
                        variant="secondary" 
                        className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 px-3 py-1"
                      >
                        {summary.totalColaciones} Colaciones
                      </Badge>
                      <Badge 
                        variant="secondary" 
                        className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 px-3 py-1"
                      >
                        {summary.activeDays} Días activos
                      </Badge>
                      {weekMenu.isPublished ? (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 px-3 py-1">
                          <Eye className="w-3 h-3 mr-1" />
                          Publicado
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-3 py-1">
                          <EyeOff className="w-3 h-3 mr-1" />
                          No publicado
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Interconnection Status */}
              {weekMenu && (
                <div className="mt-4 flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
                    <Activity className="w-4 h-4 text-green-500" />
                    <span>Conectado con:</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50 dark:bg-green-900/20">
                      Menú Público
                    </Badge>
                    <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50 dark:bg-green-900/20">
                      Mi Pedido
                    </Badge>
                  </div>
                </div>
              )}
            </div>

            {/* Controles */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefresh}
                  disabled={isLoading}
                  className="flex items-center space-x-2 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Actualizar</span>
                </Button>
                
                {weekStats && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowStatsDialog(true)}
                    className="flex items-center space-x-2 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span className="hidden sm:inline">Estadísticas</span>
                  </Button>
                )}
                
                {onTogglePreview && (
                  <Button
                    variant={showUserPreview ? "default" : "outline"}
                    size="sm"
                    onClick={onTogglePreview}
                    className="flex items-center space-x-2"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="hidden sm:inline">Vista Usuario</span>
                  </Button>
                )}
                
                {weekMenu && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportCSV}
                      className="flex items-center space-x-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                    >
                      <Download className="w-4 h-4" />
                      <span className="hidden sm:inline">Exportar</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onDuplicateWeek}
                      className="flex items-center space-x-2 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                    >
                      <Copy className="w-4 h-4" />
                      <span className="hidden sm:inline">Duplicar</span>
                    </Button>
                  </>
                )}
              </div>

              {/* Quick Links */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('/menu', '_blank')}
                  className="flex items-center space-x-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="hidden sm:inline">Ver Sitio</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('/mi-pedido', '_blank')}
                  className="flex items-center space-x-2 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                >
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">Pedidos</span>
                </Button>
              </div>

              {/* Publication and Delete Actions */}
              {weekMenu && (
                <div className="flex items-center space-x-2">
                  <Button
                    variant={weekMenu.isPublished ? "secondary" : "default"}
                    size="sm"
                    onClick={handleTogglePublication}
                    className="flex items-center space-x-2"
                  >
                    {weekMenu.isPublished ? (
                      <>
                        <EyeOff className="w-4 h-4" />
                        <span className="hidden sm:inline">Despublicar</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        <span className="hidden sm:inline">Publicar</span>
                      </>
                    )}
                  </Button>

                  {weekMenu.totalItems > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteWeek}
                      className="flex items-center space-x-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Eliminar</span>
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Dialog de estadísticas mejorado */}
      <Dialog open={showStatsDialog} onOpenChange={setShowStatsDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Estadísticas Detalladas de la Semana</span>
            </DialogTitle>
          </DialogHeader>
          {weekStats && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {weekStats.totalItems}
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                    Total Items
                  </div>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {weekStats.activeItems}
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400 mt-1">
                    Items Activos
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl">
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {weekStats.totalAlmuerzos}
                  </div>
                  <div className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                    Almuerzos
                  </div>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-xl">
                  <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                    {weekStats.totalColaciones}
                  </div>
                  <div className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                    Colaciones
                  </div>
                </div>
              </div>
              
              <div className="text-center p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-xl">
                <div className="text-2xl font-bold text-slate-600 dark:text-slate-400">
                  {weekStats.daysWithMenus}/5
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Días con Menús Configurados
                </div>
              </div>

              {/* Impact Metrics */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Impacto en Usuarios</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
                      {weekMenu?.isPublished ? '∞' : '0'}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      Usuarios Impactados
                    </div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                      {weekMenu?.isPublished ? '100%' : '0%'}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      Disponibilidad
                    </div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-teal-600 dark:text-teal-400">
                      {weekStats.daysWithMenus > 0 ? 'Activo' : 'Inactivo'}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      Estado del Servicio
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación de eliminación */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar menú semanal?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente todos los menús de esta semana.
              Los usuarios no podrán ver ni realizar pedidos para esta semana.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteWeek}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
            >
              Eliminar Todo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}