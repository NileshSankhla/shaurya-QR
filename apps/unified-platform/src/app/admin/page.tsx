import { Suspense } from "react";
import { AdminOverview } from "@/components/admin/AdminOverview";
import { SectionHeading } from "@/components/portal/PortalShell";
import { platformStore } from "@/server/data";

export const revalidate = 60; // 1 minute caching

async function DashboardData({ recentPage }: { recentPage: number }) {
  const data = await platformStore.getAdminOverview(recentPage);
  return <AdminOverview data={data} />;
}

function DashboardSkeleton() {
  return (
    <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-gray-300 dark:border-gray-800">
      <div className="flex flex-col items-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        <p className="text-sm text-gray-500">Loading live operations data...</p>
      </div>
    </div>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ activityPage?: string }>;
}) {
  const params = await searchParams;
  const parsedPage = Number.parseInt(params.activityPage ?? "1", 10);
  const recentPage =
    Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  return (
    <>
      <SectionHeading
        title="Operations overview"
        description="Live QR distribution, meal verification, participant, college, and volunteer performance."
      />
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardData recentPage={recentPage} />
      </Suspense>
    </>
  );
}
