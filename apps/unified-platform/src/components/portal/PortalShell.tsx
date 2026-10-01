'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useTransition } from 'react'
import {
  BarChart3,
  CalendarClock,
  LayoutDashboard,
  LogOut,
  QrCode,
  ScanLine,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { logoutAction } from '@/app/actions'
import type { StaffRole } from '@/lib/auth'

const ADMIN_NAV = [
  { href: '/admin', label: 'Overview', icon: BarChart3 },
  { href: '/admin/team', label: 'Team', icon: ShieldCheck },
  { href: '/admin/users', label: 'Participants', icon: Users },
  { href: '/admin/slots', label: 'Food slots', icon: CalendarClock },
]

const VOLUNTEER_NAV = [
  { href: '/volunteer', label: 'Home', icon: LayoutDashboard },
  { href: '/volunteer/assign', label: 'Assign QR', icon: QrCode },
  { href: '/volunteer/verify', label: 'Verify food', icon: ScanLine },
]

export function PortalShell({
  children,
  role,
  name,
}: {
  children: React.ReactNode
  role: StaffRole
  name: string
}) {
  const pathname = usePathname()
  const [pending, startTransition] = useTransition()
  const nav = role === 'ADMIN' ? ADMIN_NAV : VOLUNTEER_NAV

  return (
    <div className="min-h-screen bg-[var(--color-surface)] text-[var(--color-on-surface)] md:grid md:grid-cols-[250px_1fr]">
      <aside className="hidden md:flex sticky top-0 h-screen flex-col border-r border-[var(--color-surface-variant)] bg-white px-4 py-5">
        <Link href={role === 'ADMIN' ? '/admin' : '/volunteer'} className="flex items-center gap-3 px-2">
          <span className="relative h-11 w-11 overflow-hidden rounded-2xl bg-orange-50">
            <Image src="/logo.png" alt="Shaurya" fill className="object-contain p-1.5" />
          </span>
          <span>
            <strong className="block font-[family-name:var(--font-display)] text-lg">SHAURYA</strong>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-primary)]">
              {role === 'ADMIN' ? 'Master admin' : 'Volunteer'}
            </span>
          </span>
        </Link>

        <nav className="mt-8 flex flex-col gap-1.5">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/admin' && pathname.startsWith(`${href}/`))
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ${
                  active
                    ? 'bg-[var(--color-primary)] text-white shadow-lg shadow-orange-200'
                    : 'text-[var(--color-on-surface-variant)] hover:bg-orange-50 hover:text-[var(--color-primary)]'
                }`}
              >
                <Icon size={19} />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto rounded-2xl bg-[var(--color-surface-container)] p-4">
          <p className="truncate text-sm font-bold">{name}</p>
          <p className="mt-0.5 text-xs text-[var(--color-on-surface-variant)]">{role}</p>
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => logoutAction())}
            className="mt-3 flex items-center gap-2 text-xs font-bold text-red-600 disabled:opacity-50"
          >
            <LogOut size={15} />
            {pending ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-[var(--color-surface-variant)] bg-white/90 px-4 backdrop-blur md:px-8">
          <div className="flex items-center gap-3 md:hidden">
            <span className="relative h-9 w-9">
              <Image src="/logo.png" alt="Shaurya" fill className="object-contain" />
            </span>
            <div>
              <p className="text-sm font-black">SHAURYA</p>
              <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-primary)]">{role}</p>
            </div>
          </div>
          <div className="hidden md:block">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-on-surface-variant)]">
              Shaurya QR & Food Operations
            </p>
          </div>
          <div className="text-right">
            <p className="max-w-40 truncate text-sm font-bold">{name}</p>
            <p className="text-[10px] text-green-600">● Signed in</p>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 pb-24 md:px-8 md:py-8">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 grid border-t border-[var(--color-surface-variant)] bg-white/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
        style={{ gridTemplateColumns: `repeat(${nav.length}, minmax(0, 1fr))` }}>
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/admin' && pathname.startsWith(`${href}/`))
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-h-16 flex-col items-center justify-center gap-1 text-[10px] font-bold ${
                active ? 'text-[var(--color-primary)]' : 'text-[var(--color-on-surface-variant)]'
              }`}
            >
              <Icon size={21} />
              {label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

export function SectionHeading({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-black tracking-tight md:text-3xl">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--color-on-surface-variant)]">{description}</p>
      </div>
      {action}
    </div>
  )
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-dashed border-[var(--color-outline-variant)] bg-white p-10 text-center text-sm text-[var(--color-on-surface-variant)]">
      {children}
    </div>
  )
}
