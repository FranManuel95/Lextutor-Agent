"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { sendVerificationEmail } from "@/lib/send-verification-email";

export async function login(formData: FormData) {
  const supabase = createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return redirect(`/login?message=${encodeURIComponent(error.message)}`);
  }

  // revalidatePath('/', 'layout')
  redirect("/chat");
}

export async function signup(formData: FormData) {
  const supabase = createClient();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) throw new Error("Missing Service Role Key");

  // Admin client for privileged operations (Storage/Profile update during signup)
  const adminSupabase = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey);

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const fullName = formData.get("fullName") as string;
  const birthdate = formData.get("birthdate") as string;
  const avatar = formData.get("avatar") as File;

  // Validate password confirmation
  if (password !== confirmPassword) {
    return redirect("/login?message=Las contraseñas no coinciden");
  }

  // Calculate age from birthdate
  const birthdateObj = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birthdateObj.getFullYear();
  const monthDiff = today.getMonth() - birthdateObj.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthdateObj.getDate())) {
    age--;
  }

  // Validate age (must be at least 13 years old)
  if (!birthdate || isNaN(birthdateObj.getTime())) {
    return redirect("/login?message=Fecha de nacimiento inválida");
  }
  if (age < 13) {
    return redirect("/login?message=Debes tener al menos 13 años para registrarte");
  }

  // 4. Create user directly (Skip verification)
  const { data: userData, error: createError } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // AUTO-CONFIRMATION MAGIC
    user_metadata: {
      full_name: fullName,
    },
  });

  if (createError || !userData.user) {
    return redirect(`/login?message=${createError?.message || "Error al crear usuario"}`);
  }

  const user = userData.user;

  // 5. Handle Profile & Avatar
  let avatarUrl = null;
  if (avatar && avatar.size > 0) {
    const fileExt = avatar.name.split(".").pop();
    const filePath = `avatars/${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await adminSupabase.storage
      .from("avatars")
      .upload(filePath, avatar, {
        contentType: avatar.type,
        upsert: true,
      });

    if (!uploadError) {
      const {
        data: { publicUrl },
      } = adminSupabase.storage.from("avatars").getPublicUrl(filePath);
      avatarUrl = publicUrl;
    }
  }

  // 6. Update Profile
  await adminSupabase.from("profiles").upsert({
    id: user.id,
    full_name: fullName,
    birthdate: birthdate,
    avatar_url: avatarUrl,
    updated_at: new Date().toISOString(),
  });

  // 7. Auto Sign In (Now that user exists and is confirmed)
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    return redirect(
      "/login?message=Registro exitoso, pero error al iniciar sesión automática. Por favor entra manualmente."
    );
  }

  // revalidatePath('/', 'layout')
  redirect("/chat");
}
