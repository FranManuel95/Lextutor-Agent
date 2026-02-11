'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function LoginOptimizer() {
    const router = useRouter()

    useEffect(() => {
        // Prefetch the chat dashboard for instant navigation after login
        router.prefetch('/chat')
    }, [router])

    return null
}
