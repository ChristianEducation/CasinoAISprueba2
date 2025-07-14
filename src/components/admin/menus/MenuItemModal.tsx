"use client"
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Save, AlertCircle, Eye, Utensils, Coffee, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AdminMenuItem, MenuFormData, MenuModalState, MenuOperationResult } from '@/types/adminMenu'
import { generateMenuCode, validateMenuCode } from '@/lib/adminMenuUtils'
import { PRICES } from '@/types/panel'

interface MenuItemModalProps {
  modalState: MenuModalState
  onClose: () => void
  onSave: (itemData: Omit<AdminMenuItem, 'id'>) => Promise<MenuOperationResult>
  onUpdate: (id: string, updates: Partial<AdminMenuItem>) => Promise<MenuOperationResult>
  existingCodes: string[]
  weekStart: string
}

export function MenuItemModal({ 
  modalState, 
  onClose, 
  onSave, 
  onUpdate,
  existingCodes,
  weekStart
}: MenuItemModalProps) {
  const [formData, setFormData] = useState<MenuFormData>({
    type: 'almuerzo',
    code: '',
    title: '',
    description: '',
    active: true,
    price: undefined
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [useCustomPrice, setUseCustomPrice] = useState(false)

  // Inicializar formulario cuando se abre el modal
  useEffect(() => {
    if (modalState.isOpen) {
      if (modalState.mode === 'edit' && modalState.item) {
        const hasCustomPrice = modalState.item.price !== undefined && modalState.item.price > 0
        
        // Manejar título y descripción correctamente
        const title = modalState.item.title || modalState.item.description || ''
        const description = modalState.item.title && modalState.item.description && modalState.item.title !== modalState.item.description 
          ? modalState.item.description 
          : ''

        setFormData({
          type: modalState.item.type,
          code: modalState.item.code,
          title: title,
          description: description,
          active: modalState.item.active,
          price: modalState.item.price
        })
        setUseCustomPrice(hasCustomPrice)
      } else {
        // Modo crear
        const suggestedCode = generateMenuCode(
          modalState.type || 'almuerzo', 
          existingCodes
        )
        setFormData({
          type: modalState.type || 'almuerzo',
          code: suggestedCode,
          title: '',
          description: '',
          active: true,
          price: undefined
        })
        setUseCustomPrice(false)
      }
      setErrors({})
    }
  }, [modalState, existingCodes])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Validar código
    if (!formData.code.trim()) {
      newErrors.code = 'El código es obligatorio'
    } else if (!validateMenuCode(formData.code)) {
      newErrors.code = 'El código debe tener el formato A1, A2, C1, C2, etc.'
    } else if (
      modalState.mode === 'create' && 
      existingCodes.includes(formData.code)
    ) {
      newErrors.code = 'Este código ya existe para este día'
    }

    // Validar título
    if (!formData.title.trim()) {
      newErrors.title = 'El título es obligatorio'
    } else if (formData.title.length > 100) {
      newErrors.title = 'El título no puede tener más de 100 caracteres'
    }

    // Validar descripción (opcional)
    if (formData.description && formData.description.length > 200) {
      newErrors.description = 'La descripción no puede tener más de 200 caracteres'
    }

    // Validar precio personalizado si está habilitado
    if (useCustomPrice) {
      if (!formData.price || formData.price <= 0) {
        newErrors.price = 'El precio debe ser mayor a 0'
      } else if (formData.price > 50000) {
        newErrors.price = 'El precio no puede ser mayor a $50.000'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      let result: MenuOperationResult

      if (modalState.mode === 'edit' && modalState.item?.id) {
        // Preparar datos del item para actualización
        const itemData: Partial<AdminMenuItem> = {
          code: formData.code,
          title: formData.title,
          description: formData.title, // Usar título como descripción para compatibilidad
          type: formData.type,
          active: formData.active
        }

        // Solo incluir precio si se usa precio personalizado y tiene valor válido
        if (useCustomPrice && formData.price && formData.price > 0) {
          itemData.price = formData.price
        }

        result = await onUpdate(modalState.item.id, itemData)
      } else {
        const fullItemData: Omit<AdminMenuItem, 'id'> = {
          code: formData.code,
          title: formData.title,
          description: formData.title, // Usar título como descripción para compatibilidad
          type: formData.type,
          active: formData.active,
          published: true,
          date: modalState.date,
          day: modalState.day,
          weekStart,
          ...(useCustomPrice && formData.price && formData.price > 0 && { price: formData.price })
        }
        result = await onSave(fullItemData)
      }

      if (result.success) {
        onClose()
      } else if (result.errors) {
        const formErrors: Record<string, string> = {}
        result.errors.forEach(error => {
          formErrors[error.field] = error.message
        })
        setErrors(formErrors)
      }
    } catch (error) {
      console.error('Error submitting form:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof MenuFormData, value: string | boolean | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const getDisplayPrice = (): string => {
    if (useCustomPrice && formData.price) {
      return `$${formData.price.toLocaleString('es-CL')}`
    }
    
    // Mostrar precio base según tipo
    const basePrice = formData.type === 'almuerzo' 
      ? PRICES.apoderado.almuerzo 
      : PRICES.apoderado.colacion
    
    return `$${basePrice.toLocaleString('es-CL')} (precio base)`
  }

  const isEditMode = modalState.mode === 'edit'
  const modalTitle = isEditMode ? 'Editar Menú' : 'Agregar Nuevo Menú'

  // Configuración de iconos por tipo
  const typeConfig = {
    almuerzo: { 
      icon: Utensils, 
      label: 'Almuerzo', 
      color: 'text-blue-600',
      gradient: 'from-blue-500 to-indigo-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800'
    },
    colacion: { 
      icon: Coffee, 
      label: 'Colación', 
      color: 'text-emerald-600',
      gradient: 'from-emerald-500 to-teal-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
      borderColor: 'border-emerald-200 dark:border-emerald-800'
    }
  }

  const config = typeConfig[formData.type]
  const TypeIcon = config.icon

  return (
    <Dialog open={modalState.isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header compacto */}
        <DialogHeader className="flex-shrink-0 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg bg-gradient-to-br ${config.gradient}`}>
                <TypeIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">
                  {modalTitle}
                </DialogTitle>
                <div className="flex items-center space-x-2 mt-1">
                  {modalState.date && (
                    <Badge variant="outline" className="text-xs">
                      {modalState.day} • {modalState.date}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <DialogDescription className="text-sm">
            {isEditMode 
              ? 'Modifica los detalles del menú.'
              : 'Crea un nuevo elemento del menú.'
            }
          </DialogDescription>
        </DialogHeader>

        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
          {/* Vista Previa Compacta */}
          <Card className={`${config.bgColor} ${config.borderColor} border`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center space-x-2">
                <Eye className="w-4 h-4" />
                <span>Vista Previa</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className={`p-1.5 rounded-lg bg-gradient-to-br ${config.gradient}`}>
                      <TypeIcon className="w-3.5 h-3.5 text-white" />
                    </div>
                    <Badge variant="outline" className="text-xs font-bold">
                      {formData.code || 'Código'}
                    </Badge>
                  </div>
                </div>
                
                <h4 className="font-bold text-base text-slate-900 dark:text-white mb-2">
                  {formData.title || 'Título del menú...'}
                </h4>
                
                {formData.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 p-2 bg-slate-50 dark:bg-slate-700 rounded">
                    {formData.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {config.label}
                    </Badge>
                    {formData.active && (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                        Disponible
                      </Badge>
                    )}
                  </div>
                  <span className="font-bold text-green-600">
                    {getDisplayPrice()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Formulario compacto */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tipo y Código */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Tipo de menú</Label>
                <RadioGroup
                  value={formData.type}
                  onValueChange={(value) => handleInputChange('type', value as 'almuerzo' | 'colacion')}
                  className="flex space-x-4"
                  disabled={isEditMode}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="almuerzo" id="almuerzo" />
                    <Label htmlFor="almuerzo" className="flex items-center space-x-2 text-sm">
                      <Utensils className="w-4 h-4 text-blue-600" />
                      <span>Almuerzo</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="colacion" id="colacion" />
                    <Label htmlFor="colacion" className="flex items-center space-x-2 text-sm">
                      <Coffee className="w-4 h-4 text-emerald-600" />
                      <span>Colación</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="code" className="text-sm font-medium">
                  Código *
                </Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                  placeholder="Ej: A1, A2, C1, C2..."
                  className={errors.code ? 'border-red-500' : ''}
                  maxLength={10}
                />
                {errors.code && (
                  <p className="text-xs text-red-600">{errors.code}</p>
                )}
              </div>
            </div>

            {/* Título */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">
                Título del menú *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Ej: Pollo a la plancha, Ensalada César, Yogurt con granola..."
                className={errors.title ? 'border-red-500' : ''}
                maxLength={100}
              />
              <div className="flex justify-between items-center">
                {errors.title && (
                  <p className="text-xs text-red-600">{errors.title}</p>
                )}
                <span className="text-xs text-slate-500 ml-auto">
                  {formData.title.length}/100
                </span>
              </div>
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Descripción adicional (opcional)
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Detalles adicionales como ingredientes, acompañamientos..."
                className={`min-h-[80px] ${errors.description ? 'border-red-500' : ''}`}
                maxLength={200}
              />
              <div className="flex justify-between items-center">
                {errors.description && (
                  <p className="text-xs text-red-600">{errors.description}</p>
                )}
                <span className="text-xs text-slate-500 ml-auto">
                  {formData.description?.length || 0}/200
                </span>
              </div>
            </div>

            {/* Estado y Precio */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Estado */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Estado</Label>
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <span className="text-sm">
                    {formData.active ? 'Disponible' : 'No disponible'}
                  </span>
                  <Switch
                    checked={formData.active}
                    onCheckedChange={(checked) => handleInputChange('active', checked)}
                  />
                </div>
              </div>

              {/* Precio personalizado */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Precio</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <span className="text-sm">Precio personalizado</span>
                    <Switch
                      checked={useCustomPrice}
                      onCheckedChange={setUseCustomPrice}
                    />
                  </div>
                  
                  {useCustomPrice && (
                    <div className="space-y-2">
                      <Input
                        type="number"
                        value={formData.price || ''}
                        onChange={(e) => handleInputChange('price', parseInt(e.target.value) || 0)}
                        placeholder="Ej: 3100"
                        className={errors.price ? 'border-red-500' : ''}
                        min="1"
                        max="50000"
                      />
                      {errors.price && (
                        <p className="text-xs text-red-600">{errors.price}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Información de impacto compacta */}
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  {isEditMode 
                    ? 'Los cambios se reflejarán inmediatamente para todos los usuarios.'
                    : 'Este menú estará disponible inmediatamente una vez guardado.'
                  }
                </p>
              </div>
            </div>
          </form>
        </div>

        {/* Footer con botones */}
        <div className="flex-shrink-0 flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className={`flex items-center space-x-2 bg-gradient-to-r ${config.gradient} hover:opacity-90`}
            onClick={handleSubmit}
          >
            {isSubmitting ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
              />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isEditMode ? 'Actualizar' : 'Guardar'}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}