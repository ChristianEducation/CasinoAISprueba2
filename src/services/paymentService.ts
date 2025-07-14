import { PaymentRequest, PaymentResponse } from '@/types/order'
import { OrderService } from './orderService'

// Extend PaymentRequest to include optional customerName
interface ExtendedPaymentRequest extends PaymentRequest {
  customerName?: string
}

// Configuración de GetNet corregida con endpoints válidos
const GETNET_CONFIG = {
  apiUrl: process.env.GETNET_BASE_URL || 'https://checkout.getnet.cl',
  testApiUrl: 'https://checkout.test.getnet.cl',
  login: process.env.GETNET_LOGIN || '',
  secret: process.env.GETNET_SECRET || '',
  environment: process.env.GETNET_ENVIRONMENT || 'test',
  returnUrl: typeof window !== 'undefined' 
    ? `${window.location.origin}/payment/return` 
    : `${process.env.NEXT_PUBLIC_APP_URL}/payment/return`,
  notifyUrl: typeof window !== 'undefined' 
    ? `${window.location.origin}/api/payment/notify` 
    : `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/notify`
}

export interface GetNetPaymentRequest {
  amount: number
  orderId: string
  description: string
  customerEmail: string
  customerName: string
  returnUrl?: string
  notifyUrl?: string
}

export interface GetNetPaymentResponse {
  success: boolean
  paymentId?: string
  redirectUrl?: string
  error?: string
  transactionId?: string
}

export interface GetNetNotificationData {
  status: string
  orderId: string
  transactionId: string
  amount?: number
  signature?: string
  [key: string]: string | number | boolean | undefined
}

export class PaymentService {
  // Crear pago con GetNet
  static async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      console.log('Creating GetNet payment with request:', request)

      // Extraer nombre del cliente de manera más robusta
      const customerName = PaymentService.extractCustomerName(request)

      const getNetRequest: GetNetPaymentRequest = {
        amount: request.amount,
        orderId: request.orderId,
        description: request.description || `Pedido Casino Escolar #${request.orderId}`,
        customerEmail: request.userEmail,
        customerName: customerName,
        returnUrl: GETNET_CONFIG.returnUrl,
        notifyUrl: GETNET_CONFIG.notifyUrl
      }

      console.log('GetNet request prepared:', getNetRequest)

      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(getNetRequest),
      })
      
      let responseData
      try {
        responseData = await response.json()
      } catch (parseError) {
        console.error('Error parsing payment API response:', parseError)
        throw new Error('Error en la respuesta del servidor de pagos')
      }
      
      if (!response.ok) {
        console.error('Payment API error:', {
          status: response.status,
          statusText: response.statusText,
          errorData: responseData
        })
        
        // Proporcionar mensajes de error más específicos
        let errorMessage = 'Error del servidor de pagos'
        
        if (response.status === 400) {
          errorMessage = responseData.error || 'Datos de pago inválidos'
        } else if (response.status === 500) {
          errorMessage = responseData.error || 'Error interno del servidor'
        } else if (response.status === 404) {
          errorMessage = 'Servicio de pagos no disponible'
        } else {
          errorMessage = responseData.error || responseData.message || `Error del servidor: ${response.status}`
        }
        
        throw new Error(errorMessage)
      }
      
      const data: GetNetPaymentResponse = responseData
      
      if (!data.success) {
        throw new Error(data.error || 'Error en la respuesta del servicio de pago')
      }

      // Validar que tenemos los datos necesarios para el redirect
      if (!data.redirectUrl) {
        console.error('GetNet response missing redirect URL:', data)
        throw new Error('No se recibió la URL de pago. Por favor, intenta nuevamente.')
      }

      console.log('GetNet payment created successfully:', data)
      
      return {
        success: true,
        paymentId: data.paymentId || data.transactionId || '',
        redirectUrl: data.redirectUrl
      }
    } catch (error) {
      console.error('Error creating GetNet payment:', error)
      
      // Mejorar mensajes de error para el usuario
      let userFriendlyMessage = 'Error desconocido al procesar el pago'
      
      if (error instanceof Error) {
        if (error.message.includes('fetch') || error.message.includes('network')) {
          userFriendlyMessage = 'Error de conexión. Verifica tu internet e intenta nuevamente.'
        } else if (error.message.includes('ENOTFOUND')) {
          userFriendlyMessage = 'Servicio de pagos temporalmente no disponible. Intenta más tarde.'
        } else if (error.message.includes('no disponible')) {
          userFriendlyMessage = 'El servicio de pagos no está disponible temporalmente. Intenta más tarde.'
        } else if (error.message.includes('configuración')) {
          userFriendlyMessage = 'Error de configuración del sistema. Contacta al administrador.'
        } else {
          userFriendlyMessage = error.message
        }
      }
      
      return {
        success: false,
        error: userFriendlyMessage
      }
    }
  }

  // Método auxiliar para extraer nombre del cliente
  private static extractCustomerName(request: PaymentRequest): string {
    // Si hay un customerName en el request, usarlo
    if ((request as ExtendedPaymentRequest).customerName) {
      return (request as ExtendedPaymentRequest).customerName!
    }

    // Intentar extraer nombre del email
    if (request.userEmail) {
      const emailParts = request.userEmail.split('@')
      if (emailParts.length > 0) {
        // Capitalizar primera letra y reemplazar puntos/guiones con espacios
        const name = emailParts[0]
          .replace(/[._-]/g, ' ')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ')
        return name || 'Cliente'
      }
    }

    return 'Cliente'
  }

  // Verificar estado del pago
  static async verifyPayment(paymentId: string): Promise<boolean> {
    try {
      console.log('Verifying GetNet payment:', paymentId)

      const response = await fetch(`/api/payment/verify/${paymentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (!response.ok) {
        console.error('Payment verification failed with status:', response.status)
        return false
      }
      
      const data = await response.json()
      console.log('Payment verification response:', data)
      
      return data.success || false
    } catch (error) {
      console.error('Error verifying GetNet payment:', error)
      return false
    }
  }

  // Procesar notificación de GetNet (webhook) - MEJORADO
  static async processNotification(notificationData: GetNetNotificationData): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Processing GetNet notification:', notificationData)

      // Validar la notificación (verificar firma, etc.)
      const isValid = await this.validateNotification(notificationData)
      
      if (!isValid) {
        return {
          success: false,
          message: 'Notificación inválida'
        }
      }

      // Procesar según el estado del pago
      const { status, orderId, transactionId, amount } = notificationData

      // Obtener el pedido de Firebase
      const order = await OrderService.getOrderById(orderId)
      if (!order) {
        console.error(`Order not found for notification: ${orderId}`)
        return {
          success: false,
          message: 'Pedido no encontrado'
        }
      }

      switch (status.toLowerCase()) {
        case 'ok':
        case 'approved':
        case 'paid':
        case 'completed':
        case 'success':
          console.log(`Payment approved for order ${orderId}, transaction: ${transactionId}, amount: ${amount}`)
          
          // Marcar pedido como pagado
          await OrderService.updateOrder(orderId, {
            status: 'pagado',
            paidAt: new Date(),
            paymentId: transactionId,
            metadata: {
              ...order.metadata,
              version: order.metadata?.version || '1.0',
              source: order.metadata?.source || 'payment',
              paymentProcessedAt: new Date().toISOString(),
              paymentMethod: 'GetNet',
              transactionId: transactionId
            }
          })
          break
        
        case 'rejected':
        case 'failed':
        case 'cancelled':
        case 'declined':
          console.log(`Payment failed for order ${orderId}, transaction: ${transactionId}, amount: ${amount}`)
          await OrderService.updateOrder(orderId, {
            status: 'cancelado',
            metadata: {
              ...order.metadata,
              version: order.metadata?.version || '1.0',
              source: order.metadata?.source || 'payment',
              paymentFailedAt: new Date().toISOString(),
              failureReason: status,
              transactionId: transactionId
            }
          })
          break
        
        case 'pending':
          await OrderService.updateOrder(orderId, {
            status: 'procesando_pago',
            paymentId: transactionId,
            metadata: {
              ...order.metadata,
              version: order.metadata?.version || '1.0',
              source: order.metadata?.source || 'payment',
              paymentPendingAt: new Date().toISOString(),
              transactionId: transactionId
            }
          })
          break
        
        default:
          console.log(`Unknown payment status for order ${orderId}: ${status}`)
          await OrderService.updateOrder(orderId, {
            metadata: {
              ...order.metadata,
              version: order.metadata?.version || '1.0',
              source: order.metadata?.source || 'payment',
              unknownStatusAt: new Date().toISOString(),
              unknownStatus: status,
              transactionId: transactionId
            }
          })
          break
      }

      return {
        success: true,
        message: 'Notificación procesada correctamente'
      }
    } catch (error) {
      console.error('Error processing GetNet notification:', error)
      return {
        success: false,
        message: 'Error al procesar la notificación'
      }
    }
  }

  // Validar notificación de GetNet
  private static async validateNotification(notificationData: GetNetNotificationData): Promise<boolean> {
    try {
      // Implementar validación de firma según documentación de GetNet
      // Por ahora retornamos true, pero en producción debe validarse la firma
      
      const requiredFields = ['status', 'orderId', 'transactionId']
      const hasRequiredFields = requiredFields.every(field => 
        notificationData.hasOwnProperty(field) && notificationData[field] !== null
      )

      if (!hasRequiredFields) {
        console.error('Missing required fields in notification:', notificationData)
        return false
      }
      
      // Aquí se validaría la firma HMAC con la clave secreta
      // const expectedSignature = this.generateSignature(notificationData)
      // return expectedSignature === notificationData.signature
      
      return true
    } catch (error) {
      console.error('Error validating GetNet notification:', error)
      return false
    }
  }

  // Obtener configuración de GetNet (para debugging)
  static getConfig() {
    return {
      apiUrl: GETNET_CONFIG.apiUrl,
      testApiUrl: GETNET_CONFIG.testApiUrl,
      environment: GETNET_CONFIG.environment,
      login: GETNET_CONFIG.login,
      hasSecret: !!GETNET_CONFIG.secret,
      returnUrl: GETNET_CONFIG.returnUrl,
      notifyUrl: GETNET_CONFIG.notifyUrl
    }
  }
}