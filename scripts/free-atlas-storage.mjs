import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch {}
dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb+srv://chetan9515997994_db_user:V4FDmx5nEstcl5vV@cluster0.5iwwhis.mongodb.net/erus?retryWrites=true&w=majority&appName=Cluster0';

async function freeStorage() {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    const admin = mongoose.connection.db.admin();

    // 1. Drop sample_mflix if present (MongoDB sample dataset)
    const dbs = await admin.listDatabases();
    const hasSampleMflix = dbs.databases.some((d) => d.name === 'sample_mflix');
    if (hasSampleMflix) {
      console.log('[Cleanup] Dropping sample_mflix sample database (156 MB)...');
      const sampleDb = mongoose.connection.client.db('sample_mflix');
      await sampleDb.dropDatabase();
      console.log('[Cleanup] Successfully dropped sample_mflix!');
    } else {
      console.log('[Cleanup] sample_mflix not found.');
    }

    // 2. Clear old GridFS video recordings from erus database
    const erusDb = mongoose.connection.client.db('erus');
    const collections = await erusDb.listCollections().toArray();
    const hasChunks = collections.some((c) => c.name === 'gd_recordings.chunks');
    const hasFiles = collections.some((c) => c.name === 'gd_recordings.files');

    if (hasChunks) {
      console.log('[Cleanup] Dropping gd_recordings.chunks collection (212 MB of old test recordings)...');
      await erusDb.collection('gd_recordings.chunks').drop();
      console.log('[Cleanup] Successfully dropped gd_recordings.chunks!');
    }
    if (hasFiles) {
      console.log('[Cleanup] Dropping gd_recordings.files collection...');
      await erusDb.collection('gd_recordings.files').drop();
      console.log('[Cleanup] Successfully dropped gd_recordings.files!');
    }

    const updatedDbs = await admin.listDatabases();
    console.log('[Cleanup] Updated Cluster Databases:', updatedDbs.databases);
    console.log(`[Cleanup] Total cluster size is now: ${updatedDbs.totalSizeMb} MB (limit is 512 MB). Writes UNBLOCKED!`);
  } catch (err) {
    console.error('[Cleanup Error]:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

// Only execute if explicitly called with --run
if (process.argv.includes('--run')) {
  freeStorage();
} else {
  console.log('Dry run: To execute cleanup, run with --run flag.');
}
