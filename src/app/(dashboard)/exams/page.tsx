"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Trash2,
  Eye,
  Flame,
  Trophy,
  Calendar,
  Filter,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getExamLevel, getLevelColor } from "@/lib/exams/level";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { Copyright } from "@/components/copyright";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ExamsHistoryPage() {
  const [stats, setStats] = useState<any>(null);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: "all", area: "all" });
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.type !== "all") params.set("type", filters.type);
      if (filters.area !== "all") params.set("area", filters.area);
      params.set("limit", "50");

      const res = await fetch(`/api/exams?${params.toString()}`, { cache: "no-store" });
      const data = await res.json();
      if (data.items) setAttempts(data.items);
      if (data.stats) setStats(data.stats);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [filters]);

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const handleDeleteConfirm = async (id: string) => {
    try {
      const res = await fetch(`/api/exams/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Intento eliminado" });
        fetchHistory();
      } else {
        toast({ title: "Error al eliminar", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error al eliminar", variant: "destructive" });
    } finally {
      setDeleteId(null);
    }
  };

  const getTypeLabel = (t: string) => {
    if (t === "quiz") return "Test Rápido";
    if (t === "exam_open") return "Examen Desarrollo";
    return t;
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-gem-onyx font-sans text-gem-offwhite">
      <div className="z-10 flex-none border-b border-gem-border/40 bg-gem-onyx/80 px-6 backdrop-blur-sm md:px-16">
        <div className="mx-auto flex max-w-6xl items-center justify-between py-6 md:pb-4 md:pt-8">
          <div>
            <h1 className="font-crimson text-shadow-sm mb-2 text-3xl font-bold text-gem-offwhite">
              Historial de Evaluaciones
            </h1>
            <p className="text-sm text-gem-muted">
              Revisa tu progreso, rachas y calificaciones honestas.
            </p>
          </div>
        </div>
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto px-6 py-6 pt-3 md:px-16">
        <div className="mx-auto max-w-6xl space-y-8 pb-10">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Card className="border-gem-border/40 bg-gradient-to-br from-orange-500/10 to-amber-500/5 shadow-lg shadow-black/20">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-orange-600 dark:text-orange-400">
                  <Flame className="h-4 w-4" /> Racha Actual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="pb-2 text-2xl font-bold text-orange-700 dark:text-orange-200">
                  {stats?.streak || 0} días
                </div>
                <p className="text-[10px] uppercase tracking-widest text-orange-600 dark:text-orange-400/60">
                  Estudia mañana para mantenerla
                </p>
              </CardContent>
            </Card>

            <Card className="border-gem-border/40 bg-gem-mist shadow-lg shadow-black/20">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-gem-muted">
                  <Trophy className="h-4 w-4" /> Mejor Racha
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gem-offwhite">
                  {stats?.longestStreak || 0} días
                </div>
              </CardContent>
            </Card>

            <Card className="border-gem-border/40 bg-gem-mist shadow-lg shadow-black/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium uppercase tracking-wider text-gem-muted">
                  Media Test
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gem-offwhite">
                  {stats?.averages?.byType?.quiz ? stats.averages.byType.quiz : "—"}
                </div>
              </CardContent>
            </Card>

            <Card className="border-gem-border/40 bg-gem-mist shadow-lg shadow-black/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium uppercase tracking-wider text-gem-muted">
                  Media Desarrollo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gem-offwhite">
                  {stats?.averages?.byType?.exam_open ? stats.averages.byType.exam_open : "—"}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col items-start gap-4 rounded-xl border border-gem-border/40 bg-gem-mist p-4 shadow-sm md:flex-row md:items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gem-muted" />
              <span className="text-sm font-medium text-gem-muted md:hidden">Filtrar por:</span>
            </div>
            <div className="flex w-full flex-col gap-4 sm:flex-row md:w-auto">
              <Select
                value={filters.type}
                onValueChange={(v) => setFilters({ ...filters, type: v })}
              >
                <SelectTrigger className="w-full border-gem-border/40 bg-transparent text-gem-offwhite/80 md:w-[180px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent className="border-gem-border/40 bg-gem-mist text-gem-offwhite/80">
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="quiz">Test Rápido</SelectItem>
                  <SelectItem value="exam_open">Examen Desarrollo</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.area}
                onValueChange={(v) => setFilters({ ...filters, area: v })}
              >
                <SelectTrigger className="w-full border-gem-border/40 bg-transparent text-gem-offwhite/80 md:w-[180px]">
                  <SelectValue placeholder="Área" />
                </SelectTrigger>
                <SelectContent className="border-gem-border/40 bg-gem-mist text-gem-offwhite/80">
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
          <Card className="overflow-hidden border-gem-border/40 bg-gem-mist shadow-lg">
            <div className="overflow-x-auto">
              <Table className="min-w-[800px]">
                <TableHeader className="bg-gem-slate">
                  <TableRow className="border-gem-border/40 hover:bg-transparent">
                    <TableHead className="text-gem-muted">Fecha</TableHead>
                    <TableHead className="text-gem-muted">Tipo</TableHead>
                    <TableHead className="text-gem-muted">Área</TableHead>
                    <TableHead className="text-gem-muted">Nota</TableHead>
                    <TableHead className="text-gem-muted">Nivel</TableHead>
                    <TableHead className="text-gem-muted">Estado</TableHead>
                    <TableHead className="text-right text-gem-muted">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && attempts.length === 0 ? (
                    <TableRow className="border-gem-border/40">
                      <TableCell colSpan={7} className="h-64 text-center">
                        <div className="flex flex-col items-center justify-center gap-2 text-gem-muted">
                          <div className="h-8 w-8 animate-spin rounded-full border-2 border-law-gold/30 border-t-law-gold"></div>
                          <span className="text-sm font-medium">Cargando evaluaciones...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : attempts.length === 0 ? (
                    <TableRow className="border-gem-border/40">
                      <TableCell colSpan={7} className="h-96 text-center">
                        <div className="mx-auto flex max-w-sm flex-col items-center justify-center space-y-4">
                          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gem-slate">
                            <Calendar className="h-8 w-8 text-gem-muted/70" />
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-lg font-medium text-gem-offwhite/80">
                              No hay evaluaciones
                            </h3>
                            <p className="text-sm text-gem-muted">
                              Todavía no has realizado ningún test o examen. ¡Empieza tu primera
                              práctica!
                            </p>
                          </div>
                          <div className="flex gap-3 pt-2">
                            <Link href="/quiz">
                              <Button
                                variant="secondary"
                                size="sm"
                                className="border border-blue-500/20 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
                              >
                                Test Rápido
                              </Button>
                            </Link>
                            <Link href="/exam">
                              <Button
                                variant="secondary"
                                size="sm"
                                className="border border-purple-500/20 bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:hover:bg-purple-900/30"
                              >
                                Examen Abierto
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    attempts.map((attempt) => {
                      const level = getExamLevel(attempt.score || 0);
                      return (
                        <TableRow
                          key={attempt.id}
                          className="border-gem-border/40 transition-colors hover:bg-gem-slate"
                        >
                          <TableCell className="font-medium text-gem-offwhite/80">
                            {format(new Date(attempt.created_at), "d MMM yyyy, HH:mm", {
                              locale: es,
                            })}
                          </TableCell>
                          <TableCell className="text-gem-offwhite/80">
                            {getTypeLabel(attempt.attempt_type)}
                          </TableCell>
                          <TableCell className="capitalize text-gem-offwhite/80">
                            {attempt.area}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`font-bold ${(attempt.score ?? 0) >= 5 ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}`}
                            >
                              {(attempt.score ?? 0).toFixed(1)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <Badge
                                variant="outline"
                                className={`${getLevelColor(level)} border-current bg-transparent opacity-80 hover:opacity-100`}
                              >
                                {level}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            {attempt.status === "finished" ? (
                              <Badge
                                variant="secondary"
                                className="border border-green-500/20 bg-green-500/10 text-emerald-700 hover:bg-green-500/20 dark:text-emerald-400"
                              >
                                Finalizado
                              </Badge>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="border border-blue-500/20 bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 dark:text-blue-400"
                              >
                                En Progreso
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="space-x-2 text-right">
                            <Link href={`/exams/${attempt.id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-gem-muted hover:bg-gem-slate hover:text-gem-offwhite"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600/70 hover:bg-red-500/15 hover:text-red-700 dark:text-red-500/70 dark:hover:text-red-400"
                              onClick={() => handleDelete(attempt.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
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
        <AlertDialogContent className="border border-gem-border/40 bg-gem-mist text-gem-offwhite">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gem-offwhite">¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription className="text-gem-muted">
              Esta acción eliminará permanentemente este examen y su nota del historial. No se puede
              deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gem-border/40 bg-transparent text-gem-offwhite hover:bg-gem-slate hover:text-gem-offwhite">
              Cancelar
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={() => deleteId && handleDeleteConfirm(deleteId)}
              className="border-0 bg-red-600 text-white hover:bg-red-700"
            >
              Eliminar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
