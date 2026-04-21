import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn (class merging utility)", () => {
  it("returns a single class unchanged", () => {
    expect(cn("text-red-500")).toBe("text-red-500");
  });

  it("merges multiple classes", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2");
  });

  it("resolves Tailwind conflicts — last class wins", () => {
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
    expect(cn("p-4", "p-8")).toBe("p-8");
  });

  it("filters falsy values", () => {
    expect(cn("base", false && "not-included", undefined, null, "included")).toBe("base included");
  });

  it("handles conditional objects", () => {
    expect(cn("base", { active: true, disabled: false })).toBe("base active");
  });

  it("returns empty string for no input", () => {
    expect(cn()).toBe("");
  });
});
