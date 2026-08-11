/** Maps app usernames to synthetic emails required by Supabase Auth. */
export const AUTH_EMAIL_DOMAIN = 'users.driverent.local'

const USERNAME_RE = /^[a-z0-9][a-z0-9._-]{1,30}[a-z0-9]$|^[a-z0-9]{2,32}$/

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase()
}

export function isValidUsername(username: string): boolean {
  return USERNAME_RE.test(username)
}

export function usernameToAuthEmail(username: string): string {
  return `${normalizeUsername(username)}@${AUTH_EMAIL_DOMAIN}`
}

export function usernameFromAuthEmail(email: string | null | undefined): string | null {
  if (!email) return null
  const normalized = email.trim().toLowerCase()
  const suffix = `@${AUTH_EMAIL_DOMAIN}`
  if (normalized.endsWith(suffix)) {
    return normalized.slice(0, -suffix.length)
  }
  return null
}

export function displayUsername(
  user:
    | {
        email?: string | null
        user_metadata?: Record<string, unknown>
      }
    | null
    | undefined,
): string | null {
  if (!user) return null
  const meta = user.user_metadata?.username
  if (typeof meta === 'string' && meta.trim()) return meta.trim().toLowerCase()
  return usernameFromAuthEmail(user.email) ?? user.email ?? null
}
