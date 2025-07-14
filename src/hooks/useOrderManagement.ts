import { useState, useEffect, useCallback } from 'react'
import { useOrderStore } from '@/store/orderStore'
import useAuth from '@/hooks/useAuth'
import { useMultiWeekMenu } from '@/hooks/useMultiWeekMenu'
import { MenuIntegrationService } from '@/services/menuIntegrationService'
import { OrderService } from '@/services/orderService'
import { MenuService } from '@/services/menuService'
import { DayMenuDisplay } from '@/types/menu'
import { WeekInfo } from '@/types/order'
import { OrderStateByChild } from '@/services/orderService'

interface UseOrderManagementReturn {
  // Estado del menú - ahora incluye múltiples semanas
  currentWeekMenu: DayMenuDisplay[]
  allWeeks: Array<{
    weekInfo: WeekInfo & { weekLabel: string }
    weekMenu: DayMenuDisplay[]
    isLoading: boolean
    error: string | null
    hasMenus: boolean
  }>
  isLoadingMenu: boolean
  menuError: string | null
  weekInfo: WeekInfo | null
  
  // Estado del pedido - ACTUALIZADO para múltiples pedidos
  existingOrders: OrderStateByChild[]
  paidOrders: OrderStateByChild[]
  pendingOrders: OrderStateByChild[] // Nuevo: pedidos pendientes
  isLoadingOrder: boolean
  orderError: string | null
  
  // Estado del pago
  isProcessingPayment: boolean
  paymentError: string | null
  
  // Acciones
  refreshMenu: () => Promise<void>
  refreshWeek: (weekStart: string) => Promise<void>
  processPayment: () => Promise<void>
  clearErrors: () => void
  retryPayment: () => Promise<void>
  refreshOrders: () => Promise<void>
  
  // Nuevas funciones para múltiples pedidos
  canAddMoreOrders: boolean
  addAdditionalOrder: () => Promise<void>
}

export function useOrderManagement(): UseOrderManagementReturn {
  const { getOrderSummaryByChild, clearAllSelections, setExistingOrders: setExistingOrdersInStore } = useOrderStore()
  const { user } = useAuth()
  
  // Usar el nuevo hook de múltiples semanas
  const { 
    weeks: allWeeks, 
    isLoading: isLoadingMultiWeek, 
    error: multiWeekError,
    refreshWeek,
    refreshAll
  } = useMultiWeekMenu(user, 4) // Mostrar 4 semanas próximas
  
  // Estados del pedido - ACTUALIZADOS para múltiples pedidos
  const [existingOrders, setExistingOrders] = useState<OrderStateByChild[]>([])
  const [paidOrders, setPaidOrders] = useState<OrderStateByChild[]>([])
  const [pendingOrders, setPendingOrders] = useState<OrderStateByChild[]>([])
  const [isLoadingOrder, setIsLoadingOrder] = useState(true)
  const [orderError, setOrderError] = useState<string | null>(null)
  
  // Estados del pago
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)

  // Obtener la semana actual y su menú
  const currentWeek = allWeeks.find(week => week.weekInfo.isCurrentWeek)
  const currentWeekMenu = currentWeek?.weekMenu || []
  const weekInfo = currentWeek?.weekInfo || null
  const isLoadingMenu = isLoadingMultiWeek || (currentWeek?.isLoading ?? true)
  const menuError = multiWeekError || currentWeek?.error || null

  // Determinar si se pueden agregar más pedidos
  const canAddMoreOrders = weekInfo ? weekInfo.isOrderingAllowed : false

  // Cargar pedidos existentes - ACTUALIZADO PARA MANEJAR MÚLTIPLES PEDIDOS
  const loadExistingOrders = useCallback(async () => {
    if (!user || !weekInfo) {
      setIsLoadingOrder(false)
      return
    }

    try {
      setIsLoadingOrder(true)
      setOrderError(null)

      // Cargar TODOS los pedidos del usuario para esta semana
      const orders = await OrderService.getOrdersWithFilters({
        userId: user.id,
        weekStart: weekInfo.weekStart
      })

      console.log('Loaded orders for week:', weekInfo.weekStart, 'count:', orders.length)

      setExistingOrders(orders)
      
      // Separar pedidos por estado
      const paid = orders.filter(order => order.status === 'pagado')
      const pending = orders.filter(order => order.status === 'pendiente' || order.status === 'procesando_pago')
      
      setPaidOrders(paid)
      setPendingOrders(pending)

      // Actualizar el store con los IDs de pedidos existentes para evitar duplicados
      const existingOrderKeys = orders.map(order => 
        order.resumenPedido.map(selection => 
          `${selection.date}-${selection.hijo?.id || 'funcionario'}`
        )
      ).flat()
      
      setExistingOrdersInStore(existingOrderKeys)

      console.log('Orders by status - Paid:', paid.length, 'Pending:', pending.length, 'Total:', orders.length)

    } catch (error) {
      console.error('Error loading existing orders:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar los pedidos'
      setOrderError(errorMessage)
      setExistingOrders([])
      setPaidOrders([])
      setPendingOrders([])
    } finally {
      setIsLoadingOrder(false)
    }
  }, [user, weekInfo, setExistingOrders])

  // Función para refrescar pedidos
  const refreshOrders = useCallback(async () => {
    await loadExistingOrders()
  }, [loadExistingOrders])

  // Procesar pago con mejor manejo de errores y limpieza de carrito
  const processPayment = useCallback(async () => {
    if (!user) {
      setPaymentError('Información de usuario no disponible')
      return
    }

    try {
      setIsProcessingPayment(true)
      setPaymentError(null)

      const summary = getOrderSummaryByChild()
      
      console.log('Order summary from store:', summary)
      
      // Validar que hay selecciones
      if (!summary.selections || summary.selections.length === 0) {
        throw new Error('No hay elementos seleccionados para procesar el pago')
      }

      // Agrupar selecciones por semana
      const selectionsByWeek = new Map<string, typeof summary.selections>()
      
      for (const selection of summary.selections) {
        const weekStart = MenuService.getWeekStartFromDate(MenuService.createLocalDate(selection.date))
        
        if (!selectionsByWeek.has(weekStart)) {
          selectionsByWeek.set(weekStart, [])
        }
        selectionsByWeek.get(weekStart)!.push(selection)
      }

      console.log('Selections grouped by week:', Object.fromEntries(selectionsByWeek))

      // Procesar cada semana por separado
      const processResults: Array<{
        weekStart: string
        success: boolean
        orderId?: string
        paymentUrl?: string
        error?: string
      }> = []

      for (const [weekStart, weekSelections] of selectionsByWeek) {
        console.log(`Processing week ${weekStart} with ${weekSelections.length} selections`)

        // Transformar selecciones al formato requerido para esta semana específica
        const processOrderSelections = weekSelections.map(selection => {
          const selectedItems: Array<{
            itemId: string
            itemName: string
            itemCode: string
            category: 'almuerzo' | 'colacion'
            price: number
            description?: string
          }> = []

          // Agregar almuerzo si existe
          if (selection.almuerzo) {
            selectedItems.push({
              itemId: selection.almuerzo.id,
              itemName: selection.almuerzo.name,
              itemCode: selection.almuerzo.code,
              category: 'almuerzo',
              price: selection.almuerzo.price,
              description: selection.almuerzo.description
            })
          }

          // Agregar colación si existe
          if (selection.colacion) {
            selectedItems.push({
              itemId: selection.colacion.id,
              itemName: selection.colacion.name,
              itemCode: selection.colacion.code,
              category: 'colacion',
              price: selection.colacion.price,
              description: selection.colacion.description
            })
          }

          return {
            childId: selection.hijo?.id || 'funcionario',
            childName: selection.hijo?.name || 'Funcionario',
            date: selection.date,
            selectedItems
          }
        }).filter(selection => selection.selectedItems.length > 0)

        console.log(`Transformed selections for week ${weekStart}:`, processOrderSelections)

        // Validar que hay selecciones transformadas para esta semana
        if (processOrderSelections.length === 0) {
          console.warn(`No valid selections for week ${weekStart}`)
          continue
        }

        // Procesar el pedido para esta semana específica
        try {
          const result = await MenuIntegrationService.processCompleteOrder(
            user,
            processOrderSelections,
            weekStart
          )

          processResults.push({
            weekStart,
            success: result.success,
            orderId: result.orderId,
            paymentUrl: result.paymentUrl,
            error: result.error
          })

          // Si es exitoso, limpiar carrito y redirigir
          if (result.success && result.paymentUrl) {
            console.log(`✅ Payment successful for week ${weekStart}. Clearing cart...`)
            
            // LIMPIAR CARRITO DESPUÉS DEL PAGO EXITOSO
            clearAllSelections()
            
            console.log(`Redirecting to payment URL for week ${weekStart}:`, result.paymentUrl)
            window.location.href = result.paymentUrl
            return // Salir después de la primera redirección exitosa
          }

        } catch (weekError) {
          console.error(`Error processing week ${weekStart}:`, weekError)
          processResults.push({
            weekStart,
            success: false,
            error: weekError instanceof Error ? weekError.message : 'Error desconocido'
          })
        }
      }

      // Si llegamos aquí, ningún pago fue exitoso
      const failedResults = processResults.filter(r => !r.success)
      if (failedResults.length > 0) {
        const errorMessages = failedResults.map(r => `Semana ${r.weekStart}: ${r.error}`).join('; ')
        throw new Error(`Error procesando pagos: ${errorMessages}`)
      } else if (processResults.length === 0) {
        throw new Error('No hay selecciones válidas para procesar el pago')
      }

    } catch (error) {
      console.error('Error processing payment:', error)
      
      // Proporcionar mensajes de error más específicos
      let errorMessage = 'Error al procesar el pago'
      
      if (error instanceof Error) {
        if (error.message.includes('no disponible')) {
          errorMessage = 'El servicio de pagos no está disponible temporalmente. Por favor, intenta más tarde.'
        } else if (error.message.includes('conexión')) {
          errorMessage = 'Error de conexión. Verifica tu internet e intenta nuevamente.'
        } else if (error.message.includes('configuración')) {
          errorMessage = 'Error de configuración del sistema. Contacta al administrador.'
        } else if (error.message.includes('seleccionados') || error.message.includes('selecciones válidas')) {
          errorMessage = 'Debes seleccionar al menos un elemento antes de proceder al pago.'
        } else if (error.message.includes('ya pagaste')) {
          errorMessage = error.message // Mostrar mensaje específico de duplicados
        } else {
          errorMessage = error.message
        }
      }
      
      setPaymentError(errorMessage)
    } finally {
      setIsProcessingPayment(false)
    }
  }, [user, getOrderSummaryByChild, clearAllSelections])

  // Función para agregar pedidos adicionales
  const addAdditionalOrder = useCallback(async () => {
    if (!canAddMoreOrders) {
      setPaymentError('No se pueden agregar más pedidos en este momento')
      return
    }

    // Esta función permite al usuario agregar más elementos al carrito
    // sin restricciones de duplicados para pedidos adicionales
    console.log('🍽️ Permitiendo agregar pedidos adicionales...')
    
    // Refrescar pedidos existentes para mostrar el estado actual
    await refreshOrders()
  }, [canAddMoreOrders, refreshOrders])

  // Reintentar pago
  const retryPayment = useCallback(async () => {
    setPaymentError(null)
    await processPayment()
  }, [processPayment])

  // Refrescar menú (todas las semanas)
  const refreshMenu = useCallback(async () => {
    await refreshAll()
  }, [refreshAll])

  // Limpiar errores
  const clearErrors = useCallback(() => {
    setOrderError(null)
    setPaymentError(null)
  }, [])

  // Efectos
  useEffect(() => {
    if (user && weekInfo) {
      loadExistingOrders()
    } else {
      // Si no hay usuario o weekInfo, limpiar estado del pedido
      setExistingOrders([])
      setPaidOrders([])
      setPendingOrders([])
      setIsLoadingOrder(false)
    }
  }, [user, weekInfo, loadExistingOrders])

  return {
    // Estado del menú - ahora incluye múltiples semanas
    currentWeekMenu,
    allWeeks,
    isLoadingMenu,
    menuError,
    weekInfo,
    
    // Estado del pedido - ACTUALIZADO para múltiples pedidos
    existingOrders,
    paidOrders,
    pendingOrders, // Nuevo
    isLoadingOrder,
    orderError,
    
    // Estado del pago
    isProcessingPayment,
    paymentError,
    
    // Acciones
    refreshMenu,
    refreshWeek,
    processPayment,
    clearErrors,
    retryPayment,
    refreshOrders,
    
    // Nuevas funciones para múltiples pedidos
    canAddMoreOrders,
    addAdditionalOrder
  }
}