/** Layout jefe: contenido fluido en mobile y desktop.
 *  La navegación la aporta siempre el TopBar (fila de tabs horizontal, estilo iOS). */
export function ManagerShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-dvh bg-slate-50 text-[var(--color-text)]" id="main-content" tabIndex={-1}>
      <div className="min-w-0 pb-16 pt-[env(safe-area-inset-top)] lg:pb-8 lg:pt-6">{children}</div>
    </main>
  );
}
