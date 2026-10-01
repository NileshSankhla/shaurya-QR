import { AdminOverview } from '@/components/admin/AdminOverview'
import { SectionHeading } from '@/components/portal/PortalShell'
import { platformStore } from '@/server/data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminPage() {
  const data = await platformStore.getAdminOverview()
  return (
    <>
      <SectionHeading
        title="Operations overview"
        description="Live QR distribution, meal verification, participant, college, and volunteer performance."
      />
      <AdminOverview data={data} />
    </>
  )
}
