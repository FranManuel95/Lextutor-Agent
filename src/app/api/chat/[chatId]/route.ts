import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
    request: NextRequest,
    { params }: { params: { chatId: string } }
) {
    const supabase = createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const chatId = params.chatId;

    if (!chatId) {
        return NextResponse.json({ error: "Missing chat ID" }, { status: 400 });
    }

    try {
        // Verify ownership and delete in one go (RLS policies should handle this, 
        // but explicit check is safer if RLS isn't perfect). 
        // Actually, simple DELETE with eq user_id is best pattern.

        const { error } = await supabase
            .from("chats")
            .delete()
            .eq("id", chatId)
            .eq("user_id", user.id); // Security: Ensure user owns the chat

        if (error) {
            console.error("Delete Chat Error:", error);
            throw error;
        }

        revalidateTag(`chats-${user.id}`);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
