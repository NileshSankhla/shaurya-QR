import { SectionHeading } from '@/components/portal/PortalShell'
import { SlotManager } from '@/components/admin/SlotManager'
import { platformStore } from '@/server/data'

export const dynamic = 'force-dynamic'

export default async function SlotsPage() {
  const slots = await platformStore.listSlots()
  return (
    <>
      <SectionHeading
        title="Food day and slot control"
        description="Create meal schedules, start a slot immediately, pause service, resume it, or close it at any time."
      />
      <SlotManager slots={slots} />
    </>
  )
}
