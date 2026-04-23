import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/utils/supabase/admin";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { captureException } from "@/lib/telemetry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Attempt = {
  user_id: string;
  attempt_type: string | null;
  area: string | null;
  score: number | null;
  created_at: string;
};

type Profile = {
  id: string;
  full_name: string | null;
  email_weekly_summary?: boolean | null;
};

type UserSummary = {
  userId: string;
  email: string;
  name: string;
  examCount: number;
  avgScore: number;
  bestArea: { area: string; avg: number } | null;
  worstArea: { area: string; avg: number } | null;
};

function buildSummaryHtml(s: UserSummary): string {
  const firstName = (s.name || "Estudiante").split(" ")[0];
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Tu semana en Lextutor</title></head>
<body style="margin:0;padding:40px 0;background:#020617;font-family:Inter,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#0f172a;border:1px solid #1e293b;border-radius:12px;overflow:hidden;">
    <div style="padding:32px;background:#0a0a14;border-bottom:1px solid #d4af37;">
      <h1 style="margin:0;color:#d4af37;font-size:22px;font-family:Georgia,serif;font-style:italic;">
        Lextutor — Resumen semanal
      </h1>
      <p style="margin:8px 0 0;color:#94a3b8;font-size:14px;">
        Hola ${firstName}, esto es lo que has conseguido esta semana.
      </p>
    </div>

    <div style="padding:32px;color:#e2e8f0;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:16px;background:#1e293b;border-radius:8px;width:33%;text-align:center;">
            <div style="font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:1.5px;">Exámenes</div>
            <div style="font-size:32px;font-weight:bold;color:#d4af37;margin-top:4px;">${s.examCount}</div>
          </td>
          <td style="width:12px;"></td>
          <td style="padding:16px;background:#1e293b;border-radius:8px;width:33%;text-align:center;">
            <div style="font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:1.5px;">Nota media</div>
            <div style="font-size:32px;font-weight:bold;color:${s.avgScore >= 5 ? "#22c55e" : "#ef4444"};margin-top:4px;">${s.avgScore.toFixed(1)}<span style="font-size:16px;color:#64748b;">/10</span></div>
          </td>
        </tr>
      </table>

      ${
        s.bestArea
          ? `<div style="margin-top:24px;padding:16px;background:#16281b;border-left:3px solid #22c55e;border-radius:4px;">
            <div style="font-size:11px;color:#86efac;text-transform:uppercase;letter-spacing:1.5px;font-weight:bold;">🎯 Tu mejor área</div>
            <div style="margin-top:4px;color:#e2e8f0;font-size:15px;text-transform:capitalize;"><strong>${s.bestArea.area}</strong> — ${s.bestArea.avg.toFixed(1)}/10</div>
          </div>`
          : ""
      }

      ${
        s.worstArea && s.worstArea.avg < 7
          ? `<div style="margin-top:12px;padding:16px;background:#281b1b;border-left:3px solid #ef4444;border-radius:4px;">
            <div style="font-size:11px;color:#fca5a5;text-transform:uppercase;letter-spacing:1.5px;font-weight:bold;">📚 A reforzar</div>
            <div style="margin-top:4px;color:#e2e8f0;font-size:15px;text-transform:capitalize;"><strong>${s.worstArea.area}</strong> — ${s.worstArea.avg.toFixed(1)}/10</div>
          </div>`
          : ""
      }

      <p style="margin-top:32px;color:#94a3b8;font-size:14px;line-height:22px;">
        Sigue con tu rutina. Cada día cuenta. Entra a tu progreso para ver el detalle y seguir practicando.
      </p>

      <div style="margin-top:24px;text-align:center;">
        <a href="https://lextutor.dev/progress" style="display:inline-block;padding:12px 32px;background:#d4af37;color:#0a0a14;border-radius:6px;text-decoration:none;font-weight:bold;font-size:14px;letter-spacing:0.5px;">
          Ver mi progreso
        </a>
      </div>
    </div>

    <div style="padding:16px 32px;background:#0a0a14;border-top:1px solid #1e293b;text-align:center;">
      <p style="margin:0;color:#64748b;font-size:11px;">
        Lextutor — Plataforma de preparación jurídica. Recibes este email porque has estado activo esta semana.
      </p>
    </div>
  </div>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  // 1. Auth — shared secret via Authorization header
  if (!env.CRON_SECRET) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured on the server" },
      { status: 503 }
    );
  }
  const auth = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${env.CRON_SECRET}`;
  if (auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: "RESEND_API_KEY missing; cannot send emails" },
      { status: 503 }
    );
  }

  const supabase = createAdminClient();
  const resend = new Resend(env.RESEND_API_KEY);

  // 2. Fetch finished attempts from the last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: attemptsData, error: attemptsError } = await supabase
    .from("exam_attempts")
    .select("user_id, attempt_type, area, score, created_at")
    .eq("status", "finished")
    .gte("created_at", sevenDaysAgo.toISOString());

  if (attemptsError) {
    logger.error("weekly-summary: fetching attempts failed", attemptsError);
    return NextResponse.json({ error: attemptsError.message }, { status: 500 });
  }

  const attempts = (attemptsData ?? []) as Attempt[];
  if (attempts.length === 0) {
    return NextResponse.json({ sent: 0, message: "No activity this week" });
  }

  // 3. Aggregate per user
  const byUser = new Map<string, Attempt[]>();
  for (const a of attempts) {
    const list = byUser.get(a.user_id) ?? [];
    list.push(a);
    byUser.set(a.user_id, list);
  }

  const userIds = Array.from(byUser.keys());

  // 4. Fetch emails (auth.admin), names + opt-in flag (profiles) in parallel
  const [profilesRes, authUsersRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email_weekly_summary")
      .in("id", userIds)
      .returns<Profile[]>(),
    // listUsers returns all, so we paginate with perPage=1000
    supabase.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const namesById = Object.fromEntries(
    (profilesRes.data ?? []).map((p) => [p.id, p.full_name ?? "Estudiante"])
  );
  // Honor email opt-out — never send to users who explicitly disabled the summary.
  const optedInIds = new Set(
    (profilesRes.data ?? []).filter((p) => p.email_weekly_summary !== false).map((p) => p.id)
  );
  const emailsById = Object.fromEntries(
    (authUsersRes.data?.users ?? [])
      .filter((u) => userIds.includes(u.id) && u.email && optedInIds.has(u.id))
      .map((u) => [u.id, u.email as string])
  );

  let skippedOptOut = 0;
  for (const userId of userIds) {
    if (!optedInIds.has(userId)) skippedOptOut += 1;
  }

  // 5. Build summaries and send
  let sent = 0;
  let errors = 0;

  for (const [userId, userAttempts] of byUser.entries()) {
    const email = emailsById[userId];
    if (!email) continue;

    const examCount = userAttempts.length;
    const totalScore = userAttempts.reduce((s, a) => s + Number(a.score ?? 0), 0);
    const avgScore = examCount > 0 ? totalScore / examCount : 0;

    // Per-area averages
    const areaBuckets = new Map<string, { sum: number; n: number }>();
    for (const a of userAttempts) {
      const key = a.area ?? "general";
      const b = areaBuckets.get(key) ?? { sum: 0, n: 0 };
      b.sum += Number(a.score ?? 0);
      b.n += 1;
      areaBuckets.set(key, b);
    }
    const areaAvgs = Array.from(areaBuckets.entries())
      .map(([area, b]) => ({ area, avg: b.sum / b.n }))
      .sort((a, b) => b.avg - a.avg);

    const summary: UserSummary = {
      userId,
      email,
      name: namesById[userId] ?? "Estudiante",
      examCount,
      avgScore,
      bestArea: areaAvgs[0] ?? null,
      worstArea: areaAvgs[areaAvgs.length - 1] ?? null,
    };

    try {
      const { error } = await resend.emails.send({
        from: "Lextutor <onboarding@resend.dev>",
        to: email,
        subject: `📊 Tu resumen semanal: ${examCount} exámenes, ${avgScore.toFixed(1)}/10`,
        html: buildSummaryHtml(summary),
      });
      if (error) {
        errors += 1;
        logger.warn("weekly-summary: resend error", { userId, message: error.message });
      } else {
        sent += 1;
      }
    } catch (e: unknown) {
      errors += 1;
      captureException(e, {
        user: { id: userId },
        tags: { job: "weekly-summary", step: "send" },
      });
    }
  }

  return NextResponse.json({
    sent,
    errors,
    skippedOptOut,
    totalUsersActive: userIds.length,
  });
}
