import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/server/security/requireAdmin";
import { verifyOrigin } from "@/lib/csrf";

export const runtime = "nodejs";

const bulkRoleSchema = z
  .object({
    ids: z.array(z.string().uuid()).min(1).max(100),
    role: z.enum(["admin", "student"]),
  })
  .strict();

export async function PATCH(request: NextRequest) {
  try {
    const csrf = verifyOrigin(request);
    if (!csrf.ok) {
      return NextResponse.json({ error: `CSRF check failed: ${csrf.reason}` }, { status: 403 });
    }

    const { supabase, user: admin } = await requireAdmin();
    const json = await request.json();
    const { ids, role } = bulkRoleSchema.parse(json);

    // Never let an admin accidentally demote themselves in a bulk op
    const safeIds = ids.filter((id) => id !== admin.id);
    if (safeIds.length === 0) {
      return NextResponse.json(
        { error: "No puedes cambiar tu propio rol en un cambio masivo." },
        { status: 400 }
      );
    }

    const { error, count } = await supabase
      .from("profiles")
      .update({ role } as unknown as never, { count: "exact" })
      .in("id", safeIds);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      updated: count ?? safeIds.length,
      skippedSelf: ids.length - safeIds.length,
    });
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation Error", details: e.errors }, { status: 400 });
    }
    const msg = e?.message ?? "Internal Server Error";
    const status = msg === "Unauthorized" ? 401 : msg === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
