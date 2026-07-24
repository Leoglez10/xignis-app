import type { Department, Profile } from "../../../lib/database.types";
import { getSupabaseClient } from "../../../lib/supabase";
import { subscribeShared } from "../../../lib/realtimeChannel";

export type DepartmentWithCount = Department & { memberCount: number };

/** Lista áreas (activas primero, archivadas al final) con conteo de miembros. */
export async function listDepartments(): Promise<DepartmentWithCount[]> {
  const supabase = getSupabaseClient();
  const [{ data: departments, error }, { data: profiles, error: pError }] = await Promise.all([
    supabase.from("departments").select("*").order("name"),
    supabase.from("profiles").select("department_id").not("department_id", "is", null),
  ]);
  if (error) throw error;
  if (pError) throw pError;
  const counts = new Map<string, number>();
  for (const p of profiles ?? []) {
    if (p.department_id) counts.set(p.department_id, (counts.get(p.department_id) ?? 0) + 1);
  }
  const rows = (departments ?? []).map((d) => ({ ...d, memberCount: counts.get(d.id) ?? 0 }));
  rows.sort((a, b) => Number(Boolean(a.archived_at)) - Number(Boolean(b.archived_at)) || a.name.localeCompare(b.name));
  return rows;
}

/** Solo áreas activas, para selects de asignación. */
export async function listActiveDepartments(): Promise<Department[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("departments").select("*").is("archived_at", null).order("name");
  if (error) throw error;
  return data ?? [];
}

export async function createDepartment(name: string, description?: string, color?: string | null): Promise<Department> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("departments")
    .insert({ name: name.trim(), description: description?.trim() || null, color: color ?? null })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateDepartment(
  id: string,
  patch: { name?: string; description?: string | null; color?: string | null },
): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("departments").update(patch).eq("id", id);
  if (error) throw error;
}

/** Archivar es soft-delete: el área deja de aparecer en selects pero conserva historia. */
export async function setDepartmentArchived(id: string, archived: boolean): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("departments")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) throw error;
}

export async function listDepartmentMembers(id: string): Promise<Pick<Profile, "id" | "full_name" | "job_title" | "avatar_url">[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, job_title, avatar_url")
    .eq("department_id", id)
    .order("full_name");
  if (error) throw error;
  return data ?? [];
}

export type AssignableEmployee = Pick<
  Profile,
  "id" | "full_name" | "job_title" | "avatar_url" | "department_id"
> & { department: { id: string; name: string } | null };

/** Empleados activos con su área actual, para el asignador de un área. */
export async function listAssignableEmployees(): Promise<AssignableEmployee[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, job_title, avatar_url, department_id, department:departments(id, name)")
    .in("employment_status", ["active", "on_leave"])
    .order("full_name");
  if (error) throw error;
  return (data ?? []) as unknown as AssignableEmployee[];
}

/** Mueve gente a un área. Solo toca profiles.department_id: el trigger
 *  log_employment_event escribe un department_change por persona, así que el
 *  historial se arma solo y nunca se escribe a mano. */
export async function assignToDepartment(userIds: string[], departmentId: string): Promise<void> {
  if (userIds.length === 0) return;
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("profiles").update({ department_id: departmentId }).in("id", userIds);
  if (error) throw error;
}

/** Realtime: refresca lista de áreas al cambiar en otro dispositivo. */
export function subscribeToDepartments(onChange: () => void): () => void {
  return subscribeShared<void>(
    "departments-changes",
    (channel, fire) => {
      channel.on("postgres_changes", { event: "*", schema: "public", table: "departments" }, () => fire());
    },
    onChange,
  );
}
