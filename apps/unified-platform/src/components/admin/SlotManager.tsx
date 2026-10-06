'use client'

import { FormEvent, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarPlus, CirclePause, CirclePlay, Clock3, RotateCcw, Trash2, Pencil, X } from 'lucide-react'
import {
  adminCreateSlotAction,
  adminDeleteSlotAction,
  adminSetSlotStatusAction,
  adminUpdateSlotAction,
} from '@/app/actions'

type Slot = {
  id: number
  title: string
  status: string
  dayLabel: string
  eventDate: string
  startTime: string
  endTime: string
  served: number
}

export function SlotManager({ slots }: { slots: Slot[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [form, setForm] = useState({ dayLabel: '', eventDate: '', title: '', startTime: '', endTime: '' })
  const [editingSlotId, setEditingSlotId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({ dayLabel: '', eventDate: '', title: '', startTime: '', endTime: '' })
  const operationInFlight = useRef(false)

  function toLocalDatetime(isoString: string) {
    if (!isoString) return ''
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return ''
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
    return d.toISOString().slice(0, 16)
  }

  function startEdit(slot: Slot) {
    setEditingSlotId(slot.id)
    setEditForm({
      dayLabel: slot.dayLabel,
      eventDate: slot.eventDate.split('T')[0],
      title: slot.title,
      startTime: toLocalDatetime(slot.startTime),
      endTime: toLocalDatetime(slot.endTime),
    })
  }

  function execute(
    operation: () => Promise<{ ok: boolean; error?: string }>,
    success: string,
    onSuccess?: () => void,
  ) {
    if (operationInFlight.current) return
    operationInFlight.current = true
    setError('')
    setNotice('')
    startTransition(async () => {
      try {
        const result = await operation()
        if (!result.ok) return setError(result.error ?? 'Operation failed')
        onSuccess?.()
        setNotice(success)
        router.refresh()
      } finally {
        operationInFlight.current = false
      }
    })
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    const start = form.startTime ? new Date(form.startTime).toISOString() : ''
    const end = form.endTime ? new Date(form.endTime).toISOString() : ''
    execute(
      () => adminCreateSlotAction({ ...form, startTime: start, endTime: end }),
      'Food slot created',
      () => setForm({ dayLabel: '', eventDate: '', title: '', startTime: '', endTime: '' }),
    )
  }

  function submitEdit(event: FormEvent, id: number) {
    event.preventDefault()
    const start = editForm.startTime ? new Date(editForm.startTime).toISOString() : ''
    const end = editForm.endTime ? new Date(editForm.endTime).toISOString() : ''
    execute(
      () => adminUpdateSlotAction(id, { ...editForm, startTime: start, endTime: end }),
      'Food slot updated',
      () => setEditingSlotId(null),
    )
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
      <form onSubmit={submit} className="h-fit rounded-3xl border border-[var(--color-surface-variant)] bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-[var(--color-primary)]"><CalendarPlus size={21} /></span>
          <div><h2 className="font-black">Create food slot</h2><p className="text-xs text-[var(--color-on-surface-variant)]">Dates and times can be changed in the database later</p></div>
        </div>
        <div className="space-y-3">
          <input className="portal-input" placeholder="Day label (e.g. Day 1)" value={form.dayLabel} onChange={(event) => setForm({ ...form, dayLabel: event.target.value })} />
          <input className="portal-input" type="date" value={form.eventDate} onChange={(event) => setForm({ ...form, eventDate: event.target.value })} />
          <select className="portal-input" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })}>
            <option value="">Select meal</option>
            <option>Breakfast</option><option>Lunch</option><option>Snacks</option><option>Dinner</option>
          </select>
          <label className="block text-xs font-bold text-[var(--color-on-surface-variant)]">Starts at<input className="portal-input mt-1" type="datetime-local" value={form.startTime} onChange={(event) => setForm({ ...form, startTime: event.target.value })} /></label>
          <label className="block text-xs font-bold text-[var(--color-on-surface-variant)]">Ends at<input className="portal-input mt-1" type="datetime-local" value={form.endTime} onChange={(event) => setForm({ ...form, endTime: event.target.value })} /></label>
        </div>
        <button disabled={pending} className="portal-primary mt-4 w-full">{pending ? 'Saving…' : 'Create slot'}</button>
      </form>

      <div className="space-y-3">
        {error && <p className="rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
        {notice && <p className="rounded-2xl bg-green-50 p-3 text-sm font-bold text-green-700">{notice}</p>}
        {slots.map((slot) => (
          <article key={slot.id} className={`rounded-3xl border bg-white p-5 shadow-sm ${slot.status === 'ACTIVE' ? 'border-green-300 ring-2 ring-green-100' : 'border-[var(--color-surface-variant)]'}`}>
            {editingSlotId === slot.id ? (
              <form onSubmit={(e) => submitEdit(e, slot.id)} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-[var(--color-primary)]">Edit food slot</h3>
                  <button type="button" onClick={() => setEditingSlotId(null)} className="text-[var(--color-on-surface-variant)] hover:text-red-600"><X size={18} /></button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input className="portal-input" placeholder="Day label" value={editForm.dayLabel} onChange={(e) => setEditForm({ ...editForm, dayLabel: e.target.value })} required />
                  <input className="portal-input" type="date" value={editForm.eventDate} onChange={(e) => setEditForm({ ...editForm, eventDate: e.target.value })} required />
                  <select className="portal-input sm:col-span-2" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} required>
                    <option value="">Select meal</option><option>Breakfast</option><option>Lunch</option><option>Snacks</option><option>Dinner</option>
                  </select>
                  <label className="block text-xs font-bold text-[var(--color-on-surface-variant)]">Starts at<input className="portal-input mt-1" type="datetime-local" value={editForm.startTime} onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })} required /></label>
                  <label className="block text-xs font-bold text-[var(--color-on-surface-variant)]">Ends at<input className="portal-input mt-1" type="datetime-local" value={editForm.endTime} onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })} required /></label>
                </div>
                <button disabled={pending} className="portal-primary w-full">{pending ? 'Saving…' : 'Save changes'}</button>
              </form>
            ) : (
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-[family-name:var(--font-display)] text-lg font-black">{slot.dayLabel} · {slot.title}</h2>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${
                      slot.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                      slot.status === 'PAUSED' ? 'bg-amber-100 text-amber-700' :
                      slot.status === 'CLOSED' ? 'bg-slate-200 text-slate-700' : 'bg-blue-50 text-blue-700'
                    }`}>{slot.status}</span>
                  </div>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-[var(--color-on-surface-variant)]">
                    <Clock3 size={14} />
                    <span suppressHydrationWarning>
                      {new Date(slot.startTime).toLocaleString('en-IN')} – {new Date(slot.endTime).toLocaleString('en-IN')}
                    </span>
                  </p>
                  <p className="mt-1 text-xs font-bold text-[var(--color-primary)]">{slot.served} verified meals</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {slot.status !== 'ACTIVE' && slot.status !== 'CLOSED' && (
                    <button disabled={pending} onClick={() => execute(() => adminSetSlotStatusAction(slot.id, 'ACTIVE'), `${slot.title} started`)} className="portal-small text-green-700"><CirclePlay size={15} /> Start</button>
                  )}
                  {slot.status === 'ACTIVE' && (
                    <button disabled={pending} onClick={() => execute(() => adminSetSlotStatusAction(slot.id, 'PAUSED'), `${slot.title} paused`)} className="portal-small text-amber-700"><CirclePause size={15} /> Pause</button>
                  )}
                  {(slot.status === 'PAUSED' || slot.status === 'CLOSED') && (
                    <button disabled={pending} onClick={() => execute(() => adminSetSlotStatusAction(slot.id, 'SCHEDULED'), `${slot.title} reset`)} className="portal-small"><RotateCcw size={15} /> Reset</button>
                  )}
                  {slot.status !== 'CLOSED' && (
                    <button disabled={pending} onClick={() => execute(() => adminSetSlotStatusAction(slot.id, 'CLOSED'), `${slot.title} closed`)} className="portal-small">Close</button>
                  )}
                  <div className="h-6 w-px bg-gray-200 mx-1"></div>
                  <button disabled={pending} onClick={() => startEdit(slot)} className="portal-small text-slate-600"><Pencil size={15} /></button>
                  <button disabled={pending || slot.served > 0} onClick={() => execute(() => adminDeleteSlotAction(slot.id), 'Slot deleted')} className="portal-small text-red-700 disabled:opacity-30"><Trash2 size={15} /></button>
                </div>
              </div>
            )}
          </article>
        ))}
        {slots.length === 0 && <div className="rounded-3xl border border-dashed p-12 text-center text-sm text-[var(--color-on-surface-variant)]">No food slots yet. Create the first event day and meal.</div>}
      </div>
    </div>
  )
}
