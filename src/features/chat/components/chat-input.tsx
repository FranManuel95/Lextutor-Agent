'use client'

import * as React from 'react'
import { SendHorizontal, Mic } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { sendMessage } from '@/app/chat/actions'
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

        // Optimistic UI: Create temp message
        const tempId = Date.now()
        addOptimisticMessage({
            id: tempId,
            chat_id: chatId,
            role: 'user',
            content: content,
            created_at: new Date().toISOString()
        })

        try {
            const r = await sendMessage(chatId, content, tutorSettings)

            // Server has responded (or updated DB), so we remove optimistic text
            // because router.refresh() will bring the real persisted message
            removeOptimisticMessage(tempId)
            router.refresh()

            if ((r as any)?.error) {
                toast({ title: "Error", description: (r as any).error, variant: "destructive" })
            }
        } catch (e: any) {
            removeOptimisticMessage(tempId) // Remove on error too or let user retry (simple: remove)
            toast({ title: "Error", description: e?.message ?? "Falló el envío", variant: "destructive" })
        } finally {
            setIsSending(false)
        }
    }


    // Audio Flow
    const handleAudioComplete = async (audioBlob: Blob) => {
        setIsSending(true)
        setAudioState('uploading')

        // Optimistic Audio Placeholder
        // Optimistic Audio Placeholder
        // Removed to avoid duplication with the audio player bubble
        // const tempId = Date.now()
        // addOptimisticMessage({ ... })

        try {
            // 1. Get Signed URL
            const uploadRes = await fetch('/api/audio/create-upload', { method: 'POST' });
            if (!uploadRes.ok) throw new Error('Auth or API error');
            const { path, signedUrl, token } = await uploadRes.json();

            // 2. Upload to Storage
            const storageRes = await fetch(signedUrl, {
                method: 'PUT',
                body: audioBlob,
                headers: {
                    'Content-Type': audioBlob.type,
                }
            });

            if (!storageRes.ok) throw new Error('Storage upload failed');

            setAudioState('transcribing')

            // 3. Process Message
            const processRes = await fetch('/api/audio/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chatId,
                    audioPath: path,
                    settings: tutorSettings
                })
            });

            if (!processRes.ok) throw new Error('Processing failed');

            // 4. Success
            // remove temp before refresh
            // removeOptimisticMessage(tempId) // Removed since creation was removed
            toast({ title: "Audio procesado", description: "Mensaje de voz enviado y respondido." });
            router.refresh();

        } catch (error) {
            console.error(error);
            // removeOptimisticMessage(tempId) // Removed
            toast({ title: "Error", description: "Falló el envío de audio.", variant: "destructive" });
        } finally {
            setIsSending(false)
            setIsRecording(false)
            setAudioState('idle')
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
