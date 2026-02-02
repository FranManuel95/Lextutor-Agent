import { createClient } from "@/utils/supabase/server";

export async function requireAdmin() {
    const supabase = createClient();

    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr) throw new Error(userErr.message);
    if (!user) throw new Error("Unauthorized");

    const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profileErr) throw new Error(profileErr.message);
    if (!profile || (profile as any).role !== "admin") throw new Error("Forbidden");

    return { supabase, user };
}
