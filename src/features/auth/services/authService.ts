import type { UserRole } from "../../../lib/database.types";
import { getSupabaseClient } from "../../../lib/supabase";
import { getCurrentProfile } from "../../profiles/services/profileService";

const roleRoute: Record<UserRole, string> = {
  admin: "/admin",
  employee: "/employee",
  hr_admin: "/admin",
  manager: "/manager",
};

export function routeForRole(role: UserRole) {
  return roleRoute[role];
}

export async function login(input: { email: string; password: string }) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });

  if (error) throw error;

  const profile = await getCurrentProfile();

  if (!profile) {
    await supabase.auth.signOut();
    throw new Error("No existe un perfil para esta cuenta.");
  }

  return { profile, redirectTo: routeForRole(profile.role) };
}

/** Estado de una cuenta antes de pedir contraseña. `pending` = dada de alta por RH
 *  y todavía sin contraseña propia; `password` = pedir contraseña como siempre
 *  (incluye correos inexistentes, a propósito, para no filtrar quién está dado de alta). */
export type AccountStatus = "password" | "pending";

async function accountAccess<T>(body: Record<string, unknown>): Promise<T> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.functions.invoke("account-access", { body });
  // supabase-js deja `data = null` en respuestas !=2xx y expone el Response real en
  // `error.context`: leemos ahí el `{ error }` de la Edge Function.
  if (error) {
    const res = (error as { context?: Response }).context;
    let message = error.message;
    if (res instanceof Response) {
      try {
        const parsed = await res.clone().json();
        if (parsed?.error) message = parsed.error as string;
      } catch {
        // body no-JSON: nos quedamos con el mensaje genérico
      }
    }
    throw new Error(message);
  }
  return data as T;
}

export async function getAccountStatus(email: string) {
  const { status } = await accountAccess<{ status: AccountStatus }>({ action: "status", email });
  return status;
}

/** Define la contraseña de una cuenta pendiente y deja lista la sesión. */
export async function activateAccount(input: { email: string; password: string }) {
  await accountAccess<{ ok: true }>({ action: "activate", ...input });
  return login(input);
}

export async function signUp(input: { email: string; password: string; fullName: string }) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: { full_name: input.fullName },
      emailRedirectTo: `${window.location.origin}/login`,
    },
  });
  if (error) throw error;
}

export async function requestPasswordReset(email: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/set-password`,
  });
  if (error) throw error;
}

export async function updatePassword(password: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

export async function logout() {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
