"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";

interface ProgressData {
  totalAnswers: number;
  distribution: Record<string, number>;
  milestones: Array<{ title: string; desc: string; unlocked: boolean }>;
  generatedAt: string;
}

interface Props {
  data: ProgressData;
}

export function ProgressExportButton({ data }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const pageW = doc.internal.pageSize.getWidth();
      const margin = 20;
      const contentW = pageW - margin * 2;
      let y = margin;

      // ── Header ──────────────────────────────────────────────────────────
      doc.setFillColor(10, 10, 20);
      doc.rect(0, 0, pageW, 40, "F");

      doc.setTextColor(212, 175, 55); // law-gold
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("Lextutor — Informe de Progreso", margin, 26);

      doc.setTextColor(160, 160, 160);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Generado: ${data.generatedAt}`, margin, 35);

      y = 55;

      // ── KPI Section ─────────────────────────────────────────────────────
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("Estadísticas Generales", margin, y);
      y += 8;

      doc.setDrawColor(212, 175, 55);
      doc.setLineWidth(0.5);
      doc.line(margin, y, margin + contentW, y);
      y += 8;

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(50, 50, 50);

      const topArea =
        Object.entries(data.distribution).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "N/A";

      const kpis = [
        ["Total de preguntas respondidas", String(data.totalAnswers)],
        ["Área principal de estudio", topArea],
        ["Materias practicadas", String(Object.keys(data.distribution).length)],
      ];

      kpis.forEach(([label, value]) => {
        doc.setFont("helvetica", "bold");
        doc.text(label + ":", margin, y);
        doc.setFont("helvetica", "normal");
        doc.text(value, margin + 90, y);
        y += 8;
      });

      y += 6;

      // ── Distribution Table ───────────────────────────────────────────────
      const entries = Object.entries(data.distribution).sort((a, b) => b[1] - a[1]);

      if (entries.length > 0) {
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 30, 30);
        doc.text("Distribución por Materia", margin, y);
        y += 8;

        doc.setDrawColor(212, 175, 55);
        doc.line(margin, y, margin + contentW, y);
        y += 6;

        // Table header
        doc.setFillColor(245, 245, 245);
        doc.rect(margin, y, contentW, 8, "F");
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(80, 80, 80);
        doc.text("Materia", margin + 3, y + 5.5);
        doc.text("Preguntas", margin + 90, y + 5.5);
        doc.text("% del Total", margin + 130, y + 5.5);
        y += 8;

        entries.forEach(([area, count], idx) => {
          if (idx % 2 === 0) {
            doc.setFillColor(252, 252, 252);
            doc.rect(margin, y, contentW, 7, "F");
          }
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(40, 40, 40);
          const capitalized = area.charAt(0).toUpperCase() + area.slice(1);
          doc.text(capitalized, margin + 3, y + 5);
          doc.text(String(count), margin + 93, y + 5);
          const pct = data.totalAnswers > 0 ? Math.round((count / data.totalAnswers) * 100) : 0;
          doc.text(`${pct}%`, margin + 133, y + 5);
          y += 7;
        });

        y += 6;
      }

      // ── Milestones ───────────────────────────────────────────────────────
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      doc.text("Hitos", margin, y);
      y += 8;

      doc.setDrawColor(212, 175, 55);
      doc.line(margin, y, margin + contentW, y);
      y += 6;

      data.milestones.forEach((m) => {
        const status = m.unlocked ? "✓" : "○";
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(m.unlocked ? 34 : 140, m.unlocked ? 197 : 140, m.unlocked ? 94 : 140);
        doc.text(status, margin + 2, y + 5);
        doc.setTextColor(40, 40, 40);
        doc.text(m.title, margin + 10, y + 5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text(m.desc, margin + 50, y + 5);
        y += 8;
      });

      // ── Footer ───────────────────────────────────────────────────────────
      const pageH = doc.internal.pageSize.getHeight();
      doc.setFillColor(10, 10, 20);
      doc.rect(0, pageH - 15, pageW, 15, "F");
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text("Lextutor — Plataforma de preparación jurídica", margin, pageH - 5);
      doc.text("lextutor.dev", pageW - margin - 20, pageH - 5);

      doc.save(`lextutor-progreso-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error("Error generando PDF:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      onClick={handleExport}
      disabled={loading}
      size="sm"
      variant="outline"
      aria-label={loading ? "Generando PDF de progreso" : "Exportar progreso a PDF"}
      className="gap-2 border-law-gold/30 bg-law-gold/5 text-law-gold hover:bg-law-gold/10 hover:text-law-gold"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Generando…
        </>
      ) : (
        <>
          <Download className="h-4 w-4" aria-hidden="true" />
          Exportar PDF
        </>
      )}
    </Button>
  );
}
