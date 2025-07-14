"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Users,
  Plus,
  Trash2,
  GraduationCap,
  Edit3,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { getLevels, getCursosByLevel, getStudentsByLevelAndCurso, type Student } from '@/services/studentsService'

interface Child {
  id: string | number
  name: string
  curso: string
  level: string
  edad: number
  age: number
}

interface User {
  tipoUsuario: 'funcionario' | 'apoderado'
}

interface ChildrenManagerProps {
  user: User
  initialChildren: Child[]
  onChildrenChange: (children: Child[]) => void
}

export default function ChildrenManager({ user, initialChildren, onChildrenChange }: ChildrenManagerProps) {
  const { toast } = useToast()
  
  // Estado local de hijos - CORREGIDO: Inicializar correctamente
  const [children, setChildren] = useState<Child[]>([])
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  
  // Estados para los desplegables encadenados
  const [showAddChildForm, setShowAddChildForm] = useState(false)
  const [levels, setLevels] = useState<string[]>([])
  const [selectedLevel, setSelectedLevel] = useState("")
  const [cursos, setCursos] = useState<string[]>([])
  const [selectedCurso, setSelectedCurso] = useState("")
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudent, setSelectedStudent] = useState("")
  const [isLoadingData, setIsLoadingData] = useState(false)

  // Cargar niveles al montar
  useEffect(() => {
    loadLevels()
  }, [])

  // CORREGIDO: Sincronizar con initialChildren solo cuando cambian desde el padre
  useEffect(() => {
    console.log('📥 ChildrenManager: Received initialChildren:', initialChildren)
    setChildren(initialChildren || [])
    setHasUnsavedChanges(false)
  }, [initialChildren])

  const loadLevels = async () => {
    try {
      setIsLoadingData(true)
      const levelsData = await getLevels()
      setLevels(levelsData)
    } catch (error) {
      console.error('Error loading levels:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los niveles educativos.",
        variant: "destructive"
      })
    } finally {
      setIsLoadingData(false)
    }
  }

  const loadCursos = async (level: string) => {
    try {
      setIsLoadingData(true)
      const cursosData = await getCursosByLevel(level)
      setCursos(cursosData)
      setSelectedCurso("")
      setStudents([])
      setSelectedStudent("")
    } catch (error) {
      console.error('Error loading cursos:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los cursos.",
        variant: "destructive"
      })
    } finally {
      setIsLoadingData(false)
    }
  }

  const loadStudents = async (level: string, curso: string) => {
    try {
      setIsLoadingData(true)
      const studentsData = await getStudentsByLevelAndCurso(level, curso)
      setStudents(studentsData)
      setSelectedStudent("")
    } catch (error) {
      console.error('Error loading students:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los estudiantes.",
        variant: "destructive"
      })
    } finally {
      setIsLoadingData(false)
    }
  }

  const handleLevelChange = (level: string) => {
    setSelectedLevel(level)
    if (level) {
      loadCursos(level)
    } else {
      setCursos([])
      setStudents([])
      setSelectedCurso("")
      setSelectedStudent("")
    }
  }

  const handleCursoChange = (curso: string) => {
    setSelectedCurso(curso)
    if (curso && selectedLevel) {
      loadStudents(selectedLevel, curso)
    } else {
      setStudents([])
      setSelectedStudent("")
    }
  }

  const handleAddChildFromDropdowns = () => {
    if (!selectedLevel || !selectedCurso || !selectedStudent) {
      toast({
        title: "Selección incompleta",
        description: "Debes seleccionar nivel, curso y estudiante.",
        variant: "destructive"
      })
      return
    }

    const student = students.find(s => s.id === selectedStudent)
    if (!student) {
      toast({
        title: "Error",
        description: "No se encontró el estudiante seleccionado.",
        variant: "destructive"
      })
      return
    }

    // Verificar si el estudiante ya está agregado
    const existingChild = children.find(child => 
      child.name.toLowerCase() === student.name.toLowerCase() && 
      child.curso === student.curso
    )
    
    if (existingChild) {
      toast({
        title: "Estudiante duplicado",
        description: `${student.name} ya está agregado en tu lista.`,
        variant: "destructive"
      })
      return
    }

    // Crear nuevo hijo con ID único
    const newChild: Child = {
      id: `child_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: student.name,
      curso: student.curso,
      level: student.level,
      edad: student.edad ?? student.age,
      age: student.age ?? student.edad
    }

    // Actualizar estado local
    const updatedChildren = [...children, newChild]
    setChildren(updatedChildren)
    setHasUnsavedChanges(true)

    console.log('➕ Child added locally:', newChild)
    console.log('📋 Updated children list:', updatedChildren)

    // CORREGIDO: Notificar al componente padre inmediatamente
    onChildrenChange(updatedChildren)

    toast({
      title: "Hijo agregado",
      description: `${student.name} ha sido agregado. Recuerda guardar los cambios.`,
      variant: "default"
    })

    // Limpiar formulario
    handleCancelAddChild()
  }

  const handleShowAddChildForm = () => {
    setShowAddChildForm(true)
  }

  const handleCancelAddChild = () => {
    setShowAddChildForm(false)
    setSelectedLevel("")
    setSelectedCurso("")
    setSelectedStudent("")
    setCursos([])
    setStudents([])
  }

  const handleRemoveChild = (childId: string | number) => {
    const childToRemove = children.find(child => child.id === childId)
    
    if (!childToRemove) {
      toast({
        title: "Error",
        description: "No se encontró el hijo a eliminar.",
        variant: "destructive"
      })
      return
    }

    const updatedChildren = children.filter(child => child.id !== childId)
    setChildren(updatedChildren)
    setHasUnsavedChanges(true)

    console.log('➖ Child removed locally:', childToRemove)
    console.log('📋 Updated children list:', updatedChildren)
    
    // CORREGIDO: Notificar al componente padre inmediatamente
    onChildrenChange(updatedChildren)
    
    toast({
      title: "Hijo eliminado",
      description: `${childToRemove.name} ha sido eliminado. Recuerda guardar los cambios.`,
      variant: "default"
    })
  }

  // Función para obtener color del badge según el nivel
  const getLevelBadgeColor = (level: string) => {
    if (!level) return "bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300"
    
    if (level.toLowerCase().includes('high') || level.toLowerCase().includes('upper')) {
      return "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
    }
    if (level.toLowerCase().includes('middle')) {
      return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
    }
    if (level.toLowerCase().includes('lower') || level.toLowerCase().includes('basic') || level.toLowerCase().includes('kinder')) {
      return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
    }
    return "bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300"
  }

  // Función para obtener color del avatar según el nivel
  const getLevelAvatarColor = (level: string) => {
    if (!level) return "bg-slate-100 dark:bg-slate-900/30"
    
    if (level.toLowerCase().includes('high') || level.toLowerCase().includes('upper')) {
      return "bg-purple-100 dark:bg-purple-900/30"
    }
    if (level.toLowerCase().includes('middle')) {
      return "bg-blue-100 dark:bg-blue-900/30"
    }
    if (level.toLowerCase().includes('lower') || level.toLowerCase().includes('basic') || level.toLowerCase().includes('kinder')) {
      return "bg-green-100 dark:bg-green-900/30"
    }
    return "bg-slate-100 dark:bg-slate-900/30"
  }

  return (
    <Card className="panel-card">
      <CardHeader className="panel-card-header">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>
              {user.tipoUsuario === 'apoderado' 
                ? 'Mis hijos registrados' 
                : 'Mis hijos registrados (opcional)'
              }
            </span>
            <Edit3 className="w-4 h-4 text-slate-400" />
            {hasUnsavedChanges && (
              <div className="flex items-center space-x-1 text-amber-600 dark:text-amber-400">
                <AlertCircle className="w-4 h-4" />
                <span className="text-xs font-medium">Cambios sin guardar</span>
              </div>
            )}
          </CardTitle>
          {!showAddChildForm && (
            <Button
              onClick={handleShowAddChildForm}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
              disabled={isLoadingData}
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar hijo
            </Button>
          )}
        </div>
        {user.tipoUsuario === 'funcionario' && (
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            Como funcionario, puedes agregar información de tus hijos para gestionar también sus menús además del tuyo.
          </p>
        )}
        {hasUnsavedChanges && (
          <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              ⚠️ Tienes cambios sin guardar. Usa el botón "Guardar cambios" en la parte inferior para confirmar los cambios.
            </p>
          </div>
        )}
      </CardHeader>
      <CardContent className="panel-card-content">
        {/* Formulario de agregar hijo con desplegables */}
        {showAddChildForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-4 border border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50/50 dark:bg-blue-900/20"
          >
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Seleccionar estudiante para agregar como hijo
            </h4>
            
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                {/* Nivel educativo */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Nivel educativo
                  </label>
                  <select
                    value={selectedLevel}
                    onChange={(e) => handleLevelChange(e.target.value)}
                    disabled={isLoadingData}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-sm disabled:opacity-50"
                  >
                    <option value="">Seleccionar nivel</option>
                    {levels.map((level) => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>

                {/* Curso */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Curso
                  </label>
                  <select
                    value={selectedCurso}
                    onChange={(e) => handleCursoChange(e.target.value)}
                    disabled={isLoadingData || !selectedLevel}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 disabled:opacity-50 text-sm"
                  >
                    <option value="">Seleccionar curso</option>
                    {cursos.map((curso) => (
                      <option key={curso} value={curso}>{curso}</option>
                    ))}
                  </select>
                </div>

                {/* Estudiante */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Estudiante
                  </label>
                  <select
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    disabled={isLoadingData || !selectedCurso}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 disabled:opacity-50 text-sm"
                  >
                    <option value="">Seleccionar estudiante</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>{student.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Información del estudiante seleccionado */}
              {selectedStudent && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="p-3 bg-green-50/50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
                >
                  {(() => {
                    const student = students.find(s => s.id === selectedStudent)
                    return student ? (
                      <div className="text-sm">
                        <div className="flex items-center space-x-2 mb-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <p className="font-medium text-green-800 dark:text-green-200">
                            {student.name}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-green-600 dark:text-green-300">
                          <p><span className="font-medium">Curso:</span> {student.curso}</p>
                          <p><span className="font-medium">Nivel:</span> {student.level}</p>
                          <p><span className="font-medium">Edad:</span> {student.edad} años</p>
                          {student.rut && (
                            <p><span className="font-medium">RUT:</span> {student.rut}</p>
                          )}
                        </div>
                      </div>
                    ) : null
                  })()}
                </motion.div>
              )}

              {/* Indicador de carga */}
              {isLoadingData && (
                <div className="flex items-center justify-center p-3">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                  <span className="text-sm text-blue-600 dark:text-blue-400">Cargando datos...</span>
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex justify-end space-x-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCancelAddChild}
                  disabled={isLoadingData}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddChildFromDropdowns}
                  disabled={isLoadingData || !selectedStudent}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar hijo
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {children.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
              {user.tipoUsuario === 'apoderado' 
                ? 'No tienes hijos registrados' 
                : 'No tienes hijos registrados'
              }
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">
              {user.tipoUsuario === 'apoderado'
                ? 'Agrega la información de tus hijos para gestionar sus pedidos'
                : 'Agrega la información de tus hijos para gestionar sus pedidos además del tuyo'
              }
            </p>
            {!showAddChildForm && (
              <Button
                onClick={handleShowAddChildForm}
                className="bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
                disabled={isLoadingData}
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar primer hijo
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {children.map((child) => (
              <motion.div
                key={child.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="relative border border-slate-200 dark:border-slate-700 rounded-xl p-6 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-800/50 shadow-sm hover:shadow-md transition-all duration-200"
              >
                {/* Header del hijo */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 ${getLevelAvatarColor(child.level)} rounded-full flex items-center justify-center`}>
                      <GraduationCap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                        {child.name}
                      </h4>
                      {child.level && (
                        <Badge variant="outline" className={`text-xs mt-1 ${getLevelBadgeColor(child.level)}`}>
                          {child.level}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => handleRemoveChild(child.id)}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* Información del hijo - Solo lectura */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Curso */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Curso
                      </label>
                      <div className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400">
                        {child.curso}
                      </div>
                    </div>

                    {/* Nivel educativo */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Nivel educativo
                      </label>
                      <div className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400">
                        {child.level}
                      </div>
                    </div>

                    {/* Edad */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Edad
                      </label>
                      <div className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400">
                        {child.edad || child.age} años
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            
            {/* Botón para agregar más hijos */}
            {!showAddChildForm && (
              <motion.button
                type="button"
                onClick={handleShowAddChildForm}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isLoadingData}
                className="w-full p-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-slate-600 dark:text-slate-400 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all duration-300 text-sm font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-5 h-5" />
                <span>Agregar otro hijo</span>
              </motion.button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
