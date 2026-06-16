// Pure alert-rule helpers, separated from the React engine so they're testable.

/**
 * IDs that have newly entered an alerting state this tick: present in `current`
 * but not in `prev`. Used for both emergencies and watched-contact appearances.
 */
export function newlyTrue(prev: Set<string>, current: Set<string>): string[] {
  const out: string[] = [];
  for (const id of current) if (!prev.has(id)) out.push(id);
  return out;
}

/** Intersection of `ids` with `watched` — the watched contacts among `ids`. */
export function intersect(ids: Iterable<string>, watched: Set<string>): string[] {
  const out: string[] = [];
  for (const id of ids) if (watched.has(id)) out.push(id);
  return out;
}
