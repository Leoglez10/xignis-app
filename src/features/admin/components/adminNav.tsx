/** Layout RH/admin: contenido fluido en mobile y desktop.
 *  La navegación la aporta siempre el TopBar (fila de tabs horizontal, estilo iOS).
 *  El offset vertical lo gestiona globals.css con --topbar-content-h más el safe area. */
export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-dvh bg-slate-50 text-[var(--color-text)]" id="main-content" tabIndex={-1}>
      <div className="min-w-0 pb-16 lg:pb-8">{children}</div>
    </main>
  );
}
