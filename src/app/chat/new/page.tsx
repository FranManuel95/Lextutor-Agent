'use client'

import { useEffect, useRef } from 'react'
import { createChat } from '../actions'

export default function NewChatPage() {
    const initialized = useRef(false)

    useEffect(() => {
        if (!initialized.current) {
            initialized.current = true
            createChat()
        }
    }, [])

    return (
        <div className="flex items-center justify-center h-full">
            <div className="animate-pulse text-law-gold">Creando nuevo chat...</div>
        </div>
    )
}
