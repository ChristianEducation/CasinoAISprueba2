import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  Timestamp,
  getDoc,
  orderBy,
  limit,
  DocumentData
} from 'firebase/firestore'
import { db } from '@/app/lib/firebase'
import { OrderValidation } from '@/types/order'
import { OrderSelectionByChild, User, PRICES, UserType } from '@/types/panel'

export interface OrderStateByChild {
  id?: string
  userId: string
  tipoUsuario: UserType
  weekStart: string
  fechaCreacion: Date
  resumenPedido: OrderSelectionByChild[]
  total: number
  status: 'pendiente' | 'pagado' | 'cancelado' | 'procesando_pago'
  createdAt: Date
  updatedAt?: Date
  paidAt?: Date
  paymentId?: string
  metadata?: {
    version: string
    source: string
    orderNumber?: number // Nuevo: número de pedido para múltiples pedidos
    isAdditionalOrder?: boolean // Nuevo: indica si es un pedido adicional
    [key: string]: string | number | boolean | Date | null | undefined
  }
}

export interface OrderFilters {
  userId?: string
  weekStart?: string
  status?: string[]
  dateRange?: {
    start: Date
    end: Date
  }
  userType?: UserType
}

export interface OrderStats {
  totalOrders: number
  totalRevenue: number
  averageOrderValue: number
  ordersByStatus: Record<string, number>
}

export class OrderService {
  private static readonly COLLECTION_NAME = 'orders'
  private static readonly VERSION = '1.0.0'

  /**
   * Obtiene TODOS los pedidos de un usuario para una semana específica - ACTUALIZADO
   */
  static async getUserOrders(userId: string, weekStart: string): Promise<OrderStateByChild[]> {
    try {
      if (!userId || !weekStart) {
        throw new Error('userId y weekStart son requeridos')
      }

      const ordersRef = collection(db, this.COLLECTION_NAME)
      const q = query(
        ordersRef,
        where('userId', '==', userId),
        where('weekStart', '==', weekStart),
        orderBy('createdAt', 'desc')
      )
      
      const snapshot = await getDocs(q)
      const orders: OrderStateByChild[] = []
      
      snapshot.forEach((doc) => {
        const order = this.mapDocumentToOrder(doc.id, doc.data())
        if (order) {
          orders.push(order)
        }
      })
      
      console.log(`📋 Found ${orders.length} orders for user ${userId} in week ${weekStart}`)
      return orders
    } catch (error) {
      console.error('Error fetching user orders:', error)
      throw new Error('No se pudieron cargar los pedidos del usuario')
    }
  }

  /**
   * Obtiene el pedido activo más reciente (para compatibilidad) - DEPRECATED
   */
  static async getUserOrder(userId: string, weekStart: string): Promise<OrderStateByChild | null> {
    try {
      const orders = await this.getUserOrders(userId, weekStart)
      return orders.length > 0 ? orders[0] : null
    } catch (error) {
      console.error('Error fetching user order:', error)
      return null
    }
  }

  /**
   * Obtiene un pedido por su ID
   */
  static async getOrderById(orderId: string): Promise<OrderStateByChild | null> {
    try {
      if (!orderId) {
        throw new Error('orderId es requerido')
      }

      const orderRef = doc(db, this.COLLECTION_NAME, orderId)
      const docSnap = await getDoc(orderRef)
      
      if (!docSnap.exists()) {
        return null
      }
      
      return this.mapDocumentToOrder(docSnap.id, docSnap.data())
    } catch (error) {
      console.error('Error fetching order by ID:', error)
      return null
    }
  }

  /**
   * Obtiene todos los pedidos para una semana específica
   */
  static async getAllOrdersForWeek(weekStart: string, filters?: Partial<OrderFilters>): Promise<OrderStateByChild[]> {
    try {
      if (!weekStart) {
        throw new Error('weekStart es requerido')
      }

      const ordersRef = collection(db, this.COLLECTION_NAME)
      let q = query(
        ordersRef,
        where('weekStart', '==', weekStart),
        orderBy('createdAt', 'desc')
      )

      // Aplicar filtros adicionales
      if (filters?.status && filters.status.length > 0) {
        q = query(ordersRef, where('weekStart', '==', weekStart), where('status', 'in', filters.status), orderBy('createdAt', 'desc'))
      }

      if (filters?.userType) {
        q = query(ordersRef, where('weekStart', '==', weekStart), where('tipoUsuario', '==', filters.userType), orderBy('createdAt', 'desc'))
      }
      
      const snapshot = await getDocs(q)
      const orders: OrderStateByChild[] = []
      
      snapshot.forEach((doc) => {
        const order = this.mapDocumentToOrder(doc.id, doc.data())
        if (order) {
          orders.push(order)
        }
      })
      
      return orders
    } catch (error) {
      console.error('Error fetching orders for week:', error)
      throw new Error('No se pudieron cargar los pedidos de la semana')
    }
  }

  /**
   * Obtiene pedidos con filtros avanzados
   */
  static async getOrdersWithFilters(filters: OrderFilters): Promise<OrderStateByChild[]> {
    try {
      const ordersRef = collection(db, this.COLLECTION_NAME)
      let q = query(ordersRef, orderBy('createdAt', 'desc'))

      // Aplicar filtros
      if (filters.userId) {
        q = query(ordersRef, where('userId', '==', filters.userId), orderBy('createdAt', 'desc'))
      }

      if (filters.weekStart) {
        q = query(ordersRef, where('weekStart', '==', filters.weekStart), orderBy('createdAt', 'desc'))
      }

      if (filters.status && filters.status.length > 0) {
        q = query(ordersRef, where('status', 'in', filters.status), orderBy('createdAt', 'desc'))
      }

      if (filters.userType) {
        q = query(ordersRef, where('tipoUsuario', '==', filters.userType), orderBy('createdAt', 'desc'))
      }

      const snapshot = await getDocs(q)
      const orders: OrderStateByChild[] = []
      
      snapshot.forEach((doc) => {
        const order = this.mapDocumentToOrder(doc.id, doc.data())
        if (order) {
          // Filtrar por rango de fechas si se especifica
          if (filters.dateRange) {
            const orderDate = order.createdAt
            if (orderDate >= filters.dateRange.start && orderDate <= filters.dateRange.end) {
              orders.push(order)
            }
          } else {
            orders.push(order)
          }
        }
      })
      
      return orders
    } catch (error) {
      console.error('Error fetching orders with filters:', error)
      throw new Error('No se pudieron cargar los pedidos')
    }
  }

  /**
   * Guarda un nuevo pedido - ACTUALIZADO para múltiples pedidos
   */
  static async saveOrder(order: Omit<OrderStateByChild, 'id' | 'createdAt' | 'fechaCreacion' | 'updatedAt'>): Promise<string> {
    try {
      // Validar datos requeridos
      this.validateOrderData(order)

      const ordersRef = collection(db, this.COLLECTION_NAME)
      
      // Limpiar y validar las selecciones
      const cleanedSelections = this.cleanSelections(order.resumenPedido)
      
      if (cleanedSelections.length === 0) {
        throw new Error('No hay selecciones válidas para guardar')
      }

      // Recalcular total para asegurar consistencia
      const calculatedTotal = this.calculateOrderTotal(cleanedSelections, order.tipoUsuario)

      // Obtener número de pedido para múltiples pedidos
      const existingOrders = await this.getUserOrders(order.userId, order.weekStart)
      const orderNumber = existingOrders.length + 1
      const isAdditionalOrder = orderNumber > 1

      // Preparar datos para Firebase
      const orderData: Record<string, string | number | boolean | Timestamp | OrderSelectionByChild[] | object> = {
        userId: order.userId,
        tipoUsuario: order.tipoUsuario,
        weekStart: order.weekStart,
        resumenPedido: cleanedSelections,
        total: calculatedTotal,
        status: order.status || 'pendiente',
        fechaCreacion: Timestamp.now(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        metadata: {
          version: this.VERSION,
          source: 'web',
          orderNumber,
          isAdditionalOrder,
          ...order.metadata
        }
      }

      // Agregar paymentId solo si existe
      if (order.paymentId) {
        orderData.paymentId = order.paymentId
      }

      // Limpiar datos undefined
      const finalOrderData = this.cleanOrderData(orderData)
      
      console.log('💾 Saving order:', { 
        userId: order.userId, 
        weekStart: order.weekStart, 
        total: calculatedTotal,
        orderNumber,
        isAdditionalOrder
      })
      
      const docRef = await addDoc(ordersRef, finalOrderData)
      console.log('✅ Order saved successfully with ID:', docRef.id)
      
      return docRef.id
    } catch (error) {
      console.error('Error saving order:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('No se pudo guardar el pedido')
    }
  }

  /**
   * Actualiza un pedido existente
   */
  static async updateOrder(orderId: string, updates: Partial<OrderStateByChild>): Promise<void> {
    try {
      if (!orderId) {
        throw new Error('orderId es requerido')
      }

      const orderRef = doc(db, this.COLLECTION_NAME, orderId)
      
      // Verificar que el documento existe
      const docSnap = await getDoc(orderRef)
      if (!docSnap.exists()) {
        throw new Error('El pedido no existe')
      }
      
      const { paidAt, fechaCreacion, createdAt, ...restUpdates } = updates
      const updateData: Record<string, string | number | boolean | Timestamp | OrderSelectionByChild[] | object | null> = {
        ...restUpdates,
        updatedAt: Timestamp.now()
      }
      
      // Manejar fechas especiales
      if (paidAt) {
        updateData.paidAt = Timestamp.fromDate(paidAt)
      }
      
      if (fechaCreacion) {
        updateData.fechaCreacion = Timestamp.fromDate(fechaCreacion)
      }

      if (createdAt) {
        updateData.createdAt = Timestamp.fromDate(createdAt)
      }

      // Si se actualizan las selecciones, recalcular el total
      if (updates.resumenPedido) {
        const currentData = docSnap.data()
        const cleanedSelections = this.cleanSelections(updates.resumenPedido)
        updateData.resumenPedido = cleanedSelections
        updateData.total = this.calculateOrderTotal(cleanedSelections, currentData.tipoUsuario)
      }

      // Limpiar datos undefined
      const cleanedUpdateData = this.cleanOrderData(updateData) as Record<string, string | number | boolean | Timestamp | OrderSelectionByChild[] | object | null>
      
      await updateDoc(orderRef, cleanedUpdateData)
      console.log('✅ Order updated successfully:', orderId)
    } catch (error) {
      console.error('Error updating order:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('No se pudo actualizar el pedido')
    }
  }

  /**
   * Cancela un pedido
   */
  static async cancelOrder(orderId: string, reason?: string): Promise<void> {
    try {
      await this.updateOrder(orderId, {
        status: 'cancelado',
        metadata: {
          version: this.VERSION,
          source: 'web',
          cancelReason: reason || 'No reason provided',
          cancelledAt: new Date().toISOString()
        }
      })
    } catch (error) {
      console.error('Error cancelling order:', error)
      throw new Error('No se pudo cancelar el pedido')
    }
  }

  /**
   * Marca un pedido como pagado
   */
  static async markOrderAsPaid(orderId: string, paymentId: string): Promise<void> {
    try {
      await this.updateOrder(orderId, {
        status: 'pagado',
        paidAt: new Date(),
        paymentId
      })
    } catch (error) {
      console.error('Error marking order as paid:', error)
      throw new Error('No se pudo marcar el pedido como pagado')
    }
  }

  /**
   * Obtiene estadísticas de pedidos
   */
  static async getOrderStats(filters?: Partial<OrderFilters>): Promise<OrderStats> {
    try {
      const orders = filters ? await this.getOrdersWithFilters(filters) : await this.getOrdersWithFilters({})
      
      const totalOrders = orders.length
      const totalRevenue = orders
        .filter(order => order.status === 'pagado')
        .reduce((sum, order) => sum + order.total, 0)
      
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
      
      const ordersByStatus = orders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      return {
        totalOrders,
        totalRevenue,
        averageOrderValue,
        ordersByStatus
      }
    } catch (error) {
      console.error('Error getting order stats:', error)
      throw new Error('No se pudieron obtener las estadísticas de pedidos')
    }
  }

  /**
   * Valida un pedido antes de proceder al pago - ACTUALIZADO: Permite múltiples pedidos
   */
  static validateOrderByChild(
    selections: OrderSelectionByChild[], 
    weekDays: string[], 
    isOrderingAllowed: boolean,
    user: User,
    existingOrders?: OrderStateByChild[] // Nuevo parámetro opcional
  ): OrderValidation {
    const errors: string[] = []
    const warnings: string[] = []
    const missingDays: string[] = []
    
    // Verificar si se permite hacer pedidos
    if (!isOrderingAllowed) {
      errors.push('El tiempo para realizar pedidos ha expirado')
    }
    
    // Verificar que haya al menos una selección (almuerzo O colación)
    const selectionsWithItems = selections.filter(s => s.almuerzo || s.colacion)
    if (selectionsWithItems.length === 0) {
      errors.push('Debe seleccionar al menos un almuerzo o colación para proceder')
    }
    
    if (user.tipoUsuario === 'apoderado') {
      // Verificar que haya hijos registrados
      const children = user.children || user.hijos || []
      if (children.length === 0) {
        errors.push('Debe registrar al menos un hijo para realizar pedidos')
      }
      
      // Verificar que haya al menos una selección para algún hijo
      if (selections.length === 0) {
        errors.push('Debe seleccionar menús para al menos un hijo')
      }

      // Verificar que todas las selecciones tengan un hijo asignado
      const selectionsWithoutChild = selections.filter(s => !s.hijo)
      if (selectionsWithoutChild.length > 0) {
        errors.push('Todas las selecciones deben tener un hijo asignado')
      }
    }
    
    // Validar estructura de las selecciones
    const invalidSelections = selections.filter(s => !s.date || (!s.almuerzo && !s.colacion))
    if (invalidSelections.length > 0) {
      errors.push('Hay selecciones inválidas en el pedido')
    }
    
    // NUEVO: Información sobre múltiples pedidos
    if (existingOrders && existingOrders.length > 0) {
      const paidOrders = existingOrders.filter(order => order.status === 'pagado')
      const pendingOrders = existingOrders.filter(order => order.status === 'pendiente' || order.status === 'procesando_pago')
      
      if (paidOrders.length > 0) {
        warnings.push(`Ya tienes ${paidOrders.length} pedido(s) pagado(s) para esta semana. Este será un pedido adicional.`)
      }
      
      if (pendingOrders.length > 0) {
        warnings.push(`Tienes ${pendingOrders.length} pedido(s) pendiente(s) de pago. Puedes agregar más elementos o crear un nuevo pedido.`)
      }
    }
    
    // Advertencias informativas (no bloquean el pago)
    const weekDaysLaboral = weekDays.filter((_, index) => index < 5) // Solo lunes a viernes
    const selectionsWithAlmuerzo = selections.filter(s => s.almuerzo)
    const selectionsWithColacion = selections.filter(s => s.colacion)
    
    // Información sobre el tipo de pedido
    if (selectionsWithAlmuerzo.length === 0 && selectionsWithColacion.length > 0) {
      warnings.push(`Has seleccionado solo colaciones (${selectionsWithColacion.length}). Puedes agregar almuerzos después del pago si lo deseas.`)
    }
    
    if (selectionsWithAlmuerzo.length > 0 && selectionsWithColacion.length === 0) {
      warnings.push(`Has seleccionado solo almuerzos (${selectionsWithAlmuerzo.length}). Las colaciones son opcionales.`)
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      missingDays,
      canProceedToPayment: errors.length === 0 && isOrderingAllowed && selectionsWithItems.length > 0
    }
  }

  /**
   * Método de compatibilidad con la estructura anterior - ACTUALIZADO
   */
  static validateOrder(
    selections: OrderSelectionByChild[], 
    weekDays: string[], 
    isOrderingAllowed: boolean,
    existingOrders?: OrderStateByChild[]
  ): OrderValidation {
    const errors: string[] = []
    const warnings: string[] = []
    const missingDays: string[] = []
    
    if (!isOrderingAllowed) {
      errors.push('El tiempo para realizar pedidos ha expirado')
    }
    
    // Verificar que haya al menos una selección (almuerzo O colación)
    const selectionsWithItems = selections.filter(s => s.almuerzo || s.colacion)
    if (selectionsWithItems.length === 0) {
      errors.push('Debe seleccionar al menos un almuerzo o colación para proceder')
    }
    
    // NUEVO: Información sobre múltiples pedidos
    if (existingOrders && existingOrders.length > 0) {
      const paidOrders = existingOrders.filter(order => order.status === 'pagado')
      const pendingOrders = existingOrders.filter(order => order.status === 'pendiente' || order.status === 'procesando_pago')
      
      if (paidOrders.length > 0) {
        warnings.push(`Ya tienes ${paidOrders.length} pedido(s) pagado(s) para esta semana.`)
      }
      
      if (pendingOrders.length > 0) {
        warnings.push(`Tienes ${pendingOrders.length} pedido(s) pendiente(s) de pago.`)
      }
    }
    
    // Advertencias informativas
    const weekDaysLaboral = weekDays.filter((_, index) => index < 5) // Solo lunes a viernes
    const selectionsWithAlmuerzo = selections.filter(s => s.almuerzo)
    const selectionsWithColacion = selections.filter(s => s.colacion)
    
    // Información sobre colaciones
    if (selectionsWithColacion.length > 0 && selectionsWithAlmuerzo.length === 0) {
      warnings.push(`Has seleccionado solo colaciones (${selectionsWithColacion.length})`)
    } else if (selectionsWithAlmuerzo.length > 0 && selectionsWithColacion.length === 0) {
      warnings.push(`${selectionsWithAlmuerzo.length} día(s) sin colación seleccionada`)
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      missingDays,
      canProceedToPayment: errors.length === 0 && isOrderingAllowed && selectionsWithItems.length > 0
    }
  }

  /**
   * Calcula el total del pedido
   */
  static calculateOrderTotal(selections: OrderSelectionByChild[], userType: UserType): number {
    const prices = PRICES[userType]
    let total = 0
    
    selections.forEach(selection => {
      if (selection.almuerzo) {
        total += prices.almuerzo
      }
      if (selection.colacion) {
        total += prices.colacion
      }
    })
    
    return total
  }

  /**
   * Obtiene resumen del pedido
   */
  static getOrderSummary(selections: OrderSelectionByChild[], userType: UserType) {
    const totalAlmuerzos = selections.filter(s => s.almuerzo).length
    const totalColaciones = selections.filter(s => s.colacion).length
    
    const prices = PRICES[userType]
    
    const subtotalAlmuerzos = totalAlmuerzos * prices.almuerzo
    const subtotalColaciones = totalColaciones * prices.colacion
    const total = subtotalAlmuerzos + subtotalColaciones
    
    // Resumen por hijo (solo para apoderados)
    const resumenPorHijo: { [hijoId: string]: {
      hijo: { id: string; name: string; curso: string; rut?: string; active: boolean };
      almuerzos: number;
      colaciones: number;
      subtotal: number;
    } } = {}
    
    selections.forEach(selection => {
      if (selection.hijo) {
        const hijoId = selection.hijo.id
        if (!resumenPorHijo[hijoId]) {
          resumenPorHijo[hijoId] = {
            hijo: selection.hijo,
            almuerzos: 0,
            colaciones: 0,
            subtotal: 0
          }
        }
        
        if (selection.almuerzo) {
          resumenPorHijo[hijoId].almuerzos++
          resumenPorHijo[hijoId].subtotal += prices.almuerzo
        }
        
        if (selection.colacion) {
          resumenPorHijo[hijoId].colaciones++
          resumenPorHijo[hijoId].subtotal += prices.colacion
        }
      }
    })
    
    return {
      totalAlmuerzos,
      totalColaciones,
      subtotalAlmuerzos,
      subtotalColaciones,
      total,
      selections,
      resumenPorHijo
    }
  }

  // Métodos privados de utilidad

  /**
   * Mapea un documento de Firestore a un objeto OrderStateByChild
   * CORREGIDO: Maneja correctamente los timestamps de Firestore
   */
  private static mapDocumentToOrder(id: string, data: DocumentData): OrderStateByChild | null {
    try {
      // Función auxiliar para convertir timestamps de manera segura
      const safeToDate = (timestamp: unknown): Date => {
        if (!timestamp) {
          return new Date()
        }
        
        // Si es un Timestamp de Firestore
        if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
          try {
            return (timestamp as Timestamp).toDate()
          } catch (error) {
            console.warn('Error converting Firestore timestamp:', error)
            return new Date()
          }
        }
        
        // Si es una fecha como string
        if (typeof timestamp === 'string') {
          const date = new Date(timestamp)
          return isNaN(date.getTime()) ? new Date() : date
        }
        
        // Si es un número (timestamp en milisegundos)
        if (typeof timestamp === 'number') {
          return new Date(timestamp)
        }
        
        // Si es ya un objeto Date
        if (timestamp instanceof Date) {
          return timestamp
        }
        
        // Si es un objeto con seconds y nanoseconds (formato Firestore)
        if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp) {
          try {
            const seconds = (timestamp as { seconds: number; nanoseconds?: number }).seconds
            const nanoseconds = (timestamp as { seconds: number; nanoseconds?: number }).nanoseconds || 0
            return new Date(seconds * 1000 + nanoseconds / 1000000)
          } catch (error) {
            console.warn('Error converting timestamp object:', error)
            return new Date()
          }
        }
        
        console.warn('Unknown timestamp format:', timestamp)
        return new Date()
      }

      return {
        id,
        userId: data.userId || '',
        tipoUsuario: data.tipoUsuario || 'apoderado',
        weekStart: data.weekStart || '',
        fechaCreacion: safeToDate(data.fechaCreacion),
        resumenPedido: data.resumenPedido || [],
        total: data.total || 0,
        status: data.status || 'pendiente',
        createdAt: safeToDate(data.createdAt),
        updatedAt: data.updatedAt ? safeToDate(data.updatedAt) : undefined,
        paidAt: data.paidAt ? safeToDate(data.paidAt) : undefined,
        paymentId: data.paymentId,
        metadata: data.metadata
      }
    } catch (error) {
      console.error('Error mapping document to order:', error)
      return null
    }
  }

  private static validateOrderData(order: Omit<OrderStateByChild, 'id' | 'createdAt' | 'fechaCreacion' | 'updatedAt'>): void {
    if (!order.userId) {
      throw new Error('userId es requerido')
    }
    if (!order.tipoUsuario) {
      throw new Error('tipoUsuario es requerido')
    }
    if (!order.weekStart) {
      throw new Error('weekStart es requerido')
    }
    if (!order.resumenPedido || order.resumenPedido.length === 0) {
      throw new Error('resumenPedido no puede estar vacío')
    }
    if (!['apoderado', 'funcionario'].includes(order.tipoUsuario)) {
      throw new Error('tipoUsuario debe ser "apoderado" o "funcionario"')
    }
    if (!['pendiente', 'pagado', 'cancelado', 'procesando_pago'].includes(order.status)) {
      throw new Error('status inválido')
    }
  }

  private static cleanOrderData(data: Record<string, unknown>): Record<string, unknown> {
    const cleaned: Record<string, unknown> = {}
    
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          // Limpiar arrays recursivamente
          cleaned[key] = value.map(item => 
            typeof item === 'object' && item !== null 
              ? this.cleanOrderData(item as Record<string, unknown>) 
              : item
          ).filter(item => item !== undefined && item !== null)
        } else if (typeof value === 'object' && value !== null && !(value instanceof Timestamp)) {
          // Limpiar objetos recursivamente (excepto Timestamps)
          const cleanedObject = this.cleanOrderData(value as Record<string, unknown>)
          if (Object.keys(cleanedObject).length > 0) {
            cleaned[key] = cleanedObject
          }
        } else {
          cleaned[key] = value
        }
      }
    }
    
    return cleaned
  }

  private static cleanSelections(selections: OrderSelectionByChild[]): OrderSelectionByChild[] {
    return selections.map(selection => {
      const cleanedSelection: Partial<OrderSelectionByChild> = {
        date: selection.date || '',
        dia: selection.dia || '',
        fecha: selection.fecha || selection.date || ''
      }

      // Limpiar hijo (puede ser null para funcionarios)
      if (selection.hijo) {
        cleanedSelection.hijo = {
          id: selection.hijo.id || '',
          name: selection.hijo.name || selection.hijo.nombre || '',
          curso: selection.hijo.curso || '',
          rut: selection.hijo.rut,
          active: selection.hijo.active !== undefined ? selection.hijo.active : true
        }
      } else {
        cleanedSelection.hijo = null
      }

      // Limpiar almuerzo
      if (selection.almuerzo) {
        cleanedSelection.almuerzo = {
          id: selection.almuerzo.id || '',
          code: selection.almuerzo.code || '',
          name: selection.almuerzo.name || '',
          description: selection.almuerzo.description || '',
          type: 'almuerzo',
          price: selection.almuerzo.price || 0,
          available: selection.almuerzo.available !== undefined ? selection.almuerzo.available : true,
          date: selection.almuerzo.date || selection.date || '',
          dia: selection.almuerzo.dia || selection.dia || '',
          active: selection.almuerzo.active !== undefined ? selection.almuerzo.active : true
        }
      }

      // Limpiar colación
      if (selection.colacion) {
        cleanedSelection.colacion = {
          id: selection.colacion.id || '',
          code: selection.colacion.code || '',
          name: selection.colacion.name || '',
          description: selection.colacion.description || '',
          type: 'colacion',
          price: selection.colacion.price || 0,
          available: selection.colacion.available !== undefined ? selection.colacion.available : true,
          date: selection.colacion.date || selection.date || '',
          dia: selection.colacion.dia || selection.dia || '',
          active: selection.colacion.active !== undefined ? selection.colacion.active : true
        }
      }

      return cleanedSelection as OrderSelectionByChild
    }).filter(selection => 
      // Filtrar selecciones que tengan al menos almuerzo o colación
      selection.almuerzo || selection.colacion
    )
  }
}