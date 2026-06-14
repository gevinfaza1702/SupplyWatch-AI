"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ensureProfileForUser } from "@/lib/auth/ensure-profile";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_NEXT = "/dashboard";

export async function signInAction(formData: FormData) {
  const email = getString(formData, "email").toLowerCase();
  const password = getString(formData, "password");
  const next = sanitizeNext(getString(formData, "next"));

  if (!authEnvReady()) {
    redirectWithError("Supabase belum dikonfigurasi di .env.local.", next);
  }

  if (!email || !password) {
    redirectWithError("Email dan password wajib diisi.", next);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirectWithError("Email atau password salah.", next);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await ensureProfileForUser(supabase, user);
  }

  redirect(next);
}

export async function signUpAction(formData: FormData) {
  const fullName = getString(formData, "fullName");
  const email = getString(formData, "email").toLowerCase();
  const password = getString(formData, "password");
  const next = sanitizeNext(getString(formData, "next"));

  if (!authEnvReady()) {
    redirectWithError("Supabase belum dikonfigurasi di .env.local.", next);
  }

  if (!email || !password) {
    redirectWithError("Email dan password wajib diisi.", next);
  }

  if (password.length < 6) {
    redirectWithError("Password minimal 6 karakter.", next);
  }

  const origin = await getOrigin();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName || email,
      },
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    redirectWithError(error.message || "Registrasi gagal.", next);
  }

  if (data.user && data.session) {
    await ensureProfileForUser(supabase, data.user, fullName || null);
    redirect(next);
  }

  redirect(
    `/login?mode=signin&message=${encodeURIComponent(
      "Registrasi berhasil. Cek email kamu untuk konfirmasi akun, lalu login.",
    )}&next=${encodeURIComponent(next)}`,
  );
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function sanitizeNext(value: string) {
  if (!value) return DEFAULT_NEXT;
  if (!value.startsWith("/") || value.startsWith("//")) return DEFAULT_NEXT;
  return value;
}

async function getOrigin() {
  const headerStore = await headers();
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    headerStore.get("origin") ||
    "http://localhost:3000"
  );
}

function authEnvReady() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

function redirectWithError(message: string, next: string): never {
  redirect(
    `/login?error=${encodeURIComponent(message)}&next=${encodeURIComponent(next)}`,
  );
}
