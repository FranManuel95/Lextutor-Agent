'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface StreamMessage {
    type: 'start' | 'chunk' | 'done' | 'error';
    text?: string;
    message?: string;
}

export function useChatStream() {
    const [isStreaming, setIsStreaming] = useState(false);
    const router = useRouter();

    const sendStreamingMessage = async (
        chatId: string,
        message: string,
        settings: any,
        onChunk: (text: string) => void,
        onComplete: () => void,
        onError: (error: string) => void
    ) => {
        setIsStreaming(true);

        try {
            const response = await fetch('/api/chat/stream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chatId,
                    message,
                    settings,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('No response body');
            }

            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();

                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data: StreamMessage = JSON.parse(line.slice(6));

                            if (data.type === 'chunk' && data.text) {
                                onChunk(data.text);
                            } else if (data.type === 'done') {
                                setIsStreaming(false);
                                onComplete();
                                router.refresh(); // Refresh to get persisted messages
                            } else if (data.type === 'error') {
                                throw new Error(data.message || 'Streaming error');
                            }
                        } catch (parseError) {
                            console.error('Failed to parse SSE message:', parseError);
                        }
                    }
                }
            }
        } catch (error: any) {
            console.error('Stream error:', error);
            setIsStreaming(false);
            onError(error.message || 'Failed to send message');
        }
    };

    return {
        isStreaming,
        sendStreamingMessage,
    };
}
