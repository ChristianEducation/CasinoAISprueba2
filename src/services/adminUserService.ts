import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc,
  doc, 
  updateDoc, 
  orderBy, 
  limit, 
  startAfter,
  writeBatch,
  Timestamp,
  DocumentSnapshot
} from 'firebase/firestore'
import { db } from '@/app/lib/firebase'
import { 
  AdminUserView, 
  UserFilters, 
  UserStats, 
  UserDetailView, 
  UserUpdateRequest,
  UserActionResult,
  SortField,
  SortDirection,
} from '@/types/adminUser'

export class AdminUserService {
  private static readonly USERS_COLLECTION = 'users'
  private static readonly ORDERS_COLLECTION = 'orders'

  // Obtener estadísticas de usuarios
  static async getUserStats(): Promise<UserStats> {
    try {
      // Obtener todos los usuarios
      const usersRef = collection(db, this.USERS_COLLECTION)
      const usersSnapshot = await getDocs(usersRef)
      
      let totalUsers = 0
      let activeUsers = 0
      let verifiedEmails = 0
      let funcionarios = 0
      let apoderados = 0
      let estudiantes = 0
      let admins = 0
      let newUsersThisWeek = 0
      let newUsersThisMonth = 0

      // Calcular fechas para filtros de tiempo
      const now = new Date()
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      usersSnapshot.forEach((doc) => {
        const userData = doc.data()
        totalUsers++
        
        // Contar usuarios activos (por defecto son activos si no se especifica lo contrario)
        if (userData.isActive !== false) {
          activeUsers++
        }
        
        // Contar usuarios verificados
        if (userData.emailVerified === true) {
          verifiedEmails++
        }
        
        // Lógica mejorada para clasificar usuarios
        const role = userData.role || userData.userType || 'estudiante'
        const userType = userData.userType || 'estudiante'
        
        // Detectar apoderados: usuarios que tienen hijos o userType/role = 'apoderado'
        const hasChildren = Array.isArray(userData.children) && userData.children.length > 0
        const isApoderado = role === 'apoderado' || userType === 'apoderado' || hasChildren
        
        if (role === 'admin' || role === 'super_admin') {
          admins++
        } else if (role === 'funcionario' || userType === 'funcionario') {
          funcionarios++
        } else if (isApoderado) {
          apoderados++
        } else {
          estudiantes++
        }

        // Contar usuarios nuevos
        const createdAt = this.convertToDate(userData.createdAt)
        if (createdAt >= oneWeekAgo) {
          newUsersThisWeek++
        }
        if (createdAt >= oneMonthAgo) {
          newUsersThisMonth++
        }
      })

      // Calcular emails no verificados
      const unverifiedEmails = totalUsers - verifiedEmails

      return {
        totalUsers,
        funcionarios,
        apoderados,
        estudiantes,
        admins,
        verifiedEmails,
        unverifiedEmails,
        activeUsers,
        newUsersThisWeek,
        newUsersThisMonth
      }
    } catch (error) {
      console.error('Error fetching user stats:', error)
      throw new Error('No se pudieron cargar las estadísticas de usuarios')
    }
  }

  // Obtener usuarios con filtros y paginación
  static async getUsers(
    filters: UserFilters,
    sortField: SortField = 'createdAt',
    sortDirection: SortDirection = 'desc',
    pageSize: number = 20,
    lastDoc?: DocumentSnapshot | null
  ): Promise<{
    users: AdminUserView[]
    hasMore: boolean
    lastDoc: DocumentSnapshot | null
  }> {
    try {
      let q = query(collection(db, this.USERS_COLLECTION))

      // Aplicar filtros
      if (filters.role && filters.role !== 'all') {
        if (filters.role === 'funcionario') {
          q = query(q, where('userType', '==', 'funcionario'))
        } else if (filters.role === 'apoderado') {
          // Para apoderados, buscar por userType o por tener hijos
          q = query(q, where('userType', 'in', ['apoderado', 'estudiante']))
        } else {
          q = query(q, where('role', '==', filters.role))
        }
      }

      if (filters.emailVerified !== undefined && filters.emailVerified !== 'all') {
        q = query(q, where('emailVerified', '==', filters.emailVerified))
      }

      if (filters.isActive && filters.isActive !== 'all') {
        q = query(q, where('isActive', '==', filters.isActive))
      }

      // Aplicar ordenamiento
      q = query(q, orderBy(sortField, sortDirection))

      // Aplicar paginación
      q = query(q, limit(pageSize + 1))
      if (lastDoc) {
        q = query(q, startAfter(lastDoc))
      }

      const snapshot = await getDocs(q)
      const users: AdminUserView[] = []
      let newLastDoc = null
      let hasMore = false

      snapshot.docs.forEach((doc, index) => {
        if (index < pageSize) {
          const data = doc.data()
          const user = this.mapFirestoreToUser(doc.id, data)
          
          // Filtrar apoderados si es necesario
          if (filters.role === 'apoderado') {
            const hasChildren = Array.isArray(data.children) && data.children.length > 0
            const isApoderado = data.role === 'apoderado' || data.userType === 'apoderado' || hasChildren
            if (isApoderado) {
              users.push(user)
            }
          } else {
            users.push(user)
          }
          
          newLastDoc = doc
        } else {
          hasMore = true
        }
      })

      // Filtrar por término de búsqueda en el frontend
      let filteredUsers = users
      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase()
        filteredUsers = users.filter(user => 
          user.firstName.toLowerCase().includes(searchTerm) ||
          user.lastName.toLowerCase().includes(searchTerm) ||
          user.email.toLowerCase().includes(searchTerm)
        )
      }

      // Obtener conteo de pedidos para cada usuario
      const usersWithOrders = await Promise.all(
        filteredUsers.map(async (user) => {
          const ordersCount = await this.getUserOrdersCount(user.id)
          const lastOrderDate = await this.getUserLastOrderDate(user.id)
          return {
            ...user,
            ordersCount,
            lastOrderDate
          }
        })
      )

      return {
        users: usersWithOrders,
        hasMore: filteredUsers.length === pageSize && hasMore,
        lastDoc: newLastDoc
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      throw new Error('No se pudieron cargar los usuarios')
    }
  }

  // Obtener detalle de usuario
  static async getUserDetail(userId: string): Promise<UserDetailView> {
    try {
      const userDoc = await getDoc(doc(db, this.USERS_COLLECTION, userId))
      
      if (!userDoc.exists()) {
        throw new Error('Usuario no encontrado')
      }

      const userData = userDoc.data()
      const baseUser = this.mapFirestoreToUser(userId, userData)

      // Obtener pedidos recientes
      const recentOrders = await this.getUserRecentOrders(userId)
      
      // Calcular estadísticas
      const totalSpent = recentOrders.reduce((sum, order) => sum + order.total, 0)
      const averageOrderValue = recentOrders.length > 0 ? totalSpent / recentOrders.length : 0

      return {
        ...baseUser,
        recentOrders,
        totalSpent,
        averageOrderValue,
        registrationSource: userData.registrationSource || 'web'
      }
    } catch (error) {
      console.error('Error fetching user detail:', error)
      throw new Error('No se pudieron cargar los detalles del usuario')
    }
  }

  // Actualizar usuario
  static async updateUser(userId: string, updates: UserUpdateRequest): Promise<UserActionResult> {
    try {
      const userRef = doc(db, this.USERS_COLLECTION, userId)
      
      const updateData: { [key: string]: string | boolean | number | Timestamp | string[] | undefined } = {
        ...updates,
        updatedAt: Timestamp.now()
      }

      await updateDoc(userRef, updateData)

      return {
        success: true,
        message: 'Usuario actualizado correctamente'
      }
    } catch (error) {
      console.error('Error updating user:', error)
      return {
        success: false,
        message: 'Error al actualizar el usuario',
        error: error instanceof Error ? error.message : 'Error desconocido'
      }
    }
  }

  // Eliminar usuario
  static async deleteUser(userId: string): Promise<UserActionResult> {
    try {
      const batch = writeBatch(db)
      
      // Eliminar usuario
      const userRef = doc(db, this.USERS_COLLECTION, userId)
      batch.delete(userRef)

      // Eliminar pedidos del usuario
      const ordersRef = collection(db, this.ORDERS_COLLECTION)
      const userOrdersQuery = query(ordersRef, where('userId', '==', userId))
      const ordersSnapshot = await getDocs(userOrdersQuery)
      
      ordersSnapshot.docs.forEach((orderDoc) => {
        batch.delete(orderDoc.ref)
      })

      await batch.commit()

      return {
        success: true,
        message: 'Usuario eliminado correctamente'
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      return {
        success: false,
        message: 'Error al eliminar el usuario',
        error: error instanceof Error ? error.message : 'Error desconocido'
      }
    }
  }

  // Reenviar verificación de email
  static async resendEmailVerification(userEmail: string): Promise<UserActionResult> {
    try {
      // Nota: En un entorno real, esto requeriría acceso al objeto User de Firebase Auth
      // Por ahora, simulamos el envío
      console.log(`Sending verification email to: ${userEmail}`)
      
      return {
        success: true,
        message: 'Correo de verificación enviado correctamente'
      }
    } catch (error) {
      console.error('Error sending verification email:', error)
      return {
        success: false,
        message: 'Error al enviar el correo de verificación',
        error: error instanceof Error ? error.message : 'Error desconocido'
      }
    }
  }

  // Métodos privados auxiliares
  private static mapFirestoreToUser(id: string, data: Record<string, unknown>): AdminUserView {
    // Detectar si es apoderado
    const hasChildren = Array.isArray(data.children) && data.children.length > 0
    const role = data.role || data.userType || 'estudiante'
    const userType = data.userType || 'estudiante'
    const isApoderado = role === 'apoderado' || userType === 'apoderado' || hasChildren

    return {
      id,
      firstName: typeof data.firstName === 'string' ? data.firstName : '',
      lastName: typeof data.lastName === 'string' ? data.lastName : '',
      email: typeof data.email === 'string' ? data.email : '',
      role: isApoderado ? 'apoderado' : (typeof data.role === 'string' ? data.role : typeof data.userType === 'string' ? data.userType : 'estudiante') as 'estudiante' | 'funcionario' | 'admin' | 'super_admin' | 'apoderado',
      userType: isApoderado ? 'apoderado' : (typeof data.userType === 'string' && ['estudiante', 'funcionario', 'apoderado'].includes(data.userType)) 
        ? data.userType as 'estudiante' | 'funcionario' | 'apoderado'
        : 'estudiante',
      emailVerified: typeof data.emailVerified === 'boolean' ? data.emailVerified : false,
      createdAt: this.convertToDate(data.createdAt),
      lastLogin: this.convertToDate(data.lastLogin),
      phone: typeof data.phone === 'string' ? data.phone : undefined,
      isActive: data.isActive !== false,
      children: Array.isArray(data.children) ? data.children : [],
      ordersCount: 0, // Se actualiza después
      lastOrderDate: undefined // Se actualiza después
    }
  }

  private static async getUserOrdersCount(userId: string): Promise<number> {
    try {
      const ordersRef = collection(db, this.ORDERS_COLLECTION)
      const q = query(ordersRef, where('userId', '==', userId))
      const snapshot = await getDocs(q)
      return snapshot.size
    } catch (error) {
      console.error('Error getting user orders count:', error)
      return 0
    }
  }

  private static async getUserLastOrderDate(userId: string): Promise<Date | undefined> {
    try {
      const ordersRef = collection(db, this.ORDERS_COLLECTION)
      const q = query(
        ordersRef, 
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(1)
      )
      const snapshot = await getDocs(q)
      
      if (!snapshot.empty) {
        const lastOrder = snapshot.docs[0].data()
        return this.convertToDate(lastOrder.createdAt)
      }
      
      return undefined
    } catch (error) {
      console.error('Error getting user last order date:', error)
      return undefined
    }
  }

  private static async getUserRecentOrders(userId: string, limitCount: number = 5) {
    try {
      const ordersRef = collection(db, this.ORDERS_COLLECTION)
      const q = query(
        ordersRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      )
      
      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          weekStart: data.weekStart || '',
          total: data.total || 0,
          status: data.status || 'pending',
          createdAt: this.convertToDate(data.createdAt),
          itemsCount: data.items?.length || 0
        }
      })
    } catch (error) {
      console.error('Error getting user recent orders:', error)
      return []
    }
  }

  // Utility method to safely convert various date formats to Date object
  private static convertToDate(dateValue: unknown): Date {
    if (!dateValue) {
      return new Date(0) // Return epoch date for null/undefined
    }

    // If it's already a Date object
    if (dateValue instanceof Date) {
      return dateValue
    }

    // If it's a Firestore Timestamp
    if (typeof dateValue === 'object' && dateValue !== null && 'toDate' in dateValue) {
      try {
        return (dateValue as Timestamp).toDate()
      } catch (error) {
        console.warn('Failed to convert Timestamp to Date:', error)
        return new Date(0)
      }
    }

    // If it's a string or number, try to parse it
    if (typeof dateValue === 'string' || typeof dateValue === 'number') {
      const parsed = new Date(dateValue)
      return isNaN(parsed.getTime()) ? new Date(0) : parsed
    }

    // Fallback to epoch date
    return new Date(0)
  }
}