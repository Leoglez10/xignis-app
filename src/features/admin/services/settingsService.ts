import { getSupabaseClient } from "../../../lib/supabase";

export type AppRules = {
  allowHalfDay: boolean;
  notifyByEmail: boolean;
  requireManagerApproval: boolean;
};

export const defaultRules: AppRules = {
  allowHalfDay: true,
  notifyByEmail: true,
  requireManagerApproval: true,
};

const RULE_KEYS = Object.keys(defaultRules) as (keyof AppRules)[];

/** Lee las reglas operativas desde app_settings. Claves faltantes → default. */
export async function getRules(): Promise<AppRules> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("app_settings").select("key, value").in("key", RULE_KEYS);
  if (error) throw error;
  const rules = { ...defaultRules };
  for (const row of data ?? []) {
    const key = row.key as keyof AppRules;
    if (RULE_KEYS.includes(key)) rules[key] = Boolean(row.value);
  }
  return rules;
}

/** Persiste las reglas en backend (RLS: solo hr_admin/admin). */
export async function saveRules(rules: AppRules): Promise<void> {
  const supabase = getSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const rows = RULE_KEYS.map((key) => ({
    key,
    value: rules[key],
    updated_by: user?.id ?? null,
  }));
  const { error } = await supabase.from("app_settings").upsert(rows);
  if (error) throw error;
}
