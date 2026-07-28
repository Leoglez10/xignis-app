import { describe, expect, it } from "vitest";
import { GROUP_PREVIEW, groupPreview } from "./EmployeesScreen";

const members = ["a", "b", "c", "d", "e"];

describe("groupPreview", () => {
  it("caps a collapsed group at the preview size on a phone", () => {
    expect(groupPreview(members, null, "", false)).toEqual({
      visible: members.slice(0, GROUP_PREVIEW),
      hidden: members.length - GROUP_PREVIEW,
    });
  });

  it("reports nothing hidden when the group already fits", () => {
    const short = members.slice(0, GROUP_PREVIEW);
    expect(groupPreview(short, null, "", false)).toEqual({ visible: short, hidden: 0 });
  });

  it("shows everyone on desktop, where the grid is already wide", () => {
    expect(groupPreview(members, null, "", true)).toEqual({ visible: members, hidden: 0 });
  });

  it("shows everyone once an area is drilled into", () => {
    expect(groupPreview(members, "area-1", "", false)).toEqual({ visible: members, hidden: 0 });
  });

  it("shows everyone while searching, so no match hides behind the button", () => {
    expect(groupPreview(members, null, "ana", false)).toEqual({ visible: members, hidden: 0 });
  });

  it("treats a whitespace-only query as no search", () => {
    expect(groupPreview(members, null, "   ", false).hidden).toBe(members.length - GROUP_PREVIEW);
  });
});
