const { PrismaClient } = require('@prisma/client');

// Database configuration
const dbConfig = {
  // Connection options
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgres://neondb_owner:npg_IjeyM4vED3aX@ep-purple-glade-adfy1okc-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require'
    }
  },
  
  // Logging configuration
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error'] 
    : ['error'],
  
  // Connection pool settings
  connectionLimit: parseInt(process.env.DB_MAX_CONNECTIONS) || 10,
  connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 60000,
  
  // Transaction settings
  transactionOptions: {
    maxWait: 5000, // Maximum time to wait for a transaction
    timeout: 10000, // Maximum time a transaction can run
    isolationLevel: 'ReadCommitted'
  }
};

// Create Prisma client instance
const prisma = new PrismaClient(dbConfig);

// Connection management
const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await prisma.$disconnect();
    console.log('✅ Database disconnected successfully');
  } catch (error) {
    console.error('❌ Database disconnection failed:', error);
  }
};

// Health check
const checkDBHealth = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error) {
    return { 
      status: 'unhealthy', 
      error: error.message, 
      timestamp: new Date().toISOString() 
    };
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔄 Shutting down gracefully...');
  await disconnectDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🔄 Shutting down gracefully...');
  await disconnectDB();
  process.exit(0);
});

module.exports = {
  prisma,
  connectDB,
  disconnectDB,
  checkDBHealth,
  dbConfig
};
