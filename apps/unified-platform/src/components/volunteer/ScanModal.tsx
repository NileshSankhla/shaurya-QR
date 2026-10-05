'use client'

import { useState } from 'react'
import { ScanLine, X } from 'lucide-react'
import { VerificationConsole } from './VerificationConsole'

export function ScanModal({
  hasActiveSlot,
  initialScannedByMe,
  initialVerifiedByMe,
}: {
  hasActiveSlot: boolean
  initialScannedByMe: number
  initialVerifiedByMe: number
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="group rounded-3xl border border-orange-100 bg-gradient-to-br from-orange-50 to-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md text-left w-full h-full"
      >
        <ScanLine className="mb-5 text-[var(--color-primary)]" size={30} />
        <h2 className="text-xl font-black text-[var(--color-on-surface)]">Food verification</h2>
        <p className="mt-2 text-sm text-[var(--color-on-surface-variant)]">
          Scan an assigned participant QR against the currently active meal slot.
        </p>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-6">
          {/* Animated glow background */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(circle_at_center,var(--color-primary)_0%,transparent_50%)] animate-pulse" />
          
          {/* Modal Container */}
          <div className="relative w-full max-w-lg rounded-[2rem] bg-white p-6 shadow-2xl ring-1 ring-black/5 animate-in fade-in zoom-in duration-300">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-black text-[var(--color-on-surface)]">
                Live Verification
              </h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] transition-colors hover:bg-[var(--color-surface-variant)] hover:text-red-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="max-h-[75vh] overflow-y-auto no-scrollbar pb-2">
              <VerificationConsole 
                hasActiveSlot={hasActiveSlot}
                initialScannedByMe={initialScannedByMe}
                initialVerifiedByMe={initialVerifiedByMe}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
