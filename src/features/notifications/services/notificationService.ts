import type { AppNotification } from "../../../lib/database.types";
import { getSupabaseClient } from "../../../lib/supabase";

export async function listNotifications(limit = 30) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as AppNotification[];
}

export async function markNotificationRead(id: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
  if (error) throw error;
}

export async function markAllNotificationsRead() {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("notifications").update({ read: true }).eq("read", false);
  if (error) throw error;
}

/**
 * Suscripción realtime a notificaciones del usuario actual.
 * Devuelve función para cancelar.
 */
export function subscribeToNotifications(userId: string, onInsert: (row: AppNotification) => void) {
  const supabase = getSupabaseClient();
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
      (payload) => onInsert(payload.new as AppNotification),
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
