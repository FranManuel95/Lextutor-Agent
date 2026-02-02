'use client'

import { Message } from '@/types/chat'
import { cn } from '@/lib/utils'
import { Bot, User, Play, Pause, FileText, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface ChatMessageProps {
    message: Message
    userAvatar?: string | null
}

export function ChatMessage({ message, userAvatar }: ChatMessageProps) {
    const isUser = message.role === 'user'
    const [audioUrl, setAudioUrl] = useState<string | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isLoadingAudio, setIsLoadingAudio] = useState(false)
    const [duration, setDuration] = useState(0)
    const [currentTime, setCurrentTime] = useState(0)

    const audioRef = useRef<HTMLAudioElement | null>(null)

    useEffect(() => {
        if (message.audio_path) {
            setIsLoadingAudio(true)
            fetch(`/api/audio/url?path=${encodeURIComponent(message.audio_path)}`)
                .then(res => res.json())
                .then(data => {
                    if (data.signedUrl) setAudioUrl(data.signedUrl)
                })
                .catch(err => console.error("Failed to load audio:", err))
                .finally(() => setIsLoadingAudio(false))
        }
    }, [message.audio_path])

    const togglePlay = () => {
        if (!audioRef.current) return
        if (isPlaying) {
            audioRef.current.pause()
        } else {
            audioRef.current.play()
        }
        setIsPlaying(!isPlaying)
    }

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime)
        }
    }

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration)
        }
    }

    const handleEnded = () => {
        setIsPlaying(false)
        setCurrentTime(0)
    }

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60)
        const seconds = Math.floor(time % 60)
        return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }
    return (
        <div
            id={`message-${message.id}`}
            className={cn(
                "flex w-full px-4 py-4 gap-4 mx-auto max-w-5xl",
                isUser ? "flex-row-reverse" : "flex-row"
            )}>
            {/* Avatar */}
            <div className={cn(
                "flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full border shadow-sm mt-1 overflow-hidden",
                isUser ? "bg-law-gold text-gem-onyx border-law-gold" : "bg-gray-800 border-white/10 text-law-gold"
            )}>
                {isUser && userAvatar ? (
                    <img src={userAvatar} alt="User" className="w-full h-full object-cover" />
                ) : (
                    isUser ? <User size={16} /> : <Bot size={16} />
                )}
            </div>

            {/* Message Bubble */}
            <div className={cn(
                "flex flex-col max-w-[80%] rounded-2xl p-4 shadow-sm",
                isUser
                    ? "bg-law-gold/10 border border-law-gold/20 rounded-tr-none text-right items-end"
                    : "bg-gray-900/60 border border-white/5 rounded-tl-none items-start"
            )}>
                {/* Header (Name) */}
                <div className="flex items-center gap-2 mb-1 opacity-70 text-xs">
                    <span className="font-semibold text-gray-300">
                        {isUser ? "Tú" : "LexTutor Agent"}
                    </span>
                    {!isUser && <span className="text-[9px] bg-law-gold text-gem-onyx px-1 py-0 rounded font-bold uppercase tracking-wide">AI</span>}
                </div>

                {message.audio_path ? (
                    <div className={cn("space-y-2 w-full", isUser ? "items-end" : "items-start")}>
                        {/* Audio Player Card - Adaptive Style */}
                        <div className={cn(
                            "rounded-xl p-2 flex items-center gap-3 backdrop-blur-sm w-full min-w-[280px]",
                            isUser ? "bg-law-gold/20 border-law-gold/30" : "bg-black/20 border-white/10"
                        )}>
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={togglePlay}
                                disabled={isLoadingAudio || !audioUrl}
                                className={cn(
                                    "h-8 w-8 rounded-full shrink-0 transition-transform active:scale-95",
                                    isUser ? "bg-law-gold text-gem-onyx hover:bg-white" : "bg-white/10 hover:bg-white/20 text-white"
                                )}
                            >
                                {isLoadingAudio ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : isPlaying ? (
                                    <Pause className="h-4 w-4 fill-current" />
                                ) : (
                                    <Play className="h-4 w-4 fill-current ml-0.5" />
                                )}
                            </Button>

                            <div className="flex-1 flex flex-col justify-center gap-1">
                                <div className="h-1 bg-black/20 rounded-full overflow-hidden w-full">
                                    <div
                                        className={cn("h-full transition-all duration-100 ease-linear", isUser ? "bg-law-gold" : "bg-white/70")}
                                        style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-[10px] opacity-70 font-medium font-mono">
                                    <span>{formatTime(currentTime)}</span>
                                    <span>{formatTime(duration)}</span>
                                </div>
                            </div>

                            {/* Hidden Audio Element */}
                            {audioUrl && (
                                <audio
                                    ref={audioRef}
                                    src={audioUrl}
                                    onTimeUpdate={handleTimeUpdate}
                                    onLoadedMetadata={handleLoadedMetadata}
                                    onEnded={handleEnded}
                                    className="hidden"
                                />
                            )}
                        </div>

                        {/* Transcription Toggle (Removed by user request) */}
                        <div className="hidden"></div>
                    </div>
                ) : (
                    <div className={cn("prose prose-invert max-w-none text-gem-offwhite/90 leading-relaxed text-sm", isUser && "text-right")}>
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                // Custom styling for lists/paragraphs if needed to match "short paragraphs" rule
                                p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
                                ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-2 space-y-1" {...props} />,
                                strong: ({ node, ...props }) => <strong className="text-law-gold font-bold" {...props} />
                            }}
                        >
                            {message.content}
                        </ReactMarkdown>
                    </div>
                )}
            </div>
        </div>
    )
}
