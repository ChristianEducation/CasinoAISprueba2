"use client"
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Edit, Trash2, Eye, EyeOff, DollarSign, Utensils, Coffee, MoreVertical, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { AdminMenuItem } from '@/types/adminMenu'
import { PRICES } from '@/types/panel'

interface MenuItemCardProps {
  item: AdminMenuItem
  optionNumber: number
  onEdit: (item: AdminMenuItem) => void
  onDelete: (item: AdminMenuItem) => void
  isLoading?: boolean
}

export function MenuItemCard({ 
  item, 
  optionNumber,
  onEdit, 
  onDelete, 
  isLoading = false
}: MenuItemCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const handleEdit = () => {
    onEdit(item)
  }

  const handleDelete = () => {
    setShowDeleteDialog(true)
  }

  const confirmDelete = () => {
    onDelete(item)
    setShowDeleteDialog(false)
  }

  // Determinar el precio a mostrar
  const getDisplayPrice = () => {
    if (item.price && item.price > 0) {
      return item.price
    }
    return item.type === 'almuerzo' 
      ? PRICES.apoderado.almuerzo 
      : PRICES.apoderado.colacion
  }

  const hasCustomPrice = item.price && item.price > 0
  const displayPrice = getDisplayPrice()

  // Lógica inteligente para título y descripción
  const getSmartTitleAndDescription = () => {
    const title = item.title || item.description || 'Sin título'
    const description = item.description || ''
    
    // Si title y description son iguales, solo mostrar uno
    if (title === description) {
      return {
        displayTitle: title,
        displayDescription: null,
        hasDescription: false
      }
    }
    
    // Si description contiene title, solo mostrar description
    if (description.includes(title) && description.length > title.length) {
      return {
        displayTitle: description,
        displayDescription: null,
        hasDescription: false
      }
    }
    
    // Si title contiene description, solo mostrar title
    if (title.includes(description) && title.length > description.length) {
      return {
        displayTitle: title,
        displayDescription: null,
        hasDescription: false
      }
    }
    
    // Si son diferentes y ambos tienen contenido útil
    if (item.title && item.description && item.title !== item.description) {
      return {
        displayTitle: title,
        displayDescription: description,
        hasDescription: true
      }
    }
    
    // Por defecto, mostrar solo el título
    return {
      displayTitle: title,
      displayDescription: null,
      hasDescription: false
    }
  }

  const { displayTitle, displayDescription, hasDescription } = getSmartTitleAndDescription()
  
  // Determinar si el texto es muy largo
  const isLongTitle = displayTitle.length > 35
  const isLongDescription = displayDescription && displayDescription.length > 50
  const shouldShowExpandButton = isLongTitle || isLongDescription

  // Configuración de colores por tipo
  const typeConfig = {
    almuerzo: {
      icon: Utensils,
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      textColor: 'text-blue-700 dark:text-blue-300',
      badgeColor: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
    },
    colacion: {
      icon: Coffee,
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
      borderColor: 'border-emerald-200 dark:border-emerald-800',
      textColor: 'text-emerald-700 dark:text-emerald-300',
      badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
    }
  }

  const config = typeConfig[item.type]
  const TypeIcon = config.icon

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="group w-full"
      >
        <Card className={`relative overflow-hidden transition-all duration-200 hover:shadow-md w-full ${
          item.active 
            ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600' 
            : 'bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600 opacity-75'
        }`}>
          <CardContent className="p-2">
            {/* Header ultra compacto */}
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <div className={`p-0.5 rounded ${config.bgColor} ${config.borderColor} border flex-shrink-0`}>
                  <TypeIcon className={`w-2.5 h-2.5 ${config.textColor}`} />
                </div>
                <Badge className={`text-xs font-bold ${config.badgeColor} flex-shrink-0 px-1.5 py-0.5`}>
                  Opción {optionNumber}
                </Badge>
              </div>
              
              {/* Menú de acciones ultra pequeño */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    disabled={isLoading}
                  >
                    <MoreVertical className="w-2.5 h-2.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-24">
                  <DropdownMenuItem onClick={handleEdit} className="text-xs py-1">
                    <Edit className="w-2.5 h-2.5 mr-1" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDelete} className="text-red-600 text-xs py-1">
                    <Trash2 className="w-2.5 h-2.5 mr-1" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Contenido principal ultra compacto */}
            <div className="space-y-1.5">
              {/* Título inteligente ultra compacto */}
              <div>
                <h4 className={`font-semibold text-xs leading-tight admin-card-text ${
                  item.active 
                    ? 'text-slate-900 dark:text-slate-100' 
                    : 'text-slate-600 dark:text-slate-400'
                } ${!isExpanded && isLongTitle ? 'text-truncate-2' : ''}`} 
                title={isLongTitle ? displayTitle : undefined}>
                  {displayTitle}
                </h4>
              </div>

              {/* Descripción adicional ultra compacta */}
              {hasDescription && displayDescription && (
                <div className={`${config.bgColor} ${config.borderColor} border rounded p-1.5`}>
                  <p className={`text-xs leading-tight admin-card-text ${
                    item.active 
                      ? 'text-slate-700 dark:text-slate-300' 
                      : 'text-slate-500 dark:text-slate-500'
                  } ${!isExpanded && isLongDescription ? 'text-truncate-2' : ''}`} 
                  title={isLongDescription ? displayDescription : undefined}>
                    {displayDescription}
                  </p>
                </div>
              )}

              {/* Botón para expandir/contraer ultra pequeño */}
              {shouldShowExpandButton && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex items-center gap-0.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp size={8} />
                      <span className="text-xs">Menos</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown size={8} />
                      <span className="text-xs">Más</span>
                    </>
                  )}
                </button>
              )}

              {/* Estados compactos */}
              <div className="flex items-center gap-1">
                <Badge className={`text-xs ${
                  item.active 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                } px-1 py-0.5`}>
                  {item.active ? <Eye className="w-2 h-2" /> : <EyeOff className="w-2 h-2" />}
                </Badge>
                
                {hasCustomPrice && (
                  <Badge className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 px-1 py-0.5">
                    <DollarSign className="w-2 h-2" />
                  </Badge>
                )}
              </div>

              {/* Footer con precio ultra compacto */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  $
                </span>
                <div className="text-right">
                  <span className={`text-xs font-bold ${
                    item.active 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-slate-500 dark:text-slate-500'
                  }`}>
                    {displayPrice.toLocaleString('es-CL')}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar menú?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el menú &quot;{displayTitle}&quot; (Opción {optionNumber}).
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}