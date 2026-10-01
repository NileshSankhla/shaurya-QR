'use client'

import { FormEvent, useState, useTransition } from 'react'
import { Search, UserRound } from 'lucide-react'
import { searchGuestsAction } from '@/app/actions'
import type { GuestSearchResult } from '@/server/data'

export function ParticipantSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GuestSearchResult[]>([])
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)
  const [pending, startTransition] = useTransition()

  function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    startTransition(async () => {
      const result = await searchGuestsAction(query)
      setSearched(true)
      if (!result.ok) {
        setResults([])
        return setError(result.error)
      }
      setResults(result.data)
    })
  }

  return (
    <section className="rounded-3xl border border-[var(--color-surface-variant)] bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-black">Find a participant</h2>
        <p className="text-xs text-[var(--color-on-surface-variant)]">Search only when needed; the full participant list is never loaded.</p>
      </div>
      <form onSubmit={submit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-variant)]" size={18} />
          <input className="portal-input pl-11" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, mobile, email, college, or QR…" />
        </div>
        <button disabled={pending} className="portal-primary px-5">{pending ? '…' : 'Search'}</button>
      </form>
      {error && <p className="mt-3 rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700">{error}</p>}
      {searched && !error && results.length === 0 && <p className="mt-4 text-sm text-[var(--color-on-surface-variant)]">No participant found.</p>}
      {results.length > 0 && (
        <div className="mt-4 space-y-2">
          {results.map((guest) => (
            <div key={guest.id} className="flex items-start gap-3 rounded-2xl bg-[var(--color-surface-container)] p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-[var(--color-primary)]"><UserRound size={18} /></span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><p className="font-bold">{guest.name}</p><span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-black">{guest.status}</span></div>
                <p className="mt-1 text-xs text-[var(--color-on-surface-variant)]">{guest.college} · {guest.mobile}</p>
                <p className="mt-1 text-xs"><span className="font-mono font-bold text-[var(--color-primary)]">{guest.qrToken ?? 'QR not assigned'}</span> · {guest.mealsVerified} meals verified</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
