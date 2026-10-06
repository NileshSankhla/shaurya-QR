'use client'

import { FormEvent, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, History, Pencil, Plus, QrCode, Search, UserMinus, UserRoundCheck, X } from 'lucide-react'
import {
  adminCreateGuestAction,
  adminSetGuestActiveAction,
  adminUnassignQrAction,
  adminUpdateGuestAction,
  assignQrAction,
} from '@/app/actions'
import type {
  GuestAssignmentFilter,
  GuestInput,
  GuestListFilters,
  GuestScope,
  GuestSearchField,
  GuestSearchResult,
  GuestSortField,
  SortDirection,
} from '@/server/data'
import { QrCapture } from '@/components/volunteer/QrCapture'
import { useNavigation } from '@/components/portal/PortalShell'

export function UserManager({
  guests,
  total,
  page,
  pageSize,
  query,
  scope,
  assignment,
  field,
  sortBy,
  direction,
}: {
  guests: GuestSearchResult[]
  total: number
  page: number
  pageSize: number
  query: string
  scope: GuestScope
  assignment: GuestAssignmentFilter
  field: GuestSearchField
  sortBy: GuestSortField
  direction: SortDirection
}) {
  const router = useRouter()
  const { navigate: globalNavigate } = useNavigation()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState(query)
  const [assigning, setAssigning] = useState<string | null>(null)
  const [token, setToken] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newGuest, setNewGuest] = useState({ name: '', college: '', mobile: '', email: '' })
  const [editing, setEditing] = useState<string | null>(null)
  const [removeTarget, setRemoveTarget] = useState<string | null>(null)
  const [editGuest, setEditGuest] = useState<GuestInput>({ name: '', college: '', mobile: '', email: '' })
  const pages = Math.max(1, Math.ceil(total / pageSize))

  function navigate(nextPage: number, overrides: Partial<GuestListFilters> = {}) {
    const next = { scope, assignment, field, sortBy, direction, ...overrides }
    const params = new URLSearchParams()
    if (search.trim()) params.set('q', search.trim())
    params.set('page', String(nextPage))
    params.set('scope', next.scope)
    params.set('assignment', next.assignment)
    params.set('field', next.field)
    params.set('sort', next.sortBy)
    params.set('direction', next.direction)
    router.push(`/admin/users?${params}`)
  }

  function submitSearch(event: FormEvent) {
    event.preventDefault()
    navigate(1)
  }

  function run(operation: () => Promise<{ ok: boolean; error?: string }>, success: string) {
    setError('')
    setNotice('')
    startTransition(async () => {
      try {
        const result = await operation()
        if (!result.ok) return setError(result.error ?? 'Operation failed')
        setNotice(success)
        setAssigning(null)
        setRemoveTarget(null)
        setToken('')
        router.refresh()
      } catch {
        setError('The operation could not be completed. Check the connection and retry.')
      }
    })
  }

  function beginEdit(guest: GuestSearchResult) {
    setEditing(guest.id)
    setRemoveTarget(null)
    setEditGuest({ name: guest.name, college: guest.college, mobile: guest.mobile, email: guest.email })
    setAssigning(null)
    setError('')
    setNotice('')
  }

  function updateGuest(event: FormEvent, guestId: string) {
    event.preventDefault()
    setError('')
    setNotice('')
    startTransition(async () => {
      try {
        const result = await adminUpdateGuestAction(guestId, editGuest)
        if (!result.ok) return setError(result.error)
        setEditing(null)
        setNotice('Participant details updated')
        router.refresh()
      } catch {
        setError('The participant could not be updated. Check the connection and retry.')
      }
    })
  }

  function changeActive(guest: GuestSearchResult) {
    if (guest.active) {
      setRemoveTarget(guest.id)
      setEditing(null)
      setAssigning(null)
      setError('')
      setNotice('')
      return
    }
    run(
      () => adminSetGuestActiveAction(guest.id, true),
      'Participant restored',
    )
  }

  function createGuest(event: FormEvent) {
    event.preventDefault()
    setError('')
    startTransition(async () => {
      try {
        const result = await adminCreateGuestAction(newGuest)
        if (!result.ok) return setError(result.error)
        setNewGuest({ name: '', college: '', mobile: '', email: '' })
        setShowAdd(false)
        setNotice('Participant added')
        router.refresh()
      } catch {
        setError('The participant could not be added. Check the connection and retry.')
      }
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4">
        <form onSubmit={submitSearch} className="flex w-full flex-wrap sm:flex-nowrap gap-3">
          <select aria-label="Search field" className="portal-input w-full sm:w-auto min-w-32" value={field} onChange={(event) => navigate(1, { field: event.target.value as GuestSearchField })}>
            <option value="all">All fields</option>
            <option value="name">Name</option>
            <option value="college">College</option>
            <option value="mobile">Mobile</option>
            <option value="email">Email</option>
            <option value="qr">QR token</option>
          </select>
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-variant)]" size={18} />
            <input className="portal-input pl-11 w-full" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, mobile, email, college, or QR…" />
          </div>
          <button className="portal-primary px-8 w-full sm:w-auto">Search</button>
        </form>

        <div className="flex">
          <button type="button" onClick={() => setShowAdd(!showAdd)} className="portal-secondary">
            <Plus size={17} /> Add participant
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2" aria-label="Participant status filter">
        {(['ACTIVE', 'REMOVED', 'ALL'] as GuestScope[]).map((value) => (
          <button
            type="button"
            key={value}
            onClick={() => navigate(1, { scope: value })}
            className={scope === value ? 'portal-primary px-4 py-2 text-xs' : 'portal-secondary px-4 py-2 text-xs'}
          >
            {value === 'ACTIVE' ? 'Active participants' : value === 'REMOVED' ? 'Removed participants' : 'All participants'}
          </button>
        ))}
      </div>

      <div className="grid gap-3 rounded-2xl border border-[var(--color-surface-variant)] bg-white p-3 sm:grid-cols-3">
        <label className="text-xs font-bold text-[var(--color-on-surface-variant)]">
          QR assignment
          <select className="portal-input mt-1" value={assignment} onChange={(event) => navigate(1, { assignment: event.target.value as GuestAssignmentFilter })}>
            <option value="ALL">All QR states</option>
            <option value="ASSIGNED">Assigned only</option>
            <option value="UNASSIGNED">Unassigned only</option>
          </select>
        </label>
        <label className="text-xs font-bold text-[var(--color-on-surface-variant)]">
          Sort field
          <select className="portal-input mt-1" value={sortBy} onChange={(event) => navigate(1, { sortBy: event.target.value as GuestSortField })}>
            <option value="createdAt">Registration date</option>
            <option value="name">Name</option>
            <option value="college">College</option>
            <option value="mobile">Mobile</option>
            <option value="email">Email</option>
            <option value="status">QR status</option>
          </select>
        </label>
        <label className="text-xs font-bold text-[var(--color-on-surface-variant)]">
          Sort direction
          <select className="portal-input mt-1" value={direction} onChange={(event) => navigate(1, { direction: event.target.value as SortDirection })}>
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </label>
      </div>

      {showAdd && (
        <form onSubmit={createGuest} className="grid gap-3 rounded-3xl border border-orange-100 bg-orange-50/60 p-5 md:grid-cols-2 xl:grid-cols-5">
          <input className="portal-input" placeholder="Full name" value={newGuest.name} onChange={(event) => setNewGuest({ ...newGuest, name: event.target.value })} />
          <input className="portal-input" placeholder="College" value={newGuest.college} onChange={(event) => setNewGuest({ ...newGuest, college: event.target.value })} />
          <input className="portal-input" placeholder="Mobile" inputMode="numeric" value={newGuest.mobile} onChange={(event) => setNewGuest({ ...newGuest, mobile: event.target.value.replace(/\D/g, '').slice(0, 10) })} />
          <input className="portal-input" placeholder="Email" type="email" value={newGuest.email} onChange={(event) => setNewGuest({ ...newGuest, email: event.target.value })} />
          <button disabled={pending} className="portal-primary">Save participant</button>
        </form>
      )}

      {error && <p className="rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
      {notice && <p className="rounded-2xl bg-green-50 p-3 text-sm font-bold text-green-700">{notice}</p>}

      <section className="overflow-hidden rounded-3xl border border-[var(--color-surface-variant)] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[var(--color-surface-variant)] p-4">
          <p className="text-sm font-bold">{total.toLocaleString()} participants</p>
          <p className="text-xs text-[var(--color-on-surface-variant)]">Page {page} of {pages}</p>
        </div>
        <div className="divide-y divide-[var(--color-surface-variant)]">
          {guests.map((guest) => (
            <div key={guest.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <a href={`/admin/users/${guest.id}`} onClick={(e) => { e.preventDefault(); globalNavigate(`/admin/users/${guest.id}`); }} className="font-bold hover:text-[var(--color-primary)] hover:underline">
                      {guest.name} {guest.qrToken ? `(${guest.qrToken})` : ''}
                    </a>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${guest.active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{guest.active ? guest.status : 'REMOVED'}</span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--color-on-surface-variant)]">{guest.college} · {guest.mobile} · {guest.email}</p>
                  <p className="mt-2 text-xs"><span className="font-bold text-[var(--color-primary)]">{guest.qrToken ?? 'No QR assigned'}</span> · {guest.mealsVerified} meals verified</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a href={`/admin/users/${guest.id}`} onClick={(e) => { e.preventDefault(); globalNavigate(`/admin/users/${guest.id}`); }} className="portal-small"><History size={14} /> History</a>
                  <button type="button" disabled={pending} onClick={() => beginEdit(guest)} className="portal-small"><Pencil size={14} /> Edit</button>
                  {guest.active && !guest.qrToken && (
                    <button type="button" onClick={() => { setAssigning(assigning === guest.id ? null : guest.id); setEditing(null); setRemoveTarget(null) }} className="portal-small"><QrCode size={14} /> Assign</button>
                  )}
                  {guest.active && guest.qrToken && (
                    <button type="button" disabled={pending} onClick={() => run(() => adminUnassignQrAction(guest.id), 'QR unassigned')} className="portal-small">Unassign QR</button>
                  )}
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => changeActive(guest)}
                    className={`portal-small ${guest.active ? 'text-red-700' : 'text-green-700'}`}
                  >
                    {guest.active ? <UserMinus size={14} /> : <UserRoundCheck size={14} />}
                    {guest.active ? 'Remove' : 'Restore'}
                  </button>
                </div>
              </div>
              {removeTarget === guest.id && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                  <p><strong>Remove {guest.name}?</strong> Their QR will be released. Registration, meal, and audit history will be preserved.</p>
                  <div className="flex gap-2">
                    <button type="button" disabled={pending} onClick={() => run(() => adminSetGuestActiveAction(guest.id, false), 'Participant removed. View them under Removed participants.')} className="portal-small bg-red-600 text-white">Confirm remove</button>
                    <button type="button" disabled={pending} onClick={() => setRemoveTarget(null)} className="portal-small"><X size={14} /> Cancel</button>
                  </div>
                </div>
              )}
              {editing === guest.id && (
                <form onSubmit={(event) => updateGuest(event, guest.id)} className="mt-4 grid gap-3 rounded-2xl border border-purple-100 bg-purple-50/50 p-4 md:grid-cols-2 xl:grid-cols-5">
                  <input autoFocus className="portal-input" placeholder="Full name" value={editGuest.name} onChange={(event) => setEditGuest({ ...editGuest, name: event.target.value })} />
                  <input className="portal-input" placeholder="College" value={editGuest.college} onChange={(event) => setEditGuest({ ...editGuest, college: event.target.value })} />
                  <input className="portal-input" placeholder="Mobile" inputMode="numeric" value={editGuest.mobile} onChange={(event) => setEditGuest({ ...editGuest, mobile: event.target.value.replace(/\D/g, '').slice(0, 10) })} />
                  <input className="portal-input" placeholder="Email" type="email" value={editGuest.email} onChange={(event) => setEditGuest({ ...editGuest, email: event.target.value })} />
                  <div className="flex gap-2">
                    <button disabled={pending} className="portal-primary flex-1">Save</button>
                    <button type="button" disabled={pending} onClick={() => setEditing(null)} className="portal-secondary px-3" aria-label="Cancel editing"><X size={16} /></button>
                  </div>
                </form>
              )}
              {assigning === guest.id && (
                <div className="mt-3 max-w-lg rounded-2xl bg-[var(--color-surface-container)] p-3">
                  <QrCapture value={token} onChange={setToken} disabled={pending} />
                  <button type="button" disabled={pending || !token} onClick={() => run(() => assignQrAction(guest.id, token), 'QR assigned')} className="portal-primary mt-3 w-full">Confirm assignment</button>
                </div>
              )}
            </div>
          ))}
          {guests.length === 0 && <div className="p-12 text-center text-sm text-[var(--color-on-surface-variant)]">No participants match this search.</div>}
        </div>
        <div className="flex items-center justify-between border-t border-[var(--color-surface-variant)] p-4">
          <button disabled={page <= 1} onClick={() => navigate(page - 1)} className="portal-secondary disabled:opacity-40"><ChevronLeft size={16} /> Previous</button>
          <button disabled={page >= pages} onClick={() => navigate(page + 1)} className="portal-secondary disabled:opacity-40">Next <ChevronRight size={16} /></button>
        </div>
      </section>
    </div>
  )
}
