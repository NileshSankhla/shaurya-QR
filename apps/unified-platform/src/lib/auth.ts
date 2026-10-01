import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

export const SESSION_COOKIE = 'shaurya_session'
export type StaffRole = 'ADMIN' | 'VOLUNTEER'

export type Session = {
  staffId: string
  username: string
  name: string
  role: StaffRole
  expiresAt: number
}

function secret() {
  // JWT_SECRET is retained as a compatibility alias for the previous app's
  // environment. New deployments should use AUTH_SECRET.
  const value = process.env.AUTH_SECRET ?? process.env.JWT_SECRET
  if (value) return value
  if (process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SECRET is required in production')
  }
  return 'local-development-only-change-me'
}

function signature(payload: string) {
  return createHmac('sha256', secret()).update(payload).digest('base64url')
}

function encodeSession(session: Session) {
  const payload = Buffer.from(JSON.stringify(session)).toString('base64url')
  return `${payload}.${signature(payload)}`
}

function decodeSession(token?: string): Session | null {
  if (!token) return null
  const [payload, suppliedSignature] = token.split('.')
  if (!payload || !suppliedSignature) return null

  const expected = Buffer.from(signature(payload))
  const supplied = Buffer.from(suppliedSignature)
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString()) as Session
    if (!session.staffId || !session.name || !['ADMIN', 'VOLUNTEER'].includes(session.role)) return null
    if (session.expiresAt <= Date.now()) return null
    return session
  } catch {
    return null
  }
}

export async function createSession(input: Omit<Session, 'expiresAt'>) {
  const cookieStore = await cookies()
  const expiresAt = Date.now() + 12 * 60 * 60 * 1000
  cookieStore.set(SESSION_COOKIE, encodeSession({ ...input, expiresAt }), {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: new Date(expiresAt),
  })
}

export async function clearSession() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

export async function getSession() {
  const cookieStore = await cookies()
  return decodeSession(cookieStore.get(SESSION_COOKIE)?.value)
}

export async function requireSession(roles?: StaffRole[]) {
  const session = await getSession()
  if (!session) throw new Error('UNAUTHORIZED')
  if (roles && !roles.includes(session.role)) throw new Error('FORBIDDEN')
  return session
}
