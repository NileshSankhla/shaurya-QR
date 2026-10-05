import Link from 'next/link'
import { BadgeCheck, QrCode, ScanLine, Users } from 'lucide-react'
import { getSession } from '@/lib/auth'
import { platformStore } from '@/server/data'
import { ParticipantSearch } from '@/components/volunteer/ParticipantSearch'
import { ScanModal } from '@/components/volunteer/ScanModal'
import { SectionHeading } from '@/components/portal/PortalShell'
import { SlotProgressBar } from '@/components/dashboard/SlotProgressBar'
import { LiveFeed } from '@/components/dashboard/LiveFeed'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function VolunteerPage() {
  const session = await getSession()
  if (!session) return null
  const data = await platformStore.getVolunteerHome(session.staffId)
  const feed = data.recent.map((item) => ({
    id: item.id,
    type: item.successful ? ('SCAN_SUCCESS' as const) : ('SCAN_FAILED' as const),
    guestName: item.guestName,
    college: item.successful ? 'Meal verified' : 'Verification rejected',
    mealName: item.slotTitle,
    timestamp: item.createdAt,
    reason: item.reason ?? undefined,
  }))

  return (
    <>
      <SectionHeading title={`Hello, ${session.name.split(' ')[0]}`} description="Choose QR assignment or food verification. Your activity is tracked against your account." />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-3xl bg-white p-5 shadow-sm"><Users className="mb-4 text-blue-600" /><p className="text-3xl font-black">{data.totalGuests}</p><p className="text-xs font-bold uppercase text-[var(--color-on-surface-variant)]">Active participants</p></div>
        <div className="rounded-3xl bg-white p-5 shadow-sm"><ScanLine className="mb-4 text-orange-600" /><p className="text-3xl font-black">{data.scannedByMe}</p><p className="text-xs font-bold uppercase text-[var(--color-on-surface-variant)]">My scan attempts</p></div>
        <div className="rounded-3xl bg-white p-5 shadow-sm"><BadgeCheck className="mb-4 text-green-600" /><p className="text-3xl font-black">{data.verifiedByMe}</p><p className="text-xs font-bold uppercase text-[var(--color-on-surface-variant)]">My verified meals</p></div>
      </div>

      <div className="mt-6">
        <SlotProgressBar
          slotName={data.activeSlot ? `${data.activeSlot.dayLabel} · ${data.activeSlot.title}` : 'No active food slot'}
          served={data.activeSlot?.served ?? 0}
          total={data.totalGuests}
          isActive={Boolean(data.activeSlot)}
        />
        {data.activeSlot && <p className="mt-2 text-center text-xs text-[var(--color-on-surface-variant)]">{new Date(data.activeSlot.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} – {new Date(data.activeSlot.endTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>}
      </div>

      <div className="my-6 grid gap-4 sm:grid-cols-2">
        <Link href="/volunteer/assign" className="group rounded-3xl border border-purple-100 bg-gradient-to-br from-purple-50 to-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <QrCode className="mb-5 text-purple-700" size={30} />
          <h2 className="text-xl font-black">QR assignment</h2>
          <p className="mt-2 text-sm text-[var(--color-on-surface-variant)]">Find a registered participant—or add one—then scan a valid QR. New UIDs are saved when assigned.</p>
        </Link>
        <ScanModal 
          hasActiveSlot={Boolean(data.activeSlot)}
          initialScannedByMe={data.scannedByMe}
          initialVerifiedByMe={data.verifiedByMe}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ParticipantSearch />
        <section>
          <h2 className="mb-3 font-[family-name:var(--font-display)] text-lg font-black">My recent scans</h2>
          <LiveFeed items={feed} />
        </section>
      </div>
    </>
  )
}
