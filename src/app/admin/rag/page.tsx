"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Upload,
  FileText,
  Trash2,
  RefreshCw,
  AlertTriangle,
  MessageSquare,
  LogOut,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { Copyright } from "@/components/copyright";

interface RagDocument {
  id: string;
  document_name: string;
  display_name: string;
  area: string;
  created_at: string;
}

export default function AdminRagPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState<RagDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [docToDelete, setDocToDelete] = useState<RagDocument | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoadingDocs(true);
    try {
      const res = await fetch("/api/rag/documents?limit=200");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setDocuments(Array.isArray(data) ? data : data.items || []);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error al cargar documentos",
        description: "No se pudo conectar con la base de datos.",
        variant: "destructive",
      });
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("displayName", file.name);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Upload failed");
      }

      toast({
        title: "Documento subido",
        description: "El manual se ha digitalizado correctamente.",
      });

      setFile(null);
      fetchDocuments();
    } catch (error) {
      console.error(error);
      toast({
        title: "Error al subir",
        description: "Ocurrió un error al procesar el archivo.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const confirmDelete = async () => {
    if (!docToDelete) return;

    try {
      const encodedName = encodeURIComponent(docToDelete.document_name);
      const res = await fetch(`/api/rag/documents/${encodedName}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Delete failed");
      }

      toast({
        title: "Documento eliminado",
        description: "Se ha borrado del vector store y base de datos.",
      });

      setDocToDelete(null); // Close modal first
      fetchDocuments(); // Then refresh list
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error al eliminar",
        description: error.message || "No se pudo eliminar el documento.",
        variant: "destructive",
      });
      setDocToDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-gem-onyx p-8 font-sans">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl italic text-law-gold">Gestión RAG</h1>
            <p className="mt-1 text-sm text-gem-offwhite/60">
              Sube, gestiona y elimina manuales jurídicos.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/chat">
              <Button
                variant="ghost"
                className="gap-2 text-gray-400 hover:bg-white/5 hover:text-white"
              >
                <MessageSquare size={16} /> Ir a Chat
              </Button>
            </Link>
            <Button
              variant="ghost"
              onClick={async () => {
                const supabase = createClient();
                await supabase.auth.signOut();
                window.location.href = "/";
              }}
              className="gap-2 text-red-400 hover:bg-red-500/10 hover:text-red-300"
            >
              <LogOut size={16} /> Cerrar Sesión
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Upload Section */}
          <Card className="border-law-accent/30 bg-gem-slate/50 shadow-2xl backdrop-blur-md">
            <CardHeader>
              <CardTitle className="font-serif text-white">Digitalizar Nuevos Manuales</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpload} className="flex flex-col gap-6">
                <div className="group flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-law-accent/50 bg-gem-onyx/50 p-8 transition-colors hover:bg-gem-onyx/80">
                  <Upload className="mb-4 h-10 w-10 text-law-gold transition-transform group-hover:scale-110" />
                  <Label htmlFor="document" className="w-full cursor-pointer text-center">
                    <span className="mb-1 block text-lg font-medium text-white">
                      Soltar archivos
                    </span>
                    <span className="block text-sm uppercase tracking-widest text-gray-500">
                      PDF • TXT • MD
                    </span>
                  </Label>
                  <Input
                    id="document"
                    type="file"
                    accept=".pdf,.txt,.md"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  {file && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 mt-4 rounded-full bg-law-gold/10 px-4 py-2 text-sm font-medium text-law-gold">
                      {file.name}
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={!file || uploading}
                  className="w-full bg-law-accent py-6 font-bold tracking-wide text-white hover:bg-law-accent/80"
                >
                  {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {uploading ? "PROCESANDO..." : "DIGITALIZAR MANUAL"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Documents List */}
          <Card className="border-law-accent/30 bg-gem-slate/50 shadow-2xl backdrop-blur-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-serif text-white">
                  Biblioteca Global ({documents.length})
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchDocuments}
                  className="h-8 gap-2 text-law-gold hover:bg-law-gold/10 hover:text-law-gold"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="custom-scrollbar max-h-[500px] space-y-3 overflow-y-auto pr-2">
                {loadingDocs ? (
                  <div className="flex justify-center p-8 text-law-gold">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : documents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-800 p-8 text-center">
                    <p className="mb-2 text-gray-500">⚠ NO HAY BIBLIOTECA ACTIVA.</p>
                  </div>
                ) : (
                  documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="group flex items-center justify-between rounded-lg border border-law-accent/20 bg-gem-onyx/40 p-4 transition-colors hover:bg-gem-onyx/60"
                    >
                      <div className="flex items-center gap-4 overflow-hidden">
                        <div className="shrink-0 rounded-lg bg-blue-500/10 p-2">
                          <FileText className="h-5 w-5 text-blue-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-200 transition-colors group-hover:text-white">
                            {doc.display_name}
                          </p>
                          <p className="text-[10px] uppercase tracking-wider text-gray-500">
                            {new Date(doc.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 transition-colors hover:bg-red-500/10 hover:text-red-400"
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
            <div
              className="animate-in fade-in-0 fixed inset-0 bg-black/80"
              onClick={() => setDocToDelete(null)}
            />
            <div className="animate-in fade-in-0 zoom-in-95 relative z-50 grid w-full max-w-lg gap-4 border border-law-accent/50 bg-gem-slate p-6 shadow-lg sm:rounded-lg">
              <div className="flex flex-col space-y-2 text-center sm:text-left">
                <h2 className="text-lg font-semibold text-white">¿Estás seguro?</h2>
                <p className="text-sm text-gem-offwhite/60">
                  Esta acción no se puede deshacer. Se eliminará permanentemente
                  <span className="px-1 font-bold text-white">{docToDelete.display_name}</span>
                  del índice de búsqueda y de la base de datos.
                </p>
              </div>
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setDocToDelete(null)}
                  className="mt-2 border-law-accent/50 bg-transparent text-white hover:bg-white/10 hover:text-white sm:mt-0"
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
  );
}
