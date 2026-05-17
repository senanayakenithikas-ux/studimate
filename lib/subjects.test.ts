import { describe, expect, it } from "vitest";
import { hasDuplicateSubjectName, normalizeSubjectName } from "./subjects";

describe("subjects", () => {
  it("normalizes names case-insensitively", () => {
    expect(normalizeSubjectName("  English  ")).toBe("english");
  });

  it("detects duplicate names in a list", () => {
    expect(
      hasDuplicateSubjectName("English", [{ name: "english" }]),
    ).toBe(true);
    expect(
      hasDuplicateSubjectName("Math", [{ name: "English" }]),
    ).toBe(false);
  });
});
