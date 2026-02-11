'use client'

import * as React from 'react'
import { SendHorizontal, Mic } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { sendMessage } from '@/app/(dashboard)/chat/actions'
import { useAppStore } from '@/store/useAppStore'
import { AudioRecorder } from './audio-recorder'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'

interface ChatInputProps {
    chatId: string
}

export function ChatInput({ chatId }: ChatInputProps) {
    const { isSending, setIsSending, tutorSettings, addOptimisticMessage, removeOptimisticMessage } = useAppStore()
    const [isRecording, setIsRecording] = React.useState(false)
    const [audioState, setAudioState] = React.useState<'idle' | 'uploading' | 'transcribing' | 'responding'>('idle')

    const formRef = React.useRef<HTMLFormElement>(null)
    const inputRef = React.useRef<HTMLTextAreaElement>(null)
    const { toast } = useToast()
    const router = useRouter()

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            formRef.current?.requestSubmit()
        }
    }

    const onSubmit = async (formData: FormData) => {
        const content = formData.get('content') as string
        if (!content?.trim() || isSending) return

        setIsSending(true)
        if (inputRef.current) inputRef.current.value = ''

        // Optimistic UI: Add user message immediately
        const tempId = Date.now()
        addOptimisticMessage({
            id: tempId,
            chat_id: chatId,
            role: 'user',
            content: content,
            created_at: new Date().toISOString()
        })

        // Add empty assistant message for streaming
        const assistantTempId = tempId + 1
        addOptimisticMessage({
            id: assistantTempId,
            chat_id: chatId,
            role: 'assistant',
            content: '',
            created_at: new Date().toISOString()
        })

        try {
            const response = await fetch('/api/chat/stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chatId,
                    message: content,
                    settings: tutorSettings,
                }),
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const reader = response.body?.getReader()
            if (!reader) throw new Error('No response body')

            const decoder = new TextDecoder()
            let buffer = ''
            let assistantContent = ''
            let pendingChunks = ''
            let updateTimeout: NodeJS.Timeout | null = null

            // Throttled update function - updates UI every 50ms max
            const throttledUpdate = () => {
                if (pendingChunks) {
                    assistantContent += pendingChunks
                    pendingChunks = ''

                    useAppStore.setState((state) => ({
                        optimisticMessages: state.optimisticMessages.map(msg =>
                            msg.id === assistantTempId
                                ? { ...msg, content: assistantContent }
                                : msg
                        )
                    }))
                }
                updateTimeout = null
            }

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split('\n\n')
                buffer = lines.pop() || ''

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6))

                            if (data.type === 'chunk' && data.text) {
                                // Accumulate chunks
                                pendingChunks += data.text

                                // Schedule throttled update (max every 50ms)
                                if (!updateTimeout) {
                                    updateTimeout = setTimeout(throttledUpdate, 50)
                                }
                            } else if (data.type === 'done') {
                                // Final update with any pending chunks
                                if (updateTimeout) {
                                    clearTimeout(updateTimeout)
                                    throttledUpdate()
                                }

                                // Remove optimistic messages, refresh will bring persisted ones
                                // Tech Lead Fix: Disable refresh to prevent reload/blink.
                                // router.refresh()
                                /* setTimeout(() => {
                                    removeOptimisticMessage(tempId)
                                    removeOptimisticMessage(assistantTempId)
                                }, 100) */
                            } else if (data.type === 'error') {
                                throw new Error(data.message || 'Streaming error')
                            }
                        } catch (parseError) {
                            console.error('Parse error:', parseError)
                        }
                    }
                }
            }
        } catch (e: any) {
            removeOptimisticMessage(tempId)
            removeOptimisticMessage(assistantTempId)
            toast({ title: "Error", description: e?.message ?? "Falló el envío", variant: "destructive" })
        } finally {
            setIsSending(false)
        }
    }


    // Audio Flow
    // Audio Flow (Tech Lead Implementation)
    const handleAudioComplete = async (audioBlob: Blob) => {
        if (isSending) return;

        // 1. Instant UX: Optimistic Rendering with Local Blob
        const blobUrl = URL.createObjectURL(audioBlob);
        const tempId = Date.now();
        const assistantTempId = tempId + 1;

        setIsSending(true);
        // Reuse 'transcribing' state to show "Escuchando..." or similar in UI if needed
        setAudioState('transcribing');

        // Optimistic User Message (Instant Playback)
        addOptimisticMessage({
            id: tempId,
            chat_id: chatId,
            role: 'user',
            content: '', // Audio messages usually have empty text initially
            audio_url: blobUrl, // Play immediately from memory
            created_at: new Date().toISOString()
        });

        // Optimistic Assistant Message (Streaming Placeholder)
        addOptimisticMessage({
            id: assistantTempId,
            chat_id: chatId,
            role: 'assistant',
            content: '',
            created_at: new Date().toISOString()
        });

        try {
            // 2. Background Upload
            setAudioState('uploading');
            const uploadRes = await fetch('/api/audio/create-upload', { method: 'POST' });
            if (!uploadRes.ok) throw new Error('Auth or API error');
            const { path, signedUrl } = await uploadRes.json();

            const storageRes = await fetch(signedUrl, {
                method: 'PUT',
                body: audioBlob,
                headers: { 'Content-Type': audioBlob.type }
            });

            if (!storageRes.ok) throw new Error('Storage upload failed');

            // 3. Streaming Response Call
            setAudioState('transcribing'); // "Thinking" state

            const response = await fetch('/api/chat/audio-stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chatId,
                    audioPath: path,
                    settings: tutorSettings
                })
            });

            if (!response.ok) throw new Error('Audio streaming failed');

            // 4. Process Stream
            const reader = response.body?.getReader();
            if (!reader) throw new Error('No response body');

            const decoder = new TextDecoder();
            let assistantContent = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));

                            if (data.type === 'chunk' && data.text) {
                                assistantContent += data.text;
                                useAppStore.setState((state) => ({
                                    optimisticMessages: state.optimisticMessages.map(msg =>
                                        msg.id === assistantTempId
                                            ? { ...msg, content: assistantContent }
                                            : msg
                                    )
                                }));
                            } else if (data.type === 'done') {
                                // Clean up and refresh
                                // Tech Lead Change: Don't refresh to avoid page reload feel.
                                // router.refresh();
                                /* setTimeout(() => {
                                    removeOptimisticMessage(tempId);
                                    removeOptimisticMessage(assistantTempId);
                                }, 1000); */
                            } else if (data.type === 'error') {
                                throw new Error(data.message);
                            }
                        } catch (e) {
                            console.error("Stream parse error", e);
                        }
                    }
                }
            }

        } catch (error: any) {
            console.error("Audio Error:", error);
            removeOptimisticMessage(tempId);
            removeOptimisticMessage(assistantTempId);
            toast({ title: "Error", description: "Falló el audio.", variant: "destructive" });
        } finally {
            setIsSending(false);
            setIsRecording(false);
            setAudioState('idle');
        }
    }

    const getPlaceholder = () => {
        if (isSending) {
            if (audioState === 'uploading') return "Subiendo audio..."
            if (audioState === 'transcribing') return "Transcribiendo y pensando..."
            return "Tutor pensando..."
        }
        return "Escribe tu consulta jurídica..."
    }

    // Render Recorder Overlay
    if (isRecording) {
        return (
            <div className="p-6 border-t border-law-accent/20 bg-gem-onyx">
                <div className="max-w-4xl mx-auto min-h-[60px] flex items-center">
                    <AudioRecorder
                        onRecordingComplete={handleAudioComplete}
                        onCancel={() => setIsRecording(false)}
                        isProcessing={isSending}
                    />
                </div>
                <div className="text-center mt-2">
                    <p className="text-[10px] text-gray-600">Audio notes powered by Gemini 2.5</p>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 border-t border-law-accent/20 bg-gem-onyx">
            <form
                ref={formRef}
                action={onSubmit}
                className="relative flex items-center max-w-4xl mx-auto"
            >
                <div className="relative w-full">
                    <textarea
                        ref={inputRef}
                        name="content"
                        onKeyDown={handleKeyDown}
                        className="flex w-full rounded-2xl border border-law-accent/30 bg-gem-mist/20 px-6 py-4 text-sm shadow-inner text-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-law-gold/50 disabled:cursor-not-allowed disabled:opacity-50 min-h-[60px] resize-none pr-16"
                        placeholder={getPlaceholder()}
                        required
                        disabled={isSending}
                    />
                    <div className="absolute right-2 top-2 flex gap-2">
                        <div className={isSending ? "opacity-0 pointer-events-none" : "flex gap-2"}>
                            <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => setIsRecording(true)}
                                className="h-10 w-10 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl"
                                disabled={isSending}
                            >
                                <span className="sr-only">Voz</span>
                                <Mic className="h-5 w-5" />
                            </Button>
                            <Button
                                type="submit"
                                size="icon"
                                disabled={isSending}
                                className="h-10 w-10 bg-law-gold/10 text-law-gold hover:bg-law-gold hover:text-gem-onyx rounded-xl transition-all duration-300 disabled:opacity-50"
                            >
                                <SendHorizontal size={20} />
                                <span className="sr-only">Enviar</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
            <div className="text-center mt-2">
                <p className="text-[10px] text-gray-600">LexTutor Agent está se basa en manuales proporcionados por el autor del proyecto.</p>
            </div>
        </div>
    )
}
