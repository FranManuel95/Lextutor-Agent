"use client";

import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Download, Loader2 } from "lucide-react";
import { type InfographicContent } from "@/lib/imagen-service";

interface InfographicModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: InfographicContent | null;
  topic: string;
}

export function InfographicModal({ isOpen, onClose, content, topic }: InfographicModalProps) {
  const [isDownloading, setIsDownloading] = React.useState(false);
  const cardRef = React.useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async () => {
    if (!content) return;
    setIsDownloading(true);
    try {
      const { pdf } = await import("@react-pdf/renderer");
      const { InfographicPDF } = await import("./InfographicPDF");
      const blob = await pdf(<InfographicPDF content={content} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Resumen_${topic.replace(/\s+/g, "_")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error generando PDF:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  if (!content) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {/* [&>button]:hidden suppresses the Radix built-in close button; we render our own in the toolbar */}
      <DialogContent className="flex h-[90vh] max-w-2xl flex-col overflow-hidden border border-gem-border/40 bg-gem-mist p-0 shadow-2xl [&>button]:hidden">
        {/* Toolbar */}
        <div className="flex shrink-0 items-center justify-between border-b border-gem-border/40 px-4 py-3">
          <p className="font-serif text-sm italic text-law-gold/80">Resumen Visual</p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="gap-1.5 bg-law-gold text-white hover:bg-law-gold/90 dark:text-gem-onyx"
            >
              {isDownloading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              <span className="hidden md:inline">
                {isDownloading ? "Generando..." : "Descargar PDF"}
              </span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-full text-gem-muted hover:bg-gem-slate hover:text-gem-offwhite"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Infographic Card */}
        <div className="custom-scrollbar flex-1 overflow-y-auto p-6">
          <div
            ref={cardRef}
            className="mx-auto max-w-sm overflow-hidden rounded-lg shadow-2xl"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            {/* Kraft paper background */}
            <div
              className="min-h-full"
              style={{
                background: "linear-gradient(145deg, #f5e6c8 0%, #ede0c4 40%, #e8d5b0 100%)",
                borderTop: "4px solid #8B6914",
              }}
            >
              {/* Header tag */}
              <div className="px-5 pt-5">
                <div className="inline-block rounded-sm bg-amber-900/15 px-2 py-0.5">
                  <span
                    className="text-[10px] font-bold uppercase tracking-widest text-amber-900"
                    style={{ fontFamily: "monospace" }}
                  >
                    LexTutor Agent
                  </span>
                </div>
              </div>

              {/* Main title — sticker style */}
              <div className="px-5 pb-4 pt-2">
                <div
                  className="rounded-md border-2 border-dashed border-amber-800/40 bg-amber-100/70 px-4 py-3 shadow-sm"
                  style={{ transform: "rotate(-0.5deg)" }}
                >
                  <h1
                    className="text-center text-xl font-bold uppercase leading-tight tracking-wide text-amber-950"
                    style={{ fontFamily: "Georgia, serif", textShadow: "1px 1px 0 #c8a96e40" }}
                  >
                    {content.topic}
                  </h1>
                </div>
              </div>

              {/* Tape divider */}
              <div className="flex items-center gap-2 px-5 pb-3">
                <div className="h-px flex-1 border-t border-dashed border-amber-700/30" />
                <div className="h-2 w-8 rounded-sm bg-amber-300/60" />
                <div className="h-px flex-1 border-t border-dashed border-amber-700/30" />
              </div>

              {/* Sections */}
              <div className="space-y-3 px-5 pb-4">
                {content.sections.map((section, i) => (
                  <div
                    key={i}
                    className="rounded-sm border border-amber-800/30 bg-white/60 p-3 shadow-sm"
                    style={{
                      transform: `rotate(${i % 2 === 0 ? "0.3deg" : "-0.2deg"})`,
                      boxShadow: "2px 2px 4px rgba(0,0,0,0.08)",
                    }}
                  >
                    <h2
                      className="mb-1.5 border-b border-amber-700/20 pb-1 text-[10px] font-bold uppercase tracking-widest text-amber-800"
                      style={{ fontFamily: "monospace" }}
                    >
                      {section.title}
                    </h2>
                    <p
                      className="text-xs leading-relaxed text-amber-950/90"
                      style={{ fontFamily: "Georgia, serif" }}
                    >
                      {section.content}
                    </p>
                  </div>
                ))}
              </div>

              {/* Footer strip */}
              <div
                className="mx-5 mb-5 rounded-sm px-3 py-2"
                style={{
                  background: "rgba(139, 105, 20, 0.12)",
                  borderTop: "1px dashed rgba(139, 105, 20, 0.4)",
                }}
              >
                <p
                  className="text-center text-[10px] italic text-amber-800/80"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  {content.footer_context}
                </p>
                <p
                  className="mt-1 text-center text-[9px] uppercase tracking-widest text-amber-700/50"
                  style={{ fontFamily: "monospace" }}
                >
                  Estudiante Elite · LexTutor AI
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
