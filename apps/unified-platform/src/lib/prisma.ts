import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient; prismaUrl?: string }
const DEFAULT_CONNECTION_LIMIT = 5

function configuredConnectionLimit() {
  const value = Number(process.env.DATABASE_CONNECTION_LIMIT)
  return Number.isSafeInteger(value) && value > 0 ? value : DEFAULT_CONNECTION_LIMIT
}

function runtimeDatabaseUrl() {
  // Runtime traffic always uses the transaction pooler. DIRECT_URL is reserved
  // for migrations so local hot reloads cannot exhaust the session connection cap.
  const configured = process.env.DATABASE_URL
  if (!configured) return undefined

  try {
    const url = new URL(configured)
    if (url.searchParams.get('pgbouncer') === 'true') {
      if (!url.searchParams.has('connection_limit')) {
        url.searchParams.set('connection_limit', String(configuredConnectionLimit()))
      }
      if (!url.searchParams.has('connect_timeout')) url.searchParams.set('connect_timeout', '15')
      if (!url.searchParams.has('pool_timeout')) url.searchParams.set('pool_timeout', '30')
    }
    return url.toString()
  } catch {
    return configured
  }
}

const databaseUrl = runtimeDatabaseUrl()
if (globalForPrisma.prisma && globalForPrisma.prismaUrl !== databaseUrl) {
  void globalForPrisma.prisma.$disconnect()
  globalForPrisma.prisma = undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient(
  {
    ...(databaseUrl ? { datasources: { db: { url: databaseUrl } } } : {}),
    transactionOptions: { maxWait: 15_000, timeout: 20_000 },
  },
)

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
  globalForPrisma.prismaUrl = databaseUrl
}
