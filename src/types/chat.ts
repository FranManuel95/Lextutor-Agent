export interface Chat {
    id: string
    user_id: string
    title: string
    created_at: string
    updated_at: string
}

export interface Message {
    id: string
    chat_id: string
    user_id: string
    role: 'user' | 'assistant'
    content: string
    audio_path?: string
    audio_url?: string
    transcript?: string
    created_at: string
}
