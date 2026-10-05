'use client'

import { useState } from 'react'
import { CheckCircle2, Clock, XCircle, ChevronLeft, ChevronRight } from 'lucide-react'

export type LiveFeedItem = {
  id: string
  type: 'SCAN_SUCCESS' | 'SCAN_FAILED'
  guestName: string
  college: string
  mealName: string
  timestamp: string
  reason?: string
}

export function LiveFeed({ items, pageSize = 5 }: { items: LiveFeedItem[], pageSize?: number }) {
  const [currentPage, setCurrentPage] = useState(1)

  if (items.length === 0) return <div className="rounded-3xl bg-white p-8 text-center text-sm text-[var(--color-on-surface-variant)]">No scan activity yet.</div>

  const totalPages = Math.ceil(items.length / pageSize)
  const safePage = Math.max(1, Math.min(currentPage, totalPages))
  const startIndex = (safePage - 1) * pageSize
  const visibleItems = items.slice(startIndex, startIndex + pageSize)

  // Generate pagination buttons
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {visibleItems.map((item) => (
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

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-1">
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
    </div>
  )
}
