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

export async function createDepartment(name: string, description?: string): Promise<Department> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("departments")
    .insert({ name: name.trim(), description: description?.trim() || null })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateDepartment(id: string, patch: { name?: string; description?: string | null }): Promise<void> {
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
