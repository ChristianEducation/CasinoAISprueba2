import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  writeBatch,
  getDoc
} from 'firebase/firestore'
import { db } from '@/app/lib/firebase'
import { 
  AdminMenuItem, 
  AdminWeekMenu, 
  AdminDayMenu, 
  MenuOperationResult, 
  WeekNavigation,
  MenuFormData,
  MenuValidationError
} from '@/types/adminMenu'
import { DefaultColacionesService } from './defaultColacionesService'
import { format, startOfWeek, addDays, addWeeks, subWeeks } from 'date-fns'
import { es } from 'date-fns/locale'

// Interface for diagnostic results
interface DiagnosticResult {
  totalItems: number
  publishedItems: number
  activeItems: number
  issues: string[]
  recommendations: string[]
}

export class AdminMenuService {
  private static readonly COLLECTION_NAME = 'menus'

  // Helper para crear fecha local desde string YYYY-MM-DD - CORREGIDO
  static createLocalDate(dateString: string): Date {
    try {
      const [year, month, day] = dateString.split('-').map(Number)
      if (!year || !month || !day || month < 1 || month > 12 || day < 1 || day > 31) {
        throw new Error(`Invalid date components: ${dateString}`)
      }
      
      // Crear fecha local (sin conversión de zona horaria)
      const date = new Date(year, month - 1, day)
      
      // Verificar que la fecha creada es válida
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid date created: ${dateString}`)
      }
      
      return date
    } catch (error) {
      console.error('Error creating local date:', dateString, error)
      // Último recurso: fecha actual
      return new Date()
    }
  }

  // Helper para formatear fecha a YYYY-MM-DD - CORREGIDO
  static formatToDateString(date: Date): string {
    try {
      // Usar métodos locales para evitar problemas de zona horaria
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    } catch (error) {
      console.error('Error formatting date to string:', error)
      // Fallback usando format de date-fns
      return format(date, 'yyyy-MM-dd')
    }
  }

  // Obtener inicio de semana actual - CORREGIDO
  static getCurrentWeekStart(): string {
    const now = new Date()
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }) // Lunes
    return this.formatToDateString(weekStart)
  }

  // Obtener semana siguiente
  static getNextWeek(currentWeek: string): string {
    const current = this.createLocalDate(currentWeek)
    const next = addWeeks(current, 1)
    return this.formatToDateString(next)
  }

  // Obtener semana anterior
  static getPreviousWeek(currentWeek: string): string {
    const current = this.createLocalDate(currentWeek)
    const prev = subWeeks(current, 1)
    return this.formatToDateString(prev)
  }

  // Obtener navegación de semana - CORREGIDO
  static getWeekNavigation(currentWeek: string): WeekNavigation {
    const current = this.createLocalDate(currentWeek)
    const weekEnd = addDays(current, 6)
    const weekLabel = `Del ${format(current, 'd')} al ${format(weekEnd, 'd')} de ${format(weekEnd, 'MMMM yyyy', { locale: es })}`
    
    // Permitir navegar hasta 4 semanas atrás y 8 semanas adelante
    const now = new Date()
    const minWeek = subWeeks(now, 4)
    const maxWeek = addWeeks(now, 8)
    
    return {
      currentWeek,
      canGoBack: current > minWeek,
      canGoForward: current < maxWeek,
      weekLabel
    }
  }

  // Obtener menú semanal para administración
  static async getWeeklyMenu(weekStart: string): Promise<AdminWeekMenu | null> {
    try {
      console.log(`🔍 AdminMenuService.getWeeklyMenu: Loading week ${weekStart}`)
      
      const menusRef = collection(db, this.COLLECTION_NAME)
      const q = query(
        menusRef,
        where('weekStart', '==', weekStart),
        orderBy('date', 'asc'),
        orderBy('type', 'asc')
      )

      const snapshot = await getDocs(q)
      const items: AdminMenuItem[] = []

      console.log(`📊 AdminMenuService.getWeeklyMenu: Found ${snapshot.size} documents`)

      snapshot.forEach((doc) => {
        const data = doc.data()
        
        const item: AdminMenuItem = {
          id: doc.id,
          code: data.code,
          title: data.description,
          description: data.description,
          type: data.type,
          date: data.date,
          day: data.day,
          weekStart: data.weekStart,
          active: data.active,
          published: data.published ?? false,
          price: data.price,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        }

        items.push(item)
      })

      if (items.length === 0) {
        console.log(`📊 AdminMenuService.getWeeklyMenu: No items found for week ${weekStart}`)
        return null
      }

      return this.buildAdminWeekStructure(weekStart, items)
    } catch (error) {
      console.error('❌ Error fetching admin weekly menu:', error)
      throw new Error('Error al cargar el menú de administración')
    }
  }

  // Construir estructura de semana para administración - CORREGIDO
  private static buildAdminWeekStructure(weekStart: string, items: AdminMenuItem[]): AdminWeekMenu {
    const startDate = this.createLocalDate(weekStart)
    const endDate = addDays(startDate, 6)
    
    const weekLabel = `Del ${format(startDate, 'd')} al ${format(endDate, 'd')} de ${format(endDate, 'MMMM yyyy', { locale: es })}`
    
    const days: AdminDayMenu[] = []
    const dayNames = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']

    for (let i = 0; i < 7; i++) {
      const currentDate = addDays(startDate, i)
      const dateStr = this.formatToDateString(currentDate)
      const dayName = dayNames[i]

      const dayItems = items.filter(item => item.date === dateStr)
      const almuerzos = dayItems.filter(item => item.type === 'almuerzo')
      const colaciones = dayItems.filter(item => item.type === 'colacion')

      days.push({
        date: dateStr,
        day: dayName,
        dayName: format(currentDate, 'EEEE d \'de\' MMMM', { locale: es }),
        almuerzos,
        colaciones,
        isEditable: true
      })
    }

    // Verificar si toda la semana está publicada
    const isPublished = items.length > 0 && items.every(item => item.published)

    return {
      weekStart: this.formatToDateString(startDate),
      weekEnd: this.formatToDateString(endDate),
      weekLabel,
      days,
      isPublished,
      totalItems: items.length
    }
  }

  // Diagnosticar problemas de publicación de colaciones
  static async diagnosePublicationIssues(weekStart: string): Promise<DiagnosticResult> {
    try {
      console.log(`🔍 Diagnosing publication issues for week ${weekStart}`)

      const menu = await this.getWeeklyMenu(weekStart)
      const issues: string[] = []
      const recommendations: string[] = []

      if (!menu) {
        issues.push('No se encontraron menús para esta semana')
        recommendations.push('Crear colaciones predeterminadas para la semana')
        return {
          totalItems: 0,
          publishedItems: 0,
          activeItems: 0,
          issues,
          recommendations
        }
      }

      const allItems = menu.days.flatMap(day => [...day.almuerzos, ...day.colaciones])
      const colaciones = allItems.filter(item => item.type === 'colacion')
      const publishedColaciones = colaciones.filter(item => item.published)
      const activeColaciones = colaciones.filter(item => item.active)

      // Verificar si hay colaciones
      if (colaciones.length === 0) {
        issues.push('No hay colaciones configuradas para esta semana')
        recommendations.push('Crear colaciones predeterminadas')
      } else {
        // Verificar publicación
        if (publishedColaciones.length === 0) {
          issues.push('Ninguna colación está publicada')
          recommendations.push('Publicar las colaciones para que estén disponibles para los usuarios')
        } else if (publishedColaciones.length < colaciones.length) {
          issues.push(`Solo ${publishedColaciones.length} de ${colaciones.length} colaciones están publicadas`)
          recommendations.push('Revisar y publicar todas las colaciones necesarias')
        }

        // Verificar estado activo
        if (activeColaciones.length < colaciones.length) {
          const inactiveCount = colaciones.length - activeColaciones.length
          issues.push(`${inactiveCount} colaciones están marcadas como inactivas`)
          recommendations.push('Activar las colaciones que deben estar disponibles')
        }

        // Verificar cobertura de días
        const daysWithColaciones = menu.days.filter(day => day.colaciones.length > 0).length
        if (daysWithColaciones < 5) { // Lunes a viernes
          issues.push(`Solo ${daysWithColaciones} de 5 días laborales tienen colaciones`)
          recommendations.push('Asegurar que todos los días laborales tengan colaciones disponibles')
        }

        // Verificar consistencia de colaciones por día
        const defaultColaciones = await DefaultColacionesService.getDefaultColaciones()
        const activeDefaults = defaultColaciones.filter(col => col.active)
        
        for (const day of menu.days.slice(0, 5)) { // Solo días laborales
          if (day.colaciones.length > 0 && day.colaciones.length < activeDefaults.length) {
            issues.push(`${day.dayName} tiene menos colaciones de las esperadas (${day.colaciones.length}/${activeDefaults.length})`)
            recommendations.push(`Completar las colaciones faltantes para ${day.dayName}`)
          }
        }
      }

      // Si no hay problemas, agregar recomendaciones positivas
      if (issues.length === 0) {
        recommendations.push('Las colaciones están correctamente configuradas y publicadas')
        recommendations.push('Verificar periódicamente que las colaciones sigan activas')
      }

      return {
        totalItems: allItems.length,
        publishedItems: allItems.filter(item => item.published).length,
        activeItems: allItems.filter(item => item.active).length,
        issues,
        recommendations
      }
    } catch (error) {
      console.error('Error diagnosing publication issues:', error)
      return {
        totalItems: 0,
        publishedItems: 0,
        activeItems: 0,
        issues: ['Error al ejecutar el diagnóstico'],
        recommendations: ['Intentar nuevamente o contactar al administrador del sistema']
      }
    }
  }

  // Corregir colaciones predeterminadas no publicadas
  static async fixUnpublishedDefaultColaciones(weekStart: string): Promise<MenuOperationResult<void>> {
    try {
      console.log(`🔧 Fixing unpublished default colaciones for week ${weekStart}`)

      const menu = await this.getWeeklyMenu(weekStart)
      
      if (!menu) {
        // Si no hay menú, crear colaciones predeterminadas
        const createResult = await this.createDefaultColacionesWeek(weekStart)
        if (!createResult.success) {
          return {
            success: false,
            message: createResult.message,
            errors: createResult.errors
          }
        }
        
        // Publicar las colaciones recién creadas
        const publishResult = await this.publishColacionesForWeek(weekStart)
        if (!publishResult.success) {
          return publishResult
        }

        return {
          success: true,
          message: 'Colaciones predeterminadas creadas y publicadas exitosamente'
        }
      }

      const colaciones = menu.days.flatMap(day => day.colaciones)
      const unpublishedColaciones = colaciones.filter(item => !item.published)

      if (unpublishedColaciones.length === 0) {
        return {
          success: true,
          message: 'Todas las colaciones ya están publicadas'
        }
      }

      // Publicar colaciones no publicadas
      const batch = writeBatch(db)
      const now = new Date()

      for (const colacion of unpublishedColaciones) {
        if (!colacion.id) {
          console.warn('Skipping colacion without ID:', colacion)
          continue
        }
        const itemRef = doc(db, this.COLLECTION_NAME, colacion.id)
        batch.update(itemRef, {
          published: true,
          active: true, // También activar si no está activo
          updatedAt: Timestamp.fromDate(now)
        })
      }

      await batch.commit()

      return {
        success: true,
        message: `${unpublishedColaciones.length} colaciones publicadas exitosamente`
      }
    } catch (error) {
      console.error('Error fixing unpublished default colaciones:', error)
      return {
        success: false,
        message: 'Error al corregir las colaciones no publicadas',
        errors: [{ field: 'general', message: 'Error interno del servidor' }]
      }
    }
  }

  // Helper method to publish all colaciones for a week
  private static async publishColacionesForWeek(weekStart: string): Promise<MenuOperationResult<void>> {
    try {
      const menusRef = collection(db, this.COLLECTION_NAME)
      const colacionesQuery = query(
        menusRef,
        where('weekStart', '==', weekStart),
        where('type', '==', 'colacion')
      )

      const snapshot = await getDocs(colacionesQuery)
      
      if (snapshot.empty) {
        return {
          success: false,
          message: 'No se encontraron colaciones para publicar',
          errors: [{ field: 'weekStart', message: 'Sin colaciones' }]
        }
      }

      const batch = writeBatch(db)
      const now = new Date()

      snapshot.forEach((doc) => {
        batch.update(doc.ref, {
          published: true,
          active: true,
          updatedAt: Timestamp.fromDate(now)
        })
      })

      await batch.commit()

      return {
        success: true,
        message: `${snapshot.size} colaciones publicadas exitosamente`
      }
    } catch (error) {
      console.error('Error publishing colaciones for week:', error)
      return {
        success: false,
        message: 'Error al publicar las colaciones',
        errors: [{ field: 'general', message: 'Error interno del servidor' }]
      }
    }
  }

  // Crear item de menú
  static async createMenuItem(
    weekStart: string,
    date: string,
    day: string,
    type: 'almuerzo' | 'colacion',
    code: string,
    title: string,
    description: string,
    active: boolean = true,
    price?: number
  ): Promise<MenuOperationResult<AdminMenuItem>> {
    try {
      // Validar datos
      const validation = this.validateMenuItemData({
        type,
        code,
        title,
        description,
        active,
        price
      })

      if (!validation.success) {
        return {
          success: false,
          message: 'Datos inválidos',
          errors: validation.errors
        }
      }

      // Verificar si ya existe un item con el mismo código en la misma semana
      const existingItem = await this.getMenuItemByCode(code, weekStart)
      if (existingItem) {
        return {
          success: false,
          message: `Ya existe un item con el código ${code} en esta semana`,
          errors: [{ field: 'code', message: 'Código duplicado' }]
        }
      }

      const menusRef = collection(db, this.COLLECTION_NAME)
      const now = new Date()

      const menuData = {
        code,
        description,
        type,
        date,
        day,
        weekStart,
        active,
        published: false,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
        ...(price !== undefined && { price })
      }

      const docRef = await addDoc(menusRef, menuData)

      const newItem: AdminMenuItem = {
        id: docRef.id,
        code,
        title: description,
        description,
        type,
        date,
        day,
        weekStart,
        active,
        published: false,
        price,
        createdAt: now,
        updatedAt: now
      }

      return {
        success: true,
        message: 'Item de menú creado exitosamente',
        data: newItem
      }
    } catch (error) {
      console.error('Error creating menu item:', error)
      return {
        success: false,
        message: 'Error al crear el item de menú',
        errors: [{ field: 'general', message: 'Error interno del servidor' }]
      }
    }
  }

  // Actualizar item de menú
  static async updateMenuItem(
    itemId: string,
    updates: Partial<Pick<AdminMenuItem, 'title' | 'description' | 'active' | 'published' | 'price'>>
  ): Promise<MenuOperationResult<AdminMenuItem>> {
    try {
      const itemRef = doc(db, this.COLLECTION_NAME, itemId)
      const itemDoc = await getDoc(itemRef)

      if (!itemDoc.exists()) {
        return {
          success: false,
          message: 'Item de menú no encontrado',
          errors: [{ field: 'id', message: 'Item no existe' }]
        }
      }

      const updateData: {
        updatedAt: Timestamp;
        description?: string;
        active?: boolean;
        published?: boolean;
        price?: number;
      } = {
        updatedAt: Timestamp.fromDate(new Date())
      }

      if (updates.title !== undefined) {
        updateData.description = updates.title // En Firestore se guarda como description
      }
      if (updates.description !== undefined) {
        updateData.description = updates.description
      }
      if (updates.active !== undefined) {
        updateData.active = updates.active
      }
      if (updates.published !== undefined) {
        updateData.published = updates.published
      }
      if (updates.price !== undefined) {
        updateData.price = updates.price
      }

      await updateDoc(itemRef, updateData)

      const updatedData = itemDoc.data()
      const updatedItem: AdminMenuItem = {
        id: itemId,
        code: updatedData.code,
        title: updateData.description || updatedData.description,
        description: updateData.description || updatedData.description,
        type: updatedData.type,
        date: updatedData.date,
        day: updatedData.day,
        weekStart: updatedData.weekStart,
        active: updateData.active !== undefined ? updateData.active : updatedData.active,
        published: updateData.published !== undefined ? updateData.published : updatedData.published,
        price: updateData.price !== undefined ? updateData.price : updatedData.price,
        createdAt: updatedData.createdAt?.toDate(),
        updatedAt: new Date()
      }

      return {
        success: true,
        message: 'Item de menú actualizado exitosamente',
        data: updatedItem
      }
    } catch (error) {
      console.error('Error updating menu item:', error)
      return {
        success: false,
        message: 'Error al actualizar el item de menú',
        errors: [{ field: 'general', message: 'Error interno del servidor' }]
      }
    }
  }

  // Eliminar item de menú
  static async deleteMenuItem(itemId: string): Promise<MenuOperationResult<void>> {
    try {
      const itemRef = doc(db, this.COLLECTION_NAME, itemId)
      const itemDoc = await getDoc(itemRef)

      if (!itemDoc.exists()) {
        return {
          success: false,
          message: 'Item de menú no encontrado',
          errors: [{ field: 'id', message: 'Item no existe' }]
        }
      }

      await deleteDoc(itemRef)

      return {
        success: true,
        message: 'Item de menú eliminado exitosamente'
      }
    } catch (error) {
      console.error('Error deleting menu item:', error)
      return {
        success: false,
        message: 'Error al eliminar el item de menú',
        errors: [{ field: 'general', message: 'Error interno del servidor' }]
      }
    }
  }

  // Duplicar menú de una semana a otra
  static async duplicateWeekMenu(sourceWeek: string, targetWeek: string): Promise<MenuOperationResult<AdminWeekMenu>> {
    try {
      console.log(`🔄 Duplicating menu from ${sourceWeek} to ${targetWeek}`)

      // Verificar que la semana origen existe
      const sourceMenu = await this.getWeeklyMenu(sourceWeek)
      if (!sourceMenu || sourceMenu.totalItems === 0) {
        return {
          success: false,
          message: 'La semana origen no tiene menús para duplicar',
          errors: [{ field: 'sourceWeek', message: 'Semana origen vacía' }]
        }
      }

      // Verificar que la semana destino no tenga menús
      const targetMenu = await this.getWeeklyMenu(targetWeek)
      if (targetMenu && targetMenu.totalItems > 0) {
        return {
          success: false,
          message: 'La semana destino ya tiene menús. Elimínelos primero.',
          errors: [{ field: 'targetWeek', message: 'Semana destino no vacía' }]
        }
      }

      // Obtener todos los items de la semana origen
      const menusRef = collection(db, this.COLLECTION_NAME)
      const sourceQuery = query(
        menusRef,
        where('weekStart', '==', sourceWeek),
        orderBy('date', 'asc')
      )

      const sourceSnapshot = await getDocs(sourceQuery)
      const batch = writeBatch(db)
      const now = new Date()

      // Calcular las fechas de la semana destino
      const targetStartDate = this.createLocalDate(targetWeek)
      const sourceStartDate = this.createLocalDate(sourceWeek)
      const daysDiff = Math.floor((targetStartDate.getTime() - sourceStartDate.getTime()) / (1000 * 60 * 60 * 24))

      sourceSnapshot.forEach((sourceDoc) => {
        const sourceData = sourceDoc.data()
        
        // Calcular nueva fecha
        const sourceDate = this.createLocalDate(sourceData.date)
        const newDate = addDays(sourceDate, daysDiff)
        const newDateStr = this.formatToDateString(newDate)
        
        // Crear nuevo documento
        const newDocRef = doc(collection(db, this.COLLECTION_NAME))
        const newData = {
          ...sourceData,
          date: newDateStr,
          weekStart: targetWeek,
          published: false, // Los menús duplicados empiezan como no publicados
          createdAt: Timestamp.fromDate(now),
          updatedAt: Timestamp.fromDate(now)
        }
        
        batch.set(newDocRef, newData)
      })

      await batch.commit()

      // Obtener el menú duplicado
      const duplicatedMenu = await this.getWeeklyMenu(targetWeek)

      return {
        success: true,
        message: `Menú duplicado exitosamente. ${sourceSnapshot.size} items copiados.`,
        data: duplicatedMenu!
      }
    } catch (error) {
      console.error('Error duplicating week menu:', error)
      return {
        success: false,
        message: 'Error al duplicar el menú semanal',
        errors: [{ field: 'general', message: 'Error interno del servidor' }]
      }
    }
  }

  // Publicar/despublicar semana completa
  static async toggleWeekPublication(weekStart: string, published: boolean): Promise<MenuOperationResult<AdminWeekMenu>> {
    try {
      const menusRef = collection(db, this.COLLECTION_NAME)
      const weekQuery = query(
        menusRef,
        where('weekStart', '==', weekStart)
      )

      const snapshot = await getDocs(weekQuery)
      
      if (snapshot.empty) {
        return {
          success: false,
          message: 'No se encontraron menús para esta semana',
          errors: [{ field: 'weekStart', message: 'Semana sin menús' }]
        }
      }

      const batch = writeBatch(db)
      const now = new Date()

      snapshot.forEach((doc) => {
        batch.update(doc.ref, {
          published,
          updatedAt: Timestamp.fromDate(now)
        })
      })

      await batch.commit()

      const updatedMenu = await this.getWeeklyMenu(weekStart)

      return {
        success: true,
        message: `Semana ${published ? 'publicada' : 'despublicada'} exitosamente`,
        data: updatedMenu!
      }
    } catch (error) {
      console.error('Error toggling week publication:', error)
      return {
        success: false,
        message: 'Error al cambiar el estado de publicación',
        errors: [{ field: 'general', message: 'Error interno del servidor' }]
      }
    }
  }

  // Eliminar menú completo de una semana
  static async deleteWeekMenu(weekStart: string): Promise<MenuOperationResult<void>> {
    try {
      const menusRef = collection(db, this.COLLECTION_NAME)
      const weekQuery = query(
        menusRef,
        where('weekStart', '==', weekStart)
      )

      const snapshot = await getDocs(weekQuery)
      
      if (snapshot.empty) {
        return {
          success: false,
          message: 'No se encontraron menús para eliminar en esta semana',
          errors: [{ field: 'weekStart', message: 'Semana sin menús' }]
        }
      }

      const batch = writeBatch(db)

      snapshot.forEach((doc) => {
        batch.delete(doc.ref)
      })

      await batch.commit()

      return {
        success: true,
        message: `${snapshot.size} items de menú eliminados exitosamente`
      }
    } catch (error) {
      console.error('Error deleting week menu:', error)
      return {
        success: false,
        message: 'Error al eliminar el menú semanal',
        errors: [{ field: 'general', message: 'Error interno del servidor' }]
      }
    }
  }

  // Crear colaciones predeterminadas para una semana
  static async createDefaultColacionesWeek(weekStart: string): Promise<MenuOperationResult<AdminWeekMenu>> {
    try {
      console.log(`🍪 Creating default colaciones for week ${weekStart}`)

      // Verificar que no existan colaciones en esta semana
      const existingMenu = await this.getWeeklyMenu(weekStart)
      if (existingMenu) {
        const hasColaciones = existingMenu.days.some(day => day.colaciones.length > 0)
        if (hasColaciones) {
          return {
            success: false,
            message: 'Ya existen colaciones en esta semana',
            errors: [{ field: 'weekStart', message: 'Colaciones ya existen' }]
          }
        }
      }

      // Obtener colaciones predeterminadas
      const defaultColaciones = await DefaultColacionesService.getDefaultColaciones()
      
      if (defaultColaciones.length === 0) {
        return {
          success: false,
          message: 'No hay colaciones predeterminadas configuradas',
          errors: [{ field: 'defaultColaciones', message: 'Sin configuración' }]
        }
      }

      const batch = writeBatch(db)
      const now = new Date()
      const startDate = this.createLocalDate(weekStart)
      const dayNames = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes']

      let itemsCreated = 0

      // Crear colaciones para cada día de la semana (lunes a viernes)
      for (let i = 0; i < 5; i++) {
        const currentDate = addDays(startDate, i)
        const dateStr = this.formatToDateString(currentDate)
        const dayName = dayNames[i]

        for (const colacion of defaultColaciones) {
          if (colacion.active) {
            const newDocRef = doc(collection(db, this.COLLECTION_NAME))
            const menuData = {
              code: colacion.code,
              description: colacion.description,
              type: 'colacion',
              date: dateStr,
              day: dayName,
              weekStart,
              active: true,
              published: false,
              price: colacion.price,
              createdAt: Timestamp.fromDate(now),
              updatedAt: Timestamp.fromDate(now)
            }
            
            batch.set(newDocRef, menuData)
            itemsCreated++
          }
        }
      }

      await batch.commit()

      const updatedMenu = await this.getWeeklyMenu(weekStart)

      return {
        success: true,
        message: `${itemsCreated} colaciones predeterminadas creadas exitosamente`,
        data: updatedMenu!
      }
    } catch (error) {
      console.error('Error creating default colaciones week:', error)
      return {
        success: false,
        message: 'Error al crear colaciones predeterminadas',
        errors: [{ field: 'general', message: 'Error interno del servidor' }]
      }
    }
  }

  // Crear colaciones predeterminadas para un día específico
  static async createDefaultColacionesDay(weekStart: string, date: string, day: string): Promise<MenuOperationResult<AdminMenuItem[]>> {
    try {
      console.log(`🍪 Creating default colaciones for day ${date}`)

      // Verificar que no existan colaciones en este día
      const menusRef = collection(db, this.COLLECTION_NAME)
      const dayQuery = query(
        menusRef,
        where('weekStart', '==', weekStart),
        where('date', '==', date),
        where('type', '==', 'colacion')
      )

      const existingSnapshot = await getDocs(dayQuery)
      if (!existingSnapshot.empty) {
        return {
          success: false,
          message: 'Ya existen colaciones en este día',
          errors: [{ field: 'date', message: 'Colaciones ya existen' }]
        }
      }

      // Obtener colaciones predeterminadas
      const defaultColaciones = await DefaultColacionesService.getDefaultColaciones()
      
      if (defaultColaciones.length === 0) {
        return {
          success: false,
          message: 'No hay colaciones predeterminadas configuradas',
          errors: [{ field: 'defaultColaciones', message: 'Sin configuración' }]
        }
      }

      const batch = writeBatch(db)
      const now = new Date()
      const createdItems: AdminMenuItem[] = []

      for (const colacion of defaultColaciones) {
        if (colacion.active) {
          const newDocRef = doc(collection(db, this.COLLECTION_NAME))
          const menuData = {
            code: colacion.code,
            description: colacion.description,
            type: 'colacion',
            date,
            day,
            weekStart,
            active: true,
            published: false,
            price: colacion.price,
            createdAt: Timestamp.fromDate(now),
            updatedAt: Timestamp.fromDate(now)
          }
          
          batch.set(newDocRef, menuData)

          createdItems.push({
            id: newDocRef.id,
            code: colacion.code,
            title: colacion.description || colacion.code,
            description: colacion.description,
            type: 'colacion',
            date,
            day,
            weekStart,
            active: true,
            published: false,
            price: colacion.price,
            createdAt: now,
            updatedAt: now
          })
        }
      }

      await batch.commit()

      return {
        success: true,
        message: `${createdItems.length} colaciones predeterminadas creadas exitosamente`,
        data: createdItems
      }
    } catch (error) {
      console.error('Error creating default colaciones day:', error)
      return {
        success: false,
        message: 'Error al crear colaciones predeterminadas',
        errors: [{ field: 'general', message: 'Error interno del servidor' }]
      }
    }
  }

  // Obtener item de menú por código
  private static async getMenuItemByCode(code: string, weekStart: string): Promise<AdminMenuItem | null> {
    try {
      const menusRef = collection(db, this.COLLECTION_NAME)
      const q = query(
        menusRef,
        where('code', '==', code),
        where('weekStart', '==', weekStart)
      )

      const snapshot = await getDocs(q)
      if (snapshot.empty) {
        return null
      }

      const doc = snapshot.docs[0]
      const data = doc.data()
      
      return {
        id: doc.id,
        code: data.code,
        title: data.description,
        description: data.description,
        type: data.type,
        date: data.date,
        day: data.day,
        weekStart: data.weekStart,
        active: data.active,
        published: data.published ?? false,
        price: data.price,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      }
    } catch (error) {
      console.error('Error getting menu item by code:', error)
      return null
    }
  }

  // Validar datos del item
  private static validateMenuItemData(data: MenuFormData): { success: boolean; errors: MenuValidationError[] } {
    const errors: MenuValidationError[] = []

    if (!data.code || data.code.trim().length === 0) {
      errors.push({ field: 'code', message: 'El código es requerido' })
    } else if (!/^[A-Z]\d{1,2}$/.test(data.code.trim())) {
      errors.push({ field: 'code', message: 'El código debe tener formato A1, A12, C1, etc.' })
    }

    if (!data.title || data.title.trim().length === 0) {
      errors.push({ field: 'title', message: 'El título es requerido' })
    } else if (data.title.trim().length < 3) {
      errors.push({ field: 'title', message: 'El título debe tener al menos 3 caracteres' })
    }

    if (!data.description || data.description.trim().length === 0) {
      errors.push({ field: 'description', message: 'La descripción es requerida' })
    } else if (data.description.trim().length < 3) {
      errors.push({ field: 'description', message: 'La descripción debe tener al menos 3 caracteres' })
    }

    if (!data.type || !['almuerzo', 'colacion'].includes(data.type)) {
      errors.push({ field: 'type', message: 'El tipo debe ser almuerzo o colación' })
    }

    if (data.price !== undefined && (data.price < 0 || data.price > 50000)) {
      errors.push({ field: 'price', message: 'El precio debe estar entre 0 y 50,000' })
    }

    return {
      success: errors.length === 0,
      errors
    }
  }

  // Obtener estadísticas de la semana
  static async getWeekStats(weekStart: string): Promise<{
    totalItems: number
    publishedItems: number
    almuerzos: number
    colaciones: number
    activeDays: number
  }> {
    try {
      const menu = await this.getWeeklyMenu(weekStart)
      
      if (!menu) {
        return {
          totalItems: 0,
          publishedItems: 0,
          almuerzos: 0,
          colaciones: 0,
          activeDays: 0
        }
      }

      const allItems = menu.days.flatMap(day => [...day.almuerzos, ...day.colaciones])
      const publishedItems = allItems.filter(item => item.published)
      const almuerzos = allItems.filter(item => item.type === 'almuerzo')
      const colaciones = allItems.filter(item => item.type === 'colacion')
      const activeDays = menu.days.filter(day => day.almuerzos.length > 0 || day.colaciones.length > 0).length

      return {
        totalItems: allItems.length,
        publishedItems: publishedItems.length,
        almuerzos: almuerzos.length,
        colaciones: colaciones.length,
        activeDays
      }
    } catch (error) {
      console.error('Error getting week stats:', error)
      return {
        totalItems: 0,
        publishedItems: 0,
        almuerzos: 0,
        colaciones: 0,
        activeDays: 0
      }
    }
  }
}