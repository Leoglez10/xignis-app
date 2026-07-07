import type { UserRole } from "../../../lib/database.types";
import { getSupabaseClient } from "../../../lib/supabase";
import { getCurrentProfile } from "../../profiles/services/profileService";

export type LoginRole = "employee" | "manager" | "hr_admin";

const roleRoute: Record<UserRole, string> = {
  admin: "/admin",
  employee: "/employee",
  hr_admin: "/admin",
  manager: "/manager",
};

export function routeForRole(role: UserRole) {
  return roleRoute[role];
}

export function loginRoleMatchesProfile(selectedRole: LoginRole, profileRole: UserRole) {
  if (selectedRole === "hr_admin") return profileRole === "hr_admin" || profileRole === "admin";
  return selectedRole === profileRole;
}

export async function login(input: { email: string; password: string; selectedRole: LoginRole }) {
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

  if (!loginRoleMatchesProfile(input.selectedRole, profile.role)) {
    await supabase.auth.signOut();
    throw new Error("La cuenta no corresponde al rol seleccionado.");
  }

  return { profile, redirectTo: routeForRole(profile.role) };
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
