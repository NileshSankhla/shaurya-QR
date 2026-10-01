'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import QrScanner from 'qr-scanner'
import { Camera, CameraOff, Keyboard, Loader2 } from 'lucide-react'

function scannedToken(rawValue: string) {
  const raw = rawValue.trim()
  if (/^[A-Z0-9-]{6,80}$/i.test(raw)) return raw.toUpperCase()

  try {
    const url = new URL(raw)
    const candidates = [
      url.searchParams.get('token'),
      url.searchParams.get('qr'),
      url.searchParams.get('uid'),
      url.searchParams.get('code'),
      ...url.pathname.split('/').reverse(),
    ]
    const token = candidates.find((value) => value && /^[A-Z0-9-]{6,80}$/i.test(value))
    if (token) return token.toUpperCase()
  } catch {
    // The QR contains a plain value rather than a URL.
  }

  return null
}

export function QrCapture({
  value,
  onChange,
  disabled = false,
}: {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}) {
  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [starting, setStarting] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const scannerRef = useRef<QrScanner | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    if (!cameraOpen || !videoRef.current || disabled) return
    setStarting(true)
    setCameraError('')
    const scanner = new QrScanner(
      videoRef.current,
      (result) => {
        const token = scannedToken(result.data)
        if (!token) {
          setCameraError('This QR does not contain a recognized Shaurya token.')
          return
        }
        onChangeRef.current(token)
        setCameraOpen(false)
      },
      {
        preferredCamera: 'environment',
        maxScansPerSecond: 10,
        highlightScanRegion: true,
        highlightCodeOutline: true,
        returnDetailedScanResult: true,
      },
    )
    scannerRef.current = scanner
    scanner.start()
      .catch(() => {
        setCameraError('Camera access failed. Check permission or enter the token manually.')
        setCameraOpen(false)
      })
      .finally(() => setStarting(false))
    return () => {
      scanner.stop()
      scanner.destroy()
      scannerRef.current = null
    }
  }, [cameraOpen, disabled])

  function manualSubmit(event: FormEvent) {
    event.preventDefault()
  }

  async function openCamera() {
    setCameraError('')
    if (!window.isSecureContext) {
      setCameraError('Camera scanning requires HTTPS, or localhost during local testing.')
      return
    }
    setStarting(true)
    try {
      if (!(await QrScanner.hasCamera())) {
        setCameraError('No camera was found on this device.')
        return
      }
      setCameraOpen(true)
    } catch {
      setCameraError('Camera access failed. Allow camera permission in the browser and retry.')
    } finally {
      setStarting(false)
    }
  }

  return (
    <div className="space-y-3">
      {cameraOpen ? (
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-black">
          <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />
          {starting && <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white"><Loader2 className="animate-spin" /></div>}
          <button type="button" onClick={() => setCameraOpen(false)} className="absolute right-3 top-3 rounded-full bg-black/60 p-2 text-white"><CameraOff size={18} /></button>
        </div>
      ) : (
        <button type="button" disabled={disabled || starting} onClick={openCamera} className="portal-secondary w-full justify-center py-3">
          {starting ? <Loader2 className="animate-spin" size={18} /> : <Camera size={18} />}
          {starting ? 'Checking camera…' : 'Open camera scanner'}
        </button>
      )}
      <form onSubmit={manualSubmit} className="relative">
        <Keyboard className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-variant)]" size={18} />
        <input
          className="portal-input pl-11 font-mono uppercase"
          disabled={disabled}
          placeholder="Or enter QR token manually"
          value={value}
          onChange={(event) => onChange(event.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
        />
      </form>
      {cameraError && <p className="text-xs font-bold text-red-700">{cameraError}</p>}
    </div>
  )
}
