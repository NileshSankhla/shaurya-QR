import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

const KEY_LENGTH = 64

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, KEY_LENGTH).toString('hex')
  return `scrypt$${salt}$${hash}`
}

export function verifyPassword(password: string, storedValue: string) {
  if (!storedValue.startsWith('scrypt$')) {
    const valid = storedValue === password
    return { valid, needsUpgrade: valid }
  }

  const [, salt, expectedHex] = storedValue.split('$')
  if (!salt || !expectedHex) return { valid: false, needsUpgrade: false }

  try {
    const expected = Buffer.from(expectedHex, 'hex')
    const actual = scryptSync(password, salt, expected.length)
    return {
      valid: expected.length > 0 && timingSafeEqual(actual, expected),
      needsUpgrade: false,
    }
  } catch {
    return { valid: false, needsUpgrade: false }
  }
}
