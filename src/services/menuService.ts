import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { db } from '@/app/lib/firebase'
import { MenuItem, UserType, getItemPrice } from '@/types/panel'
import { DayMenuDisplay, WeekMenuDisplay } from '@/types/menu'
import { format, startOfWeek, endOfWeek, addDays, parseISO, isValid } from 'date-fns'
import { es } from 'date-fns/locale'

export interface WeekInfo {
  weekStart: string
  weekEnd: string
  weekNumber: number
  year: number
  isCurrentWeek: boolean
  isOrderingAllowed: boolean
  orderDeadline: Date
  weekLabel: string
}

export class MenuService {
  private static readonly COLLECTION_NAME = 'menus'

  // Helper method to create a local date from YYYY-MM-DD string - CORREGIDO
  static createLocalDate(dateString: string): Date {
    try {
      // Crear fecha local directamente sin conversiones de zona horaria
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
      // Fallback: usar parseISO pero ajustar a medianoche local
      try {
        const isoDate = parseISO(dateString + 'T00:00:00')
        if (isValid(isoDate)) {
          return isoDate
        }
      } catch (fallbackError) {
        console.error('Fallback date parsing also failed:', fallbackError)
      }
      
      // Último recurso: fecha actual
      return new Date()
    }
  }

  // Helper method to format date to YYYY-MM-DD - CORREGIDO
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

  // Helper method to determine user type from various possible field names
  static getUserTypeFromUser(user: { tipoUsuario?: string; userType?: string; tipo_usuario?: string; type?: string } | null | undefined): UserType {
    // Try different possible field names
    const userType = user?.tipoUsuario || user?.userType || user?.tipo_usuario || user?.type
    
    // Normalize to expected values
    if (userType === 'funcionario' || userType === 'staff' || userType === 'employee') {
      return 'funcionario'
    }
    
    if (userType === 'apoderado' || userType === 'parent' || userType === 'guardian' || userType === 'estudiante' || userType === 'student') {
      return 'apoderado'
    }
    
    // Default fallback
    console.warn('Unknown user type, defaulting to apoderado:', userType)
    return 'apoderado'
  }

  // Obtener menú semanal con precios aplicados según tipo de usuario
  static async getWeeklyMenu(weekStart?: string): Promise<WeekMenuDisplay> {
    try {
      const targetWeek = weekStart || this.getCurrentWeekStart()
      
      console.log(`🔍 MenuService.getWeeklyMenu: Querying for week ${targetWeek}`)
      
      const menusRef = collection(db, this.COLLECTION_NAME)
      const q = query(
        menusRef,
        where('weekStart', '==', targetWeek),
        where('active', '==', true),
        where('published', '==', true), // Solo menús publicados
        orderBy('date', 'asc'),
        orderBy('type', 'asc')
      )

      const snapshot = await getDocs(q)
      const items: MenuItem[] = []

      console.log(`📊 MenuService.getWeeklyMenu: Found ${snapshot.size} documents in Firestore`)

      snapshot.forEach((doc) => {
        const data = doc.data()
        
        console.log(`📄 Document ${doc.id}:`, {
          code: data.code,
          description: data.description,
          type: data.type,
          date: data.date,
          active: data.active,
          published: data.published,
          price: data.price,
          weekStart: data.weekStart
        })
        
        // Crear item con precio personalizado si existe
        const item: MenuItem = {
          id: doc.id,
          code: data.code,
          name: data.description, // Usar description como name
          description: data.description,
          type: data.type,
          price: data.price || 0, // Usar precio personalizado o 0 como fallback
          available: data.active,
          date: data.date,
          dia: data.day,
          active: data.active,
          customPrice: data.price !== undefined && data.price > 0 // Marcar si tiene precio personalizado
        }

        items.push(item)
      })

      console.log(`✅ MenuService.getWeeklyMenu: Processed ${items.length} items`)
      console.log('📈 Items breakdown:', {
        almuerzos: items.filter(i => i.type === 'almuerzo').length,
        colaciones: items.filter(i => i.type === 'colacion').length,
        byDate: items.reduce((acc, item) => {
          acc[item.date] = (acc[item.date] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      })

      return this.buildWeekMenuStructure(targetWeek, items)
    } catch (error) {
      console.error('❌ Error fetching weekly menu:', error)
      throw new Error('Error al cargar el menú semanal')
    }
  }

  // Obtener menú semanal para un usuario específico con precios aplicados
  static async getWeeklyMenuForUser(
    userTypeOrUser: UserType | { tipoUsuario?: string; userType?: string; tipo_usuario?: string; type?: string } | null | undefined,
    weekStart?: string
  ): Promise<DayMenuDisplay[]> {
    try {
      const userType = typeof userTypeOrUser === 'string' 
        ? userTypeOrUser 
        : this.getUserTypeFromUser(userTypeOrUser)
      
      console.log(`🔍 MenuService.getWeeklyMenuForUser: Loading menu for user type ${userType}, week ${weekStart}`)
      
      const weekMenu = await this.getWeeklyMenu(weekStart)
      
      console.log(`📊 MenuService.getWeeklyMenuForUser: Loaded ${weekMenu.totalItems} items, ${weekMenu.days.length} days`)
      
      // Aplicar precios según tipo de usuario
      const daysWithPrices = weekMenu.days.map(day => {
        const processedDay = {
          ...day,
          almuerzos: day.almuerzos.map(item => {
            const finalPrice = getItemPrice(item, userType)
            console.log(`💰 Almuerzo ${item.code}: original price ${item.price}, final price ${finalPrice} for ${userType}`)
            return {
              ...item,
              price: finalPrice
            }
          }),
          colaciones: day.colaciones.map(item => {
            const finalPrice = getItemPrice(item, userType)
            console.log(`🥪 Colación ${item.code}: original price ${item.price}, final price ${finalPrice} for ${userType}`)
            return {
              ...item,
              price: finalPrice
            }
          })
        }
        
        console.log(`📅 Day ${day.date}: ${processedDay.almuerzos.length} almuerzos, ${processedDay.colaciones.length} colaciones`)
        
        return processedDay
      })

      console.log(`✅ MenuService.getWeeklyMenuForUser: Returning ${daysWithPrices.length} days`)

      return daysWithPrices
    } catch (error) {
      console.error('❌ Error fetching weekly menu for user:', error)
      throw new Error('Error al cargar el menú para el usuario')
    }
  }

  /**
   * Obtiene información de la semana actual - CORREGIDO
   */
  static getCurrentWeekInfo(): WeekInfo {
    // Crear fecha actual en zona horaria local
    const now = new Date()
    console.log(`📅 Current local date: ${now.toLocaleString()}`)
    
    // Obtener inicio y fin de semana en zona horaria local
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }) // Lunes
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 }) // Domingo
    
    console.log(`📅 Week start local: ${weekStart.toLocaleString()}`)
    console.log(`📅 Week end local: ${weekEnd.toLocaleString()}`)
    
    // Calcular número de semana
    const startOfYear = new Date(now.getFullYear(), 0, 1)
    const weekNumber = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7)
    
    // Deadline para pedidos: miércoles a las 13:00 (zona horaria local)
    const wednesday = addDays(weekStart, 2)
    const orderDeadline = new Date(wednesday.getFullYear(), wednesday.getMonth(), wednesday.getDate(), 13, 0, 0, 0)
    
    const isCurrentWeek = true
    const isOrderingAllowed = now <= orderDeadline
    
    const weekStartStr = this.formatToDateString(weekStart)
    const weekEndStr = this.formatToDateString(weekEnd)
    
    console.log(`📅 Formatted week start: ${weekStartStr}`)
    console.log(`📅 Formatted week end: ${weekEndStr}`)
    
    return {
      weekStart: weekStartStr,
      weekEnd: weekEndStr,
      weekNumber,
      year: now.getFullYear(),
      isCurrentWeek,
      isOrderingAllowed,
      orderDeadline,
      weekLabel: this.getWeekDisplayText(weekStartStr, weekEndStr)
    }
  }

  /**
   * Obtiene información de una semana específica - CORREGIDO
   */
  static getWeekInfo(weekStart: string): WeekInfo {
    const now = new Date()
    const currentWeekStart = this.getCurrentWeekStart()
    const weekStartDate = this.createLocalDate(weekStart)
    const weekEndDate = addDays(weekStartDate, 6)
    
    // Calcular número de semana
    const startOfYear = new Date(weekStartDate.getFullYear(), 0, 1)
    const weekNumber = Math.ceil(((weekStartDate.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7)
    
    // Deadline para pedidos: miércoles a las 13:00 de la semana actual (zona horaria local)
    const currentWeekStartDate = this.createLocalDate(currentWeekStart)
    const wednesday = addDays(currentWeekStartDate, 2)
    const orderDeadline = new Date(wednesday.getFullYear(), wednesday.getMonth(), wednesday.getDate(), 13, 0, 0, 0)
    
    const isCurrentWeek = weekStart === currentWeekStart
    const isOrderingAllowed = isCurrentWeek ? now <= orderDeadline : weekStart > currentWeekStart
    
    return {
      weekStart,
      weekEnd: this.formatToDateString(weekEndDate),
      weekNumber,
      year: weekStartDate.getFullYear(),
      isCurrentWeek,
      isOrderingAllowed,
      orderDeadline,
      weekLabel: this.getWeekDisplayText(weekStart, this.formatToDateString(weekEndDate))
    }
  }

  /**
   * Obtiene el inicio de la semana actual - CORREGIDO
   */
  static getCurrentWeekStart(): string {
    const now = new Date()
    console.log(`📅 Getting current week start from local date: ${now.toLocaleString()}`)
    
    const weekStart = startOfWeek(now, { weekStartsOn: 1 })
    console.log(`📅 Week start date object: ${weekStart.toLocaleString()}`)
    
    const formatted = this.formatToDateString(weekStart)
    console.log(`📅 Formatted week start: ${formatted}`)
    
    return formatted
  }

  /**
   * Obtiene el inicio de una semana específica basada en una fecha - CORREGIDO
   */
  static getWeekStartFromDate(date: Date): string {
    const weekStart = startOfWeek(date, { weekStartsOn: 1 })
    return this.formatToDateString(weekStart)
  }

  /**
   * Formatea el texto de visualización de la semana
   */
  static getWeekDisplayText(weekStart: string, weekEnd: string): string {
    const start = this.createLocalDate(weekStart)
    const end = this.createLocalDate(weekEnd)
    
    return `Del ${format(start, 'd')} al ${format(end, 'd')} de ${format(end, 'MMMM yyyy', { locale: es })}`
  }

  /**
   * Obtiene el nombre del día para mostrar - CORREGIDO
   */
  static getDayDisplayName(date: string): string {
    const dayDate = this.createLocalDate(date)
    return format(dayDate, 'EEEE d \'de\' MMMM', { locale: es })
  }

  /**
   * Formatea una fecha
   */
  static getFormattedDate(date: string): string {
    const dayDate = this.createLocalDate(date)
    return this.formatToDateString(dayDate)
  }

  /**
   * Obtiene el nombre del día
   */
  static getDayName(date: string): string {
    const dayDate = this.createLocalDate(date)
    return format(dayDate, 'EEEE', { locale: es })
  }

  /**
   * Verifica si se permite hacer pedidos para un día específico - CORREGIDO
   */
  static isDayOrderingAllowed(date: string): boolean {
    try {
      // No permitir pedidos para días pasados
      if (this.isPastDay(date)) {
        return false
      }
      
      // No permitir pedidos para fines de semana
      if (this.isWeekend(date)) {
        return false
      }
      
      return true
    } catch (error) {
      console.error('Error checking if day ordering is allowed:', error)
      return false
    }
  }

  /**
   * Verifica si un día es pasado - CORREGIDO
   */
  static isPastDay(date: string): boolean {
    try {
      const dayDate = this.createLocalDate(date)
      const today = new Date()
      
      // Normalizar fechas para comparación (solo fecha, sin hora) en zona horaria local
      const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const dayDateNormalized = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate())
      
      return dayDateNormalized < todayNormalized
    } catch (error) {
      console.error('Error checking if day is past:', error)
      return false
    }
  }

  /**
   * Verifica si un día es fin de semana - CORREGIDO
   */
  static isWeekend(date: string): boolean {
    try {
      const dayDate = this.createLocalDate(date)
      const dayOfWeek = dayDate.getDay() // 0 = domingo, 6 = sábado (usando getDay() local)
      return dayOfWeek === 0 || dayOfWeek === 6
    } catch (error) {
      console.error('Error checking if day is weekend:', error)
      return false
    }
  }

  /**
   * Verifica si hay menús para una semana específica
   */
  static async hasMenusForWeek(weekStart: string): Promise<boolean> {
    try {
      console.log(`🔍 MenuService.hasMenusForWeek: Checking week ${weekStart}`)
      
      const menusRef = collection(db, this.COLLECTION_NAME)
      const q = query(
        menusRef,
        where('weekStart', '==', weekStart),
        where('active', '==', true),
        where('published', '==', true)
      )

      const snapshot = await getDocs(q)
      const hasMenus = !snapshot.empty
      
      console.log(`📊 MenuService.hasMenusForWeek: Week ${weekStart} has ${snapshot.size} published items, hasMenus: ${hasMenus}`)
      
      if (snapshot.size > 0) {
        console.log('📄 Sample documents:')
        snapshot.docs.slice(0, 3).forEach(doc => {
          const data = doc.data()
          console.log(`  - ${data.code}: ${data.description} (${data.type}) - ${data.date}`)
        })
      }
      
      return hasMenus
    } catch (error) {
      console.error('❌ Error checking if week has menus:', error)
      return false
    }
  }

  /**
   * Obtiene los días disponibles para una semana específica
   */
  static async getAvailableDaysForWeek(weekStart: string): Promise<string[]> {
    try {
      const menusRef = collection(db, this.COLLECTION_NAME)
      const q = query(
        menusRef,
        where('weekStart', '==', weekStart),
        where('active', '==', true),
        where('published', '==', true)
      )

      const snapshot = await getDocs(q)
      const availableDays = new Set<string>()

      snapshot.forEach((doc) => {
        const data = doc.data()
        availableDays.add(data.date)
      })

      return Array.from(availableDays).sort()
    } catch (error) {
      console.error('Error getting available days for week:', error)
      return []
    }
  }

  /**
   * Genera las fechas de una semana específica
   */
  static generateWeekDates(weekStart: string): string[] {
    try {
      const startDate = this.createLocalDate(weekStart)
      const dates: string[] = []
      
      for (let i = 0; i < 7; i++) {
        const date = addDays(startDate, i)
        dates.push(this.formatToDateString(date))
      }
      
      return dates
    } catch (error) {
      console.error('Error generating week dates:', error)
      return []
    }
  }

  /**
   * Obtiene las próximas N semanas
   */
  static getNextWeeks(numberOfWeeks: number = 4): string[] {
    const now = new Date()
    const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 })
    const weekStarts: string[] = []
    
    for (let i = 0; i < numberOfWeeks; i++) {
      const weekStart = addDays(currentWeekStart, i * 7)
      weekStarts.push(this.formatToDateString(weekStart))
    }
    
    return weekStarts
  }

  /**
   * Construye la estructura del menú semanal - CORREGIDO
   */
  static buildWeekMenuStructure(weekStart: string, items: MenuItem[]): WeekMenuDisplay {
    const startDate = this.createLocalDate(weekStart)
    
    // Asegurar que sea lunes
    if (startDate.getDay() !== 1) {
      const daysToSubtract = startDate.getDay() === 0 ? 6 : startDate.getDay() - 1
      startDate.setDate(startDate.getDate() - daysToSubtract)
    }

    const endDate = addDays(startDate, 6)
    const weekLabel = this.getWeekDisplayText(
      this.formatToDateString(startDate),
      this.formatToDateString(endDate)
    )

    const days: DayMenuDisplay[] = []
    const dayNames = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']

    for (let i = 0; i < 7; i++) {
      const currentDate = addDays(startDate, i)
      const dateStr = this.formatToDateString(currentDate)
      const dayName = dayNames[i]

      const dayItems = items.filter(item => item.date === dateStr)
      const almuerzos = dayItems.filter(item => item.type === 'almuerzo')
      const colaciones = dayItems.filter(item => item.type === 'colacion')

      const hasItems = almuerzos.length > 0 || colaciones.length > 0
      const isAvailable = hasItems && this.isDayOrderingAllowed(dateStr)

      console.log(`📅 Building day ${dateStr} (${dayName}): ${almuerzos.length} almuerzos, ${colaciones.length} colaciones, hasItems: ${hasItems}, isAvailable: ${isAvailable}`)

      days.push({
        date: dateStr,
        day: dayName,
        dayLabel: this.getDayDisplayName(dateStr),
        dateFormatted: this.getFormattedDate(dateStr),
        almuerzos,
        colaciones,
        hasItems,
        isAvailable
      })
    }

    console.log(`✅ MenuService.buildWeekMenuStructure: Built ${days.length} days with ${items.length} total items`)

    return {
      weekStart: this.formatToDateString(startDate),
      weekEnd: this.formatToDateString(endDate),
      weekLabel,
      days,
      totalItems: items.length
    }
  }
}