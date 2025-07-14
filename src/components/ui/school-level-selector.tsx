"use client"

import { SchoolLevel, SCHOOL_LEVELS, getSchoolLevelInfo } from '@/lib/courseUtils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface SchoolLevelSelectorProps {
  value: SchoolLevel
  onValueChange: (value: SchoolLevel) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function SchoolLevelSelector({
  value,
  onValueChange,
  placeholder = "Selecciona un nivel",
  disabled = false,
  className = ""
}: SchoolLevelSelectorProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {SCHOOL_LEVELS.map((level) => {
          const info = getSchoolLevelInfo(level)
          return (
            <SelectItem key={level} value={level}>
              <div className="flex flex-col">
                <span className="font-medium">{info.label}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {info.description}
                </span>
              </div>
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}
