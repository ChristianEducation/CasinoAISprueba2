import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { GetNetPaymentRequest } from '@/services/paymentService'

// Configuración de NetGet
const NETGET_CONFIG = {
  apiUrl: process.env.NETGET_API_URL || 'https://api.netget.cl',
  merchantId: process.env.NETGET_MERCHANT_ID || '',
  secretKey: process.env.NETGET_SECRET_KEY || '',
  returnUrl: process.env.NEXT_PUBLIC_NETGET_RETURN_URL || `${process.env.NEXT_PUBLIC_APP_URL}/payment/return`,
  notifyUrl: process.env.NEXT_PUBLIC_NETGET_NOTIFY_URL || `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/notify`
}

// Interface para los datos de pago de NetGet
interface NetGetPaymentData {
  merchant_id: string
  amount: number
  currency: string
  order_id: string
  description: string
  customer_email: string
  customer_name: string
  return_url: string
  notify_url: string
  timestamp: number
  signature?: string
}

// Interface para la respuesta de NetGet
interface NetGetResponse {
  success: boolean
  payment_id?: string
  transaction_id?: string
  redirect_url?: string
  payment_url?: string
  message?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: GetNetPaymentRequest = await request.json()
    
    console.log('Creating NetGet payment with data:', body)

    // Validar datos requeridos
    if (!body.amount || !body.orderId || !body.customerEmail) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Faltan datos requeridos: amount, orderId, customerEmail' 
        },
        { status: 400 }
      )
    }

    // Validar configuración de NetGet
    if (!NETGET_CONFIG.merchantId || !NETGET_CONFIG.secretKey) {
      console.error('NetGet configuration missing:', {
        hasMerchantId: !!NETGET_CONFIG.merchantId,
        hasSecretKey: !!NETGET_CONFIG.secretKey
      })
      return NextResponse.json(
        { 
          success: false, 
          error: 'Configuración de pago no disponible' 
        },
        { status: 500 }
      )
    }

    // Preparar datos para NetGet
    const paymentData: NetGetPaymentData = {
      merchant_id: NETGET_CONFIG.merchantId,
      amount: body.amount, // Ya viene en centavos
      currency: 'CLP',
      order_id: body.orderId,
      description: body.description || `Pedido Casino Escolar #${body.orderId}`,
      customer_email: body.customerEmail,
      customer_name: body.customerName || '',
      return_url: body.returnUrl || NETGET_CONFIG.returnUrl,
      notify_url: body.notifyUrl || NETGET_CONFIG.notifyUrl,
      timestamp: Math.floor(Date.now() / 1000)
    }

    // Generar firma (implementar según documentación de NetGet)
    const signature = generateNetGetSignature(paymentData, NETGET_CONFIG.secretKey)
    paymentData.signature = signature

    console.log('Sending payment request to NetGet:', {
      ...paymentData,
      signature: '***hidden***'
    })

    // Realizar petición a NetGet
    const netGetResponse = await fetch(`${NETGET_CONFIG.apiUrl}/payments/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(paymentData)
    })

    if (!netGetResponse.ok) {
      const errorText = await netGetResponse.text()
      console.error('NetGet API error:', {
        status: netGetResponse.status,
        statusText: netGetResponse.statusText,
        body: errorText
      })
      
      return NextResponse.json(
        { 
          success: false, 
          error: `Error del servicio de pago: ${netGetResponse.status}` 
        },
        { status: 500 }
      )
    }

    const netGetResult: NetGetResponse = await netGetResponse.json()
    console.log('NetGet response:', netGetResult)

    if (netGetResult.success) {
      return NextResponse.json({
        success: true,
        paymentId: netGetResult.payment_id || netGetResult.transaction_id,
        redirectUrl: netGetResult.redirect_url || netGetResult.payment_url,
        transactionId: netGetResult.transaction_id
      })
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: netGetResult.message || 'Error al crear el pago' 
        },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error in payment creation:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor' 
      },
      { status: 500 }
    )
  }
}

// Función para generar firma de NetGet (implementar según documentación)
function generateNetGetSignature(data: NetGetPaymentData, secretKey: string): string {
  // Implementar según la documentación específica de NetGet
  // Típicamente es un HMAC-SHA256 de los parámetros concatenados en orden alfabético
  
  // Ordenar parámetros alfabéticamente (excluyendo signature)
  const sortedParams = Object.keys(data)
    .filter(key => key !== 'signature')
    .sort()
    .map(key => `${key}=${data[key as keyof NetGetPaymentData]}`)
    .join('&')
  
  // Generar HMAC-SHA256
  const signature = createHmac('sha256', secretKey)
    .update(sortedParams)
    .digest('hex')
  
  return signature
}
