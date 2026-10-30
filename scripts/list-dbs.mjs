import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch {}
dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb+srv://chetan9515997994_db_user:V4FDmx5nEstcl5vV@cluster0.5iwwhis.mongodb.net/erus?retryWrites=true&w=majority&appName=Cluster0';

async function listDbs() {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    const admin = mongoose.connection.db.admin();
    const dbs = await admin.listDatabases();
    console.log('Databases on cluster:', dbs);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

listDbs();
