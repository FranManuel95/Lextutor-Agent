'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Upload, FileText, Trash2, RefreshCw, AlertTriangle, MessageSquare, LogOut } from 'lucide-react'
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { Copyright } from '@/components/copyright'

interface RagDocument {
    id: string
    document_name: string
    display_name: string
    area: string
    created_at: string
}

export default function AdminRagPage() {
    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [documents, setDocuments] = useState<RagDocument[]>([])
    const [loadingDocs, setLoadingDocs] = useState(true)
    const [docToDelete, setDocToDelete] = useState<RagDocument | null>(null)
    const { toast } = useToast()

    useEffect(() => {
        fetchDocuments()
    }, [])

    const fetchDocuments = async () => {
        setLoadingDocs(true)
        try {
            const res = await fetch('/api/rag/documents')
            if (!res.ok) throw new Error('Failed to fetch')
            const data = await res.json()
            setDocuments(data || [])
        } catch (error) {
            console.error(error)
            toast({
                title: "Error al cargar documentos",
                description: "No se pudo conectar con la base de datos.",
                variant: "destructive"
            })
        } finally {
            setLoadingDocs(false)
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
        }
    }

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!file) return

        setUploading(true)
        const formData = new FormData()
        formData.append('file', file)
        formData.append('displayName', file.name)

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            })

            if (!res.ok) throw new Error('Upload failed')

            toast({
                title: "Documento subido",
                description: "El manual se ha digitalizado correctamente.",
            })

            setFile(null)
            fetchDocuments()
        } catch (error) {
            console.error(error)
            toast({
                title: "Error al subir",
                description: "Ocurrió un error al procesar el archivo.",
                variant: "destructive"
            })
        } finally {
            setUploading(false)
        }
    }

    const confirmDelete = async () => {
        if (!docToDelete) return

        try {
            const encodedName = encodeURIComponent(docToDelete.document_name)
            const res = await fetch(`/api/rag/documents/${encodedName}`, {
                method: 'DELETE',
            })

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}))
                throw new Error(errData.error || 'Delete failed')
            }

            toast({
                title: "Documento eliminado",
                description: "Se ha borrado del vector store y base de datos.",
            })

            setDocToDelete(null) // Close modal first
            fetchDocuments() // Then refresh list
        } catch (error: any) {
            console.error(error)
            toast({
                title: "Error al eliminar",
                description: error.message || "No se pudo eliminar el documento.",
                variant: "destructive"
            })
            setDocToDelete(null)
        }
    }

    return (
        <div className="min-h-screen bg-gem-onyx p-8 font-sans">
            <div className="max-w-5xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-serif italic text-law-gold">Gestión RAG</h1>
                        <p className="text-gem-offwhite/60 text-sm mt-1">Sube, gestiona y elimina manuales jurídicos.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/chat">
                            <Button variant="ghost" className="text-gray-400 hover:text-white hover:bg-white/5 gap-2">
                                <MessageSquare size={16} /> Ir a Chat
                            </Button>
                        </Link>
                        <Button
                            variant="ghost"
                            onClick={async () => {
                                const supabase = createClient()
                                await supabase.auth.signOut()
                                window.location.href = '/'
                            }}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-2"
                        >
                            <LogOut size={16} /> Cerrar Sesión
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Upload Section */}
                    <Card className="bg-gem-slate/50 border-law-accent/30 backdrop-blur-md shadow-2xl">
                        <CardHeader>
                            <CardTitle className="text-white font-serif">Digitalizar Nuevos Manuales</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleUpload} className="flex flex-col gap-6">
                                <div className="border-2 border-dashed border-law-accent/50 rounded-xl p-8 flex flex-col items-center justify-center bg-gem-onyx/50 hover:bg-gem-onyx/80 transition-colors group">
                                    <Upload className="h-10 w-10 text-law-gold mb-4 group-hover:scale-110 transition-transform" />
                                    <Label htmlFor="document" className="cursor-pointer text-center w-full">
                                        <span className="block text-lg font-medium text-white mb-1">Soltar archivos</span>
                                        <span className="block text-sm text-gray-500 uppercase tracking-widest">PDF • TXT • MD</span>
                                    </Label>
                                    <Input
                                        id="document"
                                        type="file"
                                        accept=".pdf,.txt,.md"
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                    {file && (
                                        <div className="mt-4 px-4 py-2 bg-law-gold/10 text-law-gold rounded-full text-sm font-medium animate-in fade-in slide-in-from-bottom-2">
                                            {file.name}
                                        </div>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    disabled={!file || uploading}
                                    className="w-full bg-law-accent hover:bg-law-accent/80 text-white font-bold tracking-wide py-6"
                                >
                                    {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    {uploading ? 'PROCESANDO...' : 'DIGITALIZAR MANUAL'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Documents List */}
                    <Card className="bg-gem-slate/50 border-law-accent/30 backdrop-blur-md shadow-2xl">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-white font-serif">Biblioteca Global ({documents.length})</CardTitle>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={fetchDocuments}
                                    className="text-law-gold hover:text-law-gold hover:bg-law-gold/10 h-8 gap-2"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                {loadingDocs ? (
                                    <div className="flex justify-center p-8 text-law-gold">
                                        <Loader2 className="h-8 w-8 animate-spin" />
                                    </div>
                                ) : documents.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-gray-800 rounded-xl">
                                        <p className="text-gray-500 mb-2">⚠ NO HAY BIBLIOTECA ACTIVA.</p>
                                    </div>
                                ) : (
                                    documents.map((doc) => (
                                        <div key={doc.id} className="group flex items-center justify-between p-4 border border-law-accent/20 rounded-lg bg-gem-onyx/40 hover:bg-gem-onyx/60 transition-colors">
                                            <div className="flex items-center gap-4 overflow-hidden">
                                                <div className="p-2 bg-blue-500/10 rounded-lg shrink-0">
                                                    <FileText className="h-5 w-5 text-blue-400" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium text-gray-200 group-hover:text-white transition-colors text-sm truncate">{doc.display_name}</p>
                                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">{new Date(doc.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="hover:bg-red-500/10 hover:text-red-400 transition-colors shrink-0"
                                                onClick={() => setDocToDelete(doc)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Custom Modal to avoid Recursion Error */}
                {docToDelete && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        <div className="fixed inset-0 bg-black/80 animate-in fade-in-0" onClick={() => setDocToDelete(null)} />
                        <div className="relative z-50 grid w-full max-w-lg gap-4 border border-law-accent/50 bg-gem-slate p-6 shadow-lg sm:rounded-lg animate-in fade-in-0 zoom-in-95">
                            <div className="flex flex-col space-y-2 text-center sm:text-left">
                                <h2 className="text-lg font-semibold text-white">¿Estás seguro?</h2>
                                <p className="text-sm text-gem-offwhite/60">
                                    Esta acción no se puede deshacer. Se eliminará permanentemente
                                    <span className="font-bold text-white px-1">{docToDelete.display_name}</span>
                                    del índice de búsqueda y de la base de datos.
                                </p>
                            </div>
                            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setDocToDelete(null)}
                                    className="bg-transparent border-law-accent/50 text-white hover:bg-white/10 hover:text-white mt-2 sm:mt-0"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={confirmDelete}
                                    className="bg-red-900 text-red-100 hover:bg-red-800"
                                >
                                    Eliminar
                                </Button>
                            </div>
                        </div>
                    </div>
                )}


                <div className="mt-auto pt-10">
                    <Copyright />
                </div>
            </div>
        </div>
    )
}
