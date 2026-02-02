'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAppStore } from '@/store/useAppStore'
import { Settings2, Save, RotateCcw, Check } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

export function SettingsDialog() {
    const { tutorSettings, setTutorSettings } = useAppStore()
    const [open, setOpen] = useState(false)
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)

    // Local state for edits
    const [localSettings, setLocalSettings] = useState(tutorSettings)

    // Sync when opening or when store changes externally
    useEffect(() => {
        if (open) setLocalSettings(tutorSettings)
    }, [open, tutorSettings])

    const modes = [
        { id: 'feynman', label: 'Feynman' },
        { id: 'quiz', label: 'Modo Quiz' },
        { id: 'caseMode', label: 'Caso Práctico' },
    ] as const

    const toggleMode = (mode: string) => {
        setLocalSettings(prev => {
            const current = new Set(prev.modes)
            // Mutually Exclusive Logic:
            // If clicking the active mode, we deselect it (return to Normal/None).
            // If clicking a new mode, we replace the old one (only 1 active).
            if (current.has(mode as any)) {
                return { ...prev, modes: [] }
            } else {
                return { ...prev, modes: [mode as any] }
            }
        })
    }

    const handleSave = async () => {
        setLoading(true)
        try {
            // Update Store
            setTutorSettings(localSettings)

            // Persist to API
            const res = await fetch('/api/me/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(localSettings)
            })

            if (!res.ok) throw new Error('Failed to save')

            toast({ title: "Ajustes guardados", description: "El tutor se ha actualizado." })
            setOpen(false)
        } catch (error) {
            toast({ title: "Error", description: "No se pudieron guardar los ajustes.", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-law-gold">
                    <Settings2 size={20} />
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-gem-onyx border-law-accent/20 text-gem-offwhite max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-xl font-serif italic text-white">Ajustes del Tutor</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Area */}
                    <div className="space-y-2">
                        <Label>Área de Derecho</Label>
                        <Select
                            value={localSettings.area}
                            onValueChange={(v: any) => setLocalSettings(s => ({ ...s, area: v }))}
                        >
                            <SelectTrigger className="bg-gem-mist/20 border-white/10 text-white">
                                <SelectValue placeholder="Selecciona área" />
                            </SelectTrigger>
                            <SelectContent className="bg-gem-onyx border-law-accent/20 text-white">
                                <SelectItem value="general">General</SelectItem>
                                <SelectItem value="laboral">Laboral</SelectItem>
                                <SelectItem value="civil">Civil</SelectItem>
                                <SelectItem value="mercantil">Mercantil</SelectItem>
                                <SelectItem value="procesal">Procesal</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Modes */}
                    <div className="space-y-2">
                        <Label>Modo de Estudio Activo</Label>
                        <div className="grid grid-cols-1 gap-2">
                            {modes.map(mode => {
                                const isActive = localSettings.modes.includes(mode.id as any)
                                return (
                                    <div
                                        key={mode.id}
                                        onClick={() => toggleMode(mode.id)}
                                        className={cn(
                                            "flex items-center justify-between p-3 rounded-md border text-sm cursor-pointer transition-all select-none",
                                            isActive
                                                ? "bg-law-gold/10 border-law-gold/40 text-white shadow-[0_0_10px_rgba(234,179,8,0.1)]"
                                                : "bg-black/20 border-white/5 text-gray-500 hover:bg-white/5"
                                        )}
                                    >
                                        <span>{mode.label}</span>
                                        {isActive && <Check size={14} className="text-law-gold" />}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

                <div className="flex justify-between gap-3 pt-2">
                    <Button
                        variant="ghost"
                        onClick={() => setLocalSettings({ area: 'general', modes: [], detailLevel: 'normal' })}
                        className="text-gray-500 hover:text-white"
                    >
                        <RotateCcw size={16} className="mr-2" /> Restaurar
                    </Button>
                    <Button onClick={handleSave} disabled={loading} className="bg-law-gold text-gem-onyx hover:bg-law-gold/90 font-bold min-w-[120px]">
                        {loading ? "Guardando..." : <><Save size={16} className="mr-2" /> Guardar</>}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
