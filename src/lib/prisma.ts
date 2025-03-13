import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ['error', 'warn'],
    errorFormat: 'pretty',
  }).$extends({
    query: {
      async $allOperations({ 
        operation, 
        model, 
        args, 
        query 
      }: { 
        operation: string; 
        model: string; 
        args: unknown; 
        query: (args: unknown) => Promise<unknown>; 
      }) {
        try {
          return await query(args);
        } catch (error: unknown) {
          console.error(`Prisma Error in ${model}.${operation}:`, error);
          throw error;
        }
      },
    },
  });
};

export const prisma = global.prisma || prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

// Handle potential initialization errors
prisma.$connect()
  .then(() => {
    console.log('Successfully connected to the database');
  })
  .catch((error: unknown) => {
    console.error('Failed to connect to the database:', error);
  }); 