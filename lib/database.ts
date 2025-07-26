```ts file="lib/server/database.ts"
[v0-no-op-code-block-prefix]// lib/database.ts

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
prisma: PrismaClient | undefined;
};

export const prisma =
globalForPrisma.prisma ??
new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
