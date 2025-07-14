"use client"

import { SchoolLevel, getCourseOptions, getSchoolLevelInfo } from '@/lib/courseUtils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface CourseSelectorProps {
  level: SchoolLevel
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  allowCustom?: boolean
}

export function CourseSelector({
  level,
  value,
  onValueChange,
  placeholder = "Escribe el curso",
  disabled = false,
  className = "",
  allowCustom = true
}: CourseSelectorProps) {
  const [isCustomMode, setIsCustomMode] = useState(true) // Por defecto en modo custom
  const courseOptions = getCourseOptions(level)
  const levelInfo = getSchoolLevelInfo(level)

  // Si el valor actual no está en las opciones predefinidas, usar modo custom
  const isValueInOptions = courseOptions.some(option => option.value === value)

  if (isCustomMode || !isValueInOptions) {
    return (
      <div className="space-y-2">
        <Input
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={className}
        />
        {allowCustom && courseOptions.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsCustomMode(false)
              if (!value) {
                onValueChange('')
              }
            }}
            className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 h-auto p-1"
            disabled={disabled}
          >
            Ver opciones sugeridas para {levelInfo.label}
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className={className}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <div className="px-2 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
            Sugerencias para {levelInfo.description}
          </div>
          {courseOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {allowCustom && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsCustomMode(true)}
          className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 h-auto p-1"
          disabled={disabled}
        >
          Escribir curso personalizado
        </Button>
      )}
    </div>
  )
}