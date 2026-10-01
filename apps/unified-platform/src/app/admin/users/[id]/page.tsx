import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  CircleAlert,
  CircleCheck,
  Clock3,
  Mail,
  MapPin,
  Phone,
  QrCode,
  UserRound,
} from 'lucide-react'
import { SectionHeading } from '@/components/portal/PortalShell'
import { platformStore, type GuestHistory } from '@/server/data'

export const dynamic = 'force-dynamic'

const dateTime = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Kolkata',
})

const kindStyle: Record<GuestHistory['timeline'][number]['kind'], string> = {
  REGISTRATION: 'bg-blue-50 text-blue-700',
  ACCOUNT: 'bg-purple-50 text-purple-700',
  QR: 'bg-orange-50 text-orange-700',
  MEAL: 'bg-green-50 text-green-700',
  REJECTED_SCAN: 'bg-red-50 text-red-700',
}

export default async function ParticipantHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await platformStore.getGuestHistory(id)
  if (!data) notFound()

  const { guest, totals, timeline } = data
  return (
    <>
      <SectionHeading
        title={guest.name}
        description="Participant profile, QR state, meal records, and complete operations history."
        action={<Link href="/admin/users" className="portal-secondary"><ArrowLeft size={16} /> Back to participants</Link>}
      />

      <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <aside className="space-y-5">
          <section className="rounded-3xl border border-[var(--color-surface-variant)] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-[var(--color-primary)]"><UserRound size={26} /></span>
              <span className={`rounded-full px-3 py-1 text-xs font-black ${guest.active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {guest.active ? 'ACTIVE' : 'REMOVED'}
              </span>
            </div>
            <h2 className="mt-4 text-xl font-black">{guest.name}</h2>
            <div className="mt-4 space-y-3 text-sm text-[var(--color-on-surface-variant)]">
              <p className="flex items-center gap-2"><MapPin size={16} /> {guest.college}</p>
              <p className="flex items-center gap-2"><Phone size={16} /> {guest.mobile}</p>
              <p className="flex items-center gap-2 break-all"><Mail size={16} /> {guest.email}</p>
              <p className="flex items-center gap-2"><QrCode size={16} /> <span className="font-mono font-bold text-[var(--color-primary)]">{guest.qrToken ?? 'Not assigned'}</span></p>
              <p className="flex items-center gap-2"><Clock3 size={16} /> Registered {dateTime.format(new Date(guest.createdAt))}</p>
            </div>
            {guest.removedAt && <p className="mt-4 rounded-2xl bg-red-50 p-3 text-xs font-bold text-red-700">Removed {dateTime.format(new Date(guest.removedAt))}</p>}
          </section>

          <section className="grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-white p-4 text-center shadow-sm"><p className="text-2xl font-black">{totals.mealsVerified}</p><p className="text-[10px] font-bold text-[var(--color-on-surface-variant)]">MEALS</p></div>
            <div className="rounded-2xl bg-white p-4 text-center shadow-sm"><p className="text-2xl font-black">{totals.scanAttempts}</p><p className="text-[10px] font-bold text-[var(--color-on-surface-variant)]">SCANS</p></div>
            <div className="rounded-2xl bg-white p-4 text-center shadow-sm"><p className="text-2xl font-black text-red-600">{totals.rejectedScans}</p><p className="text-[10px] font-bold text-[var(--color-on-surface-variant)]">REJECTED</p></div>
          </section>
        </aside>

        <section className="rounded-3xl border border-[var(--color-surface-variant)] bg-white p-5 shadow-sm md:p-6">
          <div className="mb-5">
            <h2 className="text-lg font-black">Participant history</h2>
            <p className="text-xs text-[var(--color-on-surface-variant)]">Newest activity appears first. Records are retained when a participant is removed.</p>
          </div>
          <div className="space-y-3">
            {timeline.map((event) => (
              <article key={event.id} className="flex gap-3 rounded-2xl border border-[var(--color-surface-variant)] p-4">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${kindStyle[event.kind]}`}>
                  {event.successful === false ? <CircleAlert size={18} /> : <CircleCheck size={18} />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="font-bold">{event.title}</h3>
                    <time className="text-[11px] text-[var(--color-on-surface-variant)]">{dateTime.format(new Date(event.createdAt))}</time>
                  </div>
                  <p className="mt-1 text-sm text-[var(--color-on-surface-variant)]">{event.description}</p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-bold text-[var(--color-on-surface-variant)]">
                    {event.actor && <span>By {event.actor}</span>}
                    {event.qrToken && <span className="font-mono">QR {event.qrToken}</span>}
                    {event.slotTitle && <span>Slot {event.slotTitle}</span>}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
