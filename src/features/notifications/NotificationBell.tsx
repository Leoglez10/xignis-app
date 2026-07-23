import { relativeTimeEs } from "../../lib/relativeTime";
import { Bell, CheckCheck, Trash2, X } from "lucide-react";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BottomSheet } from "../../components/ui/BottomSheet";
import type { AppNotification } from "../../lib/database.types";
import { useIsDesktop } from "../../lib/useIsDesktop";
import { useAuth } from "../session/AuthContext";
import {
  deleteNotification,
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

/** Fila de notificación: arrastrable a la izquierda para eliminar (móvil) + botón papelera. */
function NotificationRow({
  item,
  onOpen,
  onDelete,
}: {
  item: AppNotification;
  onOpen: (item: AppNotification) => void;
  onDelete: (id: string) => void;
}) {
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const moved = useRef(false);

  return (
    <li className="relative overflow-hidden rounded-2xl">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-end rounded-2xl bg-red-500 pr-5 text-white">
        <Trash2 aria-hidden="true" className="size-5" />
      </div>
      <div
        className="relative flex touch-pan-y items-stretch gap-0"
        style={{ transform: `translateX(${dx}px)`, transition: dragging ? "none" : "transform .2s ease" }}
        onPointerDown={(e) => {
          startX.current = e.clientX;
          moved.current = false;
          setDragging(true);
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!dragging) return;
          const d = e.clientX - startX.current;
          if (Math.abs(d) > 8) moved.current = true;
          setDx(Math.max(-120, Math.min(0, d)));
        }}
        onPointerUp={() => {
          setDragging(false);
          if (dx < -80) onDelete(item.id);
          else setDx(0);
        }}
        onPointerCancel={() => {
          setDragging(false);
          setDx(0);
        }}
      >
        <button
          className={`press flex min-w-0 flex-1 items-start gap-3 rounded-l-2xl p-4 text-left ${
            item.read ? "bg-white ring-1 ring-slate-100" : "bg-[var(--color-surface)]"
          }`}
          type="button"
          onClick={() => {
            if (moved.current) return;
            onOpen(item);
          }}
        >
          <span
            aria-hidden="true"
            className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-full text-xs font-bold ${typeAccent[item.type] ?? typeAccent.info}`}
          >
            {item.read ? "" : "•"}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center justify-between gap-2">
              <span className="font-bold text-[var(--color-text)]">{item.title}</span>
              <time className="shrink-0 text-xs text-[var(--color-muted)]" dateTime={item.created_at}>
                {relativeTimeEs(item.created_at)}
              </time>
            </span>
            {item.body ? (
              <span className="mt-1 block text-sm leading-6 text-[var(--color-muted)]">{item.body}</span>
            ) : null}
          </span>
        </button>
        <button
          aria-label="Eliminar notificación"
          className={`press grid w-11 shrink-0 place-items-center rounded-r-2xl text-[var(--color-muted)] ${
            item.read ? "bg-white ring-1 ring-slate-100" : "bg-[var(--color-surface)]"
          }`}
          type="button"
          onClick={() => onDelete(item.id)}
        >
          <Trash2 aria-hidden="true" className="size-5" />
        </button>
      </div>
    </li>
  );
}

export const NotificationBell = memo(function NotificationBell({ className }: NotificationBellProps) {
  const { profile, session } = useAuth();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const userId = session?.user.id ?? null;
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [limit, setLimit] = useState(30);
  const [announcement, setAnnouncement] = useState("");
  const unread = items.filter((item) => !item.read).length;

  const load = useCallback(async () => {
    try {
      setItems(await listNotifications(limit));
    } catch {
      /* silencioso: la campana no debe romper el dashboard */
    }
  }, [limit]);

  useEffect(() => {
    if (!userId) return;
    load();
    const unsubscribe = subscribeToNotifications(userId, (row) => {
      setItems((current) => [row, ...current].slice(0, limit));
    });
    return unsubscribe;
  }, [userId, load, limit]);

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

  const handleDelete = useCallback((id: string) => {
    setItems((current) => current.filter((n) => n.id !== id));
    setAnnouncement("Notificación eliminada.");
    void deleteNotification(id).catch(() => {});
  }, []);

  async function handleMarkAll() {
    setItems((current) => current.map((n) => ({ ...n, read: true })));
    try {
      await markAllNotificationsRead();
    } catch {
      /* ignore */
    }
  }

  // Popover de escritorio: cerrar con Escape (el BottomSheet ya lo trae).
  useEffect(() => {
    if (!isOpen || !isDesktop) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, isDesktop]);

  const markAllButton =
    unread > 0 ? (
      <button
        className="press mb-3 inline-flex items-center gap-2 rounded-full bg-[var(--color-surface)] px-4 py-2 text-sm font-bold text-[var(--color-text)]"
        type="button"
        onClick={handleMarkAll}
      >
        <CheckCheck aria-hidden="true" className="size-4" />
        Marcar todo como leído
      </button>
    ) : null;

  const list = (
    <>
      <ul className="stagger max-h-[60dvh] space-y-2 overflow-y-auto lg:max-h-[26rem]">
        {items.length === 0 ? (
          <li className="rounded-2xl bg-[var(--color-surface)] p-5 text-center text-sm font-semibold text-[var(--color-muted)]">
            Sin notificaciones por ahora.
          </li>
        ) : null}
        {items.map((item) => (
          <NotificationRow key={item.id} item={item} onOpen={handleItemClick} onDelete={handleDelete} />
        ))}
      </ul>
      {items.length >= limit ? (
        <button
          className="press mt-3 min-h-11 w-full rounded-full bg-[var(--color-surface)] px-4 text-sm font-bold"
          type="button"
          onClick={() => setLimit((current) => current + 30)}
        >
          Ver notificaciones anteriores
        </button>
      ) : null}
    </>
  );

  return (
    <div className="relative">
      <span aria-live="polite" className="sr-only">{announcement}</span>
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
            className="absolute right-1.5 top-1.5 grid min-h-4 min-w-4 animate-scale-in place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white"
          >
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {isDesktop ? (
        isOpen ? (
          <>
            {/* atrapa el clic fuera para cerrar */}
            <div aria-hidden="true" className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div
              className="absolute right-0 top-full z-50 mt-2 w-[24rem] origin-top-right animate-scale-in overflow-hidden rounded-[24px] border border-[var(--card-border)] bg-[var(--card-bg)] p-4 shadow-2xl"
              role="dialog"
              aria-label="Notificaciones"
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-bold text-[var(--color-text)]">Notificaciones</h2>
                <button
                  aria-label="Cerrar"
                  className="press grid size-9 place-items-center rounded-full bg-[var(--color-surface)] text-[var(--color-text)]"
                  type="button"
                  onClick={() => setIsOpen(false)}
                >
                  <X aria-hidden="true" className="size-4" />
                </button>
              </div>
              {markAllButton}
              {list}
            </div>
          </>
        ) : null
      ) : (
        <BottomSheet isOpen={isOpen} title="Notificaciones" onClose={() => setIsOpen(false)}>
          {markAllButton}
          {list}
        </BottomSheet>
      )}
    </div>
  );
});
