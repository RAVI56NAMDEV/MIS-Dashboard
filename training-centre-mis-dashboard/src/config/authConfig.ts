export const ALLOWED_EMAIL_DOMAIN = (
  import.meta.env.VITE_ALLOWED_EMAIL_DOMAIN || 'anudip.org'
).trim().toLowerCase();

// Designated system administrator emails
export const ADMIN_EMAILS: string[] = [
  'ravinamdev998@gmail.com',
  ...(import.meta.env.VITE_ADMIN_EMAILS
    ? import.meta.env.VITE_ADMIN_EMAILS.split(',').map((e: string) => e.trim().toLowerCase())
    : [])
];

/**
 * Checks if the user is an authorized administrator.
 * Admins have permission to upload/replace the central Excel dataset.
 */
export function isAdminUser(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  if (ADMIN_EMAILS.includes(normalized)) return true;
  // Also check if admin email within organization (e.g. admin@anudip.org or mis.admin@anudip.org)
  if (normalized.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`) && (normalized.startsWith('admin') || normalized.startsWith('mis.admin') || normalized.startsWith('mis-admin'))) {
    return true;
  }
  return false;
}

/**
 * Checks if the user is authorized to access the application.
 * Only @anudip.org accounts or designated administrators are permitted.
 */
export function isAllowedDomain(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  if (isAdminUser(normalized)) return true;
  const parts = normalized.split('@');
  if (parts.length < 2) return false;
  const domain = parts[parts.length - 1];
  return domain === ALLOWED_EMAIL_DOMAIN;
}
