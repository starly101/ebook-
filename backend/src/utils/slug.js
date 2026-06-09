/**
 * Create URL-friendly slug from string
 */
export function createSlug(str) {
  if (!str) return '';
  
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
