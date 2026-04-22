import { createClient } from "@/utils/supabase/server";
import { z } from "zod";

const profileSchema = z.object({ role: z.string() });

export async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) throw new Error("Unauthorized");

  const { data: profileRaw, error: profileErr } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileErr) throw new Error(profileErr.message);

  const parsed = profileSchema.safeParse(profileRaw);
  if (!parsed.success || parsed.data.role !== "admin") throw new Error("Forbidden");

  return { supabase, user };
}
