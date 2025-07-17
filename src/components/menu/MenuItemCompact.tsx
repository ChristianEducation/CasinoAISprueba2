"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MinusCircle, PlusCircle, Info } from 'lucide-react'
import { useOrderStore } from '@/store/orderStore'
import { MenuItem } from '@/types/menu'
import { Child } from '@/types/user'

interface MenuItemCompactProps {
  item: MenuItem
  date: string
  optionNumber: number
  userType: 'funcionario' | 'apoderado'
  child: Child | null
}

export function MenuItemCompact({
  item,
  date,
  optionNumber,
  userType,
  child
}: MenuItemCompactProps) {
  // Estados locales
  const [quantity, setQuantity] = useState(0)
  
  // Acceder a orderStore para manejar selecciones
  const { 
    selectionsByChild, 
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
    
    // Siempre añadir el ítem, permitiendo duplicados para representar múltiples cantidades
    addItemToSelection(item.date, item.type, item, child);
  }
  
  const handleRemoveItem = () => {
    if (quantity <= 0) return;
    
    // Si llegamos a 0, eliminamos el ítem; de lo contrario, eliminamos una unidad
    setQuantity(quantity - 1);
    
    // Eliminar una unidad específica
    removeItemFromSelection(item.date, item.id, item.type, child);
  }

  return (
    <Card 
      className={`border-0 shadow-sm ${
        item.available
          ? quantity > 0
            ? 'bg-blue-50 dark:bg-blue-900/30'
            : 'bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600'
          : 'bg-slate-50 dark:bg-slate-800 opacity-75'
      }`}
    >
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <Badge 
                variant="outline"
                className={`text-xs px-1 py-0 h-5 ${
                  item.type === 'almuerzo'
                    ? 'border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-300'
                    : 'border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300'
                }`}
              >
                Opción {optionNumber}
              </Badge>
              
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {formatPrice(item.price)}
              </span>
            </div>
            
            <h4 className="font-medium text-sm text-slate-800 dark:text-slate-200 truncate mb-1">
              {item.name}
            </h4>
            
            {/* Controles de cantidad */}
            <div className="flex items-center justify-between mt-2">
              <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {item.description?.substring(0, 30)}{item.description?.length > 30 ? '...' : ''}
              </div>
              
              {item.available && (
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full w-6 h-6 p-0 bg-slate-100 border-slate-300 hover:bg-slate-200"
                    onClick={handleRemoveItem}
                    disabled={quantity === 0}
                  >
                    <MinusCircle className="w-3.5 h-3.5 text-slate-700 dark:text-slate-200" />
                  </Button>
                  
                  <span className={`text-sm font-semibold ${
                    quantity > 0 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-slate-600 dark:text-slate-400'
                  }`}>
                    {quantity}
                  </span>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full w-6 h-6 p-0 bg-blue-100 border-blue-300 hover:bg-blue-200"
                    onClick={handleAddItem}
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-blue-700 dark:text-blue-300" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
