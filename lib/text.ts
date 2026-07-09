const EMPTY_VALUES = new Set(["unknown", "none", "null", "n/a", "-", "?"]);

export function cleanDisplayText(value?: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed || EMPTY_VALUES.has(trimmed.toLowerCase())) return null;
  return trimmed;
}
