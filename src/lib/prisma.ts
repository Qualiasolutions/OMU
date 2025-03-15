import { PrismaClient } from '@prisma/client';

// Better error handling with retry logic for database connection
const prismaClientSingleton = () => {
  try {
    return new PrismaClient({
      log: ['error', 'warn'],
      errorFormat: 'pretty',
    });
  } catch (error) {
    console.error('Failed to initialize Prisma client:', error);
    throw error;
  }
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

let prisma: ReturnType<typeof prismaClientSingleton>;

try {
  prisma = globalThis.prisma ?? prismaClientSingleton();

  if (process.env.NODE_ENV !== 'production') {
    globalThis.prisma = prisma;
  }
} catch (error) {
  console.error('Error in prisma initialization:', error);
  throw error;
}

// Handle connection with retries
const connectWithRetry = async (retries = 5, delay = 2000) => {
  let currentTry = 0;
  
  while (currentTry < retries) {
    try {
      await prisma.$connect();
      console.log('Successfully connected to the database');
      return;
    } catch (error) {
      currentTry++;
      console.error(`Database connection attempt ${currentTry} failed:`, error);
      if (currentTry >= retries) {
        console.error('All database connection attempts failed');
        throw error;
      }
      console.log(`Retrying in ${delay / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Connect with retries
connectWithRetry().catch(error => {
  console.error('Fatal database connection error:', error);
});

export { prisma }; 