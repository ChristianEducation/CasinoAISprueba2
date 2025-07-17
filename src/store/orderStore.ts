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
  removeItemFromSelection: (
    date: string,
    itemId: string,
    itemType: 'almuerzo' | 'colacion',
    child: Child | null
  ) => void
  addItemToSelection: (
    date: string,
    field: 'almuerzo' | 'colacion',
    item: MenuItem,
    child: Child | null
  ) => void
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
          const currentSelection = {...updated[existingIndex]}
          
          if (item) {
            // Actualizar el campo individual para mantener compatibilidad
            currentSelection[field] = item
            
            // Actualizar también el array correspondiente
            const fieldArray = `${field}s` as 'almuerzos' | 'colaciones'
            
            if (currentSelection[fieldArray]) {
              // Agregar el ítem al array existente
              currentSelection[fieldArray] = [...currentSelection[fieldArray]!, item]
            } else {
              // Crear un nuevo array con el ítem
              currentSelection[fieldArray] = [item]
            }
            
            updated[existingIndex] = currentSelection
          } else {
            // Remover el campo específico
            const newSelection = { ...currentSelection }
            delete newSelection[field]
            
            // Si no quedan almuerzo ni colacion, eliminar toda la selección
            if (!newSelection.almuerzo && !newSelection.colacion && 
                (!newSelection.almuerzos?.length) && (!newSelection.colaciones?.length)) {
              updated.splice(existingIndex, 1)
            } else {
              updated[existingIndex] = newSelection
            }
          }
          
          set({ selectionsByChild: updated })
        } else if (item) {
          // Solo crear nueva selección si hay un item
          const fieldArray = `${field}s` as 'almuerzos' | 'colaciones'
          const newSelection: OrderSelectionByChild = {
            date,
            dia: '', // Se llenará desde el componente
            fecha: date,
            hijo: child, // null para funcionarios
            [field]: item,
            [fieldArray]: [item] // Inicializar el array con el primer ítem
          }
          set({ selectionsByChild: [...selectionsByChild, newSelection] })
        }
      },

      clearSelectionsByChild: () => set({ selectionsByChild: [] }),

      getOrderSummaryByChild: () => {
        const { selectionsByChild } = get()
        
        // Si no hay selecciones, retornar un objeto vacío
        if (selectionsByChild.length === 0) {
          return {
            totalItems: 0,
            totalAlmuerzos: 0,
            totalColaciones: 0,
            subtotalAlmuerzos: 0,
            subtotalColaciones: 0,
            total: 0,
            resumenPorHijo: {},
            selections: []
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
          
          // Calcular basado en arrays de selecciones múltiples
          if (selection.almuerzos && selection.almuerzos.length > 0) {
            const cantidadAlmuerzos = selection.almuerzos.length;
            totalAlmuerzos += cantidadAlmuerzos;
            resumenPorHijo[hijoId].almuerzos += cantidadAlmuerzos;
            
            // Sumar los precios de todos los almuerzos
            const subtotalAlmuerzosHijo = selection.almuerzos.reduce((sum, item) => sum + item.price, 0);
            resumenPorHijo[hijoId].subtotal += subtotalAlmuerzosHijo;
          } 
          // Mantener compatibilidad con el campo individual
          else if (selection.almuerzo) {
            totalAlmuerzos++;
            resumenPorHijo[hijoId].almuerzos++;
            resumenPorHijo[hijoId].subtotal += selection.almuerzo.price;
          }
          
          // Igual para colaciones
          if (selection.colaciones && selection.colaciones.length > 0) {
            const cantidadColaciones = selection.colaciones.length;
            totalColaciones += cantidadColaciones;
            resumenPorHijo[hijoId].colaciones += cantidadColaciones;
            
            // Sumar los precios de todas las colaciones
            const subtotalColacionesHijo = selection.colaciones.reduce((sum, item) => sum + item.price, 0);
            resumenPorHijo[hijoId].subtotal += subtotalColacionesHijo;
          }
          // Mantener compatibilidad con el campo individual
          else if (selection.colacion) {
            totalColaciones++;
            resumenPorHijo[hijoId].colaciones++;
            resumenPorHijo[hijoId].subtotal += selection.colacion.price;
          }
        })
        
        // Calcular totales usando los precios reales de los items desde los arrays
        const subtotalAlmuerzos = selectionsByChild.reduce((sum, selection) => {
          if (selection.almuerzos && selection.almuerzos.length > 0) {
            return sum + selection.almuerzos.reduce((itemSum, item) => itemSum + item.price, 0);
          } else if (selection.almuerzo) {
            return sum + selection.almuerzo.price;
          }
          return sum;
        }, 0);
        
        const subtotalColaciones = selectionsByChild.reduce((sum, selection) => {
          if (selection.colaciones && selection.colaciones.length > 0) {
            return sum + selection.colaciones.reduce((itemSum, item) => itemSum + item.price, 0);
          } else if (selection.colacion) {
            return sum + selection.colacion.price;
          }
          return sum;
        }, 0);
        
        const total = subtotalAlmuerzos + subtotalColaciones
        
        return {
          totalItems: totalAlmuerzos + totalColaciones,
          totalAlmuerzos,
          totalColaciones,
          subtotalAlmuerzos,
          subtotalColaciones,
          total,
          resumenPorHijo,
          selections: selectionsByChild
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
      },
  
      removeItemFromSelection: (
        date: string,
        itemId: string,
        itemType: 'almuerzo' | 'colacion',
        child: Child | null
      ) => {
        const { selectionsByChild } = get()
        const existingIndex = selectionsByChild.findIndex(
          s => s.date === date && 
               (s.hijo?.id === child?.id || (!s.hijo && !child))
        )
        
        if (existingIndex < 0) return; // No hay selección para este día/niño
        
        const updated = [...selectionsByChild];
        const currentSelection = {...updated[existingIndex]};
        const fieldArray = `${itemType}s` as 'almuerzos' | 'colaciones';
        
        // Si no hay un array para este tipo de ítem, revisar el campo individual
        if (!currentSelection[fieldArray] || currentSelection[fieldArray]?.length === 0) {
          // Verificar si el ítem individual coincide con el que queremos eliminar
          const singleItem = currentSelection[itemType];
          if (singleItem?.id === itemId) {
            // Eliminar el ítem individual
            const newSelection = {...currentSelection};
            delete newSelection[itemType];
            
            // Si no quedan selecciones, eliminar la entrada completa
            if (!newSelection.almuerzo && !newSelection.colacion && 
                (!newSelection.almuerzos?.length) && (!newSelection.colaciones?.length)) {
              updated.splice(existingIndex, 1);
            } else {
              updated[existingIndex] = newSelection;
            }
            
            set({ selectionsByChild: updated });
          }
          return;
        }
        
        // Buscar el índice del ítem a eliminar en el array
        const itemIndex = currentSelection[fieldArray]!.findIndex(i => i.id === itemId);
        if (itemIndex >= 0) {
          // Crear un nuevo array sin el ítem eliminado
          const newItems = [...currentSelection[fieldArray]!];
          newItems.splice(itemIndex, 1);
          
          // Actualizar la selección
          currentSelection[fieldArray] = newItems;
          
          // Si el array queda vacío, eliminarlo
          if (newItems.length === 0) {
            delete currentSelection[fieldArray];
            
            // También eliminar el ítem individual si coincide con el ID
            if (currentSelection[itemType]?.id === itemId) {
              delete currentSelection[itemType];
            }
          } else {
            // Si queda al menos un ítem, actualizar el ítem individual para mantener compatibilidad
            currentSelection[itemType] = newItems[0];
          }
          
          // Si no quedan selecciones, eliminar la entrada completa
          if (!currentSelection.almuerzo && !currentSelection.colacion && 
              (!currentSelection.almuerzos?.length) && (!currentSelection.colaciones?.length)) {
            updated.splice(existingIndex, 1);
          } else {
            updated[existingIndex] = currentSelection;
          }
          
          set({ selectionsByChild: updated });
          console.log(`🗑️ Se eliminó una unidad de ${itemType} con ID: ${itemId}`);
        }
      },

      addItemToSelection: (
        date: string,
        field: 'almuerzo' | 'colacion',
        item: MenuItem,
        child: Child | null
      ) => {
        const { selectionsByChild } = get();
        const existingIndex = selectionsByChild.findIndex(
          s => s.date === date && 
               (s.hijo?.id === child?.id || (!s.hijo && !child))
        );
        
        if (existingIndex >= 0) {
          const updated = [...selectionsByChild];
          const currentSelection = {...updated[existingIndex]};
          const fieldArray = `${field}s` as 'almuerzos' | 'colaciones';
          
          if (currentSelection[fieldArray]) {
            // Permitir duplicados para representar múltiples cantidades
            // Simplemente añadimos el ítem al array sin verificar duplicados
            currentSelection[fieldArray] = [...currentSelection[fieldArray]!, item];
          } else {
            // Crear un nuevo array con el ítem
            currentSelection[fieldArray] = [item];
          }
          
          // Mantener el campo individual para compatibilidad SOLO si no existe
          // Si ya existe un valor, no lo sobrescribimos para permitir selecciones múltiples
          if (!currentSelection[field]) {
            currentSelection[field] = item;
          }
          
          updated[existingIndex] = currentSelection;
          set({ selectionsByChild: updated });
          console.log(`✅ Se añadió un ${field} con ID: ${item.id}`);
        } else {
          // Crear una nueva selección
          const newSelection: OrderSelectionByChild = {
            date,
            dia: '',
            fecha: date,
            hijo: child
          };
          
          newSelection[field] = item;
          const fieldArray = `${field}s` as 'almuerzos' | 'colaciones';
          newSelection[fieldArray] = [item];
          
          set({ selectionsByChild: [...selectionsByChild, newSelection] });
          console.log(`✅ Se creó una nueva selección para ${date} con ${field} ID: ${item.id}`);
        }
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
