import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Database } from "@/types/database.types";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rateLimit";

export const runtime = "nodejs";

const settingsSchema = z.object({
  area: z.enum(["laboral", "civil", "mercantil", "procesal", "otro"]).optional(),
  modes: z
    .array(
      z.enum([
        "concise",
        "feynman",
        "quiz",
        "socratic",
        "steps",
        "citations",
        "caseMode",
        "memoryAware",
      ])
    )
    .max(8)
    .optional(),
  detailLevel: z.enum(["brief", "normal", "extended"]).optional(),
  preset: z.enum(["rapido", "aprender", "examen", "socratico"]).optional(),
});

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("tutor_prefs")
    .eq("id", user.id)
    .single();

  const profileRow = profile as Database["public"]["Tables"]["profiles"]["Row"] | null;

  if (error) {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }

  // Default settings
  const defaults = {
    area: "otro",
    modes: [],
    detailLevel: "normal",
  };

  return NextResponse.json({
    ...defaults,
    ...((profileRow?.tutor_prefs as any) || {}),
  });
}

export async function PATCH(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = await checkRateLimit(user.id, RATE_LIMITS.SETTINGS_UPDATE);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Demasiadas actualizaciones. Inténtalo más tarde." },
      { status: 429 }
    );
  }

  try {
    const json = await request.json();
    const validatedSettings = settingsSchema.parse(json);

    // Get existing to merge (or just overwrite if client sends full state? Client usually sends partial updates or full. Let's assume full state merge in DB)
    // Safer to fetch first then merge, or just update jsonb with merge logic if postgres supports (||), but supabase client update is replace for columns.
    // We will read current prefs first to be safe, or just overwrite if the UI sends the "complete effective state".
    // Simplest: The Client Store has authority of "intent", so we save what client sends merged with defaults.

    // Actually, let's fetch current to be safe against overwriting other future keys if any.
    const { data: profile } = await supabase
      .from("profiles")
      .select("tutor_prefs")
      .eq("id", user.id)
      .single();
    const current = (profile as any)?.tutor_prefs || {};

    const newPrefs = {
      ...current,
      ...validatedSettings,
    };

    const { error } = await supabase
      .from("profiles")
      .update({ tutor_prefs: newPrefs } as unknown as never)
      .eq("id", user.id);

    if (error) throw error;

    return NextResponse.json(newPrefs);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation Error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
