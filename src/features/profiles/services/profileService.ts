import type { Profile, UserRole } from "../../../lib/database.types";
import { getSupabaseClient } from "../../../lib/supabase";

export type ProfileWithManager = Profile & {
  manager?: Pick<Profile, "id" | "full_name"> | null;
};

export const roleLabel: Record<UserRole, string> = {
  admin: "Admin",
  employee: "Empleado",
  hr_admin: "RH",
  manager: "Jefe",
};

export async function getCurrentProfile() {
  const supabase = getSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) return null;

  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  if (error) throw new Error(error.message);

  return data;
}

/** Correo de la sesion actual (vive en auth.users, no en profiles). */
export async function getCurrentEmail() {
  const supabase = getSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.email ?? null;
}

/** Edita el perfil propio. El trigger guard_profile_privileged_fields evita que
 *  un usuario sin rol RH/admin cambie su role, manager_id o job_title. */
export async function updateMyProfile(changes: { full_name?: string; avatar_url?: string | null }) {
  const supabase = getSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error("Necesitas iniciar sesion.");

  const { error } = await supabase.from("profiles").update(changes).eq("id", user.id);
  if (error) throw new Error(error.message);
}

/** Empleados visibles para el rol actual (RH/admin: todos; jefe: su equipo). */
export async function listEmployees() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*, manager:profiles(id, full_name)")
    .order("full_name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as ProfileWithManager[];
}

/** Perfiles que pueden ser jefe (manager/admin/hr_admin). */
export async function listManagers() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .in("role", ["manager", "admin", "hr_admin"])
    .order("full_name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Pick<Profile, "id" | "full_name" | "role">[];
}

/** Empleados directos del jefe actual. */
export async function listMyTeam() {
  const supabase = getSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error("Necesitas iniciar sesion.");

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("manager_id", user.id)
    .order("full_name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Profile[];
}

/** Empleados que comparten mi mismo manager (excluyéndome). Si no tengo
 *  manager, devuelve lista vacía. Útil para el dashboard empleado "compañeros". */
export async function listMyPeers() {
  const supabase = getSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) return [] as Profile[];

  const { data: me, error: meErr } = await supabase
    .from("profiles")
    .select("manager_id")
    .eq("id", user.id)
    .maybeSingle();
  if (meErr) throw meErr;
  if (!me?.manager_id) return [] as Profile[];

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("manager_id", me.manager_id)
    .neq("id", user.id)
    .order("full_name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Profile[];
}

/** Perfil de un miembro de mi equipo. RLS deja ver si manager_id=auth.uid(). */
export async function getTeamMemberProfile(id: string): Promise<Profile | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function updateProfileAssignment(
  id: string,
  changes: {
    annual_vacation_days?: number | null;
    role?: UserRole;
    manager_id?: string | null;
    job_title?: string | null;
    full_name?: string;
  },
) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("profiles").update(changes).eq("id", id);
  if (error) throw error;
}

/** Invita un usuario nuevo (RH/admin). Crea auth user + perfil y envía correo. */
export async function inviteUser(input: {
  annual_vacation_days?: number | null;
  email: string;
  full_name: string;
  role: UserRole;
  job_title?: string | null;
  manager_id?: string | null;
}) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.functions.invoke("admin-create-user", {
    body: { ...input, redirect_to: `${window.location.origin}/set-password` },
  });

  if (error) {
    // la Edge Function devuelve { error } en el body con status !=2xx
    const message = (data as { error?: string } | null)?.error ?? error.message;
    throw new Error(message);
  }
  return data as { ok: true; user_id: string; email: string };
}

/** Elimina un empleado (RH/admin). Pide el nombre completo como confirmación. */
export async function deleteEmployee(input: { confirmation: string; user_id: string }) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.functions.invoke("admin-delete-user", {
    body: input,
  });

  if (error) {
    const message = (data as { error?: string } | null)?.error ?? error.message;
    throw new Error(message);
  }
  return data as { ok: true; user_id: string };
}
