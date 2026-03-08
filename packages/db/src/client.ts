import { drizzle } from "drizzle-orm/neon-serverless"
import { Pool } from "@neondatabase/serverless"
import * as schema from "./schema"

// Use Pool for persistent connections (WebSocket support)
// This enables long-lived connections needed for WebSocket handlers
const pool = new Pool({ connectionString: process.env.DATABASE_URL! })

export const db = drizzle({ client: pool, schema })
