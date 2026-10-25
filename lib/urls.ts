/** Client-safe helpers (no node: imports). */
export function mediaUrl(rel: string | null | undefined): string | null {
  if (!rel) return null;
  return '/media/' + rel.split('/').map(encodeURIComponent).join('/');
}
