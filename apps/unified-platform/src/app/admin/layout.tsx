import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { PortalShell } from '@/components/portal/PortalShell'
import { platformStore } from '@/server/data'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')
  const current = await platformStore.findStaffByUsername(session.username)
  if (!current || current.id !== session.staffId || !current.active) redirect('/login')
  if (current.role !== 'ADMIN') redirect('/volunteer')
  return <PortalShell role="ADMIN" name={current.name}>{children}</PortalShell>
}
