export function normalizeSubjectName(name: string): string {
  return name.trim().toLowerCase();
}

export function hasDuplicateSubjectName(
  name: string,
  existing: { name: string }[],
): boolean {
  const normalized = normalizeSubjectName(name);
  if (!normalized) return false;
  return existing.some(
    (subject) => normalizeSubjectName(subject.name) === normalized,
  );
}
