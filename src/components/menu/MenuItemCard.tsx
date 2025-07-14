"use client"

import { motion } from 'framer-motion'
import { Check, X, Info, DollarSign } from 'lucide-react'
import { MenuItem } from '@/types/menu'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface MenuItemCardProps {
  item: MenuItem
  userType: 'apoderado' | 'funcionario'
  index: number
  optionNumber: number
}

export function MenuItemCard({ item, userType, index, optionNumber }: MenuItemCardProps) {
  const [showFullDescription, setShowFullDescription] = useState(false)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price)
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
          ? 'bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600'
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

            {/* Precio */}
            <div className="text-right flex-shrink-0">
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
              <div className="text-xs text-slate-500 dark:text-slate-400">
                CLP
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
