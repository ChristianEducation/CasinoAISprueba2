import { NextRequest, NextResponse } from 'next/server'
import { OrderService } from '@/services/orderService'

// Interface para notificaciones de GetNet según su documentación
interface GetNetNotification {
  status: {
    status: string
    message: string
    reason?: string | number
    date: string
  }
  requestId?: string | number
  reference?: string // Este es nuestro orderId
  signature?: string
  authorization?: string
  receipt?: string
  franchise?: string
  franchiseName?: string
  bank?: string
  bankName?: string
  internalReference?: number
  paymentMethod?: string
  paymentMethodName?: string
  issuerName?: string
  amount?: {
    from?: {
      currency: string
      total: number
    }
    to?: {
      currency: string
      total: number
    }
  }
  authorization_code?: string
  transaction?: {
    transactionID?: string
    cus?: string
    reference?: string
    description?: string
  }
  // Campos adicionales alternativos que puede enviar GetNet
  order_id?: string
  orderId?: string
  state?: string
  transaction_id?: string
  transactionId?: string
  // Campos adicionales que puede enviar GetNet
  [key: string]: unknown
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== WEBHOOK GETNET RECEIVED ===')
    
    // Leer el cuerpo de la petición
    const rawBody = await request.text()
    console.log('Raw webhook body:', rawBody)
    
    let notificationData: GetNetNotification
    try {
      notificationData = JSON.parse(rawBody)
    } catch (parseError) {
      console.error('Error parsing webhook JSON:', parseError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid JSON format' 
        },
        { status: 400 }
      )
    }
    
    console.log('Parsed GetNet notification:', JSON.stringify(notificationData, null, 2))

    // Extraer información clave de la notificación
    const orderId = notificationData.reference || 
                   notificationData.transaction?.reference ||
                   notificationData.order_id ||
                   notificationData.orderId

    const paymentStatus = notificationData.status?.status || 
                         notificationData.state ||
                         (notificationData as Record<string, unknown>).status

    const requestId = notificationData.requestId?.toString() || 
                     notificationData.transaction?.transactionID ||
                     notificationData.transaction_id ||
                     notificationData.transactionId

    console.log('Extracted data:', {
      orderId,
      paymentStatus,
      requestId,
      statusMessage: notificationData.status?.message
    })

    // Validar que tenemos los datos mínimos requeridos
    if (!orderId) {
      console.error('Missing orderId in notification')
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing order reference' 
        },
        { status: 400 }
      )
    }

    if (!paymentStatus) {
      console.error('Missing payment status in notification')
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing payment status' 
        },
        { status: 400 }
      )
    }

    console.log(`Processing payment notification for order ${orderId}: ${paymentStatus}`)

    // Obtener el pedido de Firebase
    const order = await OrderService.getOrderById(orderId)
    if (!order) {
      console.error(`Order not found: ${orderId}`)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Order not found' 
        },
        { status: 404 }
      )
    }

    console.log('Found order:', {
      id: order.id,
      currentStatus: order.status,
      total: order.total,
      userId: order.userId
    })

    // Procesar según el estado del pago - CORREGIDO PARA GETNET
    let orderUpdateData: Partial<typeof order> = {}

    // Normalizar el estado para comparación (más específico)
    const normalizedStatus = typeof paymentStatus === 'string' ? paymentStatus.toUpperCase().trim() : String(paymentStatus).toUpperCase().trim()

    console.log('Normalized payment status:', normalizedStatus)

    // ESTADOS DE PAGO EXITOSO - AMPLIADO
    if (normalizedStatus === 'OK' || 
        normalizedStatus === 'APPROVED' || 
        normalizedStatus === 'PAID' || 
        normalizedStatus === 'COMPLETED' || 
        normalizedStatus === 'SUCCESS' ||
        normalizedStatus === 'APROBADA' ||
        normalizedStatus === 'EXITOSO' ||
        normalizedStatus === 'SUCCESSFUL' ||
        normalizedStatus === 'CONFIRMED' ||
        normalizedStatus === 'CONFIRMADO') {
      
      // Pago exitoso
      console.log(`✅ Payment APPROVED for order ${orderId}`)
      orderUpdateData = {
        status: 'pagado',
        paidAt: new Date(),
        paymentId: requestId || notificationData.requestId?.toString() || 'getnet_payment',
        metadata: {
          version: order.metadata?.version || '1.0',
          source: order.metadata?.source || 'webhook',
          ...order.metadata,
          paymentMethod: notificationData.paymentMethodName || notificationData.franchiseName || 'GetNet',
          authorization: notificationData.authorization || notificationData.authorization_code || null,
          franchise: notificationData.franchiseName || null,
          bank: notificationData.bankName || null,
          receipt: notificationData.receipt || null,
          processedAt: new Date().toISOString(),
          webhookData: JSON.stringify({
            requestId: notificationData.requestId,
            status: notificationData.status,
            amount: notificationData.amount,
            originalStatus: paymentStatus
          })
        }
      }
    } 
    // ESTADOS DE PAGO FALLIDO
    else if (normalizedStatus === 'FAILED' || 
               normalizedStatus === 'REJECTED' || 
               normalizedStatus === 'CANCELLED' || 
               normalizedStatus === 'DECLINED' ||
               normalizedStatus === 'RECHAZADA' ||
               normalizedStatus === 'CANCELADA' ||
               normalizedStatus === 'FALLIDA' ||
               normalizedStatus === 'ERROR' ||
               normalizedStatus === 'DENIED' ||
               normalizedStatus === 'DENEGADA') {
      
      // Pago fallido
      console.log(`❌ Payment FAILED for order ${orderId}: ${notificationData.status?.message}`)
      orderUpdateData = {
        status: 'cancelado',
        metadata: {
          version: order.metadata?.version || '1.0',
          source: order.metadata?.source || 'webhook',
          ...order.metadata,
          failureReason: notificationData.status?.message || 'Payment failed',
          failureCode: notificationData.status?.reason || null,
          processedAt: new Date().toISOString(),
          webhookData: JSON.stringify({
            requestId: notificationData.requestId,
            status: notificationData.status,
            amount: notificationData.amount,
            originalStatus: paymentStatus
          })
        }
      }
    } 
    // ESTADOS DE PAGO PENDIENTE
    else if (normalizedStatus === 'PENDING' || 
               normalizedStatus === 'PROCESSING' ||
               normalizedStatus === 'PENDIENTE' ||
               normalizedStatus === 'PROCESANDO' ||
               normalizedStatus === 'IN_PROGRESS' ||
               normalizedStatus === 'EN_PROCESO') {
      
        // Pago pendiente
        console.log(`⏳ Payment PENDING for order ${orderId}`)
        orderUpdateData = {
          status: 'procesando_pago',
          metadata: {
            version: order.metadata?.version || '1.0',
            source: order.metadata?.source || 'webhook',
            ...order.metadata,
            pendingReason: notificationData.status?.message || 'Payment processing',
            processedAt: new Date().toISOString(),
            webhookData: JSON.stringify({
              requestId: notificationData.requestId,
              status: notificationData.status,
              amount: notificationData.amount,
              originalStatus: paymentStatus
            })
          }
        }
      } else {
        // Estado desconocido - MEJORADO
        console.log(`⚠️ Unknown payment status for order ${orderId}: ${paymentStatus}`)
        console.log('Available status fields:', {
          'status.status': notificationData.status?.status,
          'state': notificationData.state,
          'status': (notificationData as Record<string, unknown>).status,
          'all_keys': Object.keys(notificationData)
        })
        
        orderUpdateData = {
          metadata: {
            version: order.metadata?.version || '1.0',
            source: order.metadata?.source || 'webhook',
            ...order.metadata,
            unknownStatus: String(paymentStatus),
            unknownMessage: notificationData.status?.message,
            processedAt: new Date().toISOString(),
            webhookData: JSON.stringify({
              requestId: notificationData.requestId,
              status: notificationData.status,
              amount: notificationData.amount,
              originalStatus: paymentStatus,
              fullNotification: notificationData
            })
          }
        }
    }

    // Actualizar el pedido en Firebase
    if (Object.keys(orderUpdateData).length > 0) {
      console.log('Updating order with data:', {
        orderId,
        newStatus: orderUpdateData.status,
        paymentId: orderUpdateData.paymentId,
        updateFields: Object.keys(orderUpdateData)
      })
      
      await OrderService.updateOrder(orderId, orderUpdateData)
      console.log(`✅ Order ${orderId} updated successfully to status: ${orderUpdateData.status || 'metadata only'}`)
    } else {
      console.log('No update data generated for order')
    }

    // Responder a GetNet con confirmación
    const response = { 
      success: true, 
      message: 'Notification processed successfully',
      orderId: orderId,
      status: orderUpdateData.status || order.status,
      originalStatus: paymentStatus,
      normalizedStatus: normalizedStatus,
      timestamp: new Date().toISOString()
    }

    console.log('Webhook response:', response)
    console.log('=== WEBHOOK PROCESSING COMPLETE ===')

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Error processing GetNet notification:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// Manejar método GET para verificaciones de webhook
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    service: 'getnet-payment-notification',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  })
}