import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase";
import { RateLimitConfig, checkRateLimit } from "./rateLimit";

type ApiHandlerContext<TBody = any> = {
    user: any;
    supabase: any;
    body: TBody;
};

type ApiHandlerOptions<TBody extends z.ZodType> = {
    schema?: TBody;
    rateLimit?: RateLimitConfig;
    requireAdmin?: boolean;
};

/**
 * Unified API Route Handler
 * Automatically handles Auth, Rate Limiting, Zod Validation, and Error Responses.
 */
export function createApiHandler<TBody extends z.ZodType>(
    handler: (ctx: ApiHandlerContext<z.infer<TBody>>) => Promise<NextResponse | any>,
    options: ApiHandlerOptions<TBody> = {}
) {
    return async (request: NextRequest) => {
        const supabase = createClient();

        try {
            // 1. Authentication
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }

            // 2. Admin Check (if required)
            if (options.requireAdmin) {
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("role")
                    .eq("id", user.id)
                    .single();

                if (!profile || (profile as any).role !== "admin") {
                    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
                }
            }

            // 3. Rate Limiting
            if (options.rateLimit) {
                const rateLimit = await checkRateLimit(user.id, options.rateLimit);
                if (!rateLimit.allowed) {
                    return NextResponse.json({
                        error: `Límite excedido. Intenta de nuevo a las ${new Date(rateLimit.resetAt).toLocaleTimeString('es-ES')}.`,
                        resetAt: rateLimit.resetAt
                    }, { status: 429 });
                }
            }

            // 4. Body Parsing & Validation
            let body = {};
            if (request.method !== "GET" && request.method !== "DELETE") {
                const json = await request.json();
                body = options.schema ? options.schema.parse(json) : json;
            }

            // 5. Execute Handler
            const result = await handler({ user, supabase, body });

            // 6. Return response
            if (result instanceof NextResponse) return result;
            return NextResponse.json(result);

        } catch (error: any) {
            console.error("API Error:", error);

            if (error instanceof z.ZodError) {
                return NextResponse.json({
                    error: "Validation Error",
                    details: error.errors
                }, { status: 400 });
            }

            return NextResponse.json({
                error: error.message || "Internal Server Error"
            }, { status: 500 });
        }
    };
}
