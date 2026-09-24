import type { HrReport, HrReportStatus } from "../../../lib/database.types";
import { getSupabaseClient } from "../../../lib/supabase";

export const reportStatusLabel: Record<HrReportStatus, string> = {
  open: "Abierta",
  resolved: "Resuelta",
};

export async function listMyReports(): Promise<HrReport[]> {
  const supabase = getSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error("Necesitás iniciar sesión.");

  const { data, error } = await supabase
    .from("hr_reports")
    .select("*")
    .eq("reporter_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as HrReport[];
}

export async function listAllReports(): Promise<HrReport[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("hr_reports")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as HrReport[];
}

export async function createReport(input: {
  subject: string;
  message: string;
  requestAnonymity: boolean;
}): Promise<HrReport> {
  const supabase = getSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error("Necesitás iniciar sesión.");

  const { data, error } = await supabase
    .from("hr_reports")
    .insert({
      reporter_id: user.id,
      subject: input.subject.trim(),
      message: input.message.trim(),
      request_anonymity: input.requestAnonymity,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as HrReport;
}

export async function resolveReport(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error("Necesitás iniciar sesión.");

  const { error } = await supabase
    .from("hr_reports")
    .update({
      status: "resolved",
      resolved_at: new Date().toISOString(),
      resolved_by: user.id,
    })
    .eq("id", id);

  if (error) throw error;
}
