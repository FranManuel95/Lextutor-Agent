import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/security/requireAdmin";
import { z } from "zod";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

const roleSchema = z.object({
  role: z.enum(["admin", "student"]),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { supabase, user: adminUser } = await requireAdmin();
    const { id } = await params;

    if (!id || !/^[0-9a-f-]{36}$/.test(id)) {
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    }

    // Prevent self-demotion
    if (id === adminUser.id) {
      return NextResponse.json({ error: "No puedes cambiar tu propio rol" }, { status: 400 });
    }

    const json = await request.json();
    const { role } = roleSchema.parse(json);

    const { error } = await supabase
      .from("profiles")
      .update({ role } as never)
      .eq("id", id);

    if (error) throw error;

    logger.info("admin: role updated", { targetUserId: id, newRole: role, adminId: adminUser.id });

    return NextResponse.json({ success: true, role });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Internal Server Error";
    const status = msg === "Unauthorized" ? 401 : msg === "Forbidden" ? 403 : 500;
    logger.error("PATCH /api/admin/users/[id]/role failed", e);
    return NextResponse.json({ error: msg }, { status });
  }
}
