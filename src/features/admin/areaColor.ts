/**
 * Per-area color.
 *
 * `departments.color` holds an explicit palette key when HR picks one; when it
 * is null the tone is derived from the department id, so every area still gets
 * a stable color with zero admin work.
 *
 * Tones are muted so the Xignis green stays the dominant brand color — these
 * are wayfinding, not decoration.
 */
export type AreaColor = {
  /** Palette key persisted in `departments.color` (null tone has no key). */
  key: string | null;
  /** Human label shown in the color picker. */
  label: string;
  /** Left accent bar on an employee or area card. */
  bar: string;
  /** Small dot inside the area chip. */
  dot: string;
  /** Chip styles when the area is selected ("lit up"). */
  active: string;
};

export const AREA_PALETTE: AreaColor[] = [
  { key: "sky", label: "Azul", bar: "bg-sky-400", dot: "bg-sky-500", active: "bg-sky-50 text-sky-900 ring-sky-300" },
  { key: "violet", label: "Violeta", bar: "bg-violet-400", dot: "bg-violet-500", active: "bg-violet-50 text-violet-900 ring-violet-300" },
  { key: "amber", label: "Ámbar", bar: "bg-amber-400", dot: "bg-amber-500", active: "bg-amber-50 text-amber-900 ring-amber-300" },
  { key: "rose", label: "Rosa", bar: "bg-rose-400", dot: "bg-rose-500", active: "bg-rose-50 text-rose-900 ring-rose-300" },
  { key: "teal", label: "Turquesa", bar: "bg-teal-400", dot: "bg-teal-500", active: "bg-teal-50 text-teal-900 ring-teal-300" },
  { key: "indigo", label: "Índigo", bar: "bg-indigo-400", dot: "bg-indigo-500", active: "bg-indigo-50 text-indigo-900 ring-indigo-300" },
  { key: "orange", label: "Naranja", bar: "bg-orange-400", dot: "bg-orange-500", active: "bg-orange-50 text-orange-900 ring-orange-300" },
  { key: "fuchsia", label: "Fucsia", bar: "bg-fuchsia-400", dot: "bg-fuchsia-500", active: "bg-fuchsia-50 text-fuchsia-900 ring-fuchsia-300" },
];

/** Neutral tone for employees with no department assigned. */
export const NO_AREA_COLOR: AreaColor = {
  key: null,
  label: "Sin área",
  bar: "bg-slate-300",
  dot: "bg-slate-400",
  active: "bg-slate-100 text-slate-900 ring-slate-400",
};

export function areaColor(departmentId: string | null | undefined, color?: string | null): AreaColor {
  const picked = color ? AREA_PALETTE.find((tone) => tone.key === color) : undefined;
  if (picked) return picked;
  if (!departmentId) return NO_AREA_COLOR;
  let sum = 0;
  for (let i = 0; i < departmentId.length; i += 1) sum += departmentId.charCodeAt(i);
  return AREA_PALETTE[sum % AREA_PALETTE.length];
}
