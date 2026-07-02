/**
 * Class joiner for the v2 primitive set. Deliberately not tailwind-merge:
 * primitives are written so variants never emit conflicting utilities, and
 * consumer overrides are limited to layout concerns (width, margin, grid
 * placement) — if two color utilities collide, the bug is upstream.
 */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
