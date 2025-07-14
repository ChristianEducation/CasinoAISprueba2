"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { useOrderStore } from '@/store/orderStore'
import { User } from '@/types/panel'
import { Users, Plus, User as UserIcon, GraduationCap } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ChildSelectorProps {
  user: User
  isReadOnly: boolean
}

export function ChildSelector({ isReadOnly }: ChildSelectorProps) {
  const { currentChild, setCurrentChild, children } = useOrderStore()
  const [showAddChild, setShowAddChild] = useState(false)

  const activeChildren = children.filter(child => child.active)

  const handleChildSelection = (childId: string) => {
    if (isReadOnly) return
    
    const selectedChild = activeChildren.find(child => child.id === childId)
    setCurrentChild(selectedChild || null)
  }

  const handleAddChildClick = () => {
    setShowAddChild(true)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Seleccionar Hijo
          <Badge variant="outline" className="text-xs">
            {activeChildren.length} hijo{activeChildren.length !== 1 ? 's' : ''} activo{activeChildren.length !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {activeChildren.length === 0 ? (
          <div className="text-center py-8 space-y-4">
            <UserIcon className="w-12 h-12 text-slate-400 mx-auto" />
            <div className="space-y-2">
              <h3 className="font-medium text-slate-900 dark:text-slate-100">
                No tienes hijos registrados
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Para realizar pedidos, primero debes agregar la información de tus hijos en tu perfil.
              </p>
            </div>
            <Button 
              onClick={() => window.location.href = '/perfil'}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Ir a Mi Perfil
            </Button>
          </div>
        ) : (
          <>
            <RadioGroup
              value={currentChild?.id || ''}
              onValueChange={handleChildSelection}
              disabled={isReadOnly}
              className="space-y-3"
            >
              {activeChildren.map((child, index) => (
                <motion.div
                  key={child.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "flex items-center space-x-3 p-3 rounded-lg border transition-colors",
                    currentChild?.id === child.id
                      ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                      : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800",
                    isReadOnly ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                  )}
                >
                  <RadioGroupItem 
                    value={child.id} 
                    id={child.id}
                    disabled={isReadOnly}
                    className="mt-1"
                  />
                  <Label 
                    htmlFor={child.id} 
                    className={cn(
                      "flex-1 cursor-pointer",
                      isReadOnly ? "cursor-not-allowed" : ""
                    )}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <UserIcon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                          <span className="font-medium text-slate-900 dark:text-slate-100">
                            {child.name}
                          </span>
                          {currentChild?.id === child.id && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                              Seleccionado
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-1">
                          <GraduationCap className="w-3 h-3" />
                          <span>{child.curso}</span>
                        </div>
                        {child.rut && (
                          <span className="text-xs">RUT: {child.rut}</span>
                        )}
                      </div>
                    </div>
                  </Label>
                </motion.div>
              ))}
            </RadioGroup>

            {/* Botón para agregar más hijos */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
              <Button
                variant="outline"
                onClick={handleAddChildClick}
                className="w-full gap-2"
                disabled={isReadOnly}
              >
                <Plus className="w-4 h-4" />
                Agregar Otro Hijo
              </Button>
            </div>

            {/* Información del hijo seleccionado */}
            {currentChild && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800"
              >
                <div className="flex items-center gap-2 mb-2">
                  <UserIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-medium text-emerald-900 dark:text-emerald-100">
                    Realizando pedido para:
                  </span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-emerald-700 dark:text-emerald-300">Nombre:</span>
                    <span className="font-medium text-emerald-900 dark:text-emerald-100">
                      {currentChild.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-700 dark:text-emerald-300">Curso:</span>
                    <span className="font-medium text-emerald-900 dark:text-emerald-100">
                      {currentChild.curso}
                    </span>
                  </div>
                  {currentChild.rut && (
                    <div className="flex justify-between">
                      <span className="text-emerald-700 dark:text-emerald-300">RUT:</span>
                      <span className="font-medium text-emerald-900 dark:text-emerald-100">
                        {currentChild.rut}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </>
        )}
      </CardContent>

      {/* Modal para agregar hijo (placeholder) */}
      {showAddChild && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Agregar Hijo</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Para agregar un nuevo hijo, ve a tu perfil y actualiza la información de tus hijos.
            </p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowAddChild(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button 
                onClick={() => {
                  setShowAddChild(false)
                  // Aquí podrías redirigir a /perfil
                }}
                className="flex-1"
              >
                Ir a Perfil
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}