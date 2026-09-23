import type { TimeBankTransaction } from "../../../lib/database.types";
import { getSupabaseClient } from "../../../lib/supabase";

export type TimeBankBalance = {
  availableHours: number;
};

type PageOptions = { limit: number; offset?: number };
function page(options: PageOptions) {
  const offset = options.offset ?? 0;
  return { from: offset, to: offset + options.limit - 1 };
}

export async function getTimeBankFor(employeeId: string): Promise<TimeBankBalance> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc("get_time_bank_for", { p_employee_id: employeeId });
  if (error) throw error;
  return { availableHours: typeof data === "number" ? data : 0 };
}

export async function listTimeBankFor(employeeId: string, options?: PageOptions) {
  const supabase = getSupabaseClient();
  let query = supabase
    .from("time_bank_transactions")
    .select("*")
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false });
  if (options) query = query.range(page(options).from, page(options).to);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as TimeBankTransaction[];
}

export async function adjustTimeBank(employeeId: string, hours: number, reason: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("time_bank_transactions").insert({
    employee_id: employeeId,
    hours,
    reason,
  });
  if (error) throw error;
}
