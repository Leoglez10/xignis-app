import { diffDaysInclusive } from "../../lib/date";
import type { LeaveRequest } from "../../lib/database.types";
import {
  timeRangeHours,
  type TimeBankBalance,
  type VacationBalance,
} from "../leave-requests/services/leaveRequestService";

/** Hours a full-day personal leave consumes per day (mirrors the request form). */
const HOURS_PER_FULL_DAY = 8;

export type BalanceShortfall =
  | { available: number; kind: "vacation"; requested: number }
  | { available: number; kind: "hours"; requested: number };

type ShortfallRequest = Pick<
  LeaveRequest,
  "end_date" | "end_time" | "leave_type" | "paid" | "schedule_type" | "start_date" | "start_time"
>;

/** Returns the shortfall when a request asks for more than the requester has
 *  available, or null when it fits or the relevant balance is unknown. */
export function getBalanceShortfall(
  request: ShortfallRequest,
  vacation: VacationBalance | null,
  timeBank: TimeBankBalance | null,
): BalanceShortfall | null {
  const days = diffDaysInclusive(request.start_date, request.end_date);

  if (request.leave_type === "vacation") {
    // Unpaid vacation does not consume the vacation balance.
    if (!vacation || request.paid === false) return null;
    return days > vacation.available
      ? { available: vacation.available, kind: "vacation", requested: days }
      : null;
  }

  if (request.leave_type === "personal") {
    if (!timeBank) return null;
    const hours =
      request.schedule_type === "full_day"
        ? HOURS_PER_FULL_DAY * Math.max(1, days)
        : timeRangeHours(request.start_time ?? "", request.end_time ?? "");
    return hours > timeBank.availableHours
      ? { available: timeBank.availableHours, kind: "hours", requested: hours }
      : null;
  }

  return null;
}
