'use client'

import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export function AuthSubmitButton({ children }: { children: React.ReactNode }) {
    const { pending } = useFormStatus()

    return (
        <Button
            disabled={pending}
            className="w-full bg-law-gold text-gem-onyx hover:bg-law-gold/90 font-semibold tracking-wide"
            type="submit"
        >
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                </>
            ) : (
                children
            )}
        </Button>
    )
}
