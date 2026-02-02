'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Trash2, Eye, Flame, Trophy, Calendar, Filter, CheckCircle2, ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { getExamLevel, getLevelColor } from '@/lib/exams/level'
import Link from 'next/link'
import { useToast } from '@/components/ui/use-toast'
import { Copyright } from '@/components/copyright'
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function ExamsHistoryPage() {
    const [stats, setStats] = useState<any>(null)
    const [attempts, setAttempts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [filters, setFilters] = useState({ type: 'all', area: 'all' })
    const { toast } = useToast()
    const [deleteId, setDeleteId] = useState<string | null>(null)

    const fetchHistory = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (filters.type !== 'all') params.set('type', filters.type)
            if (filters.area !== 'all') params.set('area', filters.area)
            params.set('limit', '50')

            const res = await fetch(`/api/exams?${params.toString()}`, { cache: 'no-store' })
            const data = await res.json()
            if (data.items) setAttempts(data.items)
            if (data.stats) setStats(data.stats)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchHistory()
    }, [filters])

    const handleDelete = (id: string) => {
        setDeleteId(id)
    }

    const handleDeleteConfirm = async (id: string) => {
        try {
            const res = await fetch(`/api/exams/${id}`, { method: 'DELETE' })
            if (res.ok) {
                toast({ title: 'Intento eliminado' })
                fetchHistory()
            } else {
                toast({ title: 'Error al eliminar', variant: 'destructive' })
            }
        } catch (err) {
            toast({ title: 'Error al eliminar', variant: 'destructive' })
        } finally {
            setDeleteId(null)
        }
    }

    const getTypeLabel = (t: string) => {
        if (t === 'quiz') return 'Test Rápido'
        if (t === 'exam_open') return 'Examen Desarrollo'
        return t
    }

    return (
        <div className="h-full w-full bg-gem-onyx text-gem-offwhite font-sans flex flex-col overflow-hidden">
            <div className="flex-none border-b border-white/5 bg-[#020617]/50 backdrop-blur-sm z-10 px-6 md:px-16">
                <div className="max-w-6xl mx-auto flex justify-between items-center py-6 md:pt-8 md:pb-4">
                    <div>
                        <h1 className="text-3xl font-bold font-crimson mb-2 text-white text-shadow-sm">Historial de Evaluaciones</h1>
                        <p className="text-gray-500 text-sm">Revisa tu progreso, rachas y calificaciones honestas.</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pt-3 py-6 px-6 md:px-16">
                <div className="max-w-6xl mx-auto space-y-8 pb-10">

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card className="bg-gradient-to-br from-orange-500/10 to-amber-500/5 border-white/5 shadow-lg shadow-black/20">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-orange-400 flex items-center gap-2 uppercase tracking-wider">
                                    <Flame className="w-4 h-4" /> Racha Actual
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-orange-200 pb-2">{stats?.streak || 0} días</div>
                                <p className="text-[10px] text-orange-400/60 uppercase tracking-widest">Estudia mañana para mantenerla</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gem-mist/20 border-white/5 shadow-lg shadow-black/20">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2 uppercase tracking-wider">
                                    <Trophy className="w-4 h-4" /> Mejor Racha
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-white">{stats?.longestStreak || 0} días</div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gem-mist/20 border-white/5 shadow-lg shadow-black/20">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-gray-400 uppercase tracking-wider">Media Test</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-white">
                                    {stats?.averages?.byType?.quiz ? stats.averages.byType.quiz : '—'}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gem-mist/20 border-white/5 shadow-lg shadow-black/20">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-gray-400 uppercase tracking-wider">Media Desarrollo</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-white">
                                    {stats?.averages?.byType?.exam_open ? stats.averages.byType.exam_open : '—'}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center p-4 rounded-xl border border-white/5 bg-gem-mist/10 shadow-sm">
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-400 md:hidden">Filtrar por:</span>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                            <Select value={filters.type} onValueChange={v => setFilters({ ...filters, type: v })}>
                                <SelectTrigger className="w-full md:w-[180px] bg-transparent border-white/10 text-gray-300">
                                    <SelectValue placeholder="Tipo" />
                                </SelectTrigger>
                                <SelectContent className="bg-gem-onyx border-white/10 text-gray-300">
                                    <SelectItem value="all">Todos los tipos</SelectItem>
                                    <SelectItem value="quiz">Test Rápido</SelectItem>
                                    <SelectItem value="exam_open">Examen Desarrollo</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={filters.area} onValueChange={v => setFilters({ ...filters, area: v })}>
                                <SelectTrigger className="w-full md:w-[180px] bg-transparent border-white/10 text-gray-300">
                                    <SelectValue placeholder="Área" />
                                </SelectTrigger>
                                <SelectContent className="bg-gem-onyx border-white/10 text-gray-300">
                                    <SelectItem value="all">Todas las áreas</SelectItem>
                                    <SelectItem value="laboral">Laboral</SelectItem>
                                    <SelectItem value="civil">Civil</SelectItem>
                                    <SelectItem value="mercantil">Mercantil</SelectItem>
                                    <SelectItem value="procesal">Procesal</SelectItem>
                                    <SelectItem value="otro">Otro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Table */}
                    <Card className="bg-gem-mist/10 border-white/5 shadow-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <Table className="min-w-[800px]">
                                <TableHeader className="bg-white/5">
                                    <TableRow className="border-white/5 hover:bg-transparent">
                                        <TableHead className="text-gray-400">Fecha</TableHead>
                                        <TableHead className="text-gray-400">Tipo</TableHead>
                                        <TableHead className="text-gray-400">Área</TableHead>
                                        <TableHead className="text-gray-400">Nota</TableHead>
                                        <TableHead className="text-gray-400">Nivel</TableHead>
                                        <TableHead className="text-gray-400">Estado</TableHead>
                                        <TableHead className="text-right text-gray-400">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading && attempts.length === 0 ? (
                                        <TableRow className="border-white/5">
                                            <TableCell colSpan={7} className="h-64 text-center">
                                                <div className="flex flex-col items-center justify-center gap-2 text-gray-500">
                                                    <div className="w-8 h-8 border-2 border-law-gold/30 border-t-law-gold rounded-full animate-spin"></div>
                                                    <span className="text-sm font-medium">Cargando evaluaciones...</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : attempts.length === 0 ? (
                                        <TableRow className="border-white/5">
                                            <TableCell colSpan={7} className="h-96 text-center">
                                                <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-4">
                                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
                                                        <Calendar className="w-8 h-8 text-gray-600" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <h3 className="text-lg font-medium text-gray-300">No hay evaluaciones</h3>
                                                        <p className="text-sm text-gray-500">Todavía no has realizado ningún test o examen. ¡Empieza tu primera práctica!</p>
                                                    </div>
                                                    <div className="flex gap-3 pt-2">
                                                        <Link href="/quiz">
                                                            <Button variant="secondary" size="sm" className="bg-blue-900/20 text-blue-400 hover:bg-blue-900/30 border border-blue-500/20">
                                                                Test Rápido
                                                            </Button>
                                                        </Link>
                                                        <Link href="/exam">
                                                            <Button variant="secondary" size="sm" className="bg-purple-900/20 text-purple-400 hover:bg-purple-900/30 border border-purple-500/20">
                                                                Examen Abierto
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        attempts.map((attempt) => {
                                            const level = getExamLevel(attempt.score || 0)
                                            return (
                                                <TableRow key={attempt.id} className="border-white/5 hover:bg-white/5 transition-colors">
                                                    <TableCell className="font-medium text-gray-300">
                                                        {format(new Date(attempt.created_at), "d MMM yyyy, HH:mm", { locale: es })}
                                                    </TableCell>
                                                    <TableCell className="text-gray-300">{getTypeLabel(attempt.attempt_type)}</TableCell>
                                                    <TableCell className="capitalize text-gray-300">{attempt.area}</TableCell>
                                                    <TableCell>
                                                        <span className={`font-bold ${(attempt.score ?? 0) >= 5 ? 'text-green-400' : 'text-red-400'}`}>
                                                            {(attempt.score ?? 0).toFixed(1)}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col ">
                                                            <Badge variant="outline" className={`${getLevelColor(level)} bg-transparent border-current opacity-80 hover:opacity-100`}>
                                                                {level}
                                                            </Badge>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {attempt.status === 'finished' ? (
                                                            <Badge variant="secondary" className="bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20">Finalizado</Badge>
                                                        ) : (
                                                            <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20">En Progreso</Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right space-x-2">
                                                        <Link href={`/exams/${attempt.id}`}>
                                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-white/10">
                                                                <Eye className="w-4 h-4" />
                                                            </Button>
                                                        </Link>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0 text-red-500/70 hover:text-red-400 hover:bg-red-500/10"
                                                            onClick={() => handleDelete(attempt.id)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                </div>
            </div>


            {/* Confirmation Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent className="bg-gem-onyx border border-white/10 text-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-400">
                            Esta acción eliminará permanentemente este examen y su nota del historial. No se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-transparent text-white border-white/10 hover:bg-white/5 hover:text-white">Cancelar</AlertDialogCancel>
                        <Button
                            variant="destructive"
                            onClick={() => deleteId && handleDeleteConfirm(deleteId)}
                            className="bg-red-500 hover:bg-red-600 text-white border-0"
                        >
                            Eliminar
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
