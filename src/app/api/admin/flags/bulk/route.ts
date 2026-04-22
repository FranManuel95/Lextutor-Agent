import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/server/security/requireAdmin";

export const runtime = "nodejs";

const bulkSchema = z
  .object({
    ids: z.array(z.string().uuid()).min(1).max(100),
    status: z.enum(["open", "reviewed", "dismissed"]),
  })
  .strict();

export async function PATCH(request: NextRequest) {
  try {
    const { supabase } = await requireAdmin();
    const json = await request.json();
    const { ids, status } = bulkSchema.parse(json);

    const { error, count } = await supabase
      .from("question_flags")
      .update({ status } as unknown as never, { count: "exact" })
      .in("id", ids);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, updated: count ?? ids.length });
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation Error", details: e.errors }, { status: 400 });
    }
    const msg = e?.message ?? "Internal Server Error";
    const status = msg === "Unauthorized" ? 401 : msg === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
