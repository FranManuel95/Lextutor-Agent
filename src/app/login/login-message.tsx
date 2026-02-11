'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AlertCircle } from 'lucide-react'

export function LoginMessage() {
    const searchParams = useSearchParams()
    const message = searchParams.get('message')
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        if (message) {
            setVisible(true)
            const timer = setTimeout(() => setVisible(false), 5000)
            return () => clearTimeout(timer)
        }
    }, [message])

    if (!message || !visible) return null

    const isSuccess = message.includes('exitoso')

    return (
        <div className="w-full max-w-[400px] mx-4 mb-4 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className={`p-4 rounded-lg flex items-start gap-3 border ${isSuccess
                    ? "bg-green-900/30 border-green-500/50 text-green-200"
                    : "bg-red-900/30 border-red-500/50 text-red-200"
                }`}>
                <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
                <div className="text-sm font-medium">
                    {message}
                </div>
            </div>
        </div>
    )
}
