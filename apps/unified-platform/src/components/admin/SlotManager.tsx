'use client'

import { FormEvent, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarPlus, CirclePause, CirclePlay, Clock3, RotateCcw, Trash2 } from 'lucide-react'
import {
  adminCreateSlotAction,
  adminDeleteSlotAction,
  adminSetSlotStatusAction,
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

  function execute(operation: () => Promise<{ ok: boolean; error?: string }>, success: string) {
    setError('')
    setNotice('')
    startTransition(async () => {
      const result = await operation()
      if (!result.ok) return setError(result.error ?? 'Operation failed')
      setNotice(success)
      router.refresh()
    })
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    const start = form.startTime ? new Date(form.startTime).toISOString() : ''
    const end = form.endTime ? new Date(form.endTime).toISOString() : ''
    execute(
      () => adminCreateSlotAction({ ...form, startTime: start, endTime: end }),
      'Food slot created',
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
                  {new Date(slot.startTime).toLocaleString('en-IN')} – {new Date(slot.endTime).toLocaleString('en-IN')}
                </p>
                <p className="mt-1 text-xs font-bold text-[var(--color-primary)]">{slot.served} verified meals</p>
              </div>
              <div className="flex flex-wrap gap-2">
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
                <button disabled={pending || slot.served > 0} onClick={() => execute(() => adminDeleteSlotAction(slot.id), 'Slot deleted')} className="portal-small text-red-700 disabled:opacity-30"><Trash2 size={15} /></button>
              </div>
            </div>
          </article>
        ))}
        {slots.length === 0 && <div className="rounded-3xl border border-dashed p-12 text-center text-sm text-[var(--color-on-surface-variant)]">No food slots yet. Create the first event day and meal.</div>}
      </div>
    </div>
  )
}
