import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "./schema"

// Use pg Pool for persistent TCP connections
// This provides robust connection pooling that works reliably on Fly.io
// and supports long-lived connections needed for WebSocket handlers
const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  // Connection pool settings for reliability
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

export const db = drizzle({ client: pool, schema })
