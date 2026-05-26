import { PrismaClient } from '@prisma/client'
import { ensureDbSetup } from './db-setup'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const baseClient = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = baseClient

// Track whether setup has been attempted and succeeded within this function instance
let dbReady = false

// Extend the Prisma client to automatically ensure database setup before each query.
// After the first successful setup, the flag prevents redundant checks.
// This makes all API routes resilient to missing database tables automatically.
export const db = baseClient.$extends({
  query: {
    async $allOperations({ args, query }) {
      if (!dbReady) {
        const success = await ensureDbSetup()
        if (success) {
          dbReady = true
        }
        // If setup failed, we still try the query — it might succeed if tables
        // already exist from a previous setup, or it will fail with a clear
        // error that the route handler can catch.
      }
      return query(args)
    },
  },
})

// Re-export ensureDbSetup for routes that want explicit control
export { ensureDbSetup } from './db-setup'
