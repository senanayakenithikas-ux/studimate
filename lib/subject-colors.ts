export interface SubjectColorStyle {
  accent: string;
  border: string;
  bg: string;
  bgHover: string;
  text: string;
}

/** Distinct accent hues for subject blocks (planner, legend). */
const ACCENT_PALETTE = [
  "#3b82f6",
  "#06b6d4",
  "#f59e0b",
  "#ef4444",
  "#10b981",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#6366f1",
  "#84cc16",
  "#e11d48",
] as const;

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace("#", "");
  const value =
    normalized.length === 3
      ? normalized
          .split("")
          .map((c) => c + c)
          .join("")
      : normalized;
  const num = Number.parseInt(value, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function rgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function styleFromAccent(accent: string): SubjectColorStyle {
  return {
    accent,
    border: accent,
    bg: rgba(accent, 0.15),
    bgHover: rgba(accent, 0.25),
    text: accent,
  };
}

export const defaultSubjectColor: SubjectColorStyle = styleFromAccent("#64748b");

/**
 * Assigns a unique color to each subject (stable order by name, then id).
 * Keys are subject display names as stored in the database.
 */
export function buildSubjectColorMap(
  subjects: { id: string; name: string }[],
): Record<string, SubjectColorStyle> {
  const sorted = [...subjects].sort(
    (a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id),
  );
  const map: Record<string, SubjectColorStyle> = {};
  sorted.forEach((subject, index) => {
    const accent =
      index < ACCENT_PALETTE.length
        ? ACCENT_PALETTE[index]
        : hslAccent(index);
    map[subject.name] = styleFromAccent(accent);
  });
  return map;
}

function hslAccent(index: number): string {
  const hue = (index * 47) % 360;
  return `hsl(${hue}, 70%, 55%)`;
}

export function getSubjectColor(
  subjectName: string,
  colorMap: Record<string, SubjectColorStyle>,
): SubjectColorStyle {
  return colorMap[subjectName] ?? defaultSubjectColor;
}
