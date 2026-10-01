import type { PlatformStore } from './contracts'
import { PrismaPlatformStore } from './prisma-store'

// The rest of the application imports this contract, never Supabase or Prisma
// directly. Add another adapter here when the persistence provider changes.
function createStore(): PlatformStore {
  const provider = process.env.DATA_PROVIDER ?? 'prisma'
  if (provider !== 'prisma') {
    throw new Error(`Unsupported DATA_PROVIDER: ${provider}`)
  }
  return new PrismaPlatformStore()
}

export const platformStore = createStore()
export type * from './contracts'
