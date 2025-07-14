import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { 
  OrderSelection, 
  OrderSummary, 
  OrderSelectionByChild,
  OrderSummaryByChild,
  UserType, 
  PRICES,
  Child,
  MenuItem
} from '@/types/panel'

interface OrderState {
  selections: OrderSelection[]
  userType: UserType
  isLoading: boolean
  
  selectionsByChild: OrderSelectionByChild[]
  currentChild: Child | null // null representa al funcionario
  children: Child[]
  
  // Nuevo: Estado para controlar duplicados
  existingOrders: string[] // IDs de pedidos existentes para evitar duplicados
  
  setUserType: (type: UserType) => void
  addSelection: (selection: OrderSelection) => void
  removeSelection: (date: string) => void
  updateSelection: (date: string, field: 'almuerzo' | 'colacion', item: MenuItem | undefined) => void
  clearSelections: () => void
  getOrderSummary: () => OrderSummary
  setLoading: (loading: boolean) => void
  
  setChildren: (children: Child[]) => void
  setCurrentChild: (child: Child | null) => void
  addSelectionByChild: (selection: OrderSelectionByChild) => void
  removeSelectionByChild: (date: string, childId?: string) => void
  updateSelectionByChild: (
    date: string, 
    field: 'almuerzo' | 'colacion', 
    item: MenuItem | undefined, 
    child: Child | null
  ) => void
  clearSelectionsByChild: () => void
  getOrderSummaryByChild: () => OrderSummaryByChild
  loadExistingSelections: (selections: OrderSelectionByChild[]) => void
  
  // Nuevos métodos para manejar duplicados y limpieza
  setExistingOrders: (orderIds: string[]) => void
  clearAllSelections: () => void // Limpia todo después del pago exitoso
  hasExistingOrder: (date: string, childId?: string) => boolean
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      selections: [],
      userType: 'apoderado',
      isLoading: false,
      
      selectionsByChild: [],
      currentChild: null, // null representa al funcionario
      children: [],
      existingOrders: [],

      setUserType: (type: UserType) => set({ userType: type }),

      addSelection: (selection: OrderSelection) => {
        const { selections } = get()
        const existingIndex = selections.findIndex(s => s.date === selection.date)
        
        if (existingIndex >= 0) {
          const updated = [...selections]
          updated[existingIndex] = { ...updated[existingIndex], ...selection }
          set({ selections: updated })
        } else {
          set({ selections: [...selections, selection] })
        }
      },

      removeSelection: (date: string) => {
        const { selections } = get()
        set({ selections: selections.filter(s => s.date !== date) })
      },

      updateSelection: (date: string, field: 'almuerzo' | 'colacion', item: MenuItem | undefined) => {
        const { selections } = get()
        const existingIndex = selections.findIndex(s => s.date === date)
        
        if (existingIndex >= 0) {
          const updated = [...selections]
          updated[existingIndex] = { ...updated[existingIndex], [field]: item }
          set({ selections: updated })
        } else {
          set({ selections: [...selections, { date, [field]: item }] })
        }
      },

      clearSelections: () => set({ selections: [] }),

      getOrderSummary: (): OrderSummary => {
        const { selections, userType } = get()
        
        // Verificar que PRICES esté definido
        if (!PRICES || !PRICES[userType]) {
          console.error('PRICES not defined or missing userType:', userType)
          return {
            selections,
            totalAlmuerzos: 0,
            totalColaciones: 0,
            subtotalAlmuerzos: 0,
            subtotalColaciones: 0,
            total: 0
          }
        }

        const prices = PRICES[userType]
        if (!prices || typeof prices.almuerzo !== 'number' || typeof prices.colacion !== 'number') {
          console.error('Invalid price structure for userType:', userType, prices)
          return {
            selections,
            totalAlmuerzos: 0,
            totalColaciones: 0,
            subtotalAlmuerzos: 0,
            subtotalColaciones: 0,
            total: 0
          }
        }
        
        let totalAlmuerzos = 0
        let totalColaciones = 0
        
        selections.forEach(selection => {
          if (selection.almuerzo) totalAlmuerzos++
          if (selection.colacion) totalColaciones++
        })
        
        const subtotalAlmuerzos = totalAlmuerzos * prices.almuerzo
        const subtotalColaciones = totalColaciones * prices.colacion
        const total = subtotalAlmuerzos + subtotalColaciones
        
        return {
          selections,
          totalAlmuerzos,
          totalColaciones,
          subtotalAlmuerzos,
          subtotalColaciones,
          total
        }
      },

      setLoading: (loading: boolean) => set({ isLoading: loading }),

      setChildren: (children: Child[]) => set({ children }),

      setCurrentChild: (child: Child | null) => set({ currentChild: child }),

      addSelectionByChild: (selection: OrderSelectionByChild) => {
        const { selectionsByChild } = get()
        const existingIndex = selectionsByChild.findIndex(
          s => s.date === selection.date && 
               (s.hijo?.id === selection.hijo?.id || (!s.hijo && !selection.hijo))
        )
        
        if (existingIndex >= 0) {
          const updated = [...selectionsByChild]
          updated[existingIndex] = { ...updated[existingIndex], ...selection }
          set({ selectionsByChild: updated })
        } else {
          set({ selectionsByChild: [...selectionsByChild, selection] })
        }
      },

      removeSelectionByChild: (date: string, childId?: string) => {
        const { selectionsByChild } = get()
        set({ 
          selectionsByChild: selectionsByChild.filter(s => 
            !(s.date === date && (childId ? s.hijo?.id === childId : !s.hijo))
          ) 
        })
      },

      updateSelectionByChild: (
        date: string, 
        field: 'almuerzo' | 'colacion', 
        item: MenuItem | undefined, 
        child: Child | null
      ) => {
        const { selectionsByChild } = get()
        const existingIndex = selectionsByChild.findIndex(
          s => s.date === date && 
               (s.hijo?.id === child?.id || (!s.hijo && !child))
        )
        
        if (existingIndex >= 0) {
          const updated = [...selectionsByChild]
          const currentSelection = updated[existingIndex]
          
          if (item) {
            // Agregar o actualizar el campo
            updated[existingIndex] = { ...currentSelection, [field]: item }
          } else {
            // Remover el campo específico
            const newSelection = { ...currentSelection }
            delete newSelection[field]
            
            // Si no quedan almuerzo ni colacion, eliminar toda la selección
            if (!newSelection.almuerzo && !newSelection.colacion) {
              updated.splice(existingIndex, 1)
            } else {
              updated[existingIndex] = newSelection
            }
          }
          
          set({ selectionsByChild: updated })
        } else if (item) {
          // Solo crear nueva selección si hay un item
          const newSelection: OrderSelectionByChild = {
            date,
            dia: '', // Se llenará desde el componente
            fecha: date,
            hijo: child, // null para funcionarios
            [field]: item
          }
          set({ selectionsByChild: [...selectionsByChild, newSelection] })
        }
      },

      clearSelectionsByChild: () => set({ selectionsByChild: [] }),

      getOrderSummaryByChild: (): OrderSummaryByChild => {
        const { selectionsByChild, userType } = get()
        
        // Verificar que PRICES esté definido
        if (!PRICES || !PRICES[userType]) {
          console.error('PRICES not defined or missing userType:', userType)
          return {
            selections: selectionsByChild,
            totalAlmuerzos: 0,
            totalColaciones: 0,
            subtotalAlmuerzos: 0,
            subtotalColaciones: 0,
            total: 0,
            resumenPorHijo: {}
          }
        }

        const prices = PRICES[userType]
        if (!prices || typeof prices.almuerzo !== 'number' || typeof prices.colacion !== 'number') {
          console.error('Invalid price structure for userType:', userType, prices)
          return {
            selections: selectionsByChild,
            totalAlmuerzos: 0,
            totalColaciones: 0,
            subtotalAlmuerzos: 0,
            subtotalColaciones: 0,
            total: 0,
            resumenPorHijo: {}
          }
        }
        
        let totalAlmuerzos = 0
        let totalColaciones = 0
        const resumenPorHijo: OrderSummaryByChild['resumenPorHijo'] = {}
        
        selectionsByChild.forEach(selection => {
          // Para funcionarios sin hijo seleccionado, usar 'funcionario' como ID
          const hijoId = selection.hijo?.id || 'funcionario'
          
          if (!resumenPorHijo[hijoId]) {
            resumenPorHijo[hijoId] = {
              hijo: selection.hijo || { 
                id: 'funcionario', 
                name: 'Funcionario', 
                curso: 'Personal', 
                active: true 
              },
              almuerzos: 0,
              colaciones: 0,
              subtotal: 0
            }
          }
          
          if (selection.almuerzo) {
            totalAlmuerzos++
            resumenPorHijo[hijoId].almuerzos++
            resumenPorHijo[hijoId].subtotal += selection.almuerzo.price
          }
          
          if (selection.colacion) {
            totalColaciones++
            resumenPorHijo[hijoId].colaciones++
            resumenPorHijo[hijoId].subtotal += selection.colacion.price
          }
        })
        
        // Calcular totales usando los precios reales de los items
        const subtotalAlmuerzos = selectionsByChild
          .filter(s => s.almuerzo)
          .reduce((sum, s) => sum + (s.almuerzo?.price || 0), 0)
        
        const subtotalColaciones = selectionsByChild
          .filter(s => s.colacion)
          .reduce((sum, s) => sum + (s.colacion?.price || 0), 0)
        
        const total = subtotalAlmuerzos + subtotalColaciones
        
        return {
          selections: selectionsByChild,
          totalAlmuerzos,
          totalColaciones,
          subtotalAlmuerzos,
          subtotalColaciones,
          total,
          resumenPorHijo
        }
      },

      loadExistingSelections: (selections: OrderSelectionByChild[]) => {
        set({ selectionsByChild: selections })
      },

      // Nuevos métodos para manejar duplicados y limpieza
      setExistingOrders: (orderIds: string[]) => {
        set({ existingOrders: orderIds })
      },

      clearAllSelections: () => {
        set({ 
          selections: [], 
          selectionsByChild: [],
          existingOrders: []
        })
        console.log('🧹 Carrito limpiado después del pago exitoso')
      },

      hasExistingOrder: (date: string, childId?: string) => {
        const { existingOrders } = get()
        const orderKey = `${date}-${childId || 'funcionario'}`
        return existingOrders.includes(orderKey)
      }
    }),
    {
      name: 'casino-escolar-order',
      partialize: (state) => ({ 
        selections: state.selections, 
        selectionsByChild: state.selectionsByChild,
        userType: state.userType,
        currentChild: state.currentChild,
        children: state.children,
        existingOrders: state.existingOrders
      })
    }
  )
)