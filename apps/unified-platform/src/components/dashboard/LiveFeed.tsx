'use client'

import { CheckCircle2, Clock, XCircle } from 'lucide-react'

export type LiveFeedItem = {
  id: string
  type: 'SCAN_SUCCESS' | 'SCAN_FAILED'
  guestName: string
  college: string
  mealName: string
  timestamp: string
  reason?: string
}

export function LiveFeed({ items }: { items: LiveFeedItem[] }) {
  if (items.length === 0) return <div className="rounded-3xl bg-white p-8 text-center text-sm text-[var(--color-on-surface-variant)]">No scan activity yet.</div>
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className="flex gap-3 rounded-2xl border border-[var(--color-surface-variant)] bg-white p-4 shadow-sm">
          {item.type === 'SCAN_SUCCESS' ? <CheckCircle2 className="shrink-0 text-green-600" size={20} /> : <XCircle className="shrink-0 text-red-600" size={20} />}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2"><p className="truncate text-sm font-bold">{item.guestName}</p><time className="flex shrink-0 items-center gap-1 text-[10px] text-[var(--color-on-surface-variant)]"><Clock size={11} />{new Date(item.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</time></div>
            <p className="truncate text-xs text-[var(--color-on-surface-variant)]">{item.college}</p>
            <div className="mt-2 flex flex-wrap gap-1.5"><span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-[var(--color-primary)]">{item.mealName}</span>{item.reason && <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">{item.reason}</span>}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
