import { config } from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import type { FullConfig } from "@playwright/test";

// Playwright global-setup runs in plain Node.js — .env.local is not loaded
// automatically (unlike Next.js). Load it explicitly before reading any vars.
config({ path: resolve(process.cwd(), ".env.local") });

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

  if (error) {
    if (error.message.toLowerCase().includes("already been registered")) {
      console.log(`[E2E Setup] Test user already exists: ${email}`);
      return;
    }
    // Non-fatal: warn and skip auth tests rather than crashing the run.
    console.warn(
      `[E2E Setup] Could not create test user (${error.message}). ` +
        "Auth tests will be skipped. Check SUPABASE_SERVICE_ROLE_KEY in .env.local."
    );
    // Clear credentials so auth tests self-skip via test.skip(!hasCredentials).
    delete process.env.TEST_USER_EMAIL;
    delete process.env.TEST_USER_PASSWORD;
    return;
  }

  console.log(`[E2E Setup] Test user ready: ${email}`);
}
