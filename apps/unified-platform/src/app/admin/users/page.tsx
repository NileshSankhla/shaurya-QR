import { SectionHeading } from '@/components/portal/PortalShell'
import { UserManager } from '@/components/admin/UserManager'
import { platformStore } from '@/server/data'
import type {
  GuestAssignmentFilter,
  GuestListFilters,
  GuestScope,
  GuestSearchField,
  GuestSortField,
  SortDirection,
} from '@/server/data'

export const dynamic = 'force-dynamic'

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string
    page?: string
    scope?: string
    assignment?: string
    field?: string
    sort?: string
    direction?: string
  }>
}) {
  const params = await searchParams
  const query = params.q ?? ''
  const page = Number.parseInt(params.page ?? '1', 10) || 1
  const scope: GuestScope = ['ACTIVE', 'REMOVED', 'ALL'].includes(params.scope ?? '')
    ? (params.scope as GuestScope)
    : 'ACTIVE'
  const assignment: GuestAssignmentFilter = ['ALL', 'ASSIGNED', 'UNASSIGNED'].includes(params.assignment ?? '')
    ? (params.assignment as GuestAssignmentFilter)
    : 'ALL'
  const field: GuestSearchField = ['all', 'name', 'college', 'mobile', 'email', 'qr'].includes(params.field ?? '')
    ? (params.field as GuestSearchField)
    : 'all'
  const sortBy: GuestSortField = ['createdAt', 'name', 'college', 'mobile', 'email', 'status'].includes(params.sort ?? '')
    ? (params.sort as GuestSortField)
    : 'createdAt'
  const direction: SortDirection = params.direction === 'asc' ? 'asc' : 'desc'
  const filters: GuestListFilters = { scope, assignment, field, sortBy, direction }
  const data = await platformStore.listGuests(query, page, 50, filters)
  return (
    <>
      <SectionHeading
        title="Participant control"
        description="Search and page through participants without loading the complete database. Add, assign, unassign, remove, or restore records."
      />
      <UserManager {...data} query={query} {...filters} />
    </>
  )
}
