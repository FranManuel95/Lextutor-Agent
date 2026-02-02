// Initialize Resend dynamically to avoid crashes if env var is missing
import { Resend } from 'resend';

export async function sendVerificationEmail(email: string, link: string, name: string) {
    // 1. Always log the link in Development (The "Tool" to corroborate)
    if (process.env.NODE_ENV === 'development') {
        console.log('\n================================================================');
        console.log('🔗 [DEV MODE] VERIFICATION LINK GENERATED:');
        console.log(link);
        console.log('================================================================\n');
    }

    const apiKey = process.env.RESEND_API_KEY;

    // 2. If no API Key, return success in Dev (Simulated mode)
    if (!apiKey) {
        if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ RESEND_API_KEY missing. Email simulated.');
            return { success: true, data: { id: 'simulated_dev' } };
        }
        console.error('RESEND_API_KEY is missing');
        return { success: false, error: 'Configuration error: RESEND_API_KEY missing' };
    }

    const resend = new Resend(apiKey);

    try {
        const { data, error } = await resend.emails.send({
            from: 'LexTutor Agent <onboarding@resend.dev>',
            to: email,
            subject: 'Confirma tu acceso a Estudiante Elite',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>Verificación Estudiante Elite</title>
                </head>
                <body style="font-family: 'Inter', sans-serif; background-color: #020617; margin: 0; padding: 40px 0;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5);">
                        
                        <!-- Header -->
                        <div style="padding: 40px 0; text-align: center; background: linear-gradient(to bottom, #1e293b, #0f172a); border-bottom: 1px solid #1e293b;">
                            <h1 style="color: #FDBF11; font-family: 'Times New Roman', serif; font-style: italic; font-size: 32px; margin: 0; letter-spacing: -0.5px;">
                                Estudiante <span style="color: #fff;">Elite</span>
                            </h1>
                            <p style="color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin-top: 8px;">LexTutor Agent System</p>
                        </div>

                        <!-- Content -->
                        <div style="padding: 40px 40px 20px;">
                            <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                                Hola <strong>${name}</strong>,
                            </p>
                            <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin-bottom: 32px;">
                                Bienvenido a la plataforma de asistencia legal más avanzada. Para activar tu cuenta segura y comenzar tus sesiones de tutoría, por favor verifica tu identidad haciendo clic en el siguiente enlace.
                            </p>
                            
                            <!-- Button -->
                            <div style="text-align: center; margin-bottom: 32px;">
                                <a href="${link}" style="display: inline-block; background-color: #FDBF11; color: #020617; padding: 14px 32px; font-weight: 600; font-size: 16px; text-decoration: none; border-radius: 6px; transition: all 0.2s;">
                                    Verificar mi Cuenta &rarr;
                                </a>
                            </div>

                            <p style="color: #64748b; font-size: 14px; line-height: 1.5; text-align: center;">
                                Este enlace expirará en 24 horas por motivos de seguridad.
                            </p>
                        </div>

                        <!-- Footer -->
                        <div style="padding: 24px; text-align: center; border-top: 1px solid #1e293b; background-color: #020617;">
                            <p style="color: #475569; font-size: 12px; margin: 0;">
                                &copy; ${new Date().getFullYear()} Estudiante Elite. Propulsado por LexTutor Agent AI.
                            </p>
                        </div>
                    </div>
                </body>
                </html>
            `
        });

        if (error) {
            console.error('Error sending email via Resend:', error);
            return { success: false, error: error.message };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Exception sending email:', error);
        return { success: false, error: 'Failed to send email' };
    }
}
