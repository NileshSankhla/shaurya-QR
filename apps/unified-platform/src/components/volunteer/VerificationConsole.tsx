'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, ShieldAlert, XCircle } from 'lucide-react'
import { verifyScanAction } from '@/app/actions'
import { QrCapture } from './QrCapture'

type VerificationResult = {
  guestName?: string
  college?: string
  slotTitle?: string
}

export function VerificationConsole({
  hasActiveSlot,
  initialScannedByMe,
  initialVerifiedByMe,
}: {
  hasActiveSlot: boolean
  initialScannedByMe: number
  initialVerifiedByMe: number
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [token, setToken] = useState('')
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [error, setError] = useState('')
  const [scannedByMe, setScannedByMe] = useState(initialScannedByMe)
  const [verifiedByMe, setVerifiedByMe] = useState(initialVerifiedByMe)

  useEffect(() => {
    setScannedByMe(initialScannedByMe)
    setVerifiedByMe(initialVerifiedByMe)
  }, [initialScannedByMe, initialVerifiedByMe])

  function verify() {
    setError('')
    setResult(null)
    startTransition(async () => {
      const response = await verifyScanAction(token)
      if (response.attemptRecorded) {
        setScannedByMe((count) => count + 1)
        if (response.ok) setVerifiedByMe((count) => count + 1)
        router.refresh()
      }
      if (!response.ok) {
        setError(response.error)
        return
      }
      setResult(response.data)
      setToken('')
    })
  }

  return (
    <>
      <div className="mb-6 grid grid-cols-2 gap-3 text-center" aria-live="polite">
        <div className="rounded-2xl bg-white p-3"><p className="text-xl font-black">{scannedByMe}</p><p className="text-[10px] font-bold uppercase text-[var(--color-on-surface-variant)]">My attempts</p></div>
        <div className="rounded-2xl bg-white p-3"><p className="text-xl font-black text-green-700">{verifiedByMe}</p><p className="text-[10px] font-bold uppercase text-[var(--color-on-surface-variant)]">My verified</p></div>
      </div>
      <div className="mx-auto max-w-xl">
        {!hasActiveSlot && (
          <div className="mb-4 flex items-start gap-3 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
            <ShieldAlert className="shrink-0" />
            <div><p className="font-black">Verification is paused</p><p className="mt-1 text-sm">An administrator must start a food slot before meals can be approved.</p></div>
          </div>
        )}
        <div className="rounded-3xl border border-[var(--color-surface-variant)] bg-white p-5 shadow-sm">
          <QrCapture
            value={token}
            onChange={(value) => {
              setToken(value)
              setError('')
              setResult(null)
            }}
            disabled={pending}
          />
          <button type="button" onClick={verify} disabled={pending || !token || !hasActiveSlot} className="portal-primary mt-4 w-full py-4">
            {pending ? 'Verifying…' : 'Verify and issue food'}
          </button>
        </div>

        {result && (
          <div className="mt-5 rounded-3xl border border-green-200 bg-green-50 p-6 text-center text-green-900">
            <CheckCircle2 className="mx-auto mb-3" size={50} />
            <p className="text-2xl font-black">FOOD VERIFIED</p>
            <p className="mt-4 text-lg font-bold">{result.guestName}</p>
            <p className="text-sm">{result.college}</p>
            <p className="mt-2 text-xs font-black uppercase tracking-widest">{result.slotTitle}</p>
          </div>
        )}

        {error && (
          <div className="mt-5 rounded-3xl border border-red-200 bg-red-50 p-6 text-center text-red-900">
            <XCircle className="mx-auto mb-3" size={50} />
            <p className="text-xl font-black">VERIFICATION REJECTED</p>
            <p className="mt-2 text-sm font-bold">{error}</p>
          </div>
        )}
      </div>
    </>
  )
}
