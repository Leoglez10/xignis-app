import { describe, expect, it } from "vitest";
import { getBalanceShortfall } from "./balanceShortfall";

const vacation = { available: 2, pending: 0, quota: 12, taken: 10, year: 2026 };
const base = {
  end_date: "2026-10-04",
  end_time: null,
  leave_type: "vacation" as const,
  paid: true,
  schedule_type: "full_day" as const,
  start_date: "2026-10-01",
  start_time: null,
};

describe("getBalanceShortfall", () => {
  it("flags vacation days beyond the available balance", () => {
    expect(getBalanceShortfall(base, vacation, null)).toEqual({ available: 2, kind: "vacation", requested: 4 });
  });

  it("returns null when vacation fits the balance", () => {
    expect(getBalanceShortfall({ ...base, end_date: "2026-10-02" }, vacation, null)).toBeNull();
  });

  it("ignores unpaid vacation", () => {
    expect(getBalanceShortfall({ ...base, paid: false }, vacation, null)).toBeNull();
  });

  it("flags hourly personal leave beyond the time bank", () => {
    const request = {
      ...base,
      end_date: "2026-10-01",
      end_time: "14:00",
      leave_type: "personal" as const,
      schedule_type: "time_range" as const,
      start_time: "09:00",
    };
    expect(getBalanceShortfall(request, null, { availableHours: 0 })).toEqual({ available: 0, kind: "hours", requested: 5 });
    expect(getBalanceShortfall(request, null, { availableHours: 5 })).toBeNull();
  });

  it("counts full-day personal leave as 8 hours per day", () => {
    const request = { ...base, end_date: "2026-10-02", leave_type: "personal" as const };
    expect(getBalanceShortfall(request, null, { availableHours: 10 })).toEqual({ available: 10, kind: "hours", requested: 16 });
  });

  it("returns null while the relevant balance is unavailable", () => {
    expect(getBalanceShortfall(base, null, { availableHours: 0 })).toBeNull();
    expect(getBalanceShortfall({ ...base, leave_type: "personal" }, vacation, null)).toBeNull();
  });

  it("returns null for leave types without a balance", () => {
    expect(getBalanceShortfall({ ...base, leave_type: "sick" }, { ...vacation, available: 0 }, { availableHours: 0 })).toBeNull();
  });
});
