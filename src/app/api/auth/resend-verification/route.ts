import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { createHash } from "crypto";
import { z } from "zod";

const resendSchema = z.object({
  email: z.string().email().max(254),
});

// Supabase's check_rate_limit RPC expects a UUID; derive a stable one from the email
// so the same address gets throttled regardless of IP.
function emailToUuid(email: string): string {
  const h = createHash("sha256").update(email.toLowerCase().trim()).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

export async function POST(req: NextRequest) {
  let email: string;
  try {
    const parsed = resendSchema.parse(await req.json());
    email = parsed.email;
  } catch {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const rateLimit = await checkRateLimit(emailToUuid(email), RATE_LIMITS.AUTH_RESEND);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many verification requests. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const supabase = createClient();
    const { error } = await supabase.auth.resend({ type: "signup", email });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Verification email sent successfully" });
  } catch (error) {
    console.error("Error resending verification:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
