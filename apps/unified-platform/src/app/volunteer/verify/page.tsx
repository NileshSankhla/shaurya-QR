import { getSession } from '@/lib/auth'
import { platformStore } from '@/server/data'
import { SectionHeading } from '@/components/portal/PortalShell'
import { SlotProgressBar } from '@/components/dashboard/SlotProgressBar'
import { VerificationConsole } from '@/components/volunteer/VerificationConsole'

export const dynamic = 'force-dynamic'

export default async function VerifyPage() {
  const session = await getSession()
  if (!session) return null
  const data = await platformStore.getVolunteerHome(session.staffId)
  return (
    <>
      <SectionHeading
        title="Food verification"
        description="Approve one meal per participant for the active slot. Duplicate, invalid, and unassigned QR scans are recorded as rejected attempts."
      />
      <div className="mb-6">
        <SlotProgressBar
          slotName={data.activeSlot ? `${data.activeSlot.dayLabel} · ${data.activeSlot.title}` : 'No active food slot'}
          served={data.activeSlot?.served ?? 0}
          total={data.totalGuests}
          isActive={Boolean(data.activeSlot)}
        />
      </div>
      <VerificationConsole
        hasActiveSlot={Boolean(data.activeSlot)}
        initialScannedByMe={data.scannedByMe}
        initialVerifiedByMe={data.verifiedByMe}
      />
    </>
  )
}
