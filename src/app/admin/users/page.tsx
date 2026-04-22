import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { Database } from "@/types/database.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminUsersClient } from "./AdminUsersClient";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  const [profilesResult, authResult, sessionResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .returns<Profile[]>(),
    adminSupabase.auth.admin.listUsers({ perPage: 1000 }),
    supabase.auth.getUser(),
  ]);

  if (profilesResult.error) {
    return (
      <div className="p-8 text-red-400">
        Error cargando perfiles: {profilesResult.error.message}
      </div>
    );
  }

  if (authResult.error) {
    return (
      <div className="p-8 text-red-400">
        Error cargando datos de autenticación: {authResult.error.message}
      </div>
    );
  }

  const authUsersById = Object.fromEntries(authResult.data.users.map((u) => [u.id, u.email]));

  const users = profilesResult.data.map((profile) => ({
    id: profile.id,
    full_name: profile.full_name,
    avatar_url: profile.avatar_url,
    role: profile.role,
    created_at: profile.created_at,
    email: authUsersById[profile.id],
  }));

  const currentUserId = sessionResult.data.user?.id ?? "";

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
          <AdminUsersClient users={users} currentUserId={currentUserId} />
        </CardContent>
      </Card>
    </div>
  );
}
