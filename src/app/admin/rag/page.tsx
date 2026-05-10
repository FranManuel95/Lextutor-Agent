"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Upload,
  FileText,
  Trash2,
  RefreshCw,
  MessageSquare,
  LogOut,
  AlertTriangle,
  Info,
  CheckCircle2,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
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

const AREAS = [
  { value: "general", label: "General" },
  { value: "laboral", label: "Laboral" },
  { value: "civil", label: "Civil" },
  { value: "mercantil", label: "Mercantil" },
  { value: "procesal", label: "Procesal" },
  { value: "otro", label: "Otro" },
] as const;

const AREA_COLORS: Record<string, string> = {
  laboral: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  civil: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  mercantil: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  procesal: "bg-green-500/15 text-green-300 border-green-500/30",
  otro: "bg-gray-500/15 text-gray-300 border-gray-500/30",
  general: "bg-slate-500/15 text-slate-300 border-slate-500/30",
};

const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".doc", ".txt"];
const ACCEPTED_MIME =
  "application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,text/plain";
const WARN_MB = 50;
const DANGER_MB = 150;
const MAX_MB = 500;

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileSizeLevel(file: File): "ok" | "warn" | "danger" | "over" {
  const mb = file.size / (1024 * 1024);
  if (mb > MAX_MB) return "over";
  if (mb > DANGER_MB) return "danger";
  if (mb > WARN_MB) return "warn";
  return "ok";
}

function estimatedTime(file: File): string {
  const mb = file.size / (1024 * 1024);
  if (mb < 5) return "< 30 s";
  if (mb < 20) return "~1 min";
  if (mb < 60) return "1–2 min";
  if (mb < 150) return "2–4 min";
  return "4–8 min";
}

export default function AdminRagPage() {
  const [file, setFile] = useState<File | null>(null);
  const [area, setArea] = useState("general");
  const [uploading, setUploading] = useState(false);
  const [largFileConfirmed, setLargeFileConfirmed] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [documents, setDocuments] = useState<RagDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [docToDelete, setDocToDelete] = useState<RagDocument | null>(null);
  const { toast } = useToast();
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Reset large-file confirmation whenever file changes
  useEffect(() => {
    setLargeFileConfirmed(false);
  }, [file]);

  const fetchDocuments = async () => {
    setLoadingDocs(true);
    try {
      const res = await fetch("/api/rag/documents?limit=200");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setDocuments(Array.isArray(data) ? data : (data.items ?? []));
    } catch {
      toast({
        title: "Error al cargar documentos",
        description: "No se pudo conectar con la base de datos.",
        variant: "destructive",
      });
    } finally {
      setLoadingDocs(false);
    }
  };

  const applyFile = useCallback(
    (f: File) => {
      const ext = f.name.slice(f.name.lastIndexOf(".")).toLowerCase();
      if (!ACCEPTED_EXTENSIONS.includes(ext)) {
        toast({
          title: "Formato no soportado",
          description: `Solo se aceptan: ${ACCEPTED_EXTENSIONS.join(", ")}`,
          variant: "destructive",
        });
        return;
      }
      const mb = f.size / (1024 * 1024);
      if (mb > MAX_MB) {
        toast({
          title: "Archivo demasiado grande",
          description: `El límite es ${MAX_MB} MB. Este archivo pesa ${formatBytes(f.size)}.`,
          variant: "destructive",
        });
        return;
      }
      setFile(f);
    },
    [toast]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) applyFile(e.target.files[0]);
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    if (!dropRef.current?.contains(e.relatedTarget as Node)) setDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) applyFile(dropped);
  };

  const sizeLevel = file ? fileSizeLevel(file) : null;
  const needsConfirmation = sizeLevel === "danger" && !largFileConfirmed;
  const canSubmit = !!file && !uploading && sizeLevel !== "over" && !needsConfirmation;

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !canSubmit) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("displayName", file.name.replace(/\.[^.]+$/, ""));
    formData.append("area", area);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(data.error ?? "Upload failed");

      toast({
        title: "Documento subido",
        description: `"${file.name.replace(/\.[^.]+$/, "")}" ya está disponible en el índice RAG.`,
      });
      setFile(null);
      fetchDocuments();
    } catch (error: unknown) {
      toast({
        title: "Error al subir",
        description:
          error instanceof Error ? error.message : "Error desconocido al procesar el archivo.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const confirmDelete = async () => {
    if (!docToDelete) return;
    try {
      const res = await fetch(
        `/api/rag/documents/${encodeURIComponent(docToDelete.document_name)}`,
        {
          method: "DELETE",
        }
      );
      const errData = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(errData.error ?? "Delete failed");

      toast({
        title: "Documento eliminado",
        description: "Borrado del vector store y base de datos.",
      });
      setDocToDelete(null);
      fetchDocuments();
    } catch (error: unknown) {
      toast({
        title: "Error al eliminar",
        description: error instanceof Error ? error.message : "No se pudo eliminar el documento.",
        variant: "destructive",
      });
      setDocToDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-gem-onyx p-8 font-sans">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header */}
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
                className="gap-2 text-gem-muted hover:bg-gem-slate hover:text-gem-offwhite"
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
              className="gap-2 text-red-700 hover:bg-red-500/10 hover:text-red-300 dark:text-red-400"
            >
              <LogOut size={16} /> Cerrar Sesión
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Upload Section */}
          <Card className="border-law-accent/30 bg-gem-slate/50 shadow-2xl backdrop-blur-md">
            <CardHeader>
              <CardTitle className="font-serif text-gem-offwhite">
                Digitalizar Nuevo Manual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpload} className="flex flex-col gap-5">
                {/* Drop zone */}
                <div
                  ref={dropRef}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById("document")?.click()}
                  className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors ${
                    dragging
                      ? "border-law-gold bg-law-gold/10"
                      : "border-law-accent/50 bg-gem-onyx/50 hover:bg-gem-onyx/80"
                  }`}
                >
                  <Upload className="mb-3 h-9 w-9 text-law-gold" />
                  <span className="mb-1 text-base font-medium text-gem-offwhite">
                    Arrastra o haz clic para seleccionar
                  </span>
                  <Input
                    id="document"
                    type="file"
                    accept={ACCEPTED_MIME}
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  {file ? (
                    <div className="mt-3 flex items-center gap-2 rounded-full bg-law-gold/10 px-4 py-2 text-sm font-medium text-law-gold">
                      <FileText size={14} />
                      <span className="max-w-[180px] truncate">{file.name}</span>
                      <span className="shrink-0 text-law-gold/60">· {formatBytes(file.size)}</span>
                    </div>
                  ) : null}
                </div>

                {/* File specs */}
                <div className="rounded-lg border border-gem-border/40 bg-gem-slate/60 px-4 py-3 text-xs text-gem-offwhite/85">
                  <div className="mb-1.5 flex items-center gap-1.5 font-semibold text-gem-offwhite">
                    <Info size={12} /> Especificaciones
                  </div>
                  <ul className="space-y-0.5">
                    <li>
                      Formatos:{" "}
                      <span className="font-medium text-gem-offwhite">PDF, DOCX, DOC, TXT</span>
                    </li>
                    <li>
                      Tamaño máximo: <span className="font-medium text-gem-offwhite">500 MB</span>
                    </li>
                    <li>
                      Tiempo estimado:{" "}
                      <span className="font-medium text-gem-offwhite">
                        &lt;5 MB → 30 s · &gt;50 MB → 2–4 min
                      </span>
                    </li>
                    <li>⚠ No cierres el navegador mientras se procesa.</li>
                  </ul>
                </div>

                {/* Size warnings */}
                {sizeLevel === "warn" && file && (
                  <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                    <div>
                      <span className="font-semibold">
                        Archivo grande ({formatBytes(file.size)})
                      </span>
                      <p className="mt-0.5 text-xs text-amber-300/80">
                        El procesamiento tardará ~{estimatedTime(file)}. No cierres el navegador.
                      </p>
                    </div>
                  </div>
                )}

                {sizeLevel === "danger" && file && (
                  <div className="flex flex-col gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                      <div>
                        <span className="font-semibold">
                          Archivo muy grande ({formatBytes(file.size)})
                        </span>
                        <p className="mt-0.5 text-xs text-red-300/80">
                          Tiempo estimado: {estimatedTime(file)}. Existe riesgo de timeout si el
                          servidor tarda más de 2 minutos. Considera dividir el documento en partes
                          más pequeñas para mayor fiabilidad.
                        </p>
                      </div>
                    </div>
                    {!largFileConfirmed ? (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setLargeFileConfirmed(true)}
                        className="w-full border border-red-500/50 bg-red-50 text-red-800 hover:bg-red-100 dark:bg-red-900/40 dark:text-red-200 dark:hover:bg-red-900/60"
                      >
                        Entendido — subir de todas formas
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-green-400">
                        <CheckCircle2 size={13} /> Confirmado
                      </div>
                    )}
                  </div>
                )}

                {/* Area selector */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium text-gem-offwhite/80">Área jurídica</Label>
                  <Select value={area} onValueChange={setArea}>
                    <SelectTrigger className="border-gem-border/60 bg-gem-mist font-medium text-gem-offwhite focus:ring-law-gold/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-gem-border/60 bg-gem-mist">
                      {AREAS.map((a) => (
                        <SelectItem
                          key={a.value}
                          value={a.value}
                          className="text-gem-offwhite focus:bg-gem-slate"
                        >
                          {a.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full bg-law-accent py-6 font-bold tracking-wide text-gem-offwhite hover:bg-law-accent/80 disabled:opacity-40"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      PROCESANDO… {file ? `(${estimatedTime(file)} estimado)` : ""}
                    </>
                  ) : (
                    "DIGITALIZAR MANUAL"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Documents List */}
          <Card className="border-law-accent/30 bg-gem-slate/50 shadow-2xl backdrop-blur-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-serif text-gem-offwhite">
                  Biblioteca Global ({documents.length})
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchDocuments}
                  className="h-8 gap-2 text-law-gold hover:bg-law-gold/10"
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
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gem-border/40 p-8 text-center">
                    <p className="text-sm text-gem-muted">No hay documentos indexados.</p>
                    <p className="mt-1 text-xs text-gem-muted/70">
                      Sube el primer manual para activar el RAG.
                    </p>
                  </div>
                ) : (
                  documents.map((doc) => {
                    const areaColor = AREA_COLORS[doc.area] ?? AREA_COLORS.general;
                    return (
                      <div
                        key={doc.id}
                        className="group flex items-center justify-between rounded-lg border border-law-accent/20 bg-gem-onyx/40 p-4 transition-colors hover:bg-gem-onyx/60"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <div className="shrink-0 rounded-lg bg-blue-500/10 p-2">
                            <FileText className="h-5 w-5 text-blue-700 dark:text-blue-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-gem-offwhite/80 transition-colors group-hover:text-gem-offwhite">
                              {doc.display_name}
                            </p>
                            <div className="mt-1 flex items-center gap-2">
                              <span
                                className={`inline-block rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest ${areaColor}`}
                              >
                                {doc.area}
                              </span>
                              <span className="text-[10px] text-gem-muted">
                                {new Date(doc.created_at).toLocaleDateString("es-ES")}
                              </span>
                            </div>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 transition-colors hover:bg-red-500/10 hover:text-red-700 dark:hover:text-red-400"
                          onClick={() => setDocToDelete(doc)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Delete confirmation modal */}
        {docToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="animate-in fade-in-0 fixed inset-0 bg-black/80"
              onClick={() => setDocToDelete(null)}
            />
            <div className="animate-in fade-in-0 zoom-in-95 relative z-50 grid w-full max-w-lg gap-4 border border-law-accent/50 bg-gem-slate p-6 shadow-lg sm:rounded-lg">
              <div className="flex flex-col space-y-2 text-center sm:text-left">
                <h2 className="text-lg font-semibold text-gem-offwhite">¿Eliminar documento?</h2>
                <p className="text-sm text-gem-offwhite/60">
                  Esta acción no se puede deshacer. Se eliminará permanentemente{" "}
                  <span className="font-bold text-gem-offwhite">{docToDelete.display_name}</span>{" "}
                  del índice RAG y de la base de datos.
                </p>
              </div>
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setDocToDelete(null)}
                  className="mt-2 border-law-accent/50 bg-transparent text-gem-offwhite hover:bg-gem-slate sm:mt-0"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={confirmDelete}
                  className="bg-red-700 text-red-50 hover:bg-red-800 dark:bg-red-900 dark:text-red-100 dark:hover:bg-red-800"
                >
                  Eliminar
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="pt-10">
          <Copyright />
        </div>
      </div>
    </div>
  );
}
