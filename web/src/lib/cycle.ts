/**
 * Step through an ordered id list from the current selection, wrapping at both
 * ends. With no (or an unknown) current id, entering forward starts at the
 * first item and backward at the last. Returns null only for an empty list.
 */
export function cycleId(ids: string[], current: string | null, step: 1 | -1): string | null {
  if (ids.length === 0) return null;
  const i = current === null ? -1 : ids.indexOf(current);
  if (i === -1) return step === 1 ? ids[0] : ids[ids.length - 1];
  return ids[(i + step + ids.length) % ids.length];
}
