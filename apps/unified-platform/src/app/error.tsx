"use client"

import { useEffect } from "react"
import { AlertCircle } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--color-surface)] px-4">
      <AlertCircle className="w-16 h-16 text-[var(--color-error)] mb-4" />
      <h2 className="text-2xl font-bold font-[family-name:var(--font-display)] text-[var(--color-on-surface)] mb-2">
        Something went wrong!
      </h2>
      <p className="text-sm text-[var(--color-on-surface-variant)] mb-6 text-center">
        {error.message || "An unexpected error occurred."}
      </p>
      <button
        onClick={() => reset()}
        className="px-6 py-2 bg-[var(--color-primary)] text-white rounded-full font-bold shadow-md active:scale-95 transition-transform"
      >
        Try again
      </button>
    </div>
  )
}
