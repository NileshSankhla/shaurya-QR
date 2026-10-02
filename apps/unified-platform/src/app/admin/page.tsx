import { Suspense } from 'react'
import { AdminOverview } from '@/components/admin/AdminOverview'
import { SectionHeading } from '@/components/portal/PortalShell'
import { platformStore } from '@/server/data'

export const revalidate = 60 // 1 minute caching

async function DashboardData() {
  const data = await platformStore.getAdminOverview()
  return <AdminOverview data={data} />
}

function DashboardSkeleton() {
  return (
    <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-gray-300 dark:border-gray-800">
      <div className="flex flex-col items-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        <p className="text-sm text-gray-500">Loading live operations data...</p>
      </div>
    </div>
  )
}

export default function AdminPage() {
  return (
    <>
      <SectionHeading
        title="Operations overview"
        description="Live QR distribution, meal verification, participant, college, and volunteer performance."
      />
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardData />
      </Suspense>
    </>
  )
}
