/**
 * Stable per-area color, derived from the department id.
 *
 * Departments have no `color` column on purpose: deriving keeps the palette
 * consistent with zero admin work and zero migration. Add a real column only if
 * someone actually needs to pick their own tone.
 *
 * Tones are muted so the Xignis green stays the dominant brand color — these
 * are wayfinding, not decoration.
 */
export type AreaColor = {
  /** Left accent bar on an employee card. */
  bar: string;
  /** Small dot inside the area chip. */
  dot: string;
  /** Chip styles when the area is selected ("lit up"). */
  active: string;
};

const PALETTE: AreaColor[] = [
  { bar: "bg-sky-400", dot: "bg-sky-500", active: "bg-sky-50 text-sky-900 ring-sky-300" },
  { bar: "bg-violet-400", dot: "bg-violet-500", active: "bg-violet-50 text-violet-900 ring-violet-300" },
  { bar: "bg-amber-400", dot: "bg-amber-500", active: "bg-amber-50 text-amber-900 ring-amber-300" },
  { bar: "bg-rose-400", dot: "bg-rose-500", active: "bg-rose-50 text-rose-900 ring-rose-300" },
  { bar: "bg-teal-400", dot: "bg-teal-500", active: "bg-teal-50 text-teal-900 ring-teal-300" },
  { bar: "bg-indigo-400", dot: "bg-indigo-500", active: "bg-indigo-50 text-indigo-900 ring-indigo-300" },
  { bar: "bg-orange-400", dot: "bg-orange-500", active: "bg-orange-50 text-orange-900 ring-orange-300" },
  { bar: "bg-fuchsia-400", dot: "bg-fuchsia-500", active: "bg-fuchsia-50 text-fuchsia-900 ring-fuchsia-300" },
];

/** Neutral tone for employees with no department assigned. */
export const NO_AREA_COLOR: AreaColor = {
  bar: "bg-slate-300",
  dot: "bg-slate-400",
  active: "bg-slate-100 text-slate-900 ring-slate-400",
};

export function areaColor(departmentId: string | null | undefined): AreaColor {
  if (!departmentId) return NO_AREA_COLOR;
  let sum = 0;
  for (let i = 0; i < departmentId.length; i += 1) sum += departmentId.charCodeAt(i);
  return PALETTE[sum % PALETTE.length];
}
