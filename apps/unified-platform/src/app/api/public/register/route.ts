import { NextRequest, NextResponse } from 'next/server'
import { publicError, validateGuestInput } from '@/lib/validation'
import { platformStore, type GuestInput } from '@/server/data'

function allowedOrigin(request: NextRequest) {
  const origin = request.headers.get('origin')
  if (!origin) return null
  const configured = (process.env.REGISTRATION_ORIGINS ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  if (configured.includes(origin)) return origin
  if (process.env.NODE_ENV !== 'production' && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
    return origin
  }
  return null
}

function headers(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': origin ?? 'null',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

export async function OPTIONS(request: NextRequest) {
  const origin = allowedOrigin(request)
  if (!origin) return new NextResponse(null, { status: 403 })
  return new NextResponse(null, { status: 204, headers: headers(origin) })
}

export async function POST(request: NextRequest) {
  const requestOrigin = request.headers.get('origin')
  const origin = requestOrigin ? allowedOrigin(request) : null
  if (requestOrigin && !origin) {
    return NextResponse.json({ error: 'Registration origin is not allowed' }, { status: 403 })
  }

  try {
    const body = (await request.json()) as GuestInput
    const guest = await platformStore.registerGuest(validateGuestInput(body))
    return NextResponse.json(
      { id: guest.id, message: 'Registration successful' },
      { status: 201, headers: headers(origin) },
    )
  } catch (error) {
    const message = publicError(error)
    const duplicate = message.includes('already registered')
    return NextResponse.json(
      { error: message },
      { status: duplicate ? 409 : 400, headers: headers(origin) },
    )
  }
}

export async function GET() {
  return NextResponse.json({ service: 'shaurya-registration', status: 'ready' })
}
