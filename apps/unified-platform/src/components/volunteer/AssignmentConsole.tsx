'use client'

import { FormEvent, useState, useTransition } from 'react'
import { CheckCircle2, Search, UserPlus, UserRound } from 'lucide-react'
import { assignQrAction, createGuestAndAssignAction, searchGuestsAction } from '@/app/actions'
import type { GuestSearchResult } from '@/server/data'
import { QrCapture } from './QrCapture'

export function AssignmentConsole() {
  const [pending, startTransition] = useTransition()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GuestSearchResult[]>([])
  const [selected, setSelected] = useState<GuestSearchResult | null>(null)
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [creating, setCreating] = useState(false)
  const [guest, setGuest] = useState({ name: '', college: '', mobile: '', email: '' })

  function resetMessages() {
    setError('')
    setSuccess('')
  }

  function search(event: FormEvent) {
    event.preventDefault()
    resetMessages()
    setSelected(null)
    startTransition(async () => {
      const result = await searchGuestsAction(query)
      if (!result.ok) return setError(result.error)
      setResults(result.data)
      if (result.data.length === 0) setError('No participant found. You can register them below.')
    })
  }

  function assign() {
    if (!selected) return
    resetMessages()
    startTransition(async () => {
      const result = await assignQrAction(selected.id, token)
      if (!result.ok) return setError(result.error)
      setSuccess(`${token} assigned to ${selected.name}`)
      setSelected({ ...selected, status: 'ASSIGNED', qrToken: token })
      setToken('')
    })
  }

  function createAndAssign(event: FormEvent) {
    event.preventDefault()
    resetMessages()
    startTransition(async () => {
      const result = await createGuestAndAssignAction(guest, token)
      if (!result.ok) return setError(result.error)
      setSuccess(`${result.data.name} registered and assigned ${result.data.qrToken}`)
      setGuest({ name: '', college: '', mobile: '', email: '' })
      setToken('')
      setCreating(false)
      setResults([])
    })
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
      <div className="space-y-5">
        <section className="rounded-3xl border border-[var(--color-surface-variant)] bg-white p-5 shadow-sm">
          <h2 className="mb-1 font-black">1. Find the participant</h2>
          <p className="mb-4 text-xs text-[var(--color-on-surface-variant)]">Search registered users without loading the full database.</p>
          <form onSubmit={search} className="flex gap-2">
            <div className="relative flex-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-variant)]" size={18} /><input className="portal-input pl-11" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, mobile, email, college…" /></div>
            <button disabled={pending} className="portal-primary px-5">Search</button>
          </form>
          {results.length > 0 && (
            <div className="mt-4 space-y-2">
              {results.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => { setSelected(item); setCreating(false); resetMessages() }}
                  className={`flex w-full items-center gap-3 rounded-2xl p-4 text-left transition ${selected?.id === item.id ? 'bg-orange-50 ring-2 ring-orange-200' : 'bg-[var(--color-surface-container)]'}`}
                >
                  <UserRound size={19} className="text-[var(--color-primary)]" />
                  <span className="min-w-0 flex-1"><strong className="block truncate text-sm">{item.name}</strong><span className="block truncate text-xs text-[var(--color-on-surface-variant)]">{item.college} · {item.mobile}</span></span>
                  <span className="text-[10px] font-black">{item.status}</span>
                </button>
              ))}
            </div>
          )}
          <button type="button" onClick={() => { setCreating(!creating); setSelected(null); resetMessages() }} className="portal-secondary mt-4"><UserPlus size={16} /> Participant not registered?</button>
        </section>

        {creating && (
          <form onSubmit={createAndAssign} className="rounded-3xl border border-purple-100 bg-white p-5 shadow-sm">
            <h2 className="mb-1 font-black">Register and assign</h2>
            <p className="mb-4 text-xs text-[var(--color-on-surface-variant)]">Create the participant, then claim the scanned QR in one transaction.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <input className="portal-input" placeholder="Full name" value={guest.name} onChange={(event) => setGuest({ ...guest, name: event.target.value })} />
              <input className="portal-input" placeholder="College" value={guest.college} onChange={(event) => setGuest({ ...guest, college: event.target.value })} />
              <input className="portal-input" inputMode="numeric" placeholder="10-digit mobile" value={guest.mobile} onChange={(event) => setGuest({ ...guest, mobile: event.target.value.replace(/\D/g, '').slice(0, 10) })} />
              <input className="portal-input" type="email" placeholder="Email" value={guest.email} onChange={(event) => setGuest({ ...guest, email: event.target.value })} />
            </div>
            <div className="mt-4"><QrCapture value={token} onChange={setToken} disabled={pending} /></div>
            <button disabled={pending || !token} className="portal-primary mt-4 w-full">{pending ? 'Registering…' : 'Register and assign QR'}</button>
          </form>
        )}
      </div>

      <aside className="h-fit rounded-3xl border border-[var(--color-surface-variant)] bg-white p-5 shadow-sm xl:sticky xl:top-24">
        <h2 className="mb-1 font-black">2. Scan an available QR</h2>
        <p className="mb-4 text-xs text-[var(--color-on-surface-variant)]">{selected ? `Assigning to ${selected.name}` : 'Select a registered participant first'}</p>
        {selected?.qrToken ? (
          <div className="rounded-2xl bg-green-50 p-5 text-center text-green-800"><CheckCircle2 className="mx-auto mb-2" /><p className="font-bold">Already assigned</p><p className="mt-1 font-mono text-sm">{selected.qrToken}</p></div>
        ) : (
          <>
            <QrCapture value={token} onChange={setToken} disabled={!selected || pending} />
            <button type="button" onClick={assign} disabled={!selected || !token || pending} className="portal-primary mt-4 w-full">{pending ? 'Assigning…' : 'Confirm assignment'}</button>
          </>
        )}
        {error && <p className="mt-3 rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700">{error}</p>}
        {success && <p className="mt-3 rounded-xl bg-green-50 p-3 text-xs font-bold text-green-700">{success}</p>}
      </aside>
    </div>
  )
}
