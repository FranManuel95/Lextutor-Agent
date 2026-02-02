'use client'

import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/utils/supabase/client'
import { Loader2, Upload, User, Settings, LogOut, Shield } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'

export function ProfileDialog({ children }: { children?: React.ReactNode }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const { toast } = useToast()
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [role, setRole] = useState<string | null>(null)

    const [form, setForm] = useState({
        full_name: '',
        birth_date: '',
        avatar_url: ''
    })

    const supabase = createClient()

    useEffect(() => {
        if (open) {
            fetchProfile()
        }
    }, [open])

    const fetchProfile = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/me/profile')
            const data = await res.json()
            if (data.error) throw new Error(data.error)

            setRole(data.role)
            setForm({
                full_name: data.full_name || '',
                birth_date: data.birth_date || '',
                avatar_url: data.avatar_url || ''
            })
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Upload to Supabase Storage
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `${fileName}`

        try {
            setSaving(true)
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath)

            setForm(prev => ({ ...prev, avatar_url: publicUrl }))

        } catch (error: any) {
            toast({ title: 'Error subiendo imagen', description: error.message, variant: 'destructive' })
        } finally {
            setSaving(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await fetch('/api/me/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            toast({ title: 'Perfil actualizado', className: 'bg-green-500 text-white' })
            setOpen(false)
            router.refresh()
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' })
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-white">
                        <Settings size={14} />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="bg-gem-onyx border-law-accent/20 text-white sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="font-serif text-law-gold">Editar Perfil</DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="flex justify-center p-8"><Loader2 className="animate-spin text-law-gold" /></div>
                ) : (
                    <div className="grid gap-6 py-4">
                        {/* Avatar Section */}
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-law-gold/50 bg-black/20 group">
                                {form.avatar_url ? (
                                    <img src={form.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-law-gold/50">
                                        <User size={40} />
                                    </div>
                                )}
                                <div
                                    className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Upload size={20} className="text-white" />
                                </div>
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                            <p className="text-xs text-gray-500">Click en la imagen para cambiar</p>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="name">Nombre Completo</Label>
                            <Input
                                id="name"
                                value={form.full_name}
                                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                                className="bg-black/20 border-white/10 text-white"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="birth_date">Fecha de Nacimiento</Label>
                            <Input
                                id="birth_date"
                                type="date"
                                value={form.birth_date}
                                onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
                                className="bg-black/20 border-white/10 text-white"
                            />
                        </div>

                        <Button onClick={handleSave} disabled={saving} className="bg-law-gold text-gem-onyx hover:bg-law-gold/90 font-bold">
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar Cambios
                        </Button>

                        <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-4">
                            {role === 'admin' ? (
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setOpen(false)
                                        router.push('/admin')
                                    }}
                                    className="text-law-gold hover:text-law-gold hover:bg-law-gold/10 gap-2"
                                >
                                    <Shield size={16} /> Panel Admin
                                </Button>
                            ) : <div></div>}

                            <Button
                                variant="ghost"
                                onClick={async () => {
                                    const supabase = createClient()
                                    await supabase.auth.signOut()
                                    router.push('/')
                                }}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-2"
                            >
                                <LogOut size={16} /> Cerrar Sesión
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
