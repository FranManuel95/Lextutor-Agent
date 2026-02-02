# Configuración de Email Templates - Supabase

Este archivo contiene las plantillas de email personalizadas para **LexTutor Agent** (Estudiante Elite) que deben configurarse desde el Dashboard de Supabase.

## Acceso a la configuración

1. Ve al Dashboard de Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Navega a: **Authentication** → **Email Templates**

---

## 1. Confirm Signup (Verificación de Email)

### Subject
```
Verifica tu cuenta en Estudiante Elite - LexTutor Agent
```

### HTML Body
```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verifica tu cuenta</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #1a1a1a; color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #1a1a1a;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; max-width: 90%; border-collapse: collapse; background-color: #2a2a2a; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%); border-radius: 8px 8px 0 0;">
                            <h1 style="margin: 0; font-size: 32px; font-weight: 700; color: #ffffff; font-style: italic;">
                                Estudiante <span style="color: #d4af37;">Elite</span>
                            </h1>
                            <p style="margin: 10px 0 0; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: rgba(255, 255, 255, 0.5);">
                                LexTutor Agent
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="margin: 0 0 20px; font-size: 24px; font-weight: 600; color: #ffffff;">
                                ¡Bienvenido a LexTutor Agent! 🎓
                            </h2>
                            <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #e0e0e0;">
                                Estamos encantados de tenerte en nuestra plataforma de estudio de derecho español. Para activar tu cuenta y comenzar a aprender, necesitamos verificar tu dirección de correo electrónico.
                            </p>
                            <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #e0e0e0;">
                                Haz clic en el botón de abajo para confirmar tu cuenta:
                            </p>
                            
                            <!-- Button -->
                            <table role="presentation" style="margin: 0 auto; border-collapse: collapse;">
                                <tr>
                                    <td style="border-radius: 6px; background-color: #d4af37; text-align: center;">
                                        <a href="{{ .ConfirmationURL }}" target="_blank" style="display: inline-block; padding: 16px 40px; font-size: 16px; font-weight: 600; color: #1a1a1a; text-decoration: none; text-transform: uppercase; letter-spacing: 1px;">
                                            Verificar mi cuenta
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Alternative Link -->
                            <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #b0b0b0; text-align: center;">
                                Si el botón no funciona, copia y pega este enlace en tu navegador:
                            </p>
                            <p style="margin: 10px 0 0; font-size: 13px; color: #808080; word-break: break-all; text-align: center;">
                                {{ .ConfirmationURL }}
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; background-color: #1a1a1a; border-radius: 0 0 8px 8px; border-top: 1px solid rgba(212, 175, 55, 0.2);">
                            <p style="margin: 0 0 10px; font-size: 13px; color: #808080; text-align: center;">
                                Este enlace expirará en 24 horas por motivos de seguridad.
                            </p>
                            <p style="margin: 0; font-size: 12px; color: #606060; text-align: center;">
                                Si no creaste una cuenta en Estudiante Elite, puedes ignorar este correo de forma segura.
                            </p>
                            <p style="margin: 20px 0 0; font-size: 11px; color: #505050; text-align: center;">
                                © {{ .SiteURL }} - Todos los derechos reservados
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
```

---

## 2. Magic Link (si usas autenticación por enlace mágico)

### Subject
```
Tu enlace de acceso a Estudiante Elite
```

### HTML Body
```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Enlace de acceso</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #1a1a1a; color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #1a1a1a;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; max-width: 90%; border-collapse: collapse; background-color: #2a2a2a; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%); border-radius: 8px 8px 0 0;">
                            <h1 style="margin: 0; font-size: 32px; font-weight: 700; color: #ffffff; font-style: italic;">
                                Estudiante <span style="color: #d4af37;">Elite</span>
                            </h1>
                            <p style="margin: 10px 0 0; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: rgba(255, 255, 255, 0.5);">
                                LexTutor Agent
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="margin: 0 0 20px; font-size: 24px; font-weight: 600; color: #ffffff;">
                                🔐 Tu enlace de acceso
                            </h2>
                            <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #e0e0e0;">
                                Has solicitado acceder a tu cuenta de LexTutor Agent. Haz clic en el botón de abajo para iniciar sesión de forma segura:
                            </p>
                            
                            <!-- Button -->
                            <table role="presentation" style="margin: 0 auto; border-collapse: collapse;">
                                <tr>
                                    <td style="border-radius: 6px; background-color: #d4af37; text-align: center;">
                                        <a href="{{ .ConfirmationURL }}" target="_blank" style="display: inline-block; padding: 16px 40px; font-size: 16px; font-weight: 600; color: #1a1a1a; text-decoration: none; text-transform: uppercase; letter-spacing: 1px;">
                                            Acceder ahora
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Alternative Link -->
                            <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #b0b0b0; text-align: center;">
                                O copia este enlace en tu navegador:
                            </p>
                            <p style="margin: 10px 0 0; font-size: 13px; color: #808080; word-break: break-all; text-align: center;">
                                {{ .ConfirmationURL }}
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; background-color: #1a1a1a; border-radius: 0 0 8px 8px; border-top: 1px solid rgba(212, 175, 55, 0.2);">
                            <p style="margin: 0 0 10px; font-size: 13px; color: #808080; text-align: center;">
                                Este enlace expirará en 1 hora por motivos de seguridad.
                            </p>
                            <p style="margin: 0; font-size: 12px; color: #606060; text-align: center;">
                                Si no solicitaste este enlace, puedes ignorar este correo de forma segura.
                            </p>
                            <p style="margin: 20px 0 0; font-size: 11px; color: #505050; text-align: center;">
                                © {{ .SiteURL }} - Todos los derechos reservados
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
```

---

## 3. Reset Password (Recuperación de contraseña)

### Subject
```
Restablece tu contraseña - Estudiante Elite
```

### HTML Body
```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Restablecer contraseña</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #1a1a1a; color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #1a1a1a;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; max-width: 90%; border-collapse: collapse; background-color: #2a2a2a; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%); border-radius: 8px 8px 0 0;">
                            <h1 style="margin: 0; font-size: 32px; font-weight: 700; color: #ffffff; font-style: italic;">
                                Estudiante <span style="color: #d4af37;">Elite</span>
                            </h1>
                            <p style="margin: 10px 0 0; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: rgba(255, 255, 255, 0.5);">
                                LexTutor Agent
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="margin: 0 0 20px; font-size: 24px; font-weight: 600; color: #ffffff;">
                                🔑 Restablece tu contraseña
                            </h2>
                            <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #e0e0e0;">
                                Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en LexTutor Agent. Haz clic en el botón de abajo para crear una nueva contraseña:
                            </p>
                            
                            <!-- Button -->
                            <table role="presentation" style="margin: 0 auto; border-collapse: collapse;">
                                <tr>
                                    <td style="border-radius: 6px; background-color: #d4af37; text-align: center;">
                                        <a href="{{ .ConfirmationURL }}" target="_blank" style="display: inline-block; padding: 16px 40px; font-size: 16px; font-weight: 600; color: #1a1a1a; text-decoration: none; text-transform: uppercase; letter-spacing: 1px;">
                                            Restablecer contraseña
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Alternative Link -->
                            <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #b0b0b0; text-align: center;">
                                Si el botón no funciona, copia y pega este enlace en tu navegador:
                            </p>
                            <p style="margin: 10px 0 0; font-size: 13px; color: #808080; word-break: break-all; text-align: center;">
                                {{ .ConfirmationURL }}
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; background-color: #1a1a1a; border-radius: 0 0 8px 8px; border-top: 1px solid rgba(212, 175, 55, 0.2);">
                            <p style="margin: 0 0 10px; font-size: 13px; color: #808080; text-align: center;">
                                Este enlace expirará en 1 hora por motivos de seguridad.
                            </p>
                            <p style="margin: 0; font-size: 12px; color: #606060; text-align: center;">
                                Si NO solicitaste este cambio, ignora este correo y tu contraseña permanecerá sin cambios.
                            </p>
                            <p style="margin: 20px 0 0; font-size: 11px; color: #505050; text-align: center;">
                                © {{ .SiteURL }} - Todos los derechos reservados
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
```

---

## Variables disponibles de Supabase

Las siguientes variables están disponibles en todas las plantillas:

- `{{ .ConfirmationURL }}` - URL de confirmación/acción
- `{{ .Token }}` - Token de confirmación (solo si necesitas construir una URL personalizada)
- `{{ .TokenHash }}` - Hash del token
- `{{ .SiteURL }}` - URL de tu sitio configurada en Supabase
- `{{ .Email }}` - Email del destinatario

---

## Instrucciones de implementación

1. **Accede al Dashboard de Supabase** en tu proyecto
2. Ve a **Authentication** → **Email Templates**
3. Selecciona cada tipo de email (Confirm signup, Magic Link, Reset password, etc.)
4. Copia el HTML correspondiente de este archivo
5. Pega en el editor de Supabase
6. Haz clic en **Save** para guardar los cambios
7. Envía un email de prueba para verificar el diseño

---

## Personalización adicional (Opcional)

### Configurar el remitente del email

En **Authentication** → **Settings** → **SMTP Settings**, puedes configurar:

- **Sender name**: `LexTutor Agent - Estudiante Elite`
- **Sender email**: Tu email personalizado (ej: `noreply@tudominio.com`)

Si no configuras SMTP personalizado, Supabase usará su servicio por defecto con el dominio `@mail.example.com`.

---

## Notas de seguridad

- ✅ Los enlaces expiran automáticamente (24h para confirmación, 1h para reset)
- ✅ Los emails usan variables seguras de Supabase (no exponemos datos sensibles)
- ✅ El diseño es responsive y funciona en todos los clientes de email
- ✅ Los colores y estilos coinciden con el branding de Estudiante Elite

---

## Testing

Después de configurar las plantillas, prueba:

1. **Registro nuevo**: Registra un usuario nuevo y verifica el email de confirmación
2. **Recuperar contraseña**: Usa "Olvidé mi contraseña" y verifica el email
3. **Revisa spam**: Asegúrate de que los emails no caigan en spam

---

**Última actualización**: 2026-02-02
