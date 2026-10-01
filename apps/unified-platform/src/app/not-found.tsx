import Link from "next/link"
import { SearchX } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--color-surface)] px-4">
      <SearchX className="w-16 h-16 text-[var(--color-primary)] mb-4" />
      <h2 className="text-2xl font-bold font-[family-name:var(--font-display)] text-[var(--color-on-surface)] mb-2">
        Page Not Found
      </h2>
      <p className="text-sm text-[var(--color-on-surface-variant)] mb-6 text-center">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        className="px-6 py-2 bg-[var(--color-primary)] text-white rounded-full font-bold shadow-md active:scale-95 transition-transform"
      >
        Return Home
      </Link>
    </div>
  )
}
