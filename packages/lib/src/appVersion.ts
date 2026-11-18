/**
  * Compare dotted version strings like 2.1.0, treating missing parts as 0
  * @returns negative if a is older, positive if a is newer, 0 if the same
  */
export function compareVersions(a: string, b: string) {
  const parse = (version: string) => version.trim().split('.').map((part) => parseInt(part, 10) || 0);
  const [partsA, partsB] = [parse(a), parse(b)];
  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const diff = (partsA[i] ?? 0) - (partsB[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/** Whether a version is older than a minimum; no minimum or no version never is */
export function isOlderThan(version: string | null | undefined, minimum: string | null | undefined) {
  if (!version || !minimum) return false;
  return compareVersions(version, minimum) < 0;
}
