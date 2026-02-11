import { NextRequest } from "next/server";
import { createClient } from '@/utils/supabase/server';
import { generateResponseStream } from '@/lib/ai-service-stream';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const body = await request.json();
    const { chatId, message, settings } = body;

    // 1. Verify chat ownership
    const { data: chat } = await supabase
        .from('chats')
        .select('user_id, title')
        .eq('id', chatId)
        .single();

    if (!chat || (chat as any).user_id !== user.id) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // 2. Save user message immediately
    await supabase.from('messages').insert({
        chat_id: chatId,
        user_id: user.id,
        role: 'user',
        content: message,
    } as any);

    // 3. Load conversation history
    const { data: recentMessages } = await supabase
        .from('messages')
        .select('role, content')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: false })
        .limit(10);

    const history = (recentMessages || []).reverse();

    // 4. Get user profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

    const userName = (profile as any)?.full_name?.split(' ')[0] || "";

    // 5. Create streaming response
    const encoder = new TextEncoder();
    let fullResponse = '';

    const stream = new ReadableStream({
        async start(controller) {
            try {
                // Send initial event
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'start' })}\n\n`));

                // Get AI stream
                const geminiStream = await generateResponseStream({
                    message,
                    history: history.filter(m => (m as any).content !== message),
                    settings: {
                        area: settings?.area || 'general',
                        modes: settings?.modes || [],
                        detailLevel: settings?.detailLevel || 'normal',
                    },
                    options: {
                        userName,
                        isFirstInteraction: !history.some(m => (m as any).role === 'assistant')
                    }
                });

                // Stream chunks to client
                let lastResponse: any = null;
                for await (const chunk of geminiStream) {
                    const text = chunk.text || '';
                    fullResponse += text;
                    lastResponse = chunk;

                    controller.enqueue(encoder.encode(
                        `data: ${JSON.stringify({ type: 'chunk', text })}\n\n`
                    ));
                }

                // Add citations if available
                const lastChunk = lastResponse?.candidates?.[0];
                const grounding = lastChunk?.groundingMetadata;

                if (grounding?.groundingChunks && grounding.groundingChunks.length > 0) {
                    const { formatGeminiCitations } = await import('@/lib/ai-service');
                    const citations = formatGeminiCitations(grounding.groundingChunks);
                    if (citations) {
                        fullResponse += `\n\n${citations}`;
                        controller.enqueue(encoder.encode(
                            `data: ${JSON.stringify({ type: 'chunk', text: `\n\n${citations}` })}\n\n`
                        ));
                    }
                }

                // Send done event
                controller.enqueue(encoder.encode(
                    `data: ${JSON.stringify({ type: 'done' })}\n\n`
                ));

                controller.close();

                // Save assistant message in background (non-blocking)
                saveAssistantMessage(supabase, chatId, user.id, fullResponse, (chat as any).title, message, settings).catch(console.error);

            } catch (error: any) {
                console.error('Streaming error:', error);
                const errorMessage = error?.message || 'Unknown streaming error';
                controller.enqueue(encoder.encode(
                    `data: ${JSON.stringify({ type: 'error', message: errorMessage })}\n\n`
                ));
                controller.close();
            }
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no', // Disable nginx buffering
        }
    });
}

// Background task to save assistant message
async function saveAssistantMessage(
    supabase: any,
    chatId: string,
    userId: string,
    content: string,
    currentTitle: string | null,
    userMessage: string,
    settings: any
) {
    try {
        // Save assistant message
        const { data: assistantMsg } = await supabase
            .from('messages')
            .insert({
                chat_id: chatId,
                user_id: userId,
                role: 'assistant',
                content: content,
            } as any)
            .select()
            .single();

        // Auto-title if needed
        if (!currentTitle || currentTitle === 'Nuevo Chat') {
            const firstSentence = userMessage.split(/[.\n?!]/)[0];
            const newTitle = firstSentence.trim().substring(0, 40);
            if (newTitle && newTitle.length > 2) {
                await supabase
                    .from('chats')
                    .update({ title: newTitle } as any)
                    .eq('id', chatId);
            }
        }

        // Log event
        await supabase.from('student_events').insert({
            user_id: userId,
            chat_id: chatId,
            message_id: assistantMsg?.id,
            area: settings?.area || 'general',
            kind: 'answer_submitted',
            payload: { settings }
        } as any);

        // Update chat timestamp
        await supabase
            .from('chats')
            .update({ updated_at: new Date().toISOString() } as any)
            .eq('id', chatId);

    } catch (error) {
        console.error('Failed to save assistant message:', error);
    }
}
