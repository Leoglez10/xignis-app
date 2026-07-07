import { relativeTimeEs } from "../../lib/relativeTime";
import { Bell, CheckCheck } from "lucide-react";
import { memo, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BottomSheet } from "../../components/ui/BottomSheet";
import type { AppNotification } from "../../lib/database.types";
import { useAuth } from "../session/AuthContext";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeToNotifications,
} from "./services/notificationService";

const typeAccent: Record<string, string> = {
  request_new: "bg-blue-100 text-blue-700",
  request_hr: "bg-amber-100 text-amber-700",
  request_update: "bg-indigo-100 text-indigo-700",
  request_approved: "bg-emerald-100 text-emerald-700",
  request_rejected: "bg-red-100 text-red-700",
  info: "bg-slate-100 text-slate-700",
};

type NotificationBellProps = {
  /** clase para el botón disparador (color del icono según fondo) */
  className?: string;
};

export const NotificationBell = memo(function NotificationBell({ className }: NotificationBellProps) {
  const { profile, session } = useAuth();
  const navigate = useNavigate();
  const userId = session?.user.id ?? null;
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const unread = items.filter((item) => !item.read).length;

  const load = useCallback(async () => {
    try {
      setItems(await listNotifications());
    } catch {
      /* silencioso: la campana no debe romper el dashboard */
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    load();
    const unsubscribe = subscribeToNotifications(userId, (row) => {
      setItems((current) => [row, ...current].slice(0, 30));
    });
    return unsubscribe;
  }, [userId, load]);

  async function handleOpen() {
    setIsOpen(true);
    await load();
  }

  const handleItemClick = useCallback(
    (item: AppNotification) => {
      setIsOpen(false);
      if (!item.read) {
        setItems((current) => current.map((n) => (n.id === item.id ? { ...n, read: true } : n)));
        void markNotificationRead(item.id).catch(() => {});
      }
      if (!item.related_request_id) return;
      const role = profile?.role;
      const path =
        role === "employee"
          ? `/employee/requests/${item.related_request_id}`
          : role === "manager"
            ? `/manager/requests/${item.related_request_id}`
            : role === "hr_admin" || role === "admin"
              ? `/admin/requests/${item.related_request_id}`
              : null;
      if (path) navigate(path);
    },
    [navigate, profile?.role],
  );

  async function handleMarkAll() {
    setItems((current) => current.map((n) => ({ ...n, read: true })));
    try {
      await markAllNotificationsRead();
    } catch {
      /* ignore */
    }
  }

  return (
    <>
      <button
        aria-label={unread > 0 ? `Notificaciones, ${unread} sin leer` : "Notificaciones"}
        className={`press relative grid size-11 place-items-center rounded-full ${className ?? "bg-[var(--color-surface)] text-[var(--color-text)]"}`}
        type="button"
        onClick={handleOpen}
      >
        <Bell aria-hidden="true" className="size-5" />
        {unread > 0 ? (
          <span
            aria-hidden="true"
            className="absolute right-1.5 top-1.5 grid min-h-4 min-w-4 animate-scale-in place-items-center rounded-full bg-red-500 px-1 text-[10px] font-black leading-none text-white"
          >
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      <BottomSheet isOpen={isOpen} title="Notificaciones" onClose={() => setIsOpen(false)}>
        {unread > 0 ? (
          <button
            className="press mb-3 inline-flex items-center gap-2 rounded-full bg-[var(--color-surface)] px-4 py-2 text-sm font-bold text-[var(--color-text)]"
            type="button"
            onClick={handleMarkAll}
          >
            <CheckCheck aria-hidden="true" className="size-4" />
            Marcar todo como leído
          </button>
        ) : null}

        <ul className="stagger max-h-[60dvh] space-y-2 overflow-y-auto">
          {items.length === 0 ? (
            <li className="rounded-2xl bg-[var(--color-surface)] p-5 text-center text-sm font-semibold text-[var(--color-muted)]">
              Sin notificaciones por ahora.
            </li>
          ) : null}
          {items.map((item) => (
            <li key={item.id}>
              <button
                className={`press flex w-full items-start gap-3 rounded-2xl p-4 text-left ${
                  item.read ? "bg-white ring-1 ring-slate-100" : "bg-[var(--color-surface)]"
                }`}
                type="button"
                onClick={() => handleItemClick(item)}
              >
                <span
                  aria-hidden="true"
                  className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-full text-xs font-black ${typeAccent[item.type] ?? typeAccent.info}`}
                >
                  {item.read ? "" : "•"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-black text-[var(--color-text)]">{item.title}</span>
                    <time className="shrink-0 text-xs text-[var(--color-muted)]" dateTime={item.created_at}>
                      {relativeTimeEs(item.created_at)}
                    </time>
                  </span>
                  {item.body ? (
                    <span className="mt-1 block text-sm leading-6 text-[var(--color-muted)]">{item.body}</span>
                  ) : null}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </BottomSheet>
    </>
  );
});
