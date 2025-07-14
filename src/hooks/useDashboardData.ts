"use client"

import { useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/app/lib/firebase'
import { useOrderStore } from '@/store/orderStore'
import { DashboardData, DashboardUser, OrderStatus, EconomicSummary, WeeklyMenuInfo, DashboardAlert } from '@/types/dashboard'
import { PRICES } from '@/types/panel'
import { format, addDays, isBefore, isAfter } from 'date-fns'
import { es } from 'date-fns/locale'
import { MenuService } from '@/services/menuService'
import { OrderService } from '@/services/orderService'

export function useDashboardData() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { getOrderSummary, selections, setUserType, loadExistingSelections } = useOrderStore()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setDashboardData(null)
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        // Obtener datos del usuario
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
        if (!userDoc.exists()) {
          throw new Error('Usuario no encontrado')
        }

        const userData = userDoc.data()
        const user: DashboardUser = {
          id: firebaseUser.uid,
          firstName: userData.firstName || userData.nombre || '',
          lastName: userData.lastName || userData.apellido || '',
          email: userData.email || userData.correo || firebaseUser.email || '',
          userType: userData.userType || userData.tipoUsuario || 'funcionario',
          tipoUsuario: userData.tipoUsuario || userData.userType || 'funcionario',
          active: userData.active !== undefined ? userData.active : true,
          createdAt: userData.createdAt ? userData.createdAt.toDate() : new Date(),
          children: userData.children ? userData.children.map((child: {
            id: string;
            name?: string;
            nombre?: string;
            age?: number;
            edad?: number;
            class?: string;
            curso?: string;
            level?: string;
            rut?: string;
            active?: boolean;
          }) => ({
            id: child.id,
            name: child.name || child.nombre,
            age: child.age || child.edad || 0,
            class: child.class || child.curso || '',
            level: child.level || 'Pre School',
            curso: child.curso || child.class || '',
            rut: child.rut,
            active: child.active !== undefined ? child.active : true
          })) : undefined
        }

        // Establecer tipo de usuario en el store
        const userType = user.userType === 'funcionario' ? 'funcionario' : 'apoderado'
        setUserType(userType)

        // Obtener información de la semana actual
        const weekInfo = MenuService.getCurrentWeekInfo()
        const currentWeekStart = weekInfo.weekStart

        // Obtener pedido existente del usuario para esta semana
        let existingOrder = null
        try {
          existingOrder = await OrderService.getUserOrder(firebaseUser.uid, currentWeekStart)
          if (existingOrder && existingOrder.resumenPedido) {
            // Cargar selecciones existentes en el store
            loadExistingSelections(existingOrder.resumenPedido)
          }
        } catch (orderError) {
          console.log('No existing order found or error loading:', orderError)
        }

        // Verificar si hay menú disponible para esta semana
        const hasMenuForWeek = await MenuService.hasMenusForWeek(currentWeekStart)

        // Calcular estado del pedido
        const orderSummary = getOrderSummary()
        let orderStatus: OrderStatus

        if (existingOrder) {
          // Si hay un pedido existente, usar su estado
          orderStatus = {
            status: existingOrder.status === 'pagado' ? 'paid' : 
                   existingOrder.status === 'procesando_pago' ? 'confirmed' :
                   existingOrder.resumenPedido.length > 0 ? 'in_progress' : 'not_started',
            daysSelected: existingOrder.resumenPedido.length,
            totalDays: 5, // Lunes a viernes
            lastModified: existingOrder.updatedAt || existingOrder.createdAt,
            paymentDeadline: weekInfo.orderDeadline
          }
        } else {
          // Si no hay pedido existente, usar datos del store local
          orderStatus = {
            status: orderSummary.selections.length === 0 ? 'not_started' : 
                    orderSummary.selections.length < 5 ? 'in_progress' : 'confirmed',
            daysSelected: orderSummary.selections.length,
            totalDays: 5, // Lunes a viernes
            lastModified: new Date(),
            paymentDeadline: weekInfo.orderDeadline
          }
        }

        // Calcular resumen económico
        const prices = PRICES[userType]
        let economicSummary: EconomicSummary

        if (existingOrder) {
          // Usar datos del pedido existente
          const orderSummaryData = OrderService.getOrderSummary(existingOrder.resumenPedido, userType)
          economicSummary = {
            selectedDays: existingOrder.resumenPedido.length,
            estimatedTotal: existingOrder.total,
            lunchPrice: prices.almuerzo,
            snackPrice: prices.colacion,
            totalLunches: orderSummaryData.totalAlmuerzos,
            totalSnacks: orderSummaryData.totalColaciones
          }
        } else {
          // Usar datos del store local
          economicSummary = {
            selectedDays: orderSummary.selections.length,
            estimatedTotal: orderSummary.total,
            lunchPrice: prices.almuerzo,
            snackPrice: prices.colacion,
            totalLunches: orderSummary.totalAlmuerzos,
            totalSnacks: orderSummary.totalColaciones
          }
        }

        // Información del menú semanal
        const weeklyMenuInfo: WeeklyMenuInfo = {
          isPublished: hasMenuForWeek,
          weekStart: weekInfo.weekStart,
          weekEnd: weekInfo.weekEnd,
          publishedAt: hasMenuForWeek ? new Date() : undefined,
          lastUpdated: new Date()
        }

        // Generar alertas dinámicas basadas en datos reales
        const alerts: DashboardAlert[] = []

        // Alerta si no hay menú publicado
        if (!hasMenuForWeek) {
          alerts.push({
            id: 'no-menu-published',
            type: 'warning',
            title: 'Menú no disponible',
            message: 'El menú para esta semana aún no ha sido publicado. Te notificaremos cuando esté disponible.',
            dismissible: true,
            priority: 'high'
          })
        }

        // Alerta por días sin seleccionar (solo si hay menú disponible)
        if (hasMenuForWeek && orderStatus.daysSelected > 0 && orderStatus.daysSelected < 5 && orderStatus.status !== 'paid') {
          alerts.push({
            id: 'incomplete-week',
            type: 'warning',
            title: 'Semana incompleta',
            message: `Tienes ${5 - orderStatus.daysSelected} días sin seleccionar almuerzo esta semana`,
            actionText: 'Completar pedido',
            actionUrl: '/panel',
            dismissible: false,
            priority: 'high'
          })
        }

        // Alerta por pedido no pagado
        if (existingOrder && existingOrder.status === 'pendiente' && orderStatus.daysSelected > 0) {
          alerts.push({
            id: 'payment-pending',
            type: 'error',
            title: 'Pago pendiente',
            message: 'Tu pedido no ha sido pagado. Completa el pago para confirmar.',
            actionText: 'Pagar ahora',
            actionUrl: '/panel',
            dismissible: false,
            priority: 'high'
          })
        }

        // Alerta por fecha límite
        const now = new Date()
        const isNearDeadline = isBefore(now, weekInfo.orderDeadline) && 
                              isAfter(now, addDays(weekInfo.orderDeadline, -1)) // 24 horas antes

        if (hasMenuForWeek && isNearDeadline && orderStatus.status !== 'paid') {
          const hoursLeft = Math.ceil((weekInfo.orderDeadline.getTime() - now.getTime()) / (1000 * 60 * 60))
          alerts.push({
            id: 'deadline-warning',
            type: 'warning',
            title: 'Fecha límite próxima',
            message: `Quedan ${hoursLeft} horas para realizar cambios en tu pedido`,
            actionText: 'Revisar pedido',
            actionUrl: '/panel',
            dismissible: true,
            priority: 'high'
          })
        }

        // Alerta si ya pasó la fecha límite
        if (hasMenuForWeek && isAfter(now, weekInfo.orderDeadline) && orderStatus.status !== 'paid') {
          alerts.push({
            id: 'deadline-passed',
            type: 'error',
            title: 'Fecha límite vencida',
            message: 'El tiempo para realizar pedidos ha expirado. Contacta al administrador si necesitas hacer cambios.',
            actionText: 'Contactar',
            dismissible: false,
            priority: 'high'
          })
        }

        // Alerta de bienvenida para nuevos usuarios (solo si hay menú disponible)
        if (hasMenuForWeek && orderStatus.status === 'not_started') {
          alerts.push({
            id: 'welcome',
            type: 'info',
            title: '¡Bienvenido a Casino Escolar!',
            message: 'Comienza seleccionando tus almuerzos para esta semana.',
            actionText: 'Ver menú',
            actionUrl: '/panel',
            dismissible: true,
            priority: 'low'
          })
        }

        // Alerta de confirmación para pedidos pagados
        if (existingOrder && existingOrder.status === 'pagado') {
          alerts.push({
            id: 'order-confirmed',
            type: 'success',
            title: 'Pedido confirmado',
            message: `Tu pedido para la semana del ${format(weekInfo.orderDeadline, 'dd/MM', { locale: es })} está confirmado y pagado.`,
            actionText: 'Ver detalles',
            actionUrl: '/panel',
            dismissible: true,
            priority: 'medium'
          })
        }

        setDashboardData({
          user,
          orderStatus,
          economicSummary,
          weeklyMenuInfo,
          alerts,
          isLoading: false
        })

      } catch (err) {
        console.error('Error loading dashboard data:', err)
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setIsLoading(false)
      }
    })

    return () => unsubscribe()
  }, [getOrderSummary, selections, setUserType, loadExistingSelections])

  return { dashboardData, isLoading, error }
}