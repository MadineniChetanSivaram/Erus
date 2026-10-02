process.env.NODE_ENV = process.env.NODE_ENV || 'production';
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('[Startup] Checking database configuration...');

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URL || process.env.MONGODB_URL;
if (mongoUri) {
  const masked = mongoUri.includes('@') ? mongoUri.replace(/:([^:@]+)@/, ':****@') : mongoUri;
  console.log('[Startup] MongoDB connection string detected:', masked);
} else if (process.env.DATABASE_URL) {
  console.log('[Startup] DATABASE_URL detected. Synchronizing Prisma schema with PostgreSQL...');
  try {
    execSync('npx prisma db push --skip-generate --accept-data-loss', { stdio: 'inherit', timeout: 15000 });
    console.log('[Startup] Database schema synchronized successfully.');
  } catch (err) {
    console.warn('[Startup] Prisma db push warning (server will continue):', err.message);
  }
} else {
  console.log('[Startup] Connecting to default local MongoDB (localhost:27017)...');
}

const serverBundlePath = path.join(__dirname, '..', 'dist', 'server.cjs');
if (!fs.existsSync(serverBundlePath)) {
  console.log('[Startup] dist/server.cjs not found. Running build step...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
  } catch (buildErr) {
    console.error('[Startup] Build error:', buildErr.message);
  }
}

console.log('[Startup] Launching ERUS server...');
require(serverBundlePath);
