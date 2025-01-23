import { PrismaClient } from "@prisma/client";


//singleton function

const prismaClientSingleton = () => {  // This function creates a new instance of PrismaClient.
    return new PrismaClient();
};

// Defines a type for the Prisma Client singleton.
type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

//Ensures that the globalThis object has a prisma property of the correct type.
const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClientSingleton | undefined;
};

// Initializes the Prisma Client, reusing the existing instance if available.
const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

export default prisma;

//Set Global Instance in Development:
// In non-production environments, sets the global prisma variable to the current instance to prevent multiple instances.
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
