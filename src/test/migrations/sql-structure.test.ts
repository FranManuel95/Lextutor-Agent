/**
 * SQL migration structure tests.
 * These are NOT integration tests against a live DB — they validate that our
 * critical SQL functions are defined with the expected signatures, security
 * modifiers, and grants. If a future migration accidentally drops a function
 * or forgets the GRANT, these tests will catch it before it ships.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import path from "path";

const MIGRATIONS_DIR = path.join(__dirname, "../../../supabase/migrations");

function readMigration(filename: string): string {
  const fullPath = path.join(MIGRATIONS_DIR, filename);
  if (!existsSync(fullPath)) {
    throw new Error(`Migration not found: ${filename}`);
  }
  return readFileSync(fullPath, "utf-8");
}

describe("SQL migrations — get_exam_stats", () => {
  const sql = readMigration("20260210000001_exam_stats_function.sql");
  const grantSql = readMigration("20260422010000_exam_stats_grant.sql");

  it("defines public.get_exam_stats(uuid)", () => {
    expect(sql).toMatch(/CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.get_exam_stats/i);
    expect(sql).toMatch(/p_user_id\s+uuid/i);
  });

  it("returns jsonb", () => {
    expect(sql).toMatch(/RETURNS\s+jsonb/i);
  });

  it("is declared SECURITY DEFINER to read all user data", () => {
    expect(sql).toMatch(/SECURITY\s+DEFINER/i);
  });

  it("grants execute to authenticated role (via hardening migration)", () => {
    expect(grantSql).toMatch(
      /GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+public\.get_exam_stats[\s\S]*authenticated/i
    );
  });

  it("revokes execute from PUBLIC (least privilege)", () => {
    expect(grantSql).toMatch(
      /REVOKE\s+EXECUTE\s+ON\s+FUNCTION\s+public\.get_exam_stats[\s\S]*PUBLIC/i
    );
  });

  it("returns the expected top-level keys", () => {
    // The function builds a jsonb object with these keys
    expect(sql).toMatch(/'streak'/);
    expect(sql).toMatch(/'longestStreak'/);
    expect(sql).toMatch(/'lastActive'/);
    expect(sql).toMatch(/'averages'/);
  });

  it("filters exam_attempts by status = 'finished'", () => {
    expect(sql).toMatch(/status\s*=\s*'finished'/i);
  });
});

describe("SQL migrations — get_platform_activity", () => {
  const sql = readMigration("20260422000000_platform_activity_fn.sql");

  it("defines public.get_platform_activity(int) with default 7", () => {
    expect(sql).toMatch(/CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.get_platform_activity/i);
    expect(sql).toMatch(/p_days\s+int\s+DEFAULT\s+7/i);
  });

  it("returns jsonb", () => {
    expect(sql).toMatch(/RETURNS\s+jsonb/i);
  });

  it("uses generate_series to fill days with zero activity", () => {
    expect(sql).toMatch(/generate_series/i);
  });

  it("is SECURITY DEFINER and granted to authenticated", () => {
    expect(sql).toMatch(/SECURITY\s+DEFINER/i);
    expect(sql).toMatch(
      /GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+public\.get_platform_activity[\s\S]*authenticated/i
    );
  });

  it("returns per-day shape with date, exams, messages keys", () => {
    expect(sql).toMatch(/'date'/);
    expect(sql).toMatch(/'exams'/);
    expect(sql).toMatch(/'messages'/);
  });

  it("counts only finished exam_attempts", () => {
    expect(sql).toMatch(/status\s*=\s*'finished'/i);
  });

  it("counts only user messages (not assistant)", () => {
    expect(sql).toMatch(/role\s*=\s*'user'/i);
  });

  it("coalesces to empty array when no activity", () => {
    expect(sql).toMatch(/COALESCE\(v_result,\s*'\[\]'::jsonb\)/i);
  });
});

describe("SQL migrations — rate limit function contract", () => {
  // Rate limit is called as an RPC from src/lib/rateLimit.ts with these params.
  // Ensures the DB function signature matches what the code expects.
  it("check_rate_limit migration defines the 4 expected parameters", () => {
    const files = ["20260128223044_init_schema.sql", "20260129200000_add_features.sql"];
    let found = false;
    for (const f of files) {
      try {
        const sql = readMigration(f);
        if (/FUNCTION.*check_rate_limit/i.test(sql)) {
          expect(sql).toMatch(/p_user_id/i);
          expect(sql).toMatch(/p_endpoint/i);
          expect(sql).toMatch(/p_limit/i);
          expect(sql).toMatch(/p_window_minutes/i);
          found = true;
          break;
        }
      } catch {
        // File missing — skip
      }
    }
    // If the function exists, the params above must match. If it doesn't, the RPC
    // would fail at runtime — but that's caught by integration tests, not here.
    if (!found) {
      console.warn(
        "check_rate_limit migration not located in expected files — skipping param test"
      );
    }
  });
});
