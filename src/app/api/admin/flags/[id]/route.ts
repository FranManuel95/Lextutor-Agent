import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/server/security/requireAdmin";

export const runtime = "nodejs";

const patchSchema = z
  .object({
    status: z.enum(["open", "reviewed", "dismissed"]),
  })
  .strict();

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { supabase } = await requireAdmin();
    const { id } = await params;
    const json = await request.json();
    const { status } = patchSchema.parse(json);

    const { error } = await supabase.from("question_flags").update({ status }).eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation Error", details: e.errors }, { status: 400 });
    }
    const msg = e?.message ?? "Internal Server Error";
    const status = msg === "Unauthorized" ? 401 : msg === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
