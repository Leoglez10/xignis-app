import { TriangleAlert } from "lucide-react";
import { formatDateEs } from "../../../lib/date";
import { ADMINISTRATIVE_ACT_TYPE_LABELS, type AdministrativeAct } from "../../../lib/database.types";

type EmployeeActsCardProps = {
  acts: AdministrativeAct[];
};

export function EmployeeActsCard({ acts }: EmployeeActsCardProps) {
  if (acts.length === 0) return null;

  return (
    <section
      aria-labelledby="employee-acts-title"
      className="animate-fade-up rounded-[20px] bg-amber-50 p-5 ring-1 ring-amber-200"
    >
      <div className="mb-4 flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-xl bg-amber-100 text-amber-700">
          <TriangleAlert aria-hidden="true" className="size-5" />
        </span>
        <h2 className="text-base font-bold text-amber-900" id="employee-acts-title">
          Actas administrativas
        </h2>
      </div>

      <ul className="space-y-3">
        {acts.map((act) => (
          <li key={act.id} className="rounded-2xl bg-white p-4 ring-1 ring-amber-100">
            <div className="mb-1 flex items-center justify-between gap-3">
              <span className="text-sm font-bold text-amber-900">
                {ADMINISTRATIVE_ACT_TYPE_LABELS[act.act_type]}
              </span>
              <span className="shrink-0 text-xs text-amber-700">{formatDateEs(act.act_date)}</span>
            </div>
            <p className="text-sm text-[var(--color-text)]">{act.reason}</p>
            {act.notes ? <p className="mt-2 text-sm text-amber-700/80">{act.notes}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
