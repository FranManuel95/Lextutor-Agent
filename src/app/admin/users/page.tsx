import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { Database } from "@/types/database.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminUsersClient } from "./AdminUsersClient";
import { UsersPagination } from "./UsersPagination";
import { AdminExportButton } from "@/components/admin-export-button";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const rawPage = parseInt(params.page ?? "1", 10);
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1;

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  const [profilesResult, authResult, sessionResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to)
      .returns<Profile[]>(),
    // Supabase auth.admin.listUsers is paginated; use same page/perPage.
    adminSupabase.auth.admin.listUsers({ page, perPage: PAGE_SIZE }),
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
  const totalCount = profilesResult.count ?? users.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="space-y-6 p-4 sm:p-6 md:space-y-8 md:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="font-serif text-3xl italic text-law-gold">Gestión de Usuarios</h2>
          <p className="text-gem-offwhite/60">
            Listado de todos los usuarios registrados en la plataforma.
          </p>
        </div>
        <AdminExportButton href="/api/admin/users/export" />
      </div>

      <Card className="border-law-accent/20 bg-gem-slate">
        <CardHeader>
          <CardTitle className="text-gem-offwhite">
            Usuarios · {totalCount.toLocaleString()} total
            {totalPages > 1 && (
              <span className="ml-2 text-sm font-normal text-gem-offwhite/50">
                (página {page} de {totalPages})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <AdminUsersClient users={users} currentUserId={currentUserId} />
          {totalPages > 1 && <UsersPagination currentPage={page} totalPages={totalPages} />}
        </CardContent>
      </Card>
    </div>
  );
}
