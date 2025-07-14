"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DayMenuDisplay, MenuItem } from '@/types/menu'
import { User } from '@/types/panel'
import { useOrderStore } from '@/store/orderStore'
import { MenuService } from '@/services/menuService'
import { MenuType } from './MenuTypeSelector'
import { 
  Utensils, 
  Coffee, 
  Clock, 
  CheckCircle2, 
  User as UserIcon, 
  AlertCircle,
  Calendar,
  Moon,
  Sun,
  Trash2,
  DollarSign,
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface DaySelectorProps {
  dayMenu: DayMenuDisplay
  user: User
  isReadOnly: boolean
  menuType: MenuType
}

interface MenuItemOptionProps {
  item: MenuItem
  optionNumber: number
  isSelected: boolean
  isReadOnly: boolean
  isPastDay: boolean
  isWeekend: boolean
}

function MenuItemOption({ item, optionNumber, isSelected, isReadOnly, isPastDay, isWeekend }: MenuItemOptionProps) {
  const isDisabled = isReadOnly || !item.available || isPastDay || isWeekend

  return (
    <div className="flex items-start space-x-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      <RadioGroupItem 
        value={item.id} 
        id={item.id}
        disabled={isDisabled}
        className="mt-1 flex-shrink-0"
      />
      <Label 
        htmlFor={item.id} 
        className={cn(
          "flex-1 cursor-pointer min-w-0 space-y-2",
          isDisabled ? "cursor-not-allowed opacity-50" : ""
        )}
      >
        {/* Header del item */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Badge variant="outline" className="text-xs font-medium flex-shrink-0 px-2 py-0.5">
              Opción {optionNumber}
            </Badge>
            {isSelected && (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <DollarSign className="w-3 h-3 text-green-600" />
            <span className="text-sm font-bold text-green-600">
              {item.price.toLocaleString('es-CL')}
            </span>
          </div>
        </div>

        {/* Título del item */}
        <div className="space-y-1">
          <h4 className="font-medium text-sm text-slate-900 dark:text-slate-100 leading-tight">
            {item.name}
          </h4>
          
          {/* Descripción compacta */}
          {item.description && item.description !== item.name && (
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
              {item.description}
            </p>
          )}
        </div>

        {/* Estados del item */}
        <div className="flex items-center gap-2">
          {!item.available && !isPastDay && !isWeekend && (
            <Badge variant="destructive" className="text-xs px-2 py-0.5">
              No disponible
            </Badge>
          )}
          {isSelected && (
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-xs px-2 py-0.5">
              Seleccionado
            </Badge>
          )}
        </div>
      </Label>
    </div>
  )
}

export function DaySelector({ dayMenu, user, isReadOnly, menuType }: DaySelectorProps) {
  const { 
    selectionsByChild, 
    currentChild, 
    updateSelectionByChild,
    removeSelectionByChild,
  } = useOrderStore()

  // Usar el servicio mejorado para verificar el estado del día
  const dayDate = MenuService.createLocalDate(dayMenu.date)
  const isPastDay = MenuService.isPastDay(dayMenu.date)
  const isWeekend = MenuService.isWeekend(dayMenu.date)
  const isCurrentDay = !isPastDay && !isWeekend && MenuService.formatToDateString(new Date()) === dayMenu.date
  const isFutureDay = !isPastDay && !isCurrentDay

  // Obtener selecciones actuales para este día y hijo
  const getCurrentSelection = () => {
    if (user.tipoUsuario === 'funcionario') {
      return selectionsByChild.find(s => s.date === dayMenu.date && !s.hijo)
    } else {
      return selectionsByChild.find(s => 
        s.date === dayMenu.date && s.hijo?.id === currentChild?.id
      )
    }
  }

  const currentSelection = getCurrentSelection()
  const selectedAlmuerzo = currentSelection?.almuerzo?.id || ''
  const selectedColacion = currentSelection?.colacion?.id || ''

  // Filtrar items según el tipo de menú
  const menuItems = menuType === 'almuerzo' ? dayMenu.almuerzos : dayMenu.colaciones
  const selectedItemId = menuType === 'almuerzo' ? selectedAlmuerzo : selectedColacion
  const hasItems = menuItems.length > 0

  const handleItemChange = (itemId: string) => {
    if (isReadOnly || isPastDay || isWeekend) return
    
    const selectedItem = menuItems.find(item => item.id === itemId)
    const targetChild = user.tipoUsuario === 'funcionario' ? null : currentChild
    
    updateSelectionByChild(
      dayMenu.date,
      menuType,
      selectedItem,
      targetChild
    )
  }

  // Función para remover item específico
  const removeItem = () => {
    if (isReadOnly || isPastDay || isWeekend) return
    
    const targetChild = user.tipoUsuario === 'funcionario' ? null : currentChild
    updateSelectionByChild(dayMenu.date, menuType, undefined, targetChild)
  }

  // Función para remover toda la selección del día
  const removeEntireSelection = () => {
    if (isReadOnly || isPastDay || isWeekend) return
    
    const targetChildId = user.tipoUsuario === 'funcionario' ? undefined : currentChild?.id
    removeSelectionByChild(dayMenu.date, targetChildId)
  }

  // Para apoderados, verificar que haya un hijo seleccionado
  const canMakeSelection = (user.tipoUsuario === 'funcionario' || currentChild) && !isPastDay && !isWeekend

  // Determinar el color y estilo del card según el estado del día
  const getCardClassName = () => {
    if (isPastDay) {
      return "h-full opacity-60 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700"
    }
    if (isWeekend) {
      return "h-full bg-purple-50/50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800"
    }
    if (isCurrentDay) {
      return "h-full border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 shadow-lg ring-2 ring-blue-200 dark:ring-blue-800"
    }
    if (selectedItemId) {
      return "h-full border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20"
    }
    return "h-full hover:shadow-md transition-shadow duration-200"
  }

  // Obtener icono según el día
  const getDayIcon = () => {
    if (isPastDay) return <Clock className="w-4 h-4" />
    if (isCurrentDay) return <Sun className="w-4 h-4" />
    if (isWeekend) return <Moon className="w-4 h-4" />
    return <Calendar className="w-4 h-4" />
  }

  // Obtener badge del estado
  const getDayStatusBadge = () => {
    if (isPastDay) {
      return (
        <Badge variant="secondary" className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs px-2 py-0.5">
          <Clock className="w-3 h-3 mr-1" />
          Pasado
        </Badge>
      )
    }
    if (isWeekend) {
      return (
        <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 text-xs px-2 py-0.5">
          <Moon className="w-3 h-3 mr-1" />
          Fin de semana
        </Badge>
      )
    }
    if (isCurrentDay) {
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs px-2 py-0.5">
          <Sun className="w-3 h-3 mr-1" />
          Hoy
        </Badge>
      )
    }
    if (isFutureDay && hasItems && !selectedItemId) {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800 text-xs px-2 py-0.5">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Disponible
        </Badge>
      )
    }
    return null
  }

  // Obtener el icono del tipo de menú
  const getMenuTypeIcon = () => {
    return menuType === 'almuerzo' ? <Utensils className="w-4 h-4" /> : <Coffee className="w-4 h-4" />
  }

  // Obtener el precio del item seleccionado
  const getSelectedItemPrice = () => {
    const selectedItem = menuItems.find(item => item.id === selectedItemId)
    return selectedItem?.price || 0
  }

  // Obtener el número de opción del item seleccionado
  const getSelectedOptionNumber = () => {
    const selectedIndex = menuItems.findIndex(item => item.id === selectedItemId)
    return selectedIndex >= 0 ? selectedIndex + 1 : 0
  }

  return (
    <Card className={getCardClassName()}>
      {/* Header compacto */}
      <CardHeader className="pb-3">
        <CardTitle className="space-y-2">
          {/* Primera línea: Día y fecha */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {getDayIcon()}
              <span className="capitalize font-bold text-base truncate">{dayMenu.dayLabel}</span>
              <Badge variant="outline" className="text-xs font-medium flex-shrink-0 px-2 py-0.5">
                {format(dayDate, 'd MMM', { locale: es })}
              </Badge>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {getDayStatusBadge()}
            </div>
          </div>

          {/* Segunda línea: Usuario y acciones */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 flex-1 min-w-0">
              <UserIcon className="w-3 h-3 flex-shrink-0" />
              {user.tipoUsuario === 'apoderado' && currentChild ? (
                <span className="truncate">Para: <strong>{currentChild.name}</strong></span>
              ) : user.tipoUsuario === 'funcionario' ? (
                <span>Pedido personal</span>
              ) : (
                <span className="text-amber-600">Selecciona un hijo</span>
              )}
            </div>
            
            {/* Acciones de eliminación */}
            {!isReadOnly && !isPastDay && !isWeekend && (currentSelection?.almuerzo || currentSelection?.colacion) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={removeEntireSelection}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 h-auto p-1 flex-shrink-0"
                title="Eliminar toda la selección del día"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {isWeekend ? (
          <div className="text-center py-6 text-purple-600 dark:text-purple-400">
            <Moon className="w-10 h-10 mx-auto mb-2 opacity-60" />
            <h3 className="font-medium text-sm mb-1">Fin de Semana</h3>
            <p className="text-xs opacity-80">No hay servicio de casino</p>
          </div>
        ) : !canMakeSelection && !isPastDay ? (
          <div className="text-center py-6 text-slate-500 dark:text-slate-400">
            <UserIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Selecciona un hijo para hacer el pedido</p>
          </div>
        ) : isPastDay ? (
          <div className="text-center py-6 text-slate-500 dark:text-slate-400">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No se pueden hacer pedidos para días pasados</p>
            {selectedItemId && (
              <div className="mt-3 p-3 rounded-lg bg-slate-100 dark:bg-slate-800">
                <p className="text-xs font-medium mb-1">Pedido existente:</p>
                <div className="flex items-center gap-2 text-xs justify-center">
                  {getMenuTypeIcon()}
                  <span className="truncate">Opción {getSelectedOptionNumber()}: {menuItems.find(item => item.id === selectedItemId)?.name}</span>
                </div>
              </div>
            )}
          </div>
        ) : !dayMenu.isAvailable ? (
          <div className="text-center py-6 text-slate-500 dark:text-slate-400">
            {getMenuTypeIcon()}
            <div className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Menú no disponible para este día</p>
          </div>
        ) : (
          <>
            {/* Header del tipo de menú */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {getMenuTypeIcon()}
                <h4 className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">
                  {menuType === 'almuerzo' ? 'Almuerzo' : 'Colación'}
                  {menuType === 'almuerzo' && <span className="text-red-500 ml-1">*</span>}
                </h4>
                <Badge variant="outline" className="text-xs px-2 py-0.5 flex-shrink-0">
                  {menuItems.length} opciones
                </Badge>
              </div>
              {selectedItemId && !isReadOnly && !isPastDay && !isWeekend && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeItem}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 h-auto px-2 py-1 flex-shrink-0 transition-colors"
                  title={`Quitar ${menuType}`}
                >
                  <span className="text-xs font-medium">Quitar</span>
                </Button>
              )}
            </div>
            
            {/* Lista de opciones */}
            {hasItems ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                <RadioGroup
                  value={selectedItemId || ''}
                  onValueChange={handleItemChange}
                  disabled={isReadOnly || isPastDay || isWeekend}
                  className="space-y-2"
                >
                  {menuItems.map((item, itemIndex) => (
                    <MenuItemOption
                      key={item.id}
                      item={item}
                      optionNumber={itemIndex + 1}
                      isSelected={selectedItemId === item.id}
                      isReadOnly={isReadOnly}
                      isPastDay={isPastDay}
                      isWeekend={isWeekend}
                    />
                  ))}
                </RadioGroup>
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400 italic text-center py-4">
                No hay opciones de {menuType === 'almuerzo' ? 'almuerzo' : 'colación'} disponibles
              </p>
            )}

            {/* Resumen de selección */}
            {selectedItemId && (
              <div className={cn(
                "p-3 rounded-lg border",
                isPastDay 
                  ? "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                  : isCurrentDay
                  ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                  : "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                      Opción {getSelectedOptionNumber()}: {menuItems.find(item => item.id === selectedItemId)?.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <DollarSign className="w-3 h-3 text-green-600" />
                    <span className="text-sm font-bold text-green-600">
                      {getSelectedItemPrice().toLocaleString('es-CL')}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}