import { PrismaClient } from "@prisma/client";

const createPrismaClient = () => {
    return new PrismaClient();
};

// Ensure globalThis has a correctly typed Prisma instance
type GlobalPrisma = {
    prisma?: PrismaClient;
};

// Cast globalThis to include a Prisma instance
const globalForPrisma = globalThis as unknown as GlobalPrisma;

// Use existing Prisma instance if available, otherwise create a new one
const prisma = globalForPrisma.prisma ?? createPrismaClient();

export default prisma;

// In development, store the Prisma instance in globalThis to prevent multiple instances
if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}
