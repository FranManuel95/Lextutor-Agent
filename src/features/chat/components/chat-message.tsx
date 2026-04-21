"use client";

import { Message } from "@/types/chat";
import { cn } from "@/lib/utils";
import { Bot, User, Play, Pause, FileText, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTypewriter } from "@/hooks/use-typewriter";

interface ChatMessageProps {
  message: Message;
  userAvatar?: string | null;
  isStreaming?: boolean;
}

export function ChatMessage({ message, userAvatar, isStreaming = false }: ChatMessageProps) {
  const isUser = message.role === "user";
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (message.audio_url) {
      setAudioUrl(message.audio_url);
    }
  }, [message.audio_url]);

  const loadAudio = async () => {
    if (audioUrl) return true;
    if (!message.audio_path) return false;

    setIsLoadingAudio(true);
    try {
      const res = await fetch(`/api/audio/url?path=${encodeURIComponent(message.audio_path)}`);
      const data = await res.json();
      if (data.signedUrl) {
        setAudioUrl(data.signedUrl);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to load audio:", err);
      return false;
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const togglePlay = async () => {
    if (audioUrl && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }
      return;
    }

    // Lazy Load
    if (!audioUrl && message.audio_path) {
      const loaded = await loadAudio();
      if (loaded && audioRef.current) {
        // Wait for state update/ref to be ready (a bit tricky with React state, but effect will sync)
        // Actually, safer to let the user click again or use a refined effect,
        // but for instant feel we can try to auto-play after state set requires play-effect.
        // Better: we set state, and use an effect to play if 'wasTryingToPlay' is true.
      }
    }
  };

  // Effect to auto-play when audioUrl becomes available IF user requested it?
  // Simplified: Just load it. The user might need to click again or we can trigger it.
  // For "Tech Lead" UX, let's make it auto-play after load.

  const [shouldAutoPlay, setShouldAutoPlay] = useState(false);

  useEffect(() => {
    if (shouldAutoPlay && audioUrl && audioRef.current) {
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setShouldAutoPlay(false);
        })
        .catch((e) => console.error("Auto-play failed", e));
    }
  }, [audioUrl, shouldAutoPlay]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handlePlayClick = async () => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    if (audioUrl) {
      audioRef.current?.play();
      setIsPlaying(true);
    } else {
      setShouldAutoPlay(true);
      await loadAudio();
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Use the prop instead of message property
  const displayedContent = useTypewriter(message.content || "", isStreaming);

  return (
    <div
      id={`message-${message.id}`}
      className={cn(
        "mx-auto flex w-full max-w-5xl gap-4 px-4 py-4 transition-opacity duration-300 ease-in",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "mt-1 flex h-8 w-8 shrink-0 select-none items-center justify-center overflow-hidden rounded-full border shadow-sm",
          isUser
            ? "border-law-gold bg-law-gold text-gem-onyx"
            : "border-white/10 bg-gray-800 text-law-gold"
        )}
      >
        {isUser && userAvatar ? (
          <img src={userAvatar} alt="User" className="h-full w-full object-cover" />
        ) : isUser ? (
          <User size={16} />
        ) : (
          <Bot size={16} />
        )}
      </div>

      {/* Message Bubble */}
      <div
        className={cn(
          "flex max-w-[80%] flex-col rounded-2xl p-4 shadow-sm",
          isUser
            ? "items-end rounded-tr-none border border-law-gold/20 bg-law-gold/10 text-right"
            : "items-start rounded-tl-none border border-white/5 bg-gray-900/60"
        )}
      >
        {/* Header (Name) */}
        <div className="mb-1 flex items-center gap-2 text-xs opacity-70">
          <span className="font-semibold text-gray-300">{isUser ? "Tú" : "LexTutor Agent"}</span>
          {!isUser && (
            <span className="rounded bg-law-gold px-1 py-0 text-[9px] font-bold uppercase tracking-wide text-gem-onyx">
              AI
            </span>
          )}
        </div>

        {message.audio_path || message.audio_url ? (
          <div className={cn("w-full space-y-2", isUser ? "items-end" : "items-start")}>
            <div
              className={cn(
                "flex min-w-[280px] items-center gap-3 rounded-xl p-3",
                isUser
                  ? "bg-law-gold text-gem-onyx"
                  : "border border-white/10 bg-gray-800 text-gem-offwhite"
              )}
            >
              <button
                onClick={togglePlay}
                disabled={isLoadingAudio}
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all",
                  isUser
                    ? "bg-gem-onyx/10 text-gem-onyx hover:bg-gem-onyx/20"
                    : "bg-white/10 text-law-gold hover:bg-white/20"
                )}
              >
                {isLoadingAudio ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="h-5 w-5 fill-current" />
                ) : (
                  <Play className="ml-1 h-5 w-5 fill-current" />
                )}
              </button>

              <div className="flex-1 space-y-1">
                <div className="h-1 overflow-hidden rounded-full bg-black/20">
                  <div
                    className="h-full bg-current transition-all duration-100"
                    style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-medium opacity-80">
                  <span>{formatTime(currentTime)}</span>
                  <span>{duration ? formatTime(duration) : "--:--"}</span>
                </div>
              </div>
            </div>

            {/* Hidden Audio Element */}
            <audio
              ref={audioRef}
              src={audioUrl || undefined}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={handleEnded}
              className="hidden"
            />

            {/* Optional Transcript if available */}
            {message.transcript && (
              <p className="mt-1 px-1 text-xs italic opacity-70">
                &ldquo;{message.transcript}&rdquo;
              </p>
            )}
          </div>
        ) : (
          <div
            className={cn(
              "prose prose-invert max-w-none text-sm leading-relaxed text-gem-offwhite/90",
              isUser && "text-right"
            )}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                ul: ({ node, ...props }) => (
                  <ul className="mb-2 list-disc space-y-1 pl-4" {...props} />
                ),
                ol: ({ node, ...props }) => (
                  <ol className="mb-2 list-decimal space-y-1 pl-4" {...props} />
                ),
                strong: ({ node, ...props }) => (
                  <strong className="font-bold text-law-gold" {...props} />
                ),
              }}
            >
              {displayedContent || (isStreaming ? "" : "...")}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
