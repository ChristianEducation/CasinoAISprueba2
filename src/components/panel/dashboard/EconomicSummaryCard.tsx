"use client"

import { motion } from 'framer-motion'
import { DollarSign, TrendingUp, Calculator, PieChart, ChevronDown, ChevronUp } from 'lucide-react'
import { EconomicSummary } from '@/types/dashboard'
import { formatCurrency, calculateProjectedTotal } from '@/lib/dashboardUtils'
import { useState } from 'react'

interface EconomicSummaryCardProps {
  economicSummary: EconomicSummary
}

export function EconomicSummaryCard({ economicSummary }: EconomicSummaryCardProps) {
  const [showDetails, setShowDetails] = useState(false)
  
  const remainingDays = 5 - economicSummary.selectedDays
  const projectedTotal = calculateProjectedTotal(economicSummary, remainingDays)
  const hasSelections = economicSummary.selectedDays > 0

  // Calcular porcentajes para el gráfico visual
  const lunchPercentage = economicSummary.estimatedTotal > 0 
    ? Math.round((economicSummary.totalLunches * economicSummary.lunchPrice / economicSummary.estimatedTotal) * 100)
    : 0
  const snackPercentage = 100 - lunchPercentage

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="panel-card"
    >
      <div className="panel-card-content">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 text-clean">
                Resumen Económico
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 text-clean">
                Cálculo automático semanal
              </p>
            </div>
          </div>
          
          {hasSelections && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              {showDetails ? (
                <>
                  <ChevronUp size={16} />
                  Menos detalles
                </>
              ) : (
                <>
                  <ChevronDown size={16} />
                  Más detalles
                </>
              )}
            </button>
          )}
        </div>

        {hasSelections ? (
          <div className="space-y-6">
            {/* Total actual destacado */}
            <div className="bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 rounded-xl p-5 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-lg font-semibold text-emerald-700 dark:text-emerald-300 text-clean">
                    Total actual
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 text-clean">
                    {formatCurrency(economicSummary.estimatedTotal)}
                  </div>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 text-clean">
                    {economicSummary.selectedDays} día{economicSummary.selectedDays !== 1 ? 's' : ''} seleccionado{economicSummary.selectedDays !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              
              {/* Barra de progreso visual */}
              <div className="w-full bg-emerald-200 dark:bg-emerald-800 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(economicSummary.selectedDays / 5) * 100}%` }}
                />
              </div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 text-clean mt-2">
                {Math.round((economicSummary.selectedDays / 5) * 100)}% de la semana completada
              </p>
            </div>

            {/* Desglose detallado - Mostrar solo si showDetails es true */}
            {showDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-slate-700 dark:text-slate-300 text-clean">
                    Desglose por tipo
                  </h4>
                  <span className="text-sm text-slate-500 dark:text-slate-400 text-clean">
                    {economicSummary.totalLunches + economicSummary.totalSnacks} items totales
                  </span>
                </div>
                
                {economicSummary.totalLunches > 0 && (
                  <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-600">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                        <span className="font-medium text-slate-600 dark:text-slate-400 text-clean">
                          Almuerzos
                        </span>
                      </div>
                      <span className="text-lg font-bold text-slate-800 dark:text-slate-100 text-clean">
                        {formatCurrency(economicSummary.totalLunches * economicSummary.lunchPrice)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                      <span className="text-clean">
                        {economicSummary.totalLunches} × {formatCurrency(economicSummary.lunchPrice)}
                      </span>
                      <span className="text-clean font-medium">
                        {lunchPercentage}% del total
                      </span>
                    </div>
                  </div>
                )}

                {economicSummary.totalSnacks > 0 && (
                  <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-600">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 bg-emerald-500 rounded-full"></div>
                        <span className="font-medium text-slate-600 dark:text-slate-400 text-clean">
                          Colaciones
                        </span>
                      </div>
                      <span className="text-lg font-bold text-slate-800 dark:text-slate-100 text-clean">
                        {formatCurrency(economicSummary.totalSnacks * economicSummary.snackPrice)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                      <span className="text-clean">
                        {economicSummary.totalSnacks} × {formatCurrency(economicSummary.snackPrice)}
                      </span>
                      <span className="text-clean font-medium">
                        {snackPercentage}% del total
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Proyección mejorada */}
            {remainingDays > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center space-x-3 mb-3">
                  <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="font-semibold text-blue-700 dark:text-blue-300 text-clean">
                    Proyección semanal completa
                  </span>
                </div>
                <div className="space-y-3">
                  <p className="text-sm text-blue-600 dark:text-blue-400 text-clean">
                    Si completas los {remainingDays} día{remainingDays !== 1 ? 's' : ''} restante{remainingDays !== 1 ? 's' : ''} con almuerzo:
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-blue-700 dark:text-blue-300 text-clean">
                      Total proyectado:
                    </span>
                    <span className="text-xl font-bold text-blue-700 dark:text-blue-300 text-clean">
                      {formatCurrency(projectedTotal)}
                    </span>
                  </div>
                  <p className="text-sm text-blue-600 dark:text-blue-400 text-clean">
                    Diferencia: +{formatCurrency(projectedTotal - economicSummary.estimatedTotal)}
                  </p>
                </div>
              </div>
            )}

            {/* Información de precios */}
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
              <div className="flex items-center space-x-3 mb-4">
                <Calculator className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                <span className="font-semibold text-slate-700 dark:text-slate-300 text-clean">
                  Precios unitarios vigentes
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-600">
                  <p className="text-sm text-slate-500 dark:text-slate-400 text-clean mb-2">Almuerzo</p>
                  <p className="text-lg font-bold text-slate-700 dark:text-slate-300 text-clean">
                    {formatCurrency(economicSummary.lunchPrice)}
                  </p>
                </div>
                <div className="text-center p-3 bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-600">
                  <p className="text-sm text-slate-500 dark:text-slate-400 text-clean mb-2">Colación</p>
                  <p className="text-lg font-bold text-slate-700 dark:text-slate-300 text-clean">
                    {formatCurrency(economicSummary.snackPrice)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Calculator className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-slate-500 dark:text-slate-400 text-clean mb-3">
              Aún no hay pedido iniciado
            </h4>
            <p className="text-slate-400 dark:text-slate-500 text-clean mb-6 max-w-sm mx-auto leading-relaxed">
              Los cálculos aparecerán automáticamente cuando selecciones tus menús para la semana
            </p>
            
            {/* Mostrar precios base cuando no hay selecciones */}
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 max-w-sm mx-auto">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 text-clean mb-3">
                Precios vigentes:
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center">
                  <span className="text-xs text-slate-500 dark:text-slate-400 text-clean block mb-1">Almuerzo</span>
                  <p className="font-bold text-slate-700 dark:text-slate-300 text-clean">
                    {formatCurrency(economicSummary.lunchPrice)}
                  </p>
                </div>
                <div className="text-center">
                  <span className="text-xs text-slate-500 dark:text-slate-400 text-clean block mb-1">Colación</span>
                  <p className="font-bold text-slate-700 dark:text-slate-300 text-clean">
                    {formatCurrency(economicSummary.snackPrice)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}