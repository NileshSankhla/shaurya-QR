import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { PrismaClient } from '@prisma/client'

const source = process.argv[2]
if (!source) {
  console.error('Usage: npm run import:participants -- /absolute/path/to/participants.csv')
  process.exit(1)
}

function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    if (char === '"') {
      if (quoted && text[index + 1] === '"') {
        field += '"'
        index += 1
      } else {
        quoted = !quoted
      }
    } else if (char === ',' && !quoted) {
      row.push(field)
      field = ''
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[index + 1] === '\n') index += 1
      row.push(field)
      if (row.some((value) => value.trim())) rows.push(row)
      row = []
      field = ''
    } else {
      field += char
    }
  }
  if (field || row.length) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

const text = (await readFile(resolve(source), 'utf8')).replace(/^\uFEFF/, '')
const [headerRow, ...dataRows] = parseCsv(text)
const headers = headerRow.map((header) => header.trim().toLowerCase())
const indexOf = (...names) => headers.findIndex((header) => names.includes(header))
const nameIndex = indexOf('name', 'full name')
const collegeIndex = indexOf('college', 'college name')
const mobileIndex = indexOf('mobile', 'contact no', 'phone')
const emailIndex = indexOf('email', 'email address')
if (nameIndex < 0 || collegeIndex < 0 || mobileIndex < 0) {
  throw new Error('CSV must contain Name, College, and Mobile/Contact No columns')
}

const seen = new Set()
const guests = []
for (const row of dataRows) {
  const name = (row[nameIndex] ?? '').trim()
  const college = (row[collegeIndex] ?? '').trim()
  const mobile = (row[mobileIndex] ?? '').replace(/\D/g, '')
  if (!name || !college || !mobile || seen.has(mobile)) continue
  seen.add(mobile)
  const suppliedEmail = emailIndex >= 0 ? (row[emailIndex] ?? '').trim().toLowerCase() : ''
  guests.push({
    name,
    college,
    contactNo: mobile,
    email: suppliedEmail || `${mobile}@import.shaurya.invalid`,
    status: 'UNASSIGNED',
  })
}

const prisma = new PrismaClient()
const result = await prisma.guest.createMany({ data: guests, skipDuplicates: true })
console.log(`Imported ${result.count} of ${guests.length} participant rows`)
await prisma.$disconnect()
