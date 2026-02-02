# Troubleshooting: Email de Verificación No Llega

## 🔍 Diagnóstico del Problema

Si no recibes el email de verificación al registrarte, puede deberse a varias razones:

### 1. **Email en carpeta de Spam/Correo no deseado** ⚠️
   - **Acción**: Revisa tu carpeta de spam/correo no deseado
   - **Por qué**: Los emails de Supabase pueden ser marcados como spam si no tienes SMTP personalizado
   - **Remitente esperado**: `noreply@mail.app.supabase.io` (por defecto)

### 2. **Verificación de Email Deshabilitada/Habilitada** 🔧
   - **Acción**: Verificar configuración en Supabase Dashboard
   - **Dónde**: Authentication → Settings → "Email Confirmation"
   - **Estado actual**: Probablemente **habilitado** (por eso no recibes sesión inmediata)

### 3. **Delay en Envío de Emails** ⏱️
   - **Acción**: Esperar 2-5 minutos
   - **Por qué**: Supabase puede tardar en enviar emails en el tier gratuito

### 4. **Email Ya Registrado** 👤
   - **Acción**: Verificar si el email ya existe
   - **Síntoma**: No muestra error pero no envía email
   - **Solución**: Usar otro email o eliminar el usuario existente

### 5. **Límite de Rate Limiting** 🚫
   - **Acción**: Esperar 1 hora
   - **Por qué**: Supabase limita emails por hora en desarrollo

---

## ✅ Soluciones Inmediatas

### Opción 1: Deshabilitar Verificación de Email (Desarrollo) 🚀 ⭐ RECOMENDADO

**Solo para desarrollo local - NO para producción**

#### Pasos:

1. Ve a **Supabase Dashboard**: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. **Authentication** → **Settings**
4. Busca la sección **"Email Confirmation"** o **"Confirm email"**
5. **DESACTIVA** la opción "Enable email confirmations"
6. Haz clic en **Save**

**Resultado**: Los usuarios podrán registrarse e iniciar sesión inmediatamente sin verificar email.

> ⚠️ **IMPORTANTE**: Reactivar en producción para seguridad.

---

### Opción 2: Verificar Usuario Manualmente desde Dashboard 🔐

Si ya te registraste y no recibiste el email:

#### Pasos:

1. Ve a **Supabase Dashboard** → **Authentication** → **Users**
2. Busca tu email en la lista de usuarios
3. Haz clic en el usuario
4. Busca el campo **"Email Confirmed At"**
5. Marca como confirmado manualmente (puede haber un botón "Confirm email")
6. Ahora podrás iniciar sesión

---

### Opción 3: Reenviar Email de Verificación 📧

#### **A) Desde el Dashboard de Supabase:**

1. **Authentication** → **Users**
2. Encuentra tu usuario en la lista
3. Haz clic en los 3 puntos verticales (⋮) al lado del usuario
4. Selecciona **"Send verification email"** o **"Resend confirmation"**
5. Revisa tu email (incluye spam)

#### **B) Programáticamente con el nuevo endpoint:**

He creado un endpoint API para reenviar el email:

**Endpoint**: `POST /api/auth/resend-verification`

**Uso con curl**:
```bash
curl -X POST http://localhost:3000/api/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{"email":"tu@email.com"}'
```

**Uso con Postman/Thunder Client**:
```json
POST http://localhost:3000/api/auth/resend-verification
Content-Type: application/json

{
  "email": "tu@email.com"
}
```

**Respuesta exitosa**:
```json
{
  "success": true,
  "message": "Email de verificación reenviado correctamente"
}
```

---

## 🔧 Verificar Configuración de Supabase

### 1. Verificar que Email Confirmation está habilitado

**Dashboard** → **Authentication** → **Settings** → Busca:

```
☑ Enable email confirmations
```

Si está **deshabilitado**, NO se enviarán emails pero podrás iniciar sesión inmediatamente.

### 2. Verificar Email Templates

**Dashboard** → **Authentication** → **Email Templates** → **Confirm signup**

Debe existir una plantilla (la que creamos o la por defecto de Supabase).

### 3. Verificar Site URL

**Dashboard** → **Authentication** → **Settings** → **Site URL**

Debe ser algo como:
- Desarrollo: `http://localhost:3000`
- Producción: `https://tudominio.com`

El email redirigirá a: `{Site URL}/auth/confirm?token=...`

---

## 🐛 Debugging Avanzado

### Ver Logs de Supabase

1. **Dashboard** → **Logs** → **Auth Logs**
2. Busca entradas relacionadas con tu email
3. Revisa si hay errores de envío de email

### Verificar el Usuario en la Base de Datos

1. **Dashboard** → **Authentication** → **Users**
2. Busca tu email
3. Verifica estos campos:
   - **Email**: debe ser tu email
   - **Email Confirmed At**: si está vacío, el email NO está confirmado
   - **Created At**: cuándo se registró

---

## 💡 Mejora Futura: UI para Reenviar Email

Puedes añadir un botón en la página de login para reenviar el email de verificación:

### Componente de ejemplo:

```tsx
'use client'

import { Button } from '@/components/ui/button'
import { useState } from 'react'

export function ResendVerificationButton({ email }: { email: string }) {
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    
    const handleResend = async () => {
        setLoading(true)
        setMessage('')
        
        try {
            const response = await fetch('/api/auth/resend-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            })
            
            const data = await response.json()
            
            if (data.success) {
                setMessage('✅ Email reenviado. Revisa tu bandeja de entrada.')
            } else {
                setMessage('❌ Error: ' + data.error)
            }
        } catch (error) {
            setMessage('❌ Error al reenviar el email')
        } finally {
            setLoading(false)
        }
    }
    
    return (
        <div className="text-center">
            <Button 
                onClick={handleResend} 
                disabled={loading}
                variant="outline"
                size="sm"
            >
                {loading ? 'Enviando...' : '📧 Reenviar email de verificación'}
            </Button>
            {message && (
                <p className="mt-2 text-sm">{message}</p>
            )}
        </div>
    )
}
```

---

## 📋 Checklist de Verificación

Usa este checklist para diagnosticar el problema:

- [ ] ¿Revisaste la carpeta de spam?
- [ ] ¿Esperaste al menos 5 minutos?
- [ ] ¿Verificaste que "Email Confirmation" está habilitado en Supabase?
- [ ] ¿El email existe en Authentication → Users?
- [ ] ¿El campo "Email Confirmed At" está vacío?
- [ ] ¿La "Site URL" está configurada correctamente?
- [ ] ¿Probaste reenviar el email desde el Dashboard?
- [ ] ¿Revisaste los logs de Auth en Supabase?

---

## 🎯 Solución Recomendada para Desarrollo

**Para desarrollo local, te recomiendo DESHABILITAR la verificación de email**:

1. Dashboard de Supabase
2. Authentication → Settings
3. Deshabilitar "Enable email confirmations"
4. Guardar

Esto te permitirá:
- ✅ Registrarte y entrar inmediatamente
- ✅ No depender de emails en desarrollo
- ✅ Probar flujos más rápidamente

**Recuerda reactivarlo en producción.**

---

## 📞 Si Nada Funciona

Si ninguna de las soluciones anteriores funciona:

1. **Elimina el usuario** desde Authentication → Users
2. **Deshabilita email confirmation** temporalmente
3. **Regístrate de nuevo**
4. **Verifica que puedes entrar**
5. **Reactiva email confirmation** cuando lo necesites

---

**Archivos Relacionados**:
- [Endpoint de reenvío](file:///d:/EstudianteElite/src/app/api/auth/resend-verification/route.ts)
- [Server Actions de Login](file:///d:/EstudianteElite/src/app/login/actions.ts)
- [Plantillas de Email](file:///d:/EstudianteElite/.admin/email-templates-supabase.md)

**Última actualización**: 2026-02-02
