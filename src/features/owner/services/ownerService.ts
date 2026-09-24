import type { OwnerRequest } from "../../../lib/database.types";
import { getSupabaseClient } from "../../../lib/supabase";

export async function listMyOwnerRequests(): Promise<OwnerRequest[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("owner_requests")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as OwnerRequest[];
}

export async function createOwnerRequest(input: {
  message: string;
  context?: string | null;
}): Promise<OwnerRequest> {
  const supabase = getSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error("Necesitas iniciar sesión.");

  const { data, error } = await supabase
    .from("owner_requests")
    .insert({
      owner_id: user.id,
      message: input.message.trim(),
      context: input.context ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as OwnerRequest;
}

export async function listAllOwnerRequests(): Promise<OwnerRequest[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("owner_requests")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as OwnerRequest[];
}

export async function resolveOwnerRequest(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error("Necesitas iniciar sesión.");

  const { error } = await supabase
    .from("owner_requests")
    .update({ status: "resolved", resolved_at: new Date().toISOString(), resolved_by: user.id })
    .eq("id", id);
  if (error) throw error;
}
