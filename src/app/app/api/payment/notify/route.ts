import { NextRequest, NextResponse } from 'next/server'
import { PaymentService } from '@/services/paymentService'
import crypto from 'crypto'

// Interfaz para el payload de NetGet
interface NetGetPayload {
  signature: string
  merchant_id: string
  amount: string
  order_id: string
  status: string
  transaction_id: string
}

// Configuración de NetGet
const NETGET_CONFIG = {
  secretKey: process.env.NETGET_SECRET_KEY || ''
}

export async function POST(request: NextRequest) {
  try {
    console.log('Received NetGet notification')
    
    const body = await request.json()
    console.log('NetGet notification data:', body)

    // Validar que tenemos la clave secreta
    if (!NETGET_CONFIG.secretKey) {
      console.error('NetGet secret key not configured')
      return NextResponse.json(
        { success: false, message: 'Configuración de webhook no disponible' },
        { status: 500 }
      )
    }

    // Validar firma de la notificación
    const isValidSignature = validateNetGetSignature(body, NETGET_CONFIG.secretKey)
    
    if (!isValidSignature) {
      console.error('Invalid NetGet notification signature')
      return NextResponse.json(
        { success: false, message: 'Firma inválida' },
        { status: 401 }
      )
    }

    // Procesar la notificación
    const result = await PaymentService.processNotification(body)
    
    if (result.success) {
      console.log('NetGet notification processed successfully')
      
      // Aquí puedes agregar lógica adicional como:
      // - Actualizar estado del pedido en la base de datos
      // - Enviar emails de confirmación
      // - Actualizar inventario
      // - etc.
      
      await updateOrderStatus(body)
      
      return NextResponse.json({ 
        success: true, 
        message: 'Notificación procesada correctamente' 
      })
    } else {
      console.error('Failed to process NetGet notification:', result.message)
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error processing NetGet notification:', error)
    return NextResponse.json(
      {
        success: false, 
        message: 'Error interno del servidor' 
      },
      { status: 500 }
    )
  }
}

function validateNetGetSignature(payload: NetGetPayload, secretKey: string): boolean {
  try {
    // Extraer la firma recibida
    // Extraer la firma recibida
    const receivedSignature = payload.signature
    
    if (!receivedSignature) {
      console.error('No signature provided in NetGet notification')
      return false
    }

    // Recrear la firma esperada
    const stringToSign = [
      payload.merchant_id,
      payload.amount,
      payload.order_id,
      payload.status,
      payload.transaction_id,
      secretKey
    ].join('')

    const expectedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(stringToSign)
      .digest('hex')

  const isValid = receivedSignature === expectedSignature
  
  if (!isValid) {
    console.error('NetGet signature mismatch:', {
      received: receivedSignature,
      expected: expectedSignature
    })
  }

  return isValid
} catch (error) {
  console.error('Error validating NetGet signature:', error)
  return false
}
}

// Actualizar estado del pedido según notificación de NetGet
async function updateOrderStatus(notificationData: NetGetPayload) {
  try {
    const { status, order_id } = notificationData
    
    console.log(`Updating order ${order_id} with status ${status}`)

    // Aquí implementarías la lógica para actualizar el pedido en tu base de datos
    // Por ejemplo, usando Firebase Firestore:
    
    /*
    import { doc, updateDoc } from 'firebase/firestore'
    import { db } from '@/app/lib/firebase'
    
    const orderRef = doc(db, 'orders', order_id)
    
    const updateData = {
      paymentStatus: status,
      transactionId: transaction_id,
      paidAmount: amount,
      paidAt: new Date(),
      updatedAt: new Date()
    }
    
    if (status === 'approved' || status === 'paid' || status === 'completed') {
      updateData.status = 'pagado'
    } else if (status === 'rejected' || status === 'failed') {
      updateData.status = 'fallido'
    } else if (status === 'pending') {
      updateData.status = 'pendiente'
    }
    
    await updateDoc(orderRef, updateData)
    */
    
    console.log(`Order ${order_id} updated successfully`)
    
  } catch (error) {
    console.error('Error updating order status:', error)
    throw error
  }
}

// Manejar otros métodos HTTP
export async function GET() {
  return NextResponse.json(
    { message: 'NetGet webhook endpoint - POST only' },
    { status: 200 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Método no permitido' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Método no permitido' },
    { status: 405 }
  )
}
