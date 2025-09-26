import { MongoClient, Db } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI!);
let db: Db;

export async function connectToDatabase() {
  if (!db) {
    await client.connect();
    db = client.db(process.env.MONGODB_DATABASE);
  }
  return db;
}

export { db };
