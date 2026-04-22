import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { Database } from "@/types/database.types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

type UserData = Profile & {
  email?: string;
};

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  // 1. Fetch profiles (users) from public schema
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<Profile[]>();

  if (profilesError) {
    return <div className="p-8 text-red-400">Error cargando perfiles: {profilesError.message}</div>;
  }

  // 2. Fetch all users from Auth API (needs Service Role)
  // Note: listUsers() defaults to 50 users per page. For production with many users, implement pagination.
  const {
    data: { users: authUsers },
    error: authError,
  } = await adminSupabase.auth.admin.listUsers({
    perPage: 1000, // Temporary limit for MVP
  });

  if (authError) {
    console.error("Error fetching auth users:", authError);
    // Continue but show profiles without emails if auth fails?
    // Or show error. Let's show error for admin to know something is wrong.
    return (
      <div className="p-8 text-red-400">
        Error cargando datos de autenticación: {authError.message}
      </div>
    );
  }

  // 3. Merge data
  const users: UserData[] = profiles.map((profile) => {
    const authUser = authUsers.find((u) => u.id === profile.id);
    return {
      ...profile,
      email: authUser?.email,
    };
  });

  return (
    <div className="space-y-8 p-8">
      <div className="flex flex-col gap-2">
        <h2 className="font-serif text-3xl italic text-law-gold">Gestión de Usuarios</h2>
        <p className="text-gem-offwhite/60">
          Listado de todos los usuarios registrados en la plataforma.
        </p>
      </div>

      <Card className="border-law-accent/20 bg-gem-slate">
        <CardHeader>
          <CardTitle className="text-gem-offwhite">Usuarios ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-law-accent/20 hover:bg-white/5">
                <TableHead className="text-law-gold">Usuario</TableHead>
                <TableHead className="text-law-gold">Email</TableHead>
                <TableHead className="text-law-gold">Rol</TableHead>
                <TableHead className="text-law-gold">Fecha Registro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="border-law-accent/10 hover:bg-white/5">
                  <TableCell className="font-medium text-gem-offwhite">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 border border-law-accent/30">
                        <AvatarImage src={user.avatar_url || ""} />
                        <AvatarFallback className="bg-law-primary text-xs text-law-gold">
                          {user.full_name?.slice(0, 2).toUpperCase() || "US"}
                        </AvatarFallback>
                      </Avatar>
                      <span>{user.full_name || "Sin nombre"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gem-offwhite/80">{user.email || "N/A"}</TableCell>
                  <TableCell>
                    <Badge
                      variant={user.role === "admin" ? "default" : "secondary"}
                      className={
                        user.role === "admin"
                          ? "text-law-primary bg-law-gold hover:bg-law-gold/80"
                          : "bg-white/10 text-white hover:bg-white/20"
                      }
                    >
                      {user.role || "user"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gem-offwhite/60">
                    {user.created_at
                      ? format(new Date(user.created_at), "PPp", { locale: es })
                      : "-"}
                  </TableCell>
                </TableRow>
              ))}
              {!users.length && (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-gem-offwhite/50">
                    No se encontraron usuarios.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
