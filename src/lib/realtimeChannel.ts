import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabaseClient } from "./supabase";

type Entry<T> = { channel: RealtimeChannel; subs: Set<(payload: T) => void> };

// Un canal realtime por `topic`, ref-contado. Varios componentes montados a la
// vez (p.ej. durante una transición de página que mantiene dos pantallas vivas)
// comparten el mismo canal → evita el error
// "cannot add postgres_changes callbacks after subscribe()".
const registry = new Map<string, Entry<unknown>>();

/**
 * Suscripción realtime compartida y ref-contada por `topic`.
 * - `build` registra los `.on(...)` la primera vez; llama a `fire(payload)` en cada evento.
 * - Cada suscriptor recibe `payload` vía `onEvent`.
 * - Al soltar el último suscriptor se elimina el canal.
 */
export function subscribeShared<T>(
  topic: string,
  build: (channel: RealtimeChannel, fire: (payload: T) => void) => void,
  onEvent: (payload: T) => void,
): () => void {
  let entry = registry.get(topic) as Entry<T> | undefined;
  if (!entry) {
    const supabase = getSupabaseClient();
    const subs = new Set<(payload: T) => void>();
    const fire = (payload: T) => subs.forEach((cb) => cb(payload));
    const channel = supabase.channel(topic);
    build(channel, fire);
    channel.subscribe();
    entry = { channel, subs };
    registry.set(topic, entry as Entry<unknown>);
  }
  entry.subs.add(onEvent);

  return () => {
    entry.subs.delete(onEvent);
    if (entry.subs.size === 0) {
      getSupabaseClient().removeChannel(entry.channel);
      registry.delete(topic);
    }
  };
}
