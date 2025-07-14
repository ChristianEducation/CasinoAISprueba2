// Este archivo contiene las reglas de seguridad recomendadas para Firestore
// Copiar y pegar en la consola de Firebase -> Firestore -> Rules

const firestoreRules = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Reglas para la colección de menús
    match /menus/{menuId} {
      // Lectura: permitir a usuarios autenticados leer menús publicados
      allow read: if request.auth != null && 
                     (resource.data.published == true || 
                      request.auth.token.admin == true);
      
      // Escritura: solo administradores
      allow write: if request.auth != null && 
                      request.auth.token.admin == true;
    }
    
    // Reglas para la colección de pedidos
    match /orders/{orderId} {
      // Lectura: solo el propietario del pedido o administradores
      allow read: if request.auth != null && 
                     (resource.data.userId == request.auth.uid || 
                      request.auth.token.admin == true);
      
      // Creación: solo usuarios autenticados para sus propios pedidos
      allow create: if request.auth != null && 
                       request.auth.uid == request.resource.data.userId &&
                       validateOrderData(request.resource.data);
      
      // Actualización: solo el propietario o administradores
      allow update: if request.auth != null && 
                       (resource.data.userId == request.auth.uid || 
                        request.auth.token.admin == true) &&
                       validateOrderUpdate(request.resource.data, resource.data);
      
      // Eliminación: solo administradores
      allow delete: if request.auth != null && 
                       request.auth.token.admin == true;
    }
    
    // Reglas para la colección de usuarios
    match /users/{userId} {
      // Lectura: solo el propio usuario o administradores
      allow read: if request.auth != null && 
                     (request.auth.uid == userId || 
                      request.auth.token.admin == true);
      
      // Escritura: solo el propio usuario o administradores
      allow write: if request.auth != null && 
                      (request.auth.uid == userId || 
                       request.auth.token.admin == true);
    }
    
    // Reglas para la colección de pagos (solo lectura para auditoría)
    match /payments/{paymentId} {
      allow read: if request.auth != null && 
                     request.auth.token.admin == true;
      allow write: if request.auth != null && 
                      request.auth.token.admin == true;
    }
    
    // Funciones de validación
    function validateOrderData(data) {
      return data.keys().hasAll(['userId', 'tipoUsuario', 'weekStart', 'resumenPedido', 'total', 'status']) &&
             data.userId is string &&
             data.tipoUsuario in ['apoderado', 'funcionario'] &&
             data.weekStart is string &&
             data.resumenPedido is list &&
             data.total is number &&
             data.status in ['pendiente', 'pagado', 'cancelado', 'procesando_pago'];
    }
    
    function validateOrderUpdate(newData, oldData) {
      // Permitir actualización de estado y datos de pago
      return newData.userId == oldData.userId &&
             newData.weekStart == oldData.weekStart;
    }
  }
}
`;

console.log('Reglas de Firestore para copiar en la consola de Firebase:');
console.log(firestoreRules);

export { firestoreRules };
