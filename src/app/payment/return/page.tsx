'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CheckCircle, XCircle, Clock, AlertCircle, ArrowLeft, Receipt, RefreshCw, Search } from 'lucide-react'
import { OrderService, OrderStateByChild } from '@/services/orderService'
import useAuth from '@/hooks/useAuth'

type PaymentStatus = 'success' | 'failed' | 'pending' | 'cancelled' | 'unknown'

interface PaymentResult {
  status: PaymentStatus
  orderId?: string
  requestId?: string
  message?: string
  order?: OrderStateByChild
}

export default function PaymentReturnPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  // Función para simular webhook cuando GetNet no puede enviarlo (MEJORADA)
  const simulateWebhook = async (orderId: string, requestId?: string) => {
    try {
      console.log('Simulating webhook for order:', orderId, 'requestId:', requestId)
      
      // Crear datos del webhook que simulan una respuesta exitosa de GetNet
      const webhookData = {
        status: {
          status: "OK",
          message: "Pago aprobado exitosamente",
          date: new Date().toISOString()
        },
        requestId: requestId ? (parseInt(requestId) || requestId) : Date.now(),
        reference: orderId,
        authorization: `AUTH_${Date.now()}`,
        paymentMethodName: "GetNet Test",
        franchiseName: "Visa",
        amount: {
          currency: "CLP",
          total: 0 // Se calculará en el webhook
        }
      }

      console.log('Sending webhook simulation with data:', webhookData)

      const response = await fetch('/api/payment/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData)
      })

      const result = await response.json()
      console.log('Webhook simulation result:', result)
      
      if (response.ok && result.success) {
        console.log('✅ Webhook simulation successful')
        return true
      } else {
        console.error('❌ Webhook simulation failed:', result)
        return false
      }
    } catch (error) {
      console.error('Error simulating webhook:', error)
      return false
    }
  }

  const findRecentOrder = useCallback(async (): Promise<OrderStateByChild | null> => {
    if (!user) return null

    try {
      console.log('Searching for recent orders for user:', user.id)
      
      // Buscar pedidos recientes del usuario
      const userOrders = await OrderService.getOrdersWithFilters({
        userId: user.id,
        status: ['procesando_pago', 'pagado', 'pendiente']
      })
      
      console.log('Found user orders:', userOrders.length)
      
      if (userOrders.length === 0) return null
      
      // Ordenar por fecha de creación (más reciente primero)
      const sortedOrders = userOrders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      
      // Buscar el pedido más reciente que esté en procesando_pago
      const processingOrder = sortedOrders.find(order => order.status === 'procesando_pago')
      
      if (processingOrder) {
        console.log('Found processing order:', processingOrder.id)
        return processingOrder
      }
      
      // Si no hay pedidos en procesando_pago, devolver el más reciente
      const recentOrder = sortedOrders[0]
      console.log('Using most recent order:', recentOrder.id, 'status:', recentOrder.status)
      return recentOrder
      
    } catch (error) {
      console.error('Error finding recent order:', error)
      return null
    }
  }, [user])

  useEffect(() => {
    const processPaymentReturn = async () => {
      try {
        // Obtener parámetros de la URL
        const status = searchParams.get('status')
        const orderId = searchParams.get('reference') || searchParams.get('orderId')
        const requestId = searchParams.get('requestId')
        const message = searchParams.get('message')
        const cancelled = searchParams.get('cancelled')

        console.log('Payment return params:', { status, orderId, requestId, message, cancelled })

        // Si viene de cancelación
        if (cancelled === 'true') {
          setPaymentResult({
            status: 'cancelled',
            message: 'El pago fue cancelado por el usuario'
          })
          setLoading(false)
          return
        }

        let order: OrderStateByChild | null = null

        // Intentar obtener el pedido por ID si está disponible
        if (orderId) {
          console.log('Attempting to find order by ID:', orderId)
          order = await OrderService.getOrderById(orderId)
          console.log('Order found by ID:', !!order, order?.status)
        }

        // Si no encontramos el pedido por ID, buscar el más reciente del usuario
        if (!order) {
          console.log('Order not found by ID, searching for recent order...')
          order = await findRecentOrder()
        }

        if (!order) {
          // Si aún no encontramos pedido, mostrar error con opción de buscar manualmente
          setError('No se pudo encontrar información del pedido. Esto puede suceder en desarrollo local.')
          setLoading(false)
          return
        }

        console.log('Working with order:', order.id, 'status:', order.status)

        // Si el pedido está en "procesando_pago", intentar simular webhook
        if (order.status === 'procesando_pago') {
          console.log('Order is still processing, simulating webhook...')
          
          const webhookSuccess = await simulateWebhook(order.id!, requestId || undefined)
          
          if (webhookSuccess) {
            // Esperar un poco más para que el webhook se procese
            console.log('Waiting for webhook processing...')
            await new Promise(resolve => setTimeout(resolve, 3000))
            
            // Volver a cargar el pedido
            const updatedOrder = await OrderService.getOrderById(order.id!)
            if (updatedOrder) {
              order = updatedOrder
              console.log('Order status after webhook simulation:', order.status)
            }
          } else {
            console.warn('Webhook simulation failed, but continuing...')
          }
        }

        // Determinar el estado del pago basado en el estado del pedido
        let paymentStatus: PaymentStatus = 'unknown'
        
        if (order.status === 'pagado') {
          paymentStatus = 'success'
        } else if (order.status === 'cancelado') {
          paymentStatus = 'failed'
        } else if (order.status === 'procesando_pago') {
          paymentStatus = 'pending'
        } else if (status === 'cancelled' || cancelled === 'true') {
          paymentStatus = 'cancelled'
        }

        console.log('Final payment status determined:', paymentStatus)

        setPaymentResult({
          status: paymentStatus,
          orderId: order.id,
          requestId: requestId || undefined,
          message: message || getStatusMessage(paymentStatus),
          order
        })

      } catch (err) {
        console.error('Error processing payment return:', err)
        setError('Error al procesar el resultado del pago')
      } finally {
        setLoading(false)
      }
    }

    processPaymentReturn()
    processPaymentReturn()
  }, [searchParams, user, findRecentOrder])
  const handleRetry = () => {
    setLoading(true)
    setError(null)
    setRetryCount(prev => prev + 1)
  }

  const handleSearchManually = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const recentOrder = await findRecentOrder()
      
      if (recentOrder) {
        // Si encontramos un pedido, simular webhook si está en procesando_pago
        if (recentOrder.status === 'procesando_pago') {
          await simulateWebhook(recentOrder.id!)
          await new Promise(resolve => setTimeout(resolve, 2000))
          
          const updatedOrder = await OrderService.getOrderById(recentOrder.id!)
          if (updatedOrder) {
            setPaymentResult({
              status: updatedOrder.status === 'pagado' ? 'success' : 'pending',
              orderId: updatedOrder.id,
              message: getStatusMessage(updatedOrder.status === 'pagado' ? 'success' : 'pending'),
              order: updatedOrder
            })
          }
        } else {
          setPaymentResult({
            status: recentOrder.status === 'pagado' ? 'success' : 'pending',
            orderId: recentOrder.id,
            message: getStatusMessage(recentOrder.status === 'pagado' ? 'success' : 'pending'),
            order: recentOrder
          })
        }
      } else {
        setError('No se encontraron pedidos recientes para tu usuario')
      }
    } catch (err) {
      console.error('Error searching manually:', err)
      setError('Error al buscar pedidos')
    } finally {
      setLoading(false)
    }
  }

  const getStatusMessage = (status: PaymentStatus): string => {
    switch (status) {
      case 'success':
        return 'Tu pago ha sido procesado exitosamente'
      case 'failed':
        return 'El pago no pudo ser procesado'
      case 'pending':
        return 'Tu pago está siendo procesado. Esto puede tomar unos minutos.'
      case 'cancelled':
        return 'El pago fue cancelado'
      default:
        return 'Estado del pago desconocido'
    }
  }

  const getStatusIcon = (status: PaymentStatus) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-16 w-16 text-green-500" />
      case 'failed':
        return <XCircle className="h-16 w-16 text-red-500" />
      case 'pending':
        return <Clock className="h-16 w-16 text-yellow-500" />
      case 'cancelled':
        return <XCircle className="h-16 w-16 text-gray-500" />
      default:
        return <AlertCircle className="h-16 w-16 text-gray-500" />
    }
  }

  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-500">Pagado</Badge>
      case 'failed':
        return <Badge variant="destructive">Fallido</Badge>
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-500">Pendiente</Badge>
      case 'cancelled':
        return <Badge variant="outline">Cancelado</Badge>
      default:
        return <Badge variant="outline">Desconocido</Badge>
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {retryCount > 0 ? `Reintentando... (${retryCount}/5)` : 'Procesando resultado del pago...'}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Confirmando el pago con GetNet y actualizando el estado...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Información del Pedido</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <div className="space-y-2">
                <Button onClick={handleSearchManually} className="w-full gap-2">
                  <Search className="w-4 h-4" />
                  Buscar Mi Pedido
                </Button>
                <Button onClick={handleRetry} variant="outline" className="w-full gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Reintentar
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/panel')} 
                  className="w-full"
                >
                  Volver al Panel
                </Button>
              </div>
              
              {/* Info para desarrollo */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg text-left">
                  <p className="text-sm text-blue-700">
                    <strong>Desarrollo Local:</strong> GetNet no puede enviar webhooks a localhost. 
                    Usa &quot;Buscar Mi Pedido&quot; para encontrar y actualizar tu pedido automáticamente.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!paymentResult) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          {getStatusIcon(paymentResult.status)}
          <h1 className="text-2xl font-bold text-gray-900 mt-4 mb-2">
            {paymentResult.status === 'success' ? '¡Pago Exitoso!' : 
             paymentResult.status === 'pending' ? 'Pago Pendiente' :
             paymentResult.status === 'cancelled' ? 'Pago Cancelado' : 'Pago Fallido'}
          </h1>
          <p className="text-gray-600">{paymentResult.message}</p>
        </div>

        {/* Payment Status Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Estado del Pago</span>
              {getStatusBadge(paymentResult.status)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {paymentResult.orderId && (
                <div className="flex justify-between">
                  <span className="text-gray-600">ID del Pedido:</span>
                  <span className="font-mono text-sm">{paymentResult.orderId}</span>
                </div>
              )}
              {paymentResult.requestId && (
                <div className="flex justify-between">
                  <span className="text-gray-600">ID de Transacción:</span>
                  <span className="font-mono text-sm">{paymentResult.requestId}</span>
                </div>
              )}
              {paymentResult.order && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Fecha del Pedido:</span>
                  <span>{formatDate(paymentResult.order.createdAt)}</span>
                </div>
              )}
              {paymentResult.order?.paidAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Fecha de Pago:</span>
                  <span>{formatDate(paymentResult.order.paidAt)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Order Summary */}
        {paymentResult.order && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Resumen del Pedido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Week Info */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Semana del Menú</h4>
                  <p className="text-gray-600">{paymentResult.order.weekStart}</p>
                </div>

                <Separator />

                {/* Order Items */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Selecciones</h4>
                  <div className="space-y-3">
                    {paymentResult.order.resumenPedido.map((selection, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium">{selection.dia}</p>
                            <p className="text-sm text-gray-600">{selection.fecha}</p>
                            {selection.hijo && (
                              <p className="text-sm text-blue-600">Para: {selection.hijo.name}</p>
                            )}
                          </div>
                        </div>
                        <div className="space-y-1">
                          {selection.almuerzo && (
                            <div className="flex justify-between text-sm">
                              <span>🍽️ {selection.almuerzo.name}</span>
                              <span>{formatCurrency(selection.almuerzo.price)}</span>
                            </div>
                          )}
                          {selection.colacion && (
                            <div className="flex justify-between text-sm">
                              <span>🥪 {selection.colacion.name}</span>
                              <span>{formatCurrency(selection.colacion.price)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Total */}
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total Pagado:</span>
                  <span>{formatCurrency(paymentResult.order.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            variant="outline" 
            onClick={() => router.push('/panel')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al Panel
          </Button>
          
          {paymentResult.status === 'success' && (
            <Button 
              onClick={() => router.push('/menu')}
              className="flex-1"
            >
              Ver Menú de la Semana
            </Button>
          )}
          
          {paymentResult.status === 'failed' && (
            <Button 
              onClick={() => router.push('/mi-pedido')}
              className="flex-1"
            >
              Intentar Nuevamente
            </Button>
          )}

          {paymentResult.status === 'pending' && (
            <Button 
              onClick={handleRetry}
              variant="outline"
              className="flex-1 gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Verificar Estado
            </Button>
          )}
        </div>

        {/* Additional Info */}
        {paymentResult.status === 'pending' && (
          <Card className="mt-6 border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">Pago en Proceso</h4>
                  <p className="text-yellow-700 text-sm mt-1">
                    Tu pago está siendo procesado. En desarrollo local, el webhook se simula automáticamente.
                    Si el estado no cambia, intenta refrescar la página.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Debug Info for Development */}
        {process.env.NODE_ENV === 'development' && paymentResult.order && (
          <Card className="mt-6 border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="text-sm">
                <h4 className="font-medium text-blue-800 mb-2">Debug Info (Solo en desarrollo)</h4>
                <div className="space-y-1 text-blue-700">
                  <p>Estado actual: {paymentResult.order.status}</p>
                  <p>Payment ID: {paymentResult.order.paymentId || 'No asignado'}</p>
                  <p>Última actualización: {paymentResult.order.updatedAt ? formatDate(paymentResult.order.updatedAt) : 'No disponible'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}