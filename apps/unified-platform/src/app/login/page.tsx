'use client'

import { FormEvent, useState, useTransition } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { AlertCircle, Eye, EyeOff, Loader2, Lock, User } from 'lucide-react'
import { loginAction } from '@/app/actions'

export default function LoginPage() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [visible, setVisible] = useState(false)
  const [error, setError] = useState('')

  function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    startTransition(async () => {
      const result = await loginAction(username, password)
      if (!result.ok) return setError(result.error)
      router.replace(result.data.destination)
      router.refresh()
    })
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--color-surface)] px-5 py-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-orange-200/40 blur-3xl" />
        <div className="absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-purple-200/40 blur-3xl" />
      </div>
      <div className="relative w-full max-w-md rounded-[36px] border border-white bg-white/90 p-7 shadow-2xl shadow-orange-100 backdrop-blur md:p-9">
        <div className="mb-8 text-center">
          <span className="relative mx-auto mb-4 block h-20 w-20 rounded-3xl bg-orange-50">
            <Image src="/logo.png" alt="Shaurya" fill className="object-contain p-2" />
          </span>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-black">SHAURYA OPERATIONS</h1>
          <p className="mt-1 text-sm text-[var(--color-on-surface-variant)]">Admin and volunteer secure login</p>
        </div>
        {error && <div className="mb-4 flex gap-2 rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700"><AlertCircle className="shrink-0" size={18} />{error}</div>}
        <form onSubmit={submit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-variant)]" size={19} />
            <input className="portal-input h-14 pl-12" autoComplete="username" autoCapitalize="none" placeholder="Username" value={username} onChange={(event) => setUsername(event.target.value)} />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-variant)]" size={19} />
            <input className="portal-input h-14 px-12" autoComplete="current-password" type={visible ? 'text' : 'password'} placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} />
            <button type="button" aria-label={visible ? 'Hide password' : 'Show password'} onClick={() => setVisible(!visible)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-variant)]">{visible ? <EyeOff size={19} /> : <Eye size={19} />}</button>
          </div>
          <button disabled={pending || !username || !password} className="portal-primary h-14 w-full text-base">
            {pending ? <><Loader2 className="animate-spin" size={19} /> Signing in…</> : 'Sign in'}
          </button>
        </form>
        <p className="mt-6 text-center text-xs text-[var(--color-on-surface-variant)]">Access is created and controlled by a master administrator.</p>
      </div>
    </main>
  )
}
