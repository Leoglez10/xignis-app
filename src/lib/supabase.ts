import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { authStorage } from "./capacitorStorage";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient<Database>(supabaseUrl, supabaseAnonKey, { auth: { persistSession: true, storage: authStorage, storageKey: "xignis.auth:v1" } })
    : null;

export function getSupabaseClient() {
  if (!supabase) {
    throw new Error("Supabase no esta configurado. Revisa VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.");
  }

  return supabase;
}
