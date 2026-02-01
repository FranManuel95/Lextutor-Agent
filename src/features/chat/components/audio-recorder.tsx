"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Mic, Trash2, SendHorizontal, Loader2, Pause } from "lucide-react"
import { cn } from "@/lib/utils"

interface AudioRecorderProps {
    onRecordingComplete: (audioBlob: Blob) => void
    onCancel: () => void
    isProcessing?: boolean
}

export function AudioRecorder({ onRecordingComplete, onCancel, isProcessing }: AudioRecorderProps) {
    const [isRecording, setIsRecording] = useState(false)
    const [duration, setDuration] = useState(0)
    const [isPaused, setIsPaused] = useState(false)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const chunksRef = useRef<Blob[]>([])

    // Limit to 90s
    const MAX_DURATION = 90

    useEffect(() => {
        startRecording()
        return () => {
            stopRecording(false) // cleanup on unmount
        }
    }, [])

    useEffect(() => {
        if (duration >= MAX_DURATION) {
            stopRecording(true)
        }
    }, [duration])

    const startRecording = async () => {
        try {
            // Optimized for Voice Message Quality (Clear Speech)
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1, // Mono is better for speech recognition (avoid phase issues)
                    echoCancellation: true, // Remove speaker feedback
                    noiseSuppression: true, // Remove background hiss
                    autoGainControl: true, // Normalize volume
                    sampleRate: 48000
                }
            })

            const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
                ? "audio/webm;codecs=opus"
                : "audio/webm";

            // 192kbps is High Quality for speech/music
            const mediaRecorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 192000 })

            mediaRecorderRef.current = mediaRecorder
            chunksRef.current = []

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data)
            }

            // Reliable saving on stop
            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
                if (blob.size > 0) {
                    onRecordingComplete(blob)
                }

                // Cleanup tracks
                stream.getTracks().forEach(track => track.stop())
            }

            mediaRecorder.start() // Record in one big chunk (no timeslice = no glitches)
            setIsRecording(true)
            startTimer()

        } catch (err) {
            console.error("Microphone access denied:", err)
            onCancel()
        }
    }

    const startTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current)
        timerRef.current = setInterval(() => {
            setDuration(prev => prev + 1)
        }, 1000)
    }

    const stopTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
        }
    }

    const togglePause = () => {
        if (!mediaRecorderRef.current) return

        if (isPaused) {
            mediaRecorderRef.current.resume()
            startTimer()
            setIsPaused(false)
        } else {
            mediaRecorderRef.current.pause()
            stopTimer()
            setIsPaused(true)
        }
    }

    const stopRecording = (shouldSave: boolean) => {
        if (!mediaRecorderRef.current) return

        if (mediaRecorderRef.current.state !== "inactive") {
            if (shouldSave) {
                // Trigger onstop -> onRecordingComplete
                mediaRecorderRef.current.stop()
            } else {
                // Determine it's a cancellation so onstop doesn't invoke callback? 
                // Or easier: just nullify onstop before stopping if we want to cancel.
                mediaRecorderRef.current.onstop = null
                mediaRecorderRef.current.stop()
                mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
            }
        }

        stopTimer()
        setIsRecording(false)
        // onstop handles the rest for saving
    }

    const handleStop = () => stopRecording(true)
    const handleCancel = () => {
        stopRecording(false)
        onCancel()
    }

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${m}:${s.toString().padStart(2, '0')}`
    }

    return (
        <div className="flex items-center gap-3 w-full animate-in fade-in slide-in-from-bottom-2 bg-gem-onyx/90 p-2 rounded-2xl border border-law-accent/50">
            {isProcessing ? (
                <div className="flex items-center gap-2 text-law-gold px-4 w-full justify-center">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm font-medium animate-pulse">Procesando audio...</span>
                </div>
            ) : (
                <>
                    <div className="flex items-center gap-2 px-3">
                        <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="font-mono text-white text-sm w-12">{formatTime(duration)}</span>
                    </div>

                    <div className="flex-1 flex justify-center">
                        <span className="text-xs text-gray-400">Grabando... (máx 90s)</span>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={handleCancel}
                            className="h-10 w-10 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors"
                            title="Cancelar"
                        >
                            <Trash2 className="h-5 w-5" />
                        </Button>

                        <Button
                            type="button"
                            size="icon"
                            variant="secondary"
                            onClick={togglePause}
                            className={cn(
                                "h-10 w-10 rounded-full transition-all",
                                isPaused ? "bg-law-accent/20 text-law-accent" : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                            )}
                            title={isPaused ? "Reanudar" : "Pausar"}
                        >
                            {isPaused ? <Mic className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                        </Button>

                        <Button
                            type="button"
                            size="icon"
                            onClick={handleStop}
                            className="h-10 w-10 bg-law-gold text-gem-onyx hover:bg-law-gold/90 rounded-full shadow-lg shadow-law-gold/20 transition-all transform hover:scale-105"
                            title="Enviar audio"
                        >
                            <SendHorizontal className="h-5 w-5 fill-current" />
                        </Button>
                    </div>
                </>
            )}
        </div>
    )
}
