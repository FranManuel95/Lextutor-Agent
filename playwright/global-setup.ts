import { createClient } from "@supabase/supabase-js";
import type { FullConfig } from "@playwright/test";

export default async function globalSetup(_config: FullConfig) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (!url || !serviceKey || !email || !password) {
    console.warn(
      "[E2E Setup] Missing NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, " +
        "TEST_USER_EMAIL, or TEST_USER_PASSWORD — skipping test user seed. " +
        "Auth tests will be skipped."
    );
    return;
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: "E2E Test User" },
  });

  if (error && !error.message.toLowerCase().includes("already been registered")) {
    throw new Error(`[E2E Setup] Could not create test user: ${error.message}`);
  }
}
