"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { FileText, Loader2, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import { generateInfographicAction } from "@/app/(dashboard)/chat/actions/generate-infographic";
import dynamic from "next/dynamic";

const InfographicModal = dynamic(
  () => import("./InfographicModal").then((mod) => mod.InfographicModal),
  { ssr: false }
);

interface ReportTriggerProps {
  chatId: string;
}

export function ReportTrigger({ chatId }: ReportTriggerProps) {
  const { toast } = useToast();
  const [status, setStatus] = React.useState<"idle" | "generating" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [data, setData] = React.useState<{ url: string; topic: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isErrorOpen, setIsErrorOpen] = React.useState(false);

  const handleGenerate = async () => {
    if (status === "generating") return;

    setStatus("generating");
    setErrorMsg(null);
    toast({
      title: "Generando Resumen Visual...",
      description: "Analizando conversación y diseñando infografía...",
    });

    try {
      const res = await generateInfographicAction(chatId);

      if (res.success && res.imageUrl && res.topic) {
        setData({ url: res.imageUrl, topic: res.topic });
        setStatus("done");
        toast({
          title: "¡Infografía lista!",
          description: "Tu resumen visual está listo para descargar.",
        });
      } else {
        const msg = res.error ?? "No se pudo generar el resumen visual.";
        setErrorMsg(msg);
        setStatus("error");
      }
    } catch {
      setErrorMsg("Error de conexión con el servicio. Inténtalo de nuevo.");
      setStatus("error");
    }
  };

  const handleRetry = () => {
    setIsErrorOpen(false);
    setStatus("idle");
    handleGenerate();
  };

  return (
    <>
      <InfographicModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        imageUrl={data?.url || null}
        topic={data?.topic || "Resumen"}
      />

      {/* Error detail dialog */}
      <Dialog open={isErrorOpen} onOpenChange={setIsErrorOpen}>
        <DialogContent className="border-red-500/20 bg-gem-onyx sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-4 w-4" />
              No se pudo generar la infografía
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <p className="text-sm text-gray-300">
              Ocurrió un error al intentar generar el resumen visual. Puedes reintentar o esperar
              unos minutos si el servicio está sobrecargado.
            </p>
            {errorMsg && (
              <div className="rounded-md border border-white/10 bg-gem-slate p-3">
                <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-gray-500">
                  Detalle del error
                </p>
                <p className="font-mono text-xs text-red-300/80">{errorMsg}</p>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setIsErrorOpen(false)}
              className="text-gray-400 hover:bg-white/5 hover:text-white"
            >
              Cerrar
            </Button>
            <Button
              onClick={handleRetry}
              className="bg-law-gold text-gem-onyx hover:bg-law-gold/80"
            >
              <RefreshCw className="mr-2 h-3.5 w-3.5" />
              Reintentar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {status === "idle" && (
        <Button
          onClick={handleGenerate}
          className="h-9 gap-2 rounded-full border-none bg-gradient-to-br from-law-gold to-yellow-600 px-3 text-xs font-bold text-gem-onyx shadow-lg shadow-law-gold/10 transition-all hover:scale-105 hover:from-law-gold/90 hover:to-yellow-600/90 md:px-4"
        >
          <FileText className="h-4 w-4" />
          <span className="hidden md:inline">Generar Resumen</span>
        </Button>
      )}

      {status === "generating" && (
        <Button
          disabled
          className="h-9 cursor-wait gap-2 rounded-full border border-law-gold/30 bg-law-gold/20 px-3 text-xs font-medium text-law-gold md:px-4"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="hidden md:inline">Generando...</span>
        </Button>
      )}

      {status === "done" && (
        <Button
          onClick={() => setIsModalOpen(true)}
          className="animate-in fade-in zoom-in h-9 gap-2 rounded-full border border-green-500 bg-green-600 px-3 text-xs font-medium text-white shadow-lg shadow-green-900/20 duration-300 hover:bg-green-700 md:px-4"
        >
          <CheckCircle2 className="h-4 w-4" />
          <span className="hidden md:inline">Ver Resumen</span>
        </Button>
      )}

      {status === "error" && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsErrorOpen(true)}
            className="flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 text-xs text-red-400 transition-colors hover:border-red-500/50 hover:bg-red-500/20"
          >
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden md:inline">Error — ver detalle</span>
          </button>
          <Button
            onClick={handleGenerate}
            variant="ghost"
            size="sm"
            className="h-9 w-9 rounded-full p-0 text-gem-offwhite/50 hover:bg-law-gold/10 hover:text-law-gold"
            title="Reintentar"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </>
  );
}
