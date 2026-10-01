'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { clearSession, createSession, requireSession as requireSignedSession, type StaffRole } from '@/lib/auth'
import { hashPassword, verifyPassword } from '@/lib/password'
import {
  publicError,
  validateGuestInput,
  validateQrToken,
  validateSlotInput,
  validateStaffInput,
  validateStaffUpdateInput,
} from '@/lib/validation'
import { platformStore, type GuestInput, type SlotInput } from '@/server/data'

type Result<T = undefined> = T extends undefined
  ? { ok: true } | { ok: false; error: string }
  : { ok: true; data: T } | { ok: false; error: string }

async function requireSession(roles?: StaffRole[]) {
  const session = await requireSignedSession()
  const current = await platformStore.findStaffByUsername(session.username)
  if (!current || current.id !== session.staffId || !current.active) throw new Error('UNAUTHORIZED')
  if (!['ADMIN', 'VOLUNTEER'].includes(current.role)) throw new Error('FORBIDDEN')
  const role = current.role as StaffRole
  if (roles && !roles.includes(role)) throw new Error('FORBIDDEN')
  return { ...session, name: current.name, role }
}

export async function loginAction(username: string, password: string): Promise<Result<{ destination: string; name: string }>> {
  try {
    const staff = await platformStore.findStaffByUsername(username)
    if (!staff) return { ok: false, error: 'Invalid username or password' }
    if (!staff.active) return { ok: false, error: 'This account is disabled. Contact an administrator.' }

    const passwordResult = verifyPassword(password, staff.passwordHash)
    if (!passwordResult.valid) return { ok: false, error: 'Invalid username or password' }
    if (!['ADMIN', 'VOLUNTEER'].includes(staff.role)) return { ok: false, error: 'This account has an invalid role' }

    if (passwordResult.needsUpgrade) {
      await platformStore.upgradeStaffPassword(staff.id, hashPassword(password))
    }

    const role = staff.role as StaffRole
    await createSession({
      staffId: staff.id,
      username: staff.username,
      name: staff.name,
      role,
    })
    return {
      ok: true,
      data: {
        destination: role === 'ADMIN' ? '/admin' : '/volunteer',
        name: staff.name,
      },
    }
  } catch (error) {
    return { ok: false, error: publicError(error) }
  }
}

export async function logoutAction() {
  await clearSession()
  redirect('/login')
}

export async function searchGuestsAction(query: string) {
  try {
    await requireSession(['ADMIN', 'VOLUNTEER'])
    if (query.trim().length < 2) return { ok: false as const, error: 'Enter at least 2 characters' }
    return { ok: true as const, data: await platformStore.searchGuests(query, 10) }
  } catch (error) {
    return { ok: false as const, error: publicError(error) }
  }
}

export async function assignQrAction(guestId: string, qrToken: string): Promise<Result> {
  try {
    const session = await requireSession(['ADMIN', 'VOLUNTEER'])
    await platformStore.assignQr(guestId, validateQrToken(qrToken), session.name)
    revalidatePath('/volunteer')
    revalidatePath('/volunteer/assign')
    revalidatePath('/admin')
    revalidatePath('/admin/users')
    return { ok: true }
  } catch (error) {
    return { ok: false, error: publicError(error) }
  }
}

export async function createGuestAndAssignAction(input: GuestInput, qrToken: string) {
  try {
    const session = await requireSession(['ADMIN', 'VOLUNTEER'])
    const guest = await platformStore.createGuestAndAssign(
      validateGuestInput(input),
      validateQrToken(qrToken),
      session.staffId,
      session.name,
    )
    revalidatePath('/volunteer')
    revalidatePath('/admin')
    revalidatePath('/admin/users')
    return { ok: true as const, data: guest }
  } catch (error) {
    return { ok: false as const, error: publicError(error) }
  }
}

export async function verifyScanAction(qrToken: string) {
  try {
    const session = await requireSession(['ADMIN', 'VOLUNTEER'])
    const result = await platformStore.verifyMeal(validateQrToken(qrToken), session.staffId)
    revalidatePath('/volunteer')
    revalidatePath('/volunteer/verify')
    revalidatePath('/admin')
    return result.success
      ? { ok: true as const, data: result, attemptRecorded: true as const }
      : {
          ok: false as const,
          error: result.reason ?? 'Verification failed',
          attemptRecorded: true as const,
        }
  } catch (error) {
    return { ok: false as const, error: publicError(error), attemptRecorded: false as const }
  }
}

export async function adminCreateStaffAction(input: {
  name: string
  username: string
  password: string
  role: StaffRole
}): Promise<Result> {
  try {
    await requireSession(['ADMIN'])
    const value = validateStaffInput(input)
    await platformStore.createStaff({
      name: value.name,
      username: value.username,
      passwordHash: hashPassword(value.password),
      role: value.role,
    })
    revalidatePath('/admin/team')
    revalidatePath('/admin')
    return { ok: true }
  } catch (error) {
    return { ok: false, error: publicError(error) }
  }
}

export async function adminUpdateStaffAction(
  id: string,
  input: { name: string; username: string; password?: string; role: StaffRole },
): Promise<Result> {
  try {
    const session = await requireSession(['ADMIN'])
    if (id === session.staffId) throw new Error('You cannot edit your own account from Team access')
    const value = validateStaffUpdateInput(input)
    await platformStore.updateStaff(id, {
      name: value.name,
      username: value.username,
      role: value.role,
      ...(value.password ? { passwordHash: hashPassword(value.password) } : {}),
    })
    revalidatePath('/admin/team')
    revalidatePath('/admin')
    return { ok: true }
  } catch (error) {
    return { ok: false, error: publicError(error) }
  }
}

export async function adminSetStaffActiveAction(id: string, active: boolean): Promise<Result> {
  try {
    const session = await requireSession(['ADMIN'])
    if (id === session.staffId && !active) throw new Error('You cannot disable your own account')
    await platformStore.setStaffActive(id, active)
    revalidatePath('/admin/team')
    revalidatePath('/admin')
    return { ok: true }
  } catch (error) {
    return { ok: false, error: publicError(error) }
  }
}

export async function adminCreateSlotAction(input: SlotInput): Promise<Result> {
  try {
    await requireSession(['ADMIN'])
    await platformStore.createSlot(validateSlotInput(input))
    revalidatePath('/admin/slots')
    revalidatePath('/admin')
    revalidatePath('/volunteer')
    return { ok: true }
  } catch (error) {
    return { ok: false, error: publicError(error) }
  }
}

export async function adminSetSlotStatusAction(
  id: number,
  status: 'SCHEDULED' | 'ACTIVE' | 'PAUSED' | 'CLOSED',
): Promise<Result> {
  try {
    await requireSession(['ADMIN'])
    await platformStore.setSlotStatus(id, status)
    revalidatePath('/admin/slots')
    revalidatePath('/admin')
    revalidatePath('/volunteer')
    return { ok: true }
  } catch (error) {
    return { ok: false, error: publicError(error) }
  }
}

export async function adminDeleteSlotAction(id: number): Promise<Result> {
  try {
    await requireSession(['ADMIN'])
    await platformStore.deleteSlot(id)
    revalidatePath('/admin/slots')
    revalidatePath('/admin')
    return { ok: true }
  } catch (error) {
    return { ok: false, error: publicError(error) }
  }
}

export async function adminUnassignQrAction(guestId: string): Promise<Result> {
  try {
    const session = await requireSession(['ADMIN'])
    await platformStore.unassignQr(guestId, session.name)
    revalidatePath('/admin/users')
    revalidatePath('/admin')
    return { ok: true }
  } catch (error) {
    return { ok: false, error: publicError(error) }
  }
}

export async function adminCreateGuestAction(input: GuestInput) {
  try {
    await requireSession(['ADMIN'])
    const guest = await platformStore.registerGuest(validateGuestInput(input))
    revalidatePath('/admin/users')
    revalidatePath('/admin')
    return { ok: true as const, data: guest }
  } catch (error) {
    return { ok: false as const, error: publicError(error) }
  }
}

export async function adminUpdateGuestAction(guestId: string, input: GuestInput) {
  try {
    const session = await requireSession(['ADMIN'])
    const guest = await platformStore.updateGuest(guestId, validateGuestInput(input), session.name)
    revalidatePath('/admin/users')
    revalidatePath('/admin')
    revalidatePath('/volunteer')
    return { ok: true as const, data: guest }
  } catch (error) {
    return { ok: false as const, error: publicError(error) }
  }
}

export async function adminSetGuestActiveAction(guestId: string, active: boolean): Promise<Result> {
  try {
    const session = await requireSession(['ADMIN'])
    await platformStore.setGuestActive(guestId, active, session.name)
    revalidatePath('/admin/users')
    revalidatePath('/admin')
    return { ok: true }
  } catch (error) {
    return { ok: false, error: publicError(error) }
  }
}
