'use client'

import { FormEvent, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Pencil, ShieldCheck, UserMinus, UserPlus, UserRoundCheck, Users, X } from 'lucide-react'
import { adminCreateStaffAction, adminSetStaffActiveAction, adminUpdateStaffAction } from '@/app/actions'
import type { StaffRole } from '@/lib/auth'

type Member = {
  id: string
  username: string
  name: string
  role: string
  active: boolean
}

export function TeamManager({ members, currentStaffId }: { members: Member[]; currentStaffId: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({ name: '', username: '', password: '', role: 'VOLUNTEER' as StaffRole })
  const [editing, setEditing] = useState<string | null>(null)
  const [removeTarget, setRemoveTarget] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', username: '', password: '', role: 'VOLUNTEER' as StaffRole })
  
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  const totalPages = Math.ceil(members.length / pageSize)
  const safePage = Math.max(1, Math.min(currentPage, totalPages))
  const startIndex = (safePage - 1) * pageSize
  const visibleMembers = members.slice(startIndex, startIndex + pageSize)
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setSuccess('')
    startTransition(async () => {
      try {
        const result = await adminCreateStaffAction(form)
        if (!result.ok) return setError(result.error)
        setForm({ name: '', username: '', password: '', role: 'VOLUNTEER' })
        setSuccess('Staff account created')
        router.refresh()
      } catch {
        setError('The account could not be created. Check the connection and retry.')
      }
    })
  }

  function beginEdit(member: Member) {
    if (member.id === currentStaffId) return
    setEditing(member.id)
    setRemoveTarget(null)
    setEditForm({ name: member.name, username: member.username, password: '', role: member.role as StaffRole })
    setError('')
    setSuccess('')
  }

  function update(event: FormEvent, member: Member) {
    event.preventDefault()
    setError('')
    setSuccess('')
    startTransition(async () => {
      try {
        const result = await adminUpdateStaffAction(member.id, editForm)
        if (!result.ok) return setError(result.error)
        setEditing(null)
        setSuccess(`${editForm.name} updated`)
        router.refresh()
      } catch {
        setError('The account could not be updated. Check the connection and retry.')
      }
    })
  }

  function toggle(member: Member) {
    setError('')
    setSuccess('')
    startTransition(async () => {
      try {
        const result = await adminSetStaffActiveAction(member.id, !member.active)
        if (!result.ok) return setError(result.error)
        setRemoveTarget(null)
        setSuccess(member.active ? `${member.name} removed from access` : `${member.name} restored`)
        router.refresh()
      } catch {
        setError('The account access could not be changed. Check the connection and retry.')
      }
    })
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <form onSubmit={submit} className="h-fit rounded-3xl border border-[var(--color-surface-variant)] bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-[var(--color-primary)]"><UserPlus size={21} /></span>
          <div><h2 className="font-black">Add staff account</h2><p className="text-xs text-[var(--color-on-surface-variant)]">Create volunteers or more admins</p></div>
        </div>
        <div className="space-y-3">
          <input className="portal-input" placeholder="Full name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <input className="portal-input" placeholder="Username" autoCapitalize="none" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} />
          <input className="portal-input" type="password" placeholder="Temporary password (8+ chars)" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
          <select className="portal-input" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as StaffRole })}>
            <option value="VOLUNTEER">Volunteer</option>
            <option value="ADMIN">Administrator</option>
          </select>
        </div>
        {error && <p className="mt-3 rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700">{error}</p>}
        {success && <p className="mt-3 rounded-xl bg-green-50 p-3 text-xs font-bold text-green-700">{success}</p>}
        <button disabled={pending} className="portal-primary mt-4 w-full">{pending ? 'Saving…' : 'Create account'}</button>
      </form>

      <section className="rounded-3xl border border-[var(--color-surface-variant)] bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <Users className="text-[var(--color-primary)]" />
          <div><h2 className="font-black">Admin and volunteer access</h2><p className="text-xs text-[var(--color-on-surface-variant)]">{members.length} total accounts</p></div>
        </div>
        {error && <p className="mb-3 rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700">{error}</p>}
        {success && <p className="mb-3 rounded-xl bg-green-50 p-3 text-xs font-bold text-green-700">{success}</p>}
        <div className="space-y-2">
          {visibleMembers.map((member) => (
            <div key={member.id} className="rounded-2xl bg-[var(--color-surface-container)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${member.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                    <ShieldCheck size={19} />
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold">{member.name}</p>
                      {member.id === currentStaffId && <span className="rounded-full bg-white px-2 py-0.5 text-[9px] font-black text-[var(--color-primary)]">YOU</span>}
                    </div>
                    <p className="text-xs text-[var(--color-on-surface-variant)]">@{member.username} · {member.role} · {member.active ? 'ACTIVE' : 'REMOVED'}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" disabled={pending || member.id === currentStaffId} onClick={() => beginEdit(member)} className="portal-small disabled:cursor-not-allowed disabled:opacity-40"><Pencil size={14} /> Edit</button>
                  {member.active ? (
                    <button type="button" disabled={pending || member.id === currentStaffId} onClick={() => { setRemoveTarget(member.id); setEditing(null) }} className="portal-small text-red-700 disabled:cursor-not-allowed disabled:opacity-40"><UserMinus size={14} /> Remove</button>
                  ) : (
                    <button type="button" disabled={pending || member.id === currentStaffId} onClick={() => toggle(member)} className="portal-small text-green-700 disabled:cursor-not-allowed disabled:opacity-40"><UserRoundCheck size={14} /> Restore</button>
                  )}
                </div>
              </div>

              {removeTarget === member.id && (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                  <p><strong>Remove access for {member.name}?</strong> Existing scan history will be retained and the account can be restored.</p>
                  <div className="flex gap-2">
                    <button type="button" disabled={pending} onClick={() => toggle(member)} className="portal-small bg-red-600 text-white">Confirm remove</button>
                    <button type="button" disabled={pending} onClick={() => setRemoveTarget(null)} className="portal-small"><X size={14} /> Cancel</button>
                  </div>
                </div>
              )}

              {editing === member.id && (
                <form onSubmit={(event) => update(event, member)} className="mt-3 grid gap-3 rounded-xl border border-purple-100 bg-white p-3 sm:grid-cols-2 xl:grid-cols-5">
                  <input autoFocus className="portal-input" placeholder="Full name" value={editForm.name} onChange={(event) => setEditForm({ ...editForm, name: event.target.value })} />
                  <input className="portal-input" placeholder="Username" autoCapitalize="none" value={editForm.username} onChange={(event) => setEditForm({ ...editForm, username: event.target.value })} />
                  <input className="portal-input" type="password" placeholder="New password (optional)" value={editForm.password} onChange={(event) => setEditForm({ ...editForm, password: event.target.value })} />
                  <select className="portal-input" value={editForm.role} onChange={(event) => setEditForm({ ...editForm, role: event.target.value as StaffRole })}>
                    <option value="VOLUNTEER">Volunteer</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                  <div className="flex gap-2">
                    <button disabled={pending} className="portal-primary flex-1">Save</button>
                    <button type="button" disabled={pending} onClick={() => setEditing(null)} className="portal-secondary px-3" aria-label="Cancel editing"><X size={16} /></button>
                  </div>
                </form>
              )}
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-1">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-surface-variant)] bg-white text-[var(--color-on-surface-variant)] disabled:opacity-50"
            >
              <ChevronLeft size={16} />
            </button>
            
            {pages.map(p => (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg border text-sm font-bold transition-colors ${
                  safePage === p 
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white' 
                    : 'border-[var(--color-surface-variant)] bg-white text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)]'
                }`}
              >
                {p}
              </button>
            ))}

            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-surface-variant)] bg-white text-[var(--color-on-surface-variant)] disabled:opacity-50"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
