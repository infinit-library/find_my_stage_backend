const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function setupPrisma() {
  try {
    console.log('🔄 Setting up Prisma...');
    
    // Check if .env file exists
    const envPath = path.join(__dirname, '.env');
    if (!fs.existsSync(envPath)) {
      console.log('⚠️  .env file not found. Please create one with your database URL.');
      console.log('   Example: DATABASE_URL="postgresql://username:password@localhost:5432/findmystage_db"');
      return;
    }
    
    // Generate Prisma client
    console.log('🔄 Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Prisma client generated successfully');
    
    // Push database schema (for development)
    console.log('🔄 Pushing database schema...');
    execSync('npx prisma db push', { stdio: 'inherit' });
    console.log('✅ Database schema pushed successfully');
    
    // Seed database if seed file exists
    const seedPath = path.join(__dirname, 'prisma', 'seed.js');
    if (fs.existsSync(seedPath)) {
      console.log('🔄 Seeding database...');
      execSync('node prisma/seed.js', { stdio: 'inherit' });
      console.log('✅ Database seeded successfully');
    }
    
    console.log('✅ Prisma setup completed successfully');
    
  } catch (error) {
    console.error('❌ Prisma setup failed:', error.message);
    process.exit(1);
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupPrisma();
}

module.exports = setupPrisma;
