import "dotenv/config";
import { defineConfig } from "prisma/config";

// The CLI (migrate, studio, seed) uses a direct, non-pooled connection when one is provided.
// The running app connects through the pooled DATABASE_URL (see src/lib/db.ts).
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DIRECT_URL || process.env.DATABASE_URL,
  },
});
