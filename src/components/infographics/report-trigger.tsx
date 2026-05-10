"use client";

import React from "react";
import { Button } from "@/components/ui/button";
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
        toast({
          title: "No se pudo generar la infografía",
          description: msg,
          variant: "destructive",
        });
      }
    } catch {
      const msg = "Error de conexión con el servicio. Inténtalo de nuevo.";
      setErrorMsg(msg);
      setStatus("error");
      toast({
        title: "Error inesperado",
        description: msg,
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <InfographicModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        imageUrl={data?.url || null}
        topic={data?.topic || "Resumen"}
      />

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
          <div
            title={errorMsg ?? undefined}
            className="flex h-9 cursor-help items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 text-xs text-red-400"
          >
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden max-w-[180px] truncate md:inline">
              {errorMsg ?? "Error al generar"}
            </span>
          </div>
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
