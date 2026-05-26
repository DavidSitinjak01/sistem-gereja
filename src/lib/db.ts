import { PrismaClient } from '@prisma/client'
import { getEffectiveDatabaseUrl } from './db-setup'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Use the effective database URL (auto-converts Supabase direct to pooler for Vercel)
const effectiveUrl = getEffectiveDatabaseUrl()

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: effectiveUrl,
      },
    },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

export { ensureDbSetup, getEffectiveDatabaseUrl } from './db-setup'
