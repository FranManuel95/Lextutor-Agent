"use client";

import React, { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Search, ShieldCheck, User, ExternalLink } from "lucide-react";

type UserRow = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
  created_at: string | null;
  email?: string;
};

interface Props {
  users: UserRow[];
  currentUserId: string;
}

export function AdminUsersClient({ users, currentUserId }: Props) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "student">("all");
  const [localRoles, setLocalRoles] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return users.filter((u) => {
      const role = localRoles[u.id] ?? u.role ?? "student";
      const matchesRole = roleFilter === "all" || role === roleFilter;
      if (!matchesRole) return false;
      if (!q) return true;
      return (
        (u.full_name ?? "").toLowerCase().includes(q) || (u.email ?? "").toLowerCase().includes(q)
      );
    });
  }, [users, search, roleFilter, localRoles]);

  async function toggleRole(user: UserRow) {
    const currentRole = localRoles[user.id] ?? user.role ?? "student";
    const newRole = currentRole === "admin" ? "student" : "admin";

    setError(null);
    setLoadingId(user.id);

    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/users/${user.id}/role`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: newRole }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Error al cambiar el rol");
        } else {
          setLocalRoles((prev) => ({ ...prev, [user.id]: newRole }));
        }
      } catch {
        setError("Error de red al cambiar el rol");
      } finally {
        setLoadingId(null);
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Search & filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gem-offwhite/40" />
          <Input
            placeholder="Buscar por nombre o email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-law-accent/20 bg-gem-slate pl-9 text-gem-offwhite placeholder:text-gem-offwhite/30 focus-visible:ring-law-gold/50"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "admin", "student"] as const).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={roleFilter === f ? "default" : "ghost"}
              onClick={() => setRoleFilter(f)}
              className={
                roleFilter === f
                  ? "bg-law-gold text-gem-onyx hover:bg-law-gold/80"
                  : "text-gem-offwhite/60 hover:text-gem-offwhite"
              }
            >
              {f === "all" ? "Todos" : f === "admin" ? "Admin" : "Estudiante"}
            </Button>
          ))}
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      <p className="text-sm text-gem-offwhite/50">
        {filtered.length} usuario{filtered.length !== 1 ? "s" : ""}
        {search || roleFilter !== "all" ? " encontrados" : " registrados"}
      </p>

      <Table>
        <TableHeader>
          <TableRow className="border-law-accent/20 hover:bg-white/5">
            <TableHead className="text-law-gold">Usuario</TableHead>
            <TableHead className="text-law-gold">Email</TableHead>
            <TableHead className="text-law-gold">Rol</TableHead>
            <TableHead className="text-law-gold">Fecha Registro</TableHead>
            <TableHead className="text-law-gold">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((user) => {
            const role = localRoles[user.id] ?? user.role ?? "student";
            const isSelf = user.id === currentUserId;
            const isLoading = loadingId === user.id;

            return (
              <TableRow key={user.id} className="border-law-accent/10 hover:bg-white/5">
                <TableCell className="font-medium text-gem-offwhite">
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="group flex items-center gap-3 transition hover:text-law-gold"
                  >
                    <Avatar className="h-8 w-8 border border-law-accent/30 transition group-hover:border-law-gold/50">
                      <AvatarImage src={user.avatar_url ?? ""} />
                      <AvatarFallback className="bg-law-primary text-xs text-law-gold">
                        {user.full_name?.slice(0, 2).toUpperCase() ?? "US"}
                      </AvatarFallback>
                    </Avatar>
                    <span>{user.full_name ?? "Sin nombre"}</span>
                    <ExternalLink className="h-3 w-3 opacity-0 transition group-hover:opacity-60" />
                  </Link>
                </TableCell>
                <TableCell className="text-gem-offwhite/80">{user.email ?? "N/A"}</TableCell>
                <TableCell>
                  <Badge
                    variant={role === "admin" ? "default" : "secondary"}
                    className={
                      role === "admin"
                        ? "bg-law-gold text-gem-onyx hover:bg-law-gold/80"
                        : "bg-white/10 text-white hover:bg-white/20"
                    }
                  >
                    {role}
                  </Badge>
                </TableCell>
                <TableCell className="text-gem-offwhite/60">
                  {user.created_at ? format(new Date(user.created_at), "PPp", { locale: es }) : "-"}
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={isSelf || isLoading || pending}
                    onClick={() => toggleRole(user)}
                    title={
                      isSelf
                        ? "No puedes cambiar tu propio rol"
                        : `Cambiar a ${role === "admin" ? "student" : "admin"}`
                    }
                    className="gap-1.5 text-xs text-gem-offwhite/60 hover:text-gem-offwhite disabled:opacity-30"
                  >
                    {isLoading ? (
                      <span className="animate-pulse">…</span>
                    ) : role === "admin" ? (
                      <>
                        <User className="h-3.5 w-3.5" />
                        Quitar admin
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Hacer admin
                      </>
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
          {!filtered.length && (
            <TableRow>
              <TableCell colSpan={5} className="py-8 text-center text-gem-offwhite/50">
                {search || roleFilter !== "all"
                  ? "Sin resultados para la búsqueda."
                  : "No se encontraron usuarios."}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
