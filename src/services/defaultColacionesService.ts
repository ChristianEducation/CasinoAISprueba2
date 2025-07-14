import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  orderBy,
  Timestamp
} from 'firebase/firestore'
import { db } from '@/app/lib/firebase'
import { DefaultColacionConfig, MenuOperationResult } from '@/types/adminMenu'

export class DefaultColacionesService {
  private static readonly COLLECTION_NAME = 'default_colaciones'

  // Obtener todas las colaciones predeterminadas
  static async getDefaultColaciones(): Promise<DefaultColacionConfig[]> {
    try {
      const colacionesRef = collection(db, this.COLLECTION_NAME)
      const q = query(colacionesRef, orderBy('code', 'asc'))
      const snapshot = await getDocs(q)
      
      const colaciones: DefaultColacionConfig[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        colaciones.push({
          code: data.code,
          title: data.description, // Use description as title to match interface
          description: data.description,
          price: data.price,
          active: data.active
        })
      })

      // Si no hay colaciones en la base de datos, devolver las predeterminadas
      if (colaciones.length === 0) {
        return this.getHardcodedDefaults()
      }

      return colaciones
    } catch (error) {
      console.error('Error fetching default colaciones:', error)
      // En caso de error, devolver las predeterminadas
      return this.getHardcodedDefaults()
    }
  }

  // Guardar colaciones predeterminadas
  static async saveDefaultColaciones(colaciones: DefaultColacionConfig[]): Promise<MenuOperationResult> {
    try {
      const colacionesRef = collection(db, this.COLLECTION_NAME)
      
      // Primero, eliminar todas las colaciones existentes
      const existingSnapshot = await getDocs(colacionesRef)
      const deletePromises = existingSnapshot.docs.map(doc => deleteDoc(doc.ref))
      await Promise.all(deletePromises)

      // Luego, guardar las nuevas colaciones
      const savePromises = colaciones.map(colacion => {
        const docRef = doc(colacionesRef, colacion.code)
        return setDoc(docRef, {
          ...colacion,
          updatedAt: Timestamp.now()
        })
      })

      await Promise.all(savePromises)

      return {
        success: true,
        message: `Configuración guardada exitosamente. ${colaciones.length} colaciones predeterminadas actualizadas.`
      }
    } catch (error) {
      console.error('Error saving default colaciones:', error)
      return {
        success: false,
        message: 'Error al guardar la configuración de colaciones predeterminadas.'
      }
    }
  }

  // Agregar nueva colación predeterminada
  static async addDefaultColacion(colacion: DefaultColacionConfig): Promise<MenuOperationResult> {
    try {
      // Verificar que el código no exista
      const existing = await this.getDefaultColaciones()
      if (existing.some(c => c.code === colacion.code)) {
        return {
          success: false,
          message: `Ya existe una colación con el código "${colacion.code}"`
        }
      }

      const docRef = doc(db, this.COLLECTION_NAME, colacion.code)
      await setDoc(docRef, {
        ...colacion,
        updatedAt: Timestamp.now()
      })

      return {
        success: true,
        message: `Colación "${colacion.description}" agregada exitosamente.`
      }
    } catch (error) {
      console.error('Error adding default colacion:', error)
      return {
        success: false,
        message: 'Error al agregar la colación predeterminada.'
      }
    }
  }

  // Actualizar colación predeterminada
  static async updateDefaultColacion(code: string, updates: Partial<DefaultColacionConfig>): Promise<MenuOperationResult> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, code)
      await setDoc(docRef, {
        ...updates,
        code, // Mantener el código original
        updatedAt: Timestamp.now()
      }, { merge: true })

      return {
        success: true,
        message: 'Colación actualizada exitosamente.'
      }
    } catch (error) {
      console.error('Error updating default colacion:', error)
      return {
        success: false,
        message: 'Error al actualizar la colación predeterminada.'
      }
    }
  }

  // Eliminar colación predeterminada
  static async deleteDefaultColacion(code: string): Promise<MenuOperationResult> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, code)
      await deleteDoc(docRef)

      return {
        success: true,
        message: 'Colación eliminada exitosamente.'
      }
    } catch (error) {
      console.error('Error deleting default colacion:', error)
      return {
        success: false,
        message: 'Error al eliminar la colación predeterminada.'
      }
    }
  }

  // Restablecer a valores predeterminados
  static async resetToDefaults(): Promise<MenuOperationResult> {
    try {
      const defaultColaciones = this.getHardcodedDefaults()
      return await this.saveDefaultColaciones(defaultColaciones)
    } catch (error) {
      console.error('Error resetting to defaults:', error)
      return {
        success: false,
        message: 'Error al restablecer las colaciones predeterminadas.'
      }
    }
  }

  private static getHardcodedDefaults(): DefaultColacionConfig[] {
    return [
      {
        code: 'C1',
        title: 'Yogurt con Granola + Jugo 200 cc',
        description: 'Yogurt con Granola + Jugo 200 cc',
        price: 3100,
        active: true
      },
      {
        code: 'C2',
        title: 'Yogurt con Granola + Agua Saborizada 200 cc',
        description: 'Yogurt con Granola + Agua Saborizada 200 cc',
        price: 3100,
        active: true
      },
      {
        code: 'C3',
        title: 'Miga Ave Mayo + Jugo 200 cc',
        description: 'Miga Ave Mayo + Jugo 200 cc',
        price: 2800,
        active: true
      },
      {
        code: 'C4',
        title: 'Miga Aliado (Jamón de Pavo + Queso) + Leche Semidescremada 200 cc',
        description: 'Miga Aliado (Jamón de Pavo + Queso) + Leche Semidescremada 200 cc',
        price: 2850,
        active: true
      },
      {
        code: 'C5',
        title: 'Barra Cereal Saludable + Jugo 200 cc',
        description: 'Barra Cereal Saludable + Jugo 200 cc',
        price: 1500,
        active: true
      },
      {
        code: 'C6',
        title: 'Barra Cereal Saludable + Leche Semidescremada',
        description: 'Barra Cereal Saludable + Leche Semidescremada',
        price: 1800,
        active: true
      }
    ]
  }
}
