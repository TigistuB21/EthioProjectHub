import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

let prisma: PrismaClient;

const getDbUrl = () => {
  // Return the file path protocol url
  const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
  return `file:${dbPath}`;
};

if (process.env.NODE_ENV === 'production') {
  const adapter = new PrismaBetterSqlite3({ url: getDbUrl() });
  prisma = new PrismaClient({ adapter });
} else {
  if (!globalForPrisma.prisma) {
    const adapter = new PrismaBetterSqlite3({ url: getDbUrl() });
    globalForPrisma.prisma = new PrismaClient({ adapter });
  }
  prisma = globalForPrisma.prisma;
}

export { prisma };
