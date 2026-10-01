import type { GuestInput, SlotInput, StaffInput } from '@/server/data'

export class ValidationError extends Error {}

export function validateGuestInput(input: GuestInput): GuestInput {
  const value = {
    name: input.name?.trim() ?? '',
    college: input.college?.trim() ?? '',
    mobile: input.mobile?.replace(/\D/g, '') ?? '',
    email: input.email?.trim().toLowerCase() ?? '',
  }
  if (value.name.length < 3) throw new ValidationError('Enter the participant’s full name')
  if (value.college.length < 2) throw new ValidationError('Enter a valid college name')
  if (!/^[6-9]\d{9}$/.test(value.mobile)) throw new ValidationError('Enter a valid 10-digit Indian mobile number')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email)) throw new ValidationError('Enter a valid email address')
  return value
}

export function validateQrToken(token: string) {
  const value = token.trim().toUpperCase()
  if (!/^[A-Z0-9-]{6,80}$/.test(value)) throw new ValidationError('Scan or enter a valid QR token')
  return value
}

export function validateStaffInput(input: Omit<StaffInput, 'passwordHash'> & { password: string }) {
  const name = input.name?.trim() ?? ''
  const username = input.username?.trim().toLowerCase() ?? ''
  if (name.length < 3) throw new ValidationError('Enter the staff member’s full name')
  if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
    throw new ValidationError('Username must be 3–32 characters using letters, numbers, dot, dash, or underscore')
  }
  if ((input.password?.length ?? 0) < 8) throw new ValidationError('Password must contain at least 8 characters')
  if (!['ADMIN', 'VOLUNTEER'].includes(input.role)) throw new ValidationError('Select a valid role')
  return { name, username, password: input.password, role: input.role }
}

export function validateStaffUpdateInput(input: {
  name: string
  username: string
  password?: string
  role: StaffInput['role']
}) {
  const name = input.name?.trim() ?? ''
  const username = input.username?.trim().toLowerCase() ?? ''
  const password = input.password ?? ''
  if (name.length < 3) throw new ValidationError('Enter the staff member’s full name')
  if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
    throw new ValidationError('Username must be 3–32 characters using letters, numbers, dot, dash, or underscore')
  }
  if (password && password.length < 8) throw new ValidationError('A new password must contain at least 8 characters')
  if (!['ADMIN', 'VOLUNTEER'].includes(input.role)) throw new ValidationError('Select a valid role')
  return { name, username, password, role: input.role }
}

export function validateSlotInput(input: SlotInput): SlotInput {
  const value = {
    dayLabel: input.dayLabel?.trim() ?? '',
    eventDate: input.eventDate ?? '',
    title: input.title?.trim() ?? '',
    startTime: input.startTime ?? '',
    endTime: input.endTime ?? '',
  }
  if (value.dayLabel.length < 2) throw new ValidationError('Enter a day label')
  if (value.title.length < 2) throw new ValidationError('Enter a meal/slot title')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value.eventDate)) throw new ValidationError('Select the event date')
  if (!value.startTime || !value.endTime) throw new ValidationError('Select both start and end times')
  return value
}

export function publicError(error: unknown) {
  if (error instanceof ValidationError) return error.message
  if (error instanceof Error) {
    if (error.message === 'UNAUTHORIZED') return 'Your session expired. Please log in again.'
    if (error.message === 'FORBIDDEN') return 'You do not have permission to perform this action.'
    const databaseError = error as Error & { code?: string; meta?: { target?: string[] | string } }
    if (databaseError.code === 'P2002' || /unique|Unique|P2002/.test(error.message)) {
      const target = Array.isArray(databaseError.meta?.target)
        ? databaseError.meta.target.join(' ')
        : String(databaseError.meta?.target ?? '')
      if (/mobile|contactNo/i.test(target)) return 'That mobile number is already registered.'
      if (/email/i.test(target)) return 'That email address is already registered.'
      if (/username/i.test(target)) return 'That username is already registered.'
      if (/assigned_user_id|guestId/i.test(target)) return 'That participant already has a QR assigned.'
      return 'A record with these details already exists.'
    }
    if (['P1001', 'P1002', 'P2024', 'P2028'].includes(databaseError.code ?? '')) {
      return 'The database is temporarily busy or unavailable. Please retry in a moment.'
    }
    if (
      error.message.includes('Participant') ||
      error.message.includes('QR code') ||
      error.message.includes('mobile number') ||
      error.message.includes('email address') ||
      error.message.includes('already registered') ||
      error.message.includes('currently removed') ||
      error.message.includes('another operator') ||
      error.message.includes('Slot') ||
      error.message.includes('End time') ||
      error.message.includes('your own account')
    ) {
      return error.message
    }
  }
  return 'The operation could not be completed. Please try again.'
}
