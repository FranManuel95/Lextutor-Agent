'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { generateResponse } from '@/lib/ai-service'


export async function createChat() {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    // 1. Fetch Profile for Name & Prefs
    const { data: profile } = await supabase
        .from('profiles')
        .select('tutor_prefs, full_name')
        .eq('id', user.id)
        .single()

    const settings = (profile as any)?.tutor_prefs || { area: 'general', modes: [], detailLevel: 'normal' }
    const userName = (profile as any)?.full_name?.split(' ')[0] || "Estudiante"

    // 2. Create Chat
    const { data, error } = await supabase
        .from('chats')
        .insert({
            user_id: user.id,
            title: 'Nuevo Chat',
        } as any)
        .select()
        .single()

    if (error) {
        console.error('Error creating chat:', error)
        return { error: 'Failed to create chat' }
    }

    const chatId = (data as any).id

    // 3. Proactive Agent Greeting (Generate & Save)
    try {
        // OPTIMIZATION: Use static instant greeting instead of waiting for AI generation (saves 5-8s)
        const welcomeMessage = `Hola ${userName}, soy tu tutor legal inteligente. ⚖️

Estoy aquí para ayudarte a dominar el Derecho, resolver dudas complejas o preparar tus exámenes con casos prácticos. 

Puedes pedirme que:
1.  Resuma una normativa específica.
2.  Genere un examen de autoevaluación.
3.  Te explique un concepto con ejemplos reales.

¿Por qué materia o tema te gustaría empezar hoy?`

        await supabase.from('messages').insert({
            chat_id: chatId,
            user_id: user.id,
            role: 'assistant',
            content: welcomeMessage,
        } as any)

    } catch (err) {
        console.error("Failed to insert welcome message:", err)
    }

    revalidatePath('/chat')
    redirect(`/chat/${chatId}`)
}

export async function sendMessage(
    chatId: string,
    content: string,
    settings: {
        area: string;
        modes: string[];
        detailLevel: string;
        preset?: string;
    }
) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // 1. Save user message
    const { error: messageError } = await supabase
        .from('messages')
        .insert({
            chat_id: chatId,
            user_id: user.id,
            role: 'user',
            content: content,
        } as any)

    if (messageError) {
        console.error('Error sending message:', messageError)
        return { error: 'Failed to send message' }
    }

    // 3. Generate AI Response
    let aiResponse = "Lo siento, no pude procesar tu solicitud."

    // Fetch conversation history for context (last 6 messages)
    const { data: recentMessages } = await supabase
        .from('messages')
        .select('role, content')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: false })
        .limit(6);

    const history = (recentMessages || []).reverse().map((m: any) => ({
        role: m.role,
        content: m.content
    }));

    try {
        aiResponse = await generateResponse({
            message: content,
            history,
            settings: settings as any
        })
    } catch (error) {
        console.error("AI Service Error:", error)
        aiResponse = "Error al conectar con el tutor inteligente. Intenta de nuevo."
    }

    // 4. Save assistant message
    const { data: assistantMsg } = await supabase
        .from('messages')
        .insert({
            chat_id: chatId,
            user_id: user.id,
            role: 'assistant',
            content: aiResponse,
        } as any)
        .select()
        .single()

    // 5. Auto-Title Check (Deterministic First Sentence)
    // If we're here, we can check if the chat still needs a title
    const { data: currentChat } = await supabase
        .from('chats')
        .select('title')
        .eq('id', chatId)
        .single() as any

    if (!currentChat?.title || currentChat.title === 'Nuevo Chat') {
        const firstSentence = content.split(/[.\n?!]/)[0]
        const newTitle = firstSentence.trim().substring(0, 40)
        if (newTitle && newTitle.length > 2) {
            await (supabase.from('chats') as any)
                .update({ title: newTitle })
                .eq('id', chatId)
        }
    }

    // 4b. Log Student Event (Progress)
    await supabase.from('student_events').insert({
        user_id: user.id,
        chat_id: chatId, // optional relation
        message_id: (assistantMsg as any)?.id,
        area: settings.area,
        kind: 'answer_submitted',
        payload: { settings }
    } as any)

    // 6. Update chat updated_at
    await (supabase.from('chats') as any)
        .update({ updated_at: new Date().toISOString() })
        .eq('id', chatId)

    revalidatePath(`/chat/${chatId}`)
    revalidatePath(`/chat`) // Refresh list for title update
}

export async function renameChat(chatId: string, newTitle: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    await (supabase
        .from('chats') as any)
        .update({ title: newTitle, updated_at: new Date().toISOString() })
        .eq('id', chatId)
        .eq('user_id', user.id)

    revalidatePath('/chat')
    return { success: true }
}
