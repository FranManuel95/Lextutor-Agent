"use client";

import { useState } from "react";
import { Flag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

type Reason = "incorrect" | "ambiguous" | "off_topic" | "other";

interface Props {
  attemptId: string;
  sessionId?: string;
  questionId: string;
  questionText?: string;
  area?: string;
}

export function FlagQuestionButton({
  attemptId,
  sessionId,
  questionId,
  questionText,
  area,
}: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<Reason>("incorrect");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/quiz/flag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId,
          sessionId,
          questionId,
          questionText,
          area,
          reason,
          comment: comment.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error al enviar el reporte");
      }
      setSubmitted(true);
      toast({
        title: "Gracias por el aviso",
        description: "Revisaremos esta pregunta para mejorar el sistema.",
      });
      setTimeout(() => setOpen(false), 800);
    } catch (err: any) {
      toast({
        title: "No se pudo enviar",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs text-slate-500 hover:text-red-400"
          disabled={submitted}
        >
          <Flag className="h-3.5 w-3.5" />
          {submitted ? "Reportada" : "Reportar"}
        </Button>
      </DialogTrigger>
      <DialogContent className="border-white/10 bg-gem-onyx text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-law-gold">Reportar pregunta</DialogTitle>
          <DialogDescription className="text-gray-400">
            ¿Qué ocurre con esta pregunta? Usaremos tu reporte para mejorar el generador.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-xs text-gray-400">Motivo</Label>
            <Select value={reason} onValueChange={(v) => setReason(v as Reason)}>
              <SelectTrigger className="border-white/10 bg-gem-slate text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-gem-onyx text-white">
                <SelectItem value="incorrect">La respuesta correcta es incorrecta</SelectItem>
                <SelectItem value="ambiguous">Pregunta ambigua o confusa</SelectItem>
                <SelectItem value="off_topic">Fuera del área seleccionada</SelectItem>
                <SelectItem value="other">Otro motivo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-gray-400">Comentario (opcional)</Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Explica brevemente qué está mal…"
              maxLength={500}
              className="min-h-[80px] border-white/10 bg-gem-slate text-white placeholder:text-gray-600"
            />
            <p className="text-right text-[10px] text-gray-600">{comment.length}/500</p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            className="text-gray-400 hover:bg-white/5 hover:text-white"
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-law-gold text-gem-onyx hover:bg-law-gold/80"
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar reporte
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
