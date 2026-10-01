import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { PrismaClient } from '@prisma/client'

const source = process.argv[2]
if (!source) {
  console.error('Usage: npm run import:qrs -- /absolute/path/to/qr_codes.json')
  process.exit(1)
}

const prisma = new PrismaClient()
const payload = JSON.parse(await readFile(resolve(source), 'utf8'))
if (!Array.isArray(payload)) throw new Error('QR source must be a JSON array')

const rows = payload
  .map((item) => String(item.unique_token ?? item.uid ?? '').trim().toUpperCase())
  .filter(Boolean)
  .map((uid) => ({ uid, status: 'AVAILABLE' }))

const result = await prisma.qrCard.createMany({ data: rows, skipDuplicates: true })
console.log(`Imported ${result.count} of ${rows.length} QR tokens`)
await prisma.$disconnect()
