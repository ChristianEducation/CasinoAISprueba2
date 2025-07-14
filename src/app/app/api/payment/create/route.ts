import { NextRequest, NextResponse } from 'next/server'
import { GetNetPaymentRequest, GetNetPaymentResponse } from '@/services/paymentService'
import crypto from 'crypto'

// Interface para el payload de NetGet
interface NetGetPayload {
  merchant_id: string
  amount: number
  order_id: string
  description: string
  customer_email: string
  customer_name: string
  return_url: string
  notify_url: string
  currency: string
  environment: string
  signature?: string
}

// Configuración de NetGet desde variables de entorno
const NETGET_CONFIG = {
  apiUrl: process.env.NETGET_API_URL || 'https://api.netget.cl',
  merchantId: process.env.NETGET_MERCHANT_ID || '',
  secretKey: process.env.NETGET_SECRET_KEY || '',
  environment: process.env.NETGET_ENVIRONMENT || 'sandbox' // 'sandbox' o 'production'
}

export async function POST(request: NextRequest) {
  try {
    const body: GetNetPaymentRequest = await request.json()
    
    console.log('Creating NetGet payment:', body)

    // Validar datos requeridos
    if (!body.amount || !body.orderId || !body.customerEmail) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Datos incompletos: amount, orderId y customerEmail son requeridos' 
        },
        { status: 400 }
      )
    }

    // Validar configuración de NetGet
    if (!NETGET_CONFIG.merchantId || !NETGET_CONFIG.secretKey) {
      console.error('NetGet configuration missing')
      return NextResponse.json(
        { 
          success: false, 
          error: 'Configuración de pago no disponible' 
        },
        { status: 500 }
      )
    }

    // Preparar datos para NetGet
    const netGetPayload: NetGetPayload = {
      merchant_id: NETGET_CONFIG.merchantId,
      amount: body.amount,
      order_id: body.orderId,
      description: body.description || `Pedido Casino Escolar #${body.orderId}`,
      customer_email: body.customerEmail,
      customer_name: body.customerName || 'Cliente',
      return_url: body.returnUrl || `${request.nextUrl.origin}/payment/return`,
      notify_url: body.notifyUrl || `${request.nextUrl.origin}/api/payment/notify`,
      currency: 'CLP',
      environment: NETGET_CONFIG.environment
    }

    // Generar firma (implementar según documentación de NetGet)
    const signature = generateNetGetSignature(netGetPayload, NETGET_CONFIG.secretKey)
    netGetPayload.signature = signature

    console.log('NetGet payload prepared:', { ...netGetPayload, signature: '[HIDDEN]' })

    // Llamar a la API de NetGet
    const netGetResponse = await fetch(`${NETGET_CONFIG.apiUrl}/v1/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'CasinoEscolar/1.0'
      },
      body: JSON.stringify(netGetPayload)
    })

    const netGetData = await netGetResponse.json()
    
    console.log('NetGet API response:', netGetData)

    if (!netGetResponse.ok) {
      throw new Error(netGetData.message || `NetGet API error: ${netGetResponse.status}`)
    }

    // Procesar respuesta exitosa de NetGet
    if (netGetData.success && netGetData.payment_url) {
      const response: GetNetPaymentResponse = {
        success: true,
        paymentId: netGetData.payment_id || netGetData.transaction_id,
        redirectUrl: netGetData.payment_url,
        transactionId: netGetData.transaction_id
      }

      console.log('NetGet payment created successfully:', response)
      return NextResponse.json(response)
  } else {
    throw new Error(netGetData.error || 'Error en la respuesta de NetGet')
  }
} catch (error) {
    console.error('Error creating NetGet payment:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error interno del servidor' 
      },
      { status: 500 }
    )
  }
}

function generateNetGetSignature(payload: NetGetPayload, secretKey: string): string {
  try {
    // Crear string para firmar (según documentación de NetGet)
    // Crear string para firmar (según documentación de NetGet)
    // Típicamente es: merchant_id + amount + order_id + currency + secret_key
    const stringToSign = [
      payload.merchant_id,
      payload.amount,
      payload.order_id,
      payload.currency || 'CLP',
      secretKey
    ].join('')

    // Generar HMAC-SHA256
    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(stringToSign)
      .digest('hex')

    console.log('Generated signature for NetGet')
    return signature
  } catch (error) {
    console.error('Error generating NetGet signature:', error)
    throw new Error('Error al generar firma de seguridad')
  }
}

// Manejar otros métodos HTTP
export async function GET() {
  return NextResponse.json(
    { error: 'Método no permitido' },
    { status: 405 }
  )
}
