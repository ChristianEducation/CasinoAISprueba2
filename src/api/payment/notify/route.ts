import { NextRequest, NextResponse } from 'next/server'
import { doc, updateDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/app/lib/firebase'

interface NetGetNotification {
  status: string
  order_id: string
  transaction_id: string
  amount: number
  signature?: string
  [key: string]: string | number | boolean | null | undefined
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Received NetGet notification:', body)

    // Validar la notificación
    const isValid = await validateNetGetNotification(body)
    if (!isValid) {
      console.error('Invalid NetGet notification')
      return NextResponse.json(
        { success: false, message: 'Notificación inválida' },
        { status: 400 }
      )
    }

    const { status, order_id, transaction_id } = body

    // Actualizar el estado del pedido en Firebase
    try {
      const orderRef = doc(db, 'orders', order_id)
      
      const updateData: {
        paymentId: string;
        updatedAt: Timestamp;
        status: string;
        paidAt?: Timestamp;
      } = {
        paymentId: transaction_id,
        updatedAt: Timestamp.now(),
        status: 'pendiente'
      }

      switch (status) {
        case 'approved':
        case 'paid':
        case 'completed':
          updateData.status = 'pagado'
          updateData.paidAt = Timestamp.now()
          console.log(`Payment approved for order ${order_id}`)
          break
        
        case 'rejected':
        case 'failed':
          updateData.status = 'cancelado'
          console.log(`Payment failed for order ${order_id}`)
          break
        
        case 'pending':
          updateData.status = 'procesando_pago'
          console.log(`Payment pending for order ${order_id}`)
          break
        
        default:
          console.log(`Unknown payment status: ${status} for order ${order_id}`)
          updateData.status = 'pendiente'
      }

      await updateDoc(orderRef, updateData)
      
      console.log(`Order ${order_id} updated with status: ${updateData.status}`)

      return NextResponse.json({
        success: true,
        message: 'Notificación procesada correctamente'
      })

    } catch (dbError) {
      console.error('Error updating order in database:', dbError)
      return NextResponse.json(
        { success: false, message: 'Error al actualizar el pedido' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error processing NetGet notification:', error)
    return NextResponse.json(
      { success: false, message: 'Error al procesar la notificación' },
      { status: 500 }
    )
  }
}

async function validateNetGetNotification(data: NetGetNotification): Promise<boolean> {
  try {
    // Validar campos requeridos
    const requiredFields = ['status', 'order_id', 'transaction_id', 'amount']
    const hasRequiredFields = requiredFields.every(field => 
      data.hasOwnProperty(field) && data[field] !== null
    )

    if (!hasRequiredFields) {
      console.error('Missing required fields in notification:', data)
      return false
    }

    // Aquí se validaría la firma HMAC con la clave secreta
    // const expectedSignature = generateNetGetSignature(data, process.env.NETGET_SECRET_KEY)
    // return expectedSignature === data.signature

    // Por ahora, solo validamos la presencia de campos requeridos
    return true

  } catch (error) {
    console.error('Error validating NetGet notification:', error)
    return false
  }
}

// Permitir GET para verificación de endpoint
export async function GET() {
  return NextResponse.json({
    message: 'NetGet notification endpoint is active',
    timestamp: new Date().toISOString()
  })
}
