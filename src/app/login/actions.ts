'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
    const supabase = createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return redirect('/login?message=Could not authenticate user')
    }

    revalidatePath('/', 'layout')
    redirect('/chat')
}

export async function signup(formData: FormData) {
    const supabase = createClient()
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) throw new Error('Missing Service Role Key')

    // Admin client for privileged operations (Storage/Profile update during signup)
    const { createClient: createAdminClient } = require('@supabase/supabase-js')
    const adminSupabase = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey
    )

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('fullName') as string
    const age = Number(formData.get('age'))
    const avatar = formData.get('avatar') as File

    // Simple validation (Zod would be better but keeping deps minimal if not installed)
    if (age < 13 || age > 120) {
        return redirect('/login?message=Edad inválida (13-120)')
    }

    const { data: authData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
                // store in meta too
            }
        }
    })

    if (error || !authData.user) {
        return redirect(`/login?message=${error?.message || 'Error al registrarse'}`)
    }

    // Handle Profile & Avatar
    let avatarUrl = null
    if (avatar && avatar.size > 0) {
        const fileExt = avatar.name.split('.').pop()
        const filePath = `avatars/${authData.user.id}/${Date.now()}.${fileExt}`

        const { error: uploadError } = await adminSupabase.storage
            .from('avatars')
            .upload(filePath, avatar, {
                contentType: avatar.type,
                upsert: true
            })

        if (!uploadError) {
            const { data: { publicUrl } } = adminSupabase.storage
                .from('avatars')
                .getPublicUrl(filePath)
            avatarUrl = publicUrl
        }
    }

    // Update Profile (Upsert to handle trigger vs no-trigger cases safely)
    await adminSupabase.from('profiles').upsert({
        id: authData.user.id,
        full_name: fullName,
        age: age,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
    })

    if (error) {
        return redirect('/login?message=Could not authenticate user')
    }

    // Check for session. If no session, email verification is likely required.
    if (!authData.session) {
        return redirect('/login?message=Registro exitoso. Por favor verifica tu correo electrónico para continuar.')
    }

    revalidatePath('/', 'layout')
    redirect('/chat')
}
