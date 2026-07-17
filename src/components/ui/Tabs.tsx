import type { ReactNode } from "react";

type Tab = { id: string; label: string; panel: ReactNode };
export function Tabs({ activeId, onChange, tabs }: { activeId: string; onChange: (id: string) => void; tabs: Tab[] }) {
  return <div><div aria-label="Secciones" className="flex gap-1 rounded-2xl bg-[var(--color-surface)] p-1" role="tablist">{tabs.map((tab) => <button aria-controls={`panel-${tab.id}`} aria-selected={activeId === tab.id} className={`min-h-11 flex-1 rounded-xl px-3 text-sm font-bold ${activeId === tab.id ? "bg-[var(--card-bg)] shadow-sm" : "text-[var(--color-muted)]"}`} id={`tab-${tab.id}`} key={tab.id} role="tab" type="button" onClick={() => onChange(tab.id)}>{tab.label}</button>)}</div>{tabs.map((tab) => <div aria-labelledby={`tab-${tab.id}`} hidden={activeId !== tab.id} id={`panel-${tab.id}`} key={tab.id} role="tabpanel" tabIndex={0}>{tab.panel}</div>)}</div>;
}
