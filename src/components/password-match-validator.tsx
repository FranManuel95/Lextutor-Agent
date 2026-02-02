'use client'

import { useEffect } from 'react'

export function PasswordMatchValidator() {
    useEffect(() => {
        const handlePasswordMatch = () => {
            const password = (document.getElementById('password') as HTMLInputElement)?.value
            const confirmPassword = (document.getElementById('confirmPassword') as HTMLInputElement)?.value
            const confirmInput = document.getElementById('confirmPassword') as HTMLInputElement

            if (confirmInput && password && confirmPassword) {
                if (password !== confirmPassword) {
                    confirmInput.setCustomValidity('Las contraseñas no coinciden')
                } else {
                    confirmInput.setCustomValidity('')
                }
            }
        }

        const passwordInput = document.getElementById('password')
        const confirmInput = document.getElementById('confirmPassword')

        passwordInput?.addEventListener('input', handlePasswordMatch)
        confirmInput?.addEventListener('input', handlePasswordMatch)

        // Cleanup
        return () => {
            passwordInput?.removeEventListener('input', handlePasswordMatch)
            confirmInput?.removeEventListener('input', handlePasswordMatch)
        }
    }, [])

    return null
}
