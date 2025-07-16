"use client"

import { motion } from 'framer-motion'
import { Check, X, Info, DollarSign, MinusCircle, PlusCircle } from 'lucide-react'
import { MenuItem } from '@/types/menu'
import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useOrderStore } from '@/store/orderStore'

interface MenuItemCardProps {
  item: MenuItem
  type: 'almuerzo' | 'colacion'
  date: string
}

const MenuItemCard = ({
  item,
  type,
  date
}: MenuItemCardProps) => {
  const { 
    currentChild, 
    selectionsByChild, 
    updateSelectionByChild, 
    removeItemFromSelection,
    addItemToSelection 
  } = useOrderStore()

  // Estado local para verificar si el ítem está seleccionado
  const [isSelected, setIsSelected] = useState(false)
  const [quantity, setQuantity] = useState(0)
  const [showFullDescription, setShowFullDescription] = useState(false)

  // Verificar si este ítem está seleccionado para este día y niño
  useEffect(() => {
    const selection = selectionsByChild.find(s =>
      s.date === date && 
      (s.hijo?.id === currentChild?.id || (!s.hijo && !currentChild))
    )

    if (selection) {
      // Verificar en el array de múltiples selecciones
      const arrayField = `${type}s` as 'almuerzos' | 'colaciones'
      const itemsArray = selection[arrayField] as MenuItem[] | undefined

      if (itemsArray && itemsArray.length > 0) {
        // Contar cuántas veces aparece este ítem en el array (cantidad)
        const count = itemsArray.filter(i => i.id === item.id).length
        setQuantity(count)
        setIsSelected(count > 0)
      } else {
        // Compatibilidad con selección única
        const singleItem = selection[type] as MenuItem | undefined
        const isSingleSelected = singleItem?.id === item.id
        setIsSelected(isSingleSelected)
        setQuantity(isSingleSelected ? 1 : 0)
      }
    } else {
      setIsSelected(false)
      setQuantity(0)
    }
  }, [selectionsByChild, date, currentChild, item, type])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price)
  }

  const handleSelect = () => {
    if (item.available) {
      // Si está seleccionado, lo deseleccionamos
      // Si no está seleccionado, lo seleccionamos
      if (isSelected) {
        // Eliminar una unidad de este ítem
        removeItemFromSelection(date, item.id, type, currentChild)
      } else {
        // Añadir el ítem (usando la nueva función específica)
        addItemToSelection(date, type, item, currentChild)
      }
    }
  }

  const handleAddItem = () => {
    if (item.available) {
      // Añadir otra unidad del ítem usando la nueva función
      addItemToSelection(date, type, item, currentChild)
    }
  }

  const handleRemoveItem = () => {
    // Eliminar una unidad del ítem
    removeItemFromSelection(date, item.id, type, currentChild)
  }

  const isLongDescription = item.description.length > 120
  const shouldTruncateDescription = isLongDescription && !showFullDescription

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className={`border-0 shadow-md hover:shadow-lg transition-all duration-300 ${
        item.available
          ? quantity > 0
            ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800'
            : 'bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600'
          : 'bg-slate-50 dark:bg-slate-800 opacity-75'
      }`}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            {/* Contenido principal */}
            <div className="flex-1 min-w-0">
              {/* Header con badges */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <Badge className={`${
                  item.type === 'almuerzo' 
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                }`}>
                  Opción {optionNumber}
                </Badge>
                
                {/* Mostrar badge de cantidad si está seleccionado */}
                {quantity > 0 && (
                  <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
                    <Check className="w-3 h-3 mr-1" />
                    {quantity > 1 ? `${quantity} unidades` : 'Seleccionado'}
                  </Badge>
                )}
                
                <Badge variant={item.available ? "default" : "destructive"} className="text-xs">
                  {item.available ? (
                    <>
                      <Check className="w-3 h-3 mr-1" />
                      Disponible
                    </>
                  ) : (
                    <>
                      <X className="w-3 h-3 mr-1" />
                      No disponible
                    </>
                  )}
                </Badge>
              </div>

              {/* Título */}
              <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2 leading-tight">
                {item.name}
              </h4>

              {/* Descripción */}
              <div className="space-y-2">
                <p className={`text-sm text-slate-600 dark:text-slate-400 leading-relaxed ${
                  shouldTruncateDescription ? 'line-clamp-3' : ''
                }`}>
                  {item.description}
                </p>
                
                {isLongDescription && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    className="h-auto p-0 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    <Info className="w-3 h-3 mr-1" />
                    {showFullDescription ? 'Ver menos' : 'Ver descripción completa'}
                  </Button>
                )}
              </div>

              {/* Información del tipo */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-200 dark:border-slate-600">
                <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center">
                    {item.type === 'almuerzo' ? '🍽️' : '🥪'}
                    <span className="ml-1 capitalize">{item.type}</span>
                  </span>
                  <span>
                    {item.type === 'almuerzo' ? '12:00 - 14:00' : '15:30 - 16:30'}
                  </span>
                </div>
                
                <Badge variant="outline" className={`text-xs ${
                  userType === 'funcionario' 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800' 
                    : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800'
                }`}>
                  {userType === 'funcionario' ? 'Precio funcionario' : 'Precio apoderado'}
                </Badge>
              </div>
            </div>

            {/* Precio y controles de cantidad */}
            <div className="text-right flex-shrink-0 flex flex-col items-end">
              <div className="flex items-center space-x-1 mb-1">
                <DollarSign className={`w-4 h-4 ${
                  item.available 
                    ? 'text-slate-700 dark:text-slate-300' 
                    : 'text-slate-400 dark:text-slate-500'
                }`} />
                <span className={`text-xl font-bold ${
                  item.available 
                    ? 'text-slate-900 dark:text-slate-100' 
                    : 'text-slate-500 dark:text-slate-500'
                }`}>
                  {formatPrice(item.price)}
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                CLP
              </div>
              
              {/* Controles de cantidad */}
              {item.available && (
                <div className="flex items-center space-x-2 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full w-8 h-8 p-0 bg-slate-100 border-slate-300 hover:bg-slate-200"
                    onClick={handleRemoveItem}
                    disabled={quantity === 0}
                  >
                    <MinusCircle className="w-4 h-4 text-slate-700 dark:text-slate-200" />
                  </Button>
                  
                  <span className={`text-lg font-semibold ${
                    quantity > 0 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-slate-600 dark:text-slate-400'
                  }`}>
                    {quantity}
                  </span>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full w-8 h-8 p-0 bg-blue-100 border-blue-300 hover:bg-blue-200"
                    onClick={handleAddItem}
                  >
                    <PlusCircle className="w-4 h-4 text-blue-700 dark:text-blue-300" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
