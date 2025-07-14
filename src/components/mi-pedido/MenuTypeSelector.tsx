"use client"

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Utensils, Coffee } from 'lucide-react'

export type MenuType = 'almuerzo' | 'colacion'

interface MenuTypeSelectorProps {
  activeType: MenuType
  onTypeChange: (type: MenuType) => void
  almuerzoCount?: number
  colacionCount?: number
}

export function MenuTypeSelector({ 
  activeType, 
  onTypeChange, 
  almuerzoCount = 0, 
  colacionCount = 0 
}: MenuTypeSelectorProps) {
  return (
    <Tabs value={activeType} onValueChange={(value) => onTypeChange(value as MenuType)}>
      <TabsList className="grid w-full grid-cols-2 h-12">
        <TabsTrigger 
          value="almuerzo" 
          className="flex items-center gap-2 text-base font-medium"
        >
          <Utensils className="w-4 h-4" />
          <span>Almuerzos</span>
          {almuerzoCount > 0 && (
            <Badge variant="secondary" className="ml-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              {almuerzoCount}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger 
          value="colacion" 
          className="flex items-center gap-2 text-base font-medium"
        >
          <Coffee className="w-4 h-4" />
          <span>Colaciones</span>
          {colacionCount > 0 && (
            <Badge variant="secondary" className="ml-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              {colacionCount}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
