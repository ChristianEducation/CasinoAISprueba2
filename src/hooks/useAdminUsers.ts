"use client"
import { useState, useEffect, useCallback } from 'react'
import { DocumentSnapshot, DocumentData } from 'firebase/firestore'
import { AdminUserService } from '@/services/adminUserService'
import { 
  AdminUserView, 
  UserFilters, 
  UserStats, 
  UserDetailView, 
  UserUpdateRequest,
  UserActionResult,
  SortField,
  UserSortConfig
} from '@/types/adminUser'

interface UseAdminUsersReturn {
  // Estado
  users: AdminUserView[]
  userStats: UserStats | null
  selectedUser: UserDetailView | null
  isLoading: boolean
  isLoadingStats: boolean
  isLoadingDetail: boolean
  error: string | null
  hasMore: boolean
  
  // Filtros y ordenamiento
  filters: UserFilters
  sortConfig: UserSortConfig
  
  // Acciones
  loadUsers: (reset?: boolean) => Promise<void>
  loadUserStats: () => Promise<void>
  loadUserDetail: (userId: string) => Promise<void>
  updateFilters: (newFilters: Partial<UserFilters>) => void
  updateSort: (field: SortField) => void
  updateUser: (userId: string, updates: UserUpdateRequest) => Promise<UserActionResult>
  deleteUser: (userId: string) => Promise<UserActionResult>
  resendEmailVerification: (userEmail: string) => Promise<UserActionResult>
  clearSelectedUser: () => void
  refreshData: () => Promise<void>
  loadMoreUsers: () => Promise<void>
}

export function useAdminUsers(): UseAdminUsersReturn {
  // Estados
  const [users, setUsers] = useState<AdminUserView[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [selectedUser, setSelectedUser] = useState<UserDetailView | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot<DocumentData> | null>(null)

  // Filtros y ordenamiento
  const [filters, setFilters] = useState<UserFilters>({
    role: 'all',
    emailVerified: 'all',
    isActive: 'all',
    searchTerm: ''
  })

  const [sortConfig, setSortConfig] = useState<UserSortConfig>({
    field: 'createdAt',
    direction: 'desc'
  })

  // Cargar usuarios
  const loadUsers = useCallback(async (reset: boolean = false) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const currentLastDoc = reset ? null : lastDoc
      
      const result = await AdminUserService.getUsers(
        filters,
        sortConfig.field,
        sortConfig.direction,
        20,
        currentLastDoc
      )
      
      if (reset) {
        setUsers(result.users)
      } else {
        setUsers(prev => [...prev, ...result.users])
      }
      
      setHasMore(result.hasMore)
      setLastDoc(result.lastDoc)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar usuarios'
      setError(errorMessage)
      console.error('Error loading users:', err)
    } finally {
      setIsLoading(false)
    }
  }, [filters, sortConfig, lastDoc])

  // Cargar estadísticas
  const loadUserStats = useCallback(async () => {
    try {
      setIsLoadingStats(true)
      setError(null)
      const stats = await AdminUserService.getUserStats()
      setUserStats(stats)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar estadísticas'
      setError(errorMessage)
      console.error('Error loading user stats:', err)
      
      // Proporcionar estadísticas por defecto en caso de error
      setUserStats({
        totalUsers: 0,
        activeUsers: 0,
        funcionarios: 0,
        apoderados: 0,
        estudiantes: 0,
        admins: 0,
        verifiedEmails: 0,
        unverifiedEmails: 0,
        newUsersThisWeek: 0,
        newUsersThisMonth: 0
      })
    } finally {
      setIsLoadingStats(false)
    }
  }, [])

  // Cargar detalle de usuario
  const loadUserDetail = useCallback(async (userId: string) => {
    try {
      setIsLoadingDetail(true)
      setError(null)
      const userDetail = await AdminUserService.getUserDetail(userId)
      setSelectedUser(userDetail)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar detalles del usuario'
      setError(errorMessage)
      console.error('Error loading user detail:', err)
    } finally {
      setIsLoadingDetail(false)
    }
  }, [])

  // Actualizar filtros
  const updateFilters = useCallback((newFilters: Partial<UserFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    setLastDoc(null) // Reset pagination
  }, [])

  // Actualizar ordenamiento
  const updateSort = useCallback((field: SortField) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
    setLastDoc(null) // Reset pagination
  }, [])

  // Actualizar usuario
  const updateUser = useCallback(async (userId: string, updates: UserUpdateRequest): Promise<UserActionResult> => {
    try {
      const result = await AdminUserService.updateUser(userId, updates)
      
      if (result.success) {
        // Actualizar usuario en la lista local
        setUsers(prev => prev.map(user => 
          user.id === userId ? { ...user, ...updates } : user
        ))
        
        // Actualizar usuario seleccionado si es el mismo
        if (selectedUser && selectedUser.id === userId) {
          setSelectedUser(prev => prev ? { ...prev, ...updates } : null)
        }
      }
      
      return result
    } catch (err) {
      console.error('Error updating user:', err)
      return {
        success: false,
        message: 'Error al actualizar el usuario',
        error: err instanceof Error ? err.message : 'Error desconocido'
      }
    }
  }, [selectedUser])

  // Eliminar usuario
  const deleteUser = useCallback(async (userId: string): Promise<UserActionResult> => {
    try {
      const result = await AdminUserService.deleteUser(userId)
      
      if (result.success) {
        // Remover usuario de la lista local
        setUsers(prev => prev.filter(user => user.id !== userId))
        
        // Limpiar usuario seleccionado si es el mismo
        if (selectedUser && selectedUser.id === userId) {
          setSelectedUser(null)
        }
        
        // Recargar estadísticas
        loadUserStats()
      }
      
      return result
    } catch (err) {
      console.error('Error deleting user:', err)
      return {
        success: false,
        message: 'Error al eliminar el usuario',
        error: err instanceof Error ? err.message : 'Error desconocido'
      }
    }
  }, [selectedUser, loadUserStats])

  // Reenviar verificación de email
  const resendEmailVerification = useCallback(async (userEmail: string): Promise<UserActionResult> => {
    try {
      return await AdminUserService.resendEmailVerification(userEmail)
    } catch (err) {
      console.error('Error resending email verification:', err)
      return {
        success: false,
        message: 'Error al enviar verificación de email',
        error: err instanceof Error ? err.message : 'Error desconocido'
      }
    }
  }, [])

  // Limpiar usuario seleccionado
  const clearSelectedUser = useCallback(() => {
    setSelectedUser(null)
  }, [])

  // Refrescar datos
  const refreshData = useCallback(async () => {
    await Promise.all([
      loadUsers(true),
      loadUserStats()
    ])
  }, [loadUsers, loadUserStats])

  // Cargar más usuarios
  const loadMoreUsers = useCallback(async () => {
    if (!isLoading && hasMore) {
      await loadUsers(false)
    }
  }, [isLoading, hasMore, loadUsers])

  // Efectos
  useEffect(() => {
    loadUsers(true)
  }, [filters, sortConfig, loadUsers])

  useEffect(() => {
    loadUserStats()
  }, [loadUserStats])

  return {
    // Estado
    users,
    userStats,
    selectedUser,
    isLoading,
    isLoadingStats,
    isLoadingDetail,
    error,
    hasMore,
    
    // Filtros y ordenamiento
    filters,
    sortConfig,
    
    // Acciones
    loadUsers,
    loadUserStats,
    loadUserDetail,
    updateFilters,
    updateSort,
    updateUser,
    deleteUser,
    resendEmailVerification,
    clearSelectedUser,
    refreshData,
    loadMoreUsers
  }
}