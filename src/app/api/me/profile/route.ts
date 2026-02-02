import { createApiHandler } from "@/lib/api-handler";
import { z } from "zod";

export const runtime = 'nodejs';

const profileSchema = z.object({
    full_name: z.string().min(2).max(100).optional(),
    avatar_url: z.string().optional(),
    birth_date: z.string().nullable().optional(), // YYYY-MM-DD
    age: z.number().optional() // Legacy or calculated
});

export const GET = createApiHandler(
    async ({ user, supabase }) => {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('full_name, avatar_url, birth_date, age, role')
            .eq('id', user.id)
            .single();

        if (error) {
            // Throwing error will be caught by api-handler and returned as 500 (or we can return NextResponse for 404?)
            // If profile is strictly required, 500 or 404 is fine.
            throw new Error(error.message);
        }

        return profile;
    }
);

export const PATCH = createApiHandler(
    async ({ user, supabase, body }) => {
        const { error } = await supabase
            .from('profiles')
            .update(body as unknown as never)
            .eq('id', user.id);

        if (error) throw error;

        return { success: true, user: body };
    },
    {
        schema: profileSchema
    }
);
