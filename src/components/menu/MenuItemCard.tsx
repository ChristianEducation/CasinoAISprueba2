"use client"
import { Check, Info, MinusCircle, PlusCircle } from 'lucide-react'
import { MenuItem } from '@/types/menu'
import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useOrderStore } from '@/store/orderStore'
import type { Child } from '@/types/user'

interface MenuItemCardProps {
  item: MenuItem
  date: string
  optionNumber: number
  userType: 'funcionario' | 'apoderado'
  child: Child | null
}

export function MenuItemCard({
  item,
  date,
  optionNumber,
  userType,
  child
}: MenuItemCardProps) {
  // Estados locales
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [quantity, setQuantity] = useState(0)
  
  // Acceder a orderStore para manejar selecciones
  const { 
    selectionsByChild, 
    currentChild, 
    removeItemFromSelection,
    addItemToSelection 
  } = useOrderStore()

  // Comprobar si el ítem está seleccionado y con qué cantidad
  const getSelectedQuantity = (): number => {
    const selection = selectionsByChild.find(
      (s: {date: string; hijo?: Child | null; almuerzos?: MenuItem[]; colaciones?: MenuItem[]}) => 
           s.date === date && 
           (s.hijo?.id === child?.id || (!s.hijo && !child))
    )
    
    if (!selection) return 0;
    
    // Comprobar en el array correspondiente (almuerzos o colaciones)
    const itemArray = item.type === 'almuerzo' ? selection.almuerzos : selection.colaciones;
    
    if (itemArray) {
      // Contar cuántas veces aparece este ítem en el array
      return itemArray.filter((i: MenuItem) => i.id === item.id).length;
    }
    
    // Comprobar en los campos individuales para retrocompatibilidad
    const singleItem = item.type === 'almuerzo' ? selection.almuerzo : selection.colacion;
    return singleItem?.id === item.id ? 1 : 0;
  }
  
  // Actualizar la cantidad cuando cambian las selecciones
  useEffect(() => {
    setQuantity(getSelectedQuantity());
  }, [item, child, date, selectionsByChild]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price)
  }

  const handleAddItem = () => {
    if (!item.available) return;
    
    // Incrementar la cantidad y actualizar la selección en el store
    setQuantity(quantity + 1);
    addItemToSelection(item.date, item.type, item, currentChild);
  }
  
  const handleRemoveItem = () => {
    if (quantity <= 0) return;
    
    // Si llegamos a 0, eliminamos el ítem; de lo contrario, eliminamos una unidad
    setQuantity(quantity - 1);
    
    // Eliminar una unidad específica
    removeItemFromSelection(item.date, item.id, item.type, currentChild);
  }
  
  // Determinar si la descripción es larga para mostrar el botón de ver más
  const isLongDescription = item.description && item.description.length > 120
  const shouldTruncateDescription = isLongDescription && !showFullDescription

  return (
    <div
      className="mb-4"
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
                <div className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                  item.type === 'almuerzo' 
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                }`}>
                  Opción {optionNumber}
                </div>
                
                {/* Mostrar badge de cantidad si está seleccionado */}
                {quantity > 0 && (
                  <div className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
                    <Check className="w-3 h-3 mr-1" />
                    {quantity > 1 ? `${quantity} unidades` : 'Seleccionado'}
                  </div>
                )}
                
                {item.available ? (
                  <div className="inline-flex items-center rounded-md border-0 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-green-500 text-white">
                    Disponible
                  </div>
                ) : (
                  <div className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-red-100 text-red-600 border-red-200">
                    No disponible
                  </div>
                )}
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
                
                <div className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-xs ${
                  userType === 'funcionario' 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800' 
                    : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800'
                }`}>
                  {userType === 'funcionario' ? 'Precio funcionario' : 'Precio apoderado'}
                </div>
              </div>
            </div>

            {/* Precio y controles de cantidad */}
            <div className="text-right flex-shrink-0 flex flex-col items-end">
              <div className="mb-2">
                <span className={`text-xl font-bold ${
                  item.available 
                    ? 'text-slate-900 dark:text-slate-100' 
                    : 'text-slate-500 dark:text-slate-500'
                }`}>
                  {formatPrice(item.price)}
                </span>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  CLP
                </div>
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
    </div>
  )
}
