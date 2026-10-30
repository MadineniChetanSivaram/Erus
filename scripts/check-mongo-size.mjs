import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch {}
dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb+srv://chetan9515997994_db_user:V4FDmx5nEstcl5vV@cluster0.5iwwhis.mongodb.net/erus?retryWrites=true&w=majority&appName=Cluster0';

async function checkSizes() {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('Connected to MongoDB. Collections found:', collections.length);
    let totalDataMB = 0;
    let totalStorageMB = 0;
    for (const c of collections) {
      try {
        const stats = await db.command({ collStats: c.name });
        const sizeMB = stats.size / (1024 * 1024);
        const storageMB = stats.storageSize / (1024 * 1024);
        totalDataMB += sizeMB;
        totalStorageMB += storageMB;
        console.log(`${c.name.padEnd(25)}: count=${String(stats.count).padStart(6)}, data=${sizeMB.toFixed(2).padStart(8)} MB, storage=${storageMB.toFixed(2).padStart(8)} MB`);
      } catch (e) {
        console.log(`${c.name}: error getting stats: ${e.message}`);
      }
    }
    console.log('------------------------------------------------------------');
    console.log(`TOTAL DATA SIZE:    ${totalDataMB.toFixed(2)} MB`);
    console.log(`TOTAL STORAGE SIZE: ${totalStorageMB.toFixed(2)} MB`);
  } catch (err) {
    console.error('Connection error:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkSizes();
