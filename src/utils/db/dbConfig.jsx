import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
const sql = neon(
  process.env.DATABASE_URL || "postgresql://neondb_owner:npg_cmwG6qjPUhI8@ep-falling-mode-adf1fvu9-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
);
export const db = drizzle(sql, { schema });
