import { SectionHeading } from '@/components/portal/PortalShell'
import { TeamManager } from '@/components/admin/TeamManager'
import { platformStore } from '@/server/data'
import { requireSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function TeamPage() {
  const [session, members] = await Promise.all([
    requireSession(['ADMIN']),
    platformStore.listStaff(),
  ])
  return (
    <>
      <SectionHeading title="Team access" description="Create, edit, remove, restore, promote, or demote administrators and volunteers." />
      <TeamManager members={members} currentStaffId={session.staffId} />
    </>
  )
}
