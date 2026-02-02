# Troubleshooting: Email de Verificación No Llega

## 🔍 Diagnóstico del Problema

Si no recibes el email de verificación al registrarte, puede deberse a varias razones:

### 1. ** Email en carpeta de Spam / Correo no deseado ** ⚠️
   - ** Acción **: Revisa tu carpeta de spam / correo no deseado
    - ** Por qué **: Los emails de Supabase pueden ser marcados como spam si no tienes SMTP personalizado
        - ** Remitente esperado **: `noreply@mail.app.supabase.io`(por defecto)

### 2. ** Verificación de Email Deshabilitada ** 🔧
   - ** Acción **: Verificar configuración en Supabase Dashboard
    - ** Dónde **: Authentication → Settings → "Email Confirmation"
        - ** Estado actual **: Probablemente ** habilitado ** (por eso no recibes sesión inmediata)

### 3. ** Delay en Envío de Emails ** ⏱️
   - ** Acción **: Esperar 2 - 5 minutos
    - ** Por qué **: Supabase puede tardar en enviar emails en el tier gratuito

### 4. ** Email Ya Registrado ** 👤
   - ** Acción **: Verificar si el email ya existe
    - ** Síntoma **: No muestra error pero no envía email
        - ** Solución **: Usar otro email o eliminar el usuario existente

### 5. ** Límite de Rate Limiting ** 🚫
   - ** Acción **: Esperar 1 hora
    - ** Por qué **: Supabase limita emails por hora en desarrollo

---

## ✅ Soluciones Inmediatas

### Opción 1: Deshabilitar Verificación de Email(Desarrollo) 🚀

** Solo para desarrollo local - NO para producción **

    1. Ve a ** Supabase Dashboard **: https://supabase.com/dashboard
2. Selecciona tu proyecto → ** Authentication ** → ** Settings **
    3. Busca ** "Email Confirmation" **
        4. ** DESACTIVA ** la opción "Enable email confirmations"
5. Guarda los cambios

    ** Resultado **: Los usuarios podrán registrarse e iniciar sesión inmediatamente sin verificar email.

> ⚠️ ** IMPORTANTE **: Reactivar en producción para seguridad.

---

### Opción 2: Verificar Usuario Manualmente desde Dashboard 🔐

1. Ve a ** Supabase Dashboard ** → ** Authentication ** → ** Users **
    2. Busca tu email en la lista de usuarios
3. Haz clic en el usuario
4. En "Email Confirmed At", marca como confirmado manualmente
5. Ahora podrás iniciar sesión

---

### Opción 3: Reenviar Email de Verificación 📧

#### Desde el Dashboard de Supabase:
1. ** Authentication ** → ** Users **
    2. Encuentra tu usuario
3. Haz clic en los 3 puntos(⋮)
4. Selecciona "Send verification email"

#### Programáticamente(añadir endpoint):

<function_calls>
    <invoke name="write_to_file" >
        <parameter name="CodeContent" >import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const { email } = await request.json()

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            )
        }

        const supabase = createClient()

        // Resend verification email
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email: email,
        })

        if (error) {
            console.error('Error resending verification email:', error)
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            message: 'Email de verificación reenviado correctamente'
        })
    } catch (error) {
        console.error('Unexpected error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
