"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import { auth, db } from "@/app/lib/firebase"
import { SchoolLevel } from "@/lib/courseUtils"
import { GraduationCap, Plus, Trash2, MapPin } from "lucide-react"
import { getLevels, getCursosByLevel, getStudentsByLevelAndCurso, type StudentRecord } from "@/services/studentsService"
import { DondeRetiraOption, CURSOS_PRESCHOOL, CursoPreschool } from "@/types/user"

// Configuración de opciones "donde retira"
const DONDE_RETIRA_OPTIONS = [
  {
    value: 'casino_basica' as DondeRetiraOption,
    label: 'Casino Básica',
    description: 'Retiro en casino de enseñanza básica'
  },
  {
    value: 'casino_media' as DondeRetiraOption,
    label: 'Casino Media',
    description: 'Retiro en casino de enseñanza media'
  },
  {
    value: 'preschool' as DondeRetiraOption,
    label: 'Preschool',
    description: 'Retiro en área de preescolar'
  }
]

// Interfaz actualizada para incluir todos los campos que luego va a persistir
interface ChildData {
  id: number
  name: string
  age: string
  class: string
  level: SchoolLevel
  rut: string
  edad?: number
  active?: boolean
}

export default function RegistroPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    userType: "" as "funcionario" | "apoderado" | "",
    // Nuevos campos para funcionarios
    dondeRetira: "" as DondeRetiraOption | "",
    cursoPreschool: "" as CursoPreschool | ""
  })
  
  const [children, setChildren] = useState<ChildData[]>([
    {
      id: 1,
      name: "",
      age: "",
      class: "",
      level: "Lower School",
      rut: ""
    }
  ])

  // Estados para los desplegables encadenados - Actualizado para usar StudentRecord[]
  const [levels, setLevels] = useState<string[]>([])
  const [selectedLevel, setSelectedLevel] = useState("")
  const [cursos, setCursos] = useState<string[]>([])
  const [selectedCurso, setSelectedCurso] = useState("")
  const [students, setStudents] = useState<StudentRecord[]>([])
  const [selectedStudent, setSelectedStudent] = useState("")

  useEffect(() => {
    setMounted(true)
    // Cargar niveles al montar el componente
    loadLevels()
  }, [])

  const loadLevels = async () => {
    try {
      const levelsData = await getLevels()
      setLevels(levelsData)
    } catch (error) {
      console.error('Error loading levels:', error)
    }
  }

  const loadCursos = async (level: string) => {
    try {
      const cursosData = await getCursosByLevel(level)
      setCursos(cursosData)
      setSelectedCurso("")
      setStudents([])
      setSelectedStudent("")
    } catch (error) {
      console.error('Error loading cursos:', error)
    }
  }

  const loadStudents = async (level: string, curso: string) => {
    try {
      const studentsData = await getStudentsByLevelAndCurso(level, curso)
      setStudents(studentsData)
      setSelectedStudent("")
    } catch (error) {
      console.error('Error loading students:', error)
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

  // Función addChild actualizada para arrastrar todos los campos del estudiante seleccionado
  const addChild = () => {
    if (!selectedLevel || !selectedCurso || !selectedStudent) return
    const student = students.find(s => s.id === selectedStudent)
    if (!student) return

    // Verificar si el estudiante ya está agregado
    const existingChild = children.find(child => child.name === student.name && child.class === student.curso)
    if (existingChild) {
      setError("Este estudiante ya ha sido agregado")
      return
    }

    // Usamos directamente todos los campos del registro Firestore:
    const newChild: ChildData = {
      id: children.length > 0 ? Math.max(...children.map(c => c.id)) + 1 : 1,
      name: student.name,
      age: student.age.toString(),
      edad: student.edad,
      class: student.curso,
      level: student.level as SchoolLevel,
      rut: student.rut ?? "",
      active: student.active,
    }
    setChildren([...children, newChild])

    // Limpiar selects
    setSelectedLevel("")
    setSelectedCurso("")
    setSelectedStudent("")
    setCursos([])
    setStudents([])
    
    // Limpiar error si existía
    if (error) setError("")
  }

  if (!mounted) {
    return null
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    // Limpiar error cuando el usuario empiece a escribir
    if (error) setError("")
  }

  const handleUserTypeChange = (value: string) => {
    setFormData({
      ...formData,
      userType: value as "funcionario" | "apoderado",
      // Limpiar campos específicos de funcionario si cambia a apoderado
      dondeRetira: value === "funcionario" ? formData.dondeRetira : "",
      cursoPreschool: value === "funcionario" ? formData.cursoPreschool : ""
    })
    // Limpiar error cuando el usuario seleccione un tipo
    if (error) setError("")
  }

  const handleDondeRetiraChange = (value: string) => {
    setFormData({
      ...formData,
      dondeRetira: value as DondeRetiraOption,
      // Limpiar curso preschool si no es preschool
      cursoPreschool: value === "preschool" ? formData.cursoPreschool : ""
    })
  }

  const removeChild = (id: number) => {
    if (children.length > 1) {
      setChildren(children.filter(child => child.id !== id))
    }
  }

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      setError("El nombre es requerido")
      return false
    }
    if (!formData.lastName.trim()) {
      setError("El apellido es requerido")
      return false
    }
    if (!formData.email.trim()) {
      setError("El correo electrónico es requerido")
      return false
    }
    
    // Validación de email más robusta
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError("Por favor ingresa un correo electrónico válido")
      return false
    }
    
    if (formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden")
      return false
    }

    // Validar que se haya seleccionado un tipo de usuario
    if (!formData.userType) {
      setError("Debes seleccionar un tipo de usuario")
      return false
    }

    // Validaciones específicas para funcionarios
    if (formData.userType === "funcionario") {
      if (!formData.dondeRetira) {
        setError("Los funcionarios deben seleccionar dónde retiran")
        return false
      }
      
      if (formData.dondeRetira === "preschool" && !formData.cursoPreschool) {
        setError("Debes seleccionar un curso para retiro en preschool")
        return false
      }
    }

    // Validar datos de hijos si se han agregado (tanto para apoderados como funcionarios)
    const validChildren = children.filter(child => child.name.trim() !== "")
    
    // Para apoderados, al menos un hijo es obligatorio
    if (formData.userType === "apoderado" && validChildren.length === 0) {
      setError("Los apoderados deben agregar al menos un hijo")
      return false
    }
    
    // Para funcionarios, los hijos son opcionales, pero si se agregan deben ser válidos
    if (validChildren.length > 0) {
      for (const child of validChildren) {
        if (!child.name.trim()) {
          setError("El nombre del hijo es requerido")
          return false
        }
        if (!child.age || parseInt(child.age) < 3 || parseInt(child.age) > 18) {
          setError("La edad del hijo debe estar entre 3 y 18 años")
          return false
        }
        if (!child.class.trim()) {
          setError("El curso del hijo es requerido")
          return false
        }
        if (!child.level) {
          setError("El nivel educativo del hijo es requerido")
          return false
        }
        
        // Validar RUT si se proporciona
        if (child.rut && child.rut.trim()) {
          const rutRegex = /^[0-9]+-[0-9kK]$/
          if (!rutRegex.test(child.rut.trim())) {
            setError("El formato del RUT debe ser: 12345678-9")
            return false
          }
        }
      }
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setError("")

    try {
      // Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email.trim(), 
        formData.password
      )
      const user = userCredential.user

      // Actualizar el perfil del usuario con el nombre
      await updateProfile(user, {
        displayName: `${formData.firstName.trim()} ${formData.lastName.trim()}`
      })

      // Preparar datos de los hijos - Simplificado para usar los campos arrastrados
      const validChildren = children
        .filter(child => child.name.trim() !== "")
        .map(child => ({
          ...child,
          age: parseInt(child.age),
          edad: parseInt(child.age),
        }))

      // Preparar datos del usuario
      const userData: Record<string, unknown> = {
        id: user.uid,
        email: formData.email.trim().toLowerCase(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        userType: formData.userType,
        tipoUsuario: formData.userType,
        children: validChildren,
        isActive: true,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        phone: null
      }

      // Agregar campos específicos de funcionarios
      if (formData.userType === "funcionario") {
        userData.dondeRetira = formData.dondeRetira
        if (formData.dondeRetira === "preschool" && formData.cursoPreschool) {
          userData.cursoPreschool = formData.cursoPreschool
        }
      }

      // Filtrar cualquier valor undefined antes de guardar
      const cleanUserData = Object.fromEntries(
        Object.entries(userData).filter(([, value]) => value !== undefined)
      )

      await setDoc(doc(db, 'users', user.uid), cleanUserData)

      // Registro exitoso, redirigir al panel
      router.push('/panel')
      
    } catch (error: unknown) {
      console.error('Error al registrar usuario:', error)
      
      // Manejar diferentes tipos de errores de Firebase
      const firebaseError = error as { code?: string }
      switch (firebaseError.code) {
        case 'auth/email-already-in-use':
          setError('Ya existe una cuenta con este correo electrónico.')
          break
        case 'auth/invalid-email':
          setError('Correo electrónico inválido.')
          break
        case 'auth/operation-not-allowed':
          setError('Registro no permitido. Contacta al administrador.')
          break
        case 'auth/weak-password':
          setError('La contraseña es muy débil. Debe tener al menos 6 caracteres.')
          break
        case 'auth/network-request-failed':
          setError('Error de conexión. Verifica tu conexión a internet.')
          break
        case 'auth/too-many-requests':
          setError('Demasiados intentos. Intenta más tarde.')
          break
        default:
          setError('Error al crear la cuenta. Intenta nuevamente.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0">
        {/* Soft geometric shapes */}
        <motion.div
          className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-emerald-100/30 to-teal-100/30 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        <motion.div
          className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-br from-blue-100/30 to-indigo-100/30 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.15, 0.35, 0.15],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />

        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-5 dark:opacity-10">
          <div 
            className="w-full h-full"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-4">
        
        {/* Auth Form Container */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-lg"
        >
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/20 dark:border-slate-700/50">
            
            {/* Header - Más compacto */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center mb-6"
            >
              <h1 className="text-2xl font-light text-slate-800 dark:text-slate-100 mb-1 text-elegant">
                Únete a nosotros
              </h1>
              <p className="text-slate-600 dark:text-slate-300 text-clean text-sm">
                Crea tu cuenta en Delicias Food Service
              </p>
              
              {/* Elegant separator */}
              <motion.div
                className="flex items-center justify-center mt-3"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <div className="w-6 h-px bg-slate-300 dark:bg-slate-600" />
                <div className="mx-3 w-1.5 h-1.5 bg-emerald-400 dark:bg-emerald-500 rounded-full" />
                <div className="w-6 h-px bg-slate-300 dark:bg-slate-600" />
              </motion.div>
            </motion.div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
              >
                <p className="text-sm text-red-600 dark:text-red-400 text-clean">{error}</p>
              </motion.div>
            )}

            {/* Registration Form */}
            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="space-y-4"
            >
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-3">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                >
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Nombre *
                  </label>
                  <Input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="Tu nombre"
                    required
                    disabled={isLoading}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                >
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Apellido *
                  </label>
                  <Input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Tu apellido"
                    required
                    disabled={isLoading}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300"
                  />
                </motion.div>
              </div>

              {/* Email Field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
              >
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Correo Electrónico *
                </label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="tu@email.com"
                  required
                  disabled={isLoading}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300"
                />
              </motion.div>

              {/* User Type Selection */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.85 }}
                className="space-y-2"
              >
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Tipo de Usuario *
                </label>
                <RadioGroup
                  value={formData.userType}
                  onValueChange={handleUserTypeChange}
                  disabled={isLoading}
                  className="space-y-2"
                >
                  <motion.div
                    whileHover={!isLoading ? { scale: 1.01 } : {}}
                    className={`flex items-start space-x-3 p-3 rounded-lg border-2 transition-all duration-300 ${
                      formData.userType === "apoderado" 
                        ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20" 
                        : "border-slate-200 dark:border-slate-600 bg-white/60 dark:bg-slate-700/60 hover:border-emerald-300 dark:hover:border-emerald-600"
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <RadioGroupItem value="apoderado" id="apoderado" className="mt-0.5" />
                    <div className="flex-1">
                      <label 
                        htmlFor="apoderado" 
                        className={`text-sm font-medium text-slate-800 dark:text-slate-200 cursor-pointer ${isLoading ? 'cursor-not-allowed' : ''}`}
                      >
                        Apoderado
                      </label>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        Padre, madre o tutor. Gestiona menús de tus hijos.
                      </p>
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={!isLoading ? { scale: 1.01 } : {}}
                    className={`flex items-start space-x-3 p-3 rounded-lg border-2 transition-all duration-300 ${
                      formData.userType === "funcionario" 
                        ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20" 
                        : "border-slate-200 dark:border-slate-600 bg-white/60 dark:bg-slate-700/60 hover:border-emerald-300 dark:hover:border-emerald-600"
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <RadioGroupItem value="funcionario" id="funcionario" className="mt-0.5" />
                    <div className="flex-1">
                      <label 
                        htmlFor="funcionario" 
                        className={`text-sm font-medium text-slate-800 dark:text-slate-200 cursor-pointer ${isLoading ? 'cursor-not-allowed' : ''}`}
                      >
                        Funcionario
                      </label>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        Trabajador del colegio. Gestiona tu menú y el de tus hijos.
                      </p>
                    </div>
                  </motion.div>
                </RadioGroup>
              </motion.div>

              {/* Campos específicos para funcionarios */}
              {formData.userType === "funcionario" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-3 border-t border-slate-200 dark:border-slate-600 pt-3"
                >
                  <div className="flex items-center space-x-2 mb-3">
                    <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-base font-medium text-slate-800 dark:text-slate-200 text-clean">
                      Información de retiro *
                    </h3>
                  </div>

                  {/* Donde retira */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      ¿Dónde retiras tu menú? *
                    </label>
                    <select
                      value={formData.dondeRetira}
                      onChange={(e) => handleDondeRetiraChange(e.target.value)}
                      disabled={isLoading}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300"
                    >
                      <option value="">Seleccionar lugar de retiro</option>
                      {DONDE_RETIRA_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {formData.dondeRetira && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        {DONDE_RETIRA_OPTIONS.find(opt => opt.value === formData.dondeRetira)?.description}
                      </p>
                    )}
                  </div>

                  {/* Curso preschool (solo si selecciona preschool) */}
                  {formData.dondeRetira === "preschool" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Curso en Preschool *
                      </label>
                      <select
                        value={formData.cursoPreschool}
                        onChange={(e) => setFormData({...formData, cursoPreschool: e.target.value as CursoPreschool})}
                        disabled={isLoading}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300"
                      >
                        <option value="">Seleccionar curso</option>
                        {CURSOS_PRESCHOOL.map((curso) => (
                          <option key={curso} value={curso}>
                            {curso}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        Selecciona el curso correspondiente para el retiro en preschool
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* Password Fields */}
              <div className="grid grid-cols-2 gap-3">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.9 }}
                >
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Contraseña *
                  </label>
                  <Input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Mín. 6 caracteres"
                    required
                    disabled={isLoading}
                    minLength={6}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 1 }}
                >
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Confirmar *
                  </label>
                  <Input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Repite contraseña"
                    required
                    disabled={isLoading}
                    minLength={6}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300"
                  />
                </motion.div>
              </div>

              {/* Children Section - Desplegables encadenados mejorados */}
              {formData.userType && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-3"
                >
                  <div className="border-t border-slate-200 dark:border-slate-600 pt-3">
                    <div className="flex items-center space-x-2 mb-3">
                      <GraduationCap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <h3 className="text-base font-medium text-slate-800 dark:text-slate-200 text-clean">
                        {formData.userType === "apoderado" 
                          ? "Información de tus hijos *" 
                          : "Información de tus hijos (opcional)"
                        }
                      </h3>
                    </div>
                    
                    {formData.userType === "funcionario" && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                        Como funcionario, puedes agregar información de tus hijos para gestionar también sus menús.
                      </p>
                    )}
                    
                    {/* Desplegables encadenados mejorados */}
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
                            disabled={isLoading}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300"
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
                            disabled={isLoading || !selectedLevel}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300 disabled:opacity-50"
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
                            disabled={isLoading || !selectedCurso}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300 disabled:opacity-50"
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
                          className="p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                        >
                          {(() => {
                            const student = students.find(s => s.id === selectedStudent)
                            return student ? (
                              <div className="text-sm">
                                <p className="font-medium text-blue-800 dark:text-blue-200">
                                  {student.name}
                                </p>
                                <p className="text-blue-600 dark:text-blue-300">
                                  {student.curso} - {student.level}
                                </p>
                                <p className="text-blue-600 dark:text-blue-300">
                                  Edad: {student.edad} años
                                </p>
                                {student.rut && (
                                  <p className="text-blue-600 dark:text-blue-300">
                                    RUT: {student.rut}
                                  </p>
                                )}
                              </div>
                            ) : null
                          })()}
                        </motion.div>
                      )}

                      {/* Botón Agregar hijo */}
                      <motion.button
                        type="button"
                        onClick={addChild}
                        whileHover={!isLoading && selectedStudent ? { y: -1 } : {}}
                        whileTap={!isLoading && selectedStudent ? { scale: 0.98 } : {}}
                        disabled={isLoading || !selectedStudent}
                        className="w-full p-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 text-white rounded-lg transition-all duration-300 text-sm font-medium text-clean disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Agregar hijo</span>
                      </motion.button>

                      {/* Lista de hijos agregados */}
                      {children.filter(child => child.name.trim() !== "").length > 0 && (
                        <div className="mt-4 p-3 bg-white/60 dark:bg-slate-700/60 rounded-lg border border-slate-200 dark:border-slate-600">
                          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Hijos agregados:
                          </h4>
                          <ul className="space-y-2">
                            {children.filter(child => child.name.trim() !== "").map((child) => (
                              <li key={child.id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded-md">
                                <div className="text-sm">
                                  <p className="font-medium text-slate-800 dark:text-slate-200">
                                    {child.name}
                                  </p>
                                  <p className="text-slate-600 dark:text-slate-400">
                                    {child.class} - {child.level}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeChild(child.id)}
                                  disabled={isLoading}
                                  className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Submit Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.2 }}
                className="pt-3"
              >
                <motion.div
                  whileHover={!isLoading ? { y: -2 } : {}}
                  whileTap={!isLoading ? { scale: 0.98 } : {}}
                >
                  <Button
                                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold py-2.5 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Creando cuenta...</span>
                      </div>
                    ) : (
                      <>
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100"
                          animate={{ x: ["-100%", "100%"] }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            repeatDelay: 3
                          }}
                        />
                        <span className="relative z-10">Crear Cuenta</span>
                      </>
                    )}
                  </Button>
                </motion.div>
              </motion.div>
            </motion.form>

            {/* Separator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.3 }}
              className="flex items-center my-4"
            >
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-600"></div>
              <span className="px-3 text-sm text-slate-500 dark:text-slate-400 text-clean">o</span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-600"></div>
            </motion.div>

            {/* Login Link */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.4 }}
              className="text-center"
            >
              <p className="text-sm text-slate-600 dark:text-slate-300 text-clean">
                ¿Ya tienes una cuenta?{" "}
                <Link 
                  href="/auth/login" 
                  className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors duration-300 font-medium"
                >
                  Iniciar sesión
                </Link>
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* Back to Home Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.5 }}
          className="mt-8"
        >
          <Link href="/">
            <motion.button
              whileHover={{ y: -1, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors duration-300 font-medium"
            >
              ← Volver al inicio
            </motion.button>
          </Link>
        </motion.div>

        {/* Bottom accent - Más separado */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.7 }}
        >
          <motion.div
            className="flex items-center space-x-2 text-slate-400 dark:text-slate-500 text-sm"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="w-1 h-1 bg-slate-400 dark:bg-slate-500 rounded-full" />
            <span className="text-clean">Sistema de gestión alimentaria</span>
            <div className="w-1 h-1 bg-slate-400 dark:bg-slate-500 rounded-full" />
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

