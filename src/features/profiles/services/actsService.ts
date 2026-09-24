import { getSupabaseClient } from "../../../lib/supabase";
import type { AdministrativeAct, AdministrativeActType } from "../../../lib/database.types";

export async function listMyActs(): Promise<AdministrativeAct[]> {
  const supabase = getSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw new Error("No se pudieron cargar tus actas.");
  if (!user) throw new Error("Necesitas iniciar sesión.");

  const { data, error } = await supabase
    .from("administrative_acts")
    .select("*")
    .eq("employee_id", user.id)
    .order("act_date", { ascending: false });

  if (error) throw new Error("No se pudieron cargar tus actas.");
  return (data ?? []) as AdministrativeAct[];
}

export async function listActsFor(employeeId: string): Promise<AdministrativeAct[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("administrative_acts")
    .select("*")
    .eq("employee_id", employeeId)
    .order("act_date", { ascending: false });

  if (error) throw new Error("No se pudieron cargar las actas del empleado.");
  return (data ?? []) as AdministrativeAct[];
}

export async function createAct(input: {
  employeeId: string;
  actType: AdministrativeActType;
  reason: string;
  actDate: string;
  notes?: string;
}): Promise<void> {
  const supabase = getSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw new Error("No se pudo registrar el acta.");
  if (!user) throw new Error("Necesitas iniciar sesión.");

  const { error } = await supabase.from("administrative_acts").insert({
    employee_id: input.employeeId,
    act_type: input.actType,
    reason: input.reason.trim(),
    act_date: input.actDate,
    notes: input.notes?.trim() || null,
    created_by: user.id,
  });

  if (error) {
    throw new Error("No se pudo registrar el acta. ¿Tienes permisos de RH?");
  }
}
