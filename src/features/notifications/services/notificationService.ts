import type { AppNotification } from "../../../lib/database.types";
import { getSupabaseClient } from "../../../lib/supabase";
import { subscribeShared } from "../../../lib/realtimeChannel";

export async function listNotifications(limit = 30, offset = 0) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return (data ?? []) as AppNotification[];
}

export async function markNotificationRead(id: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
  if (error) throw error;
}

export async function deleteNotification(id: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("notifications").delete().eq("id", id);
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
  return subscribeShared<AppNotification>(
    `notifications:${userId}`,
    (channel, fire) =>
      channel.on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => fire(payload.new as AppNotification),
      ),
    onInsert,
  );
}
