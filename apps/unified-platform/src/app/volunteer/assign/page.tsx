import { SectionHeading } from '@/components/portal/PortalShell'
import { AssignmentConsole } from '@/components/volunteer/AssignmentConsole'

export default function AssignPage() {
  return (
    <>
      <SectionHeading
        title="QR assignment"
        description="Search a registered participant or add a new one, then scan an unassigned QR to link it safely."
      />
      <AssignmentConsole />
    </>
  )
}
