import { MongoClient, Db } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI!);
let db: Db | undefined;

export async function connectToDatabase() {
  if (!db) {
    await client.connect();
    db = client.db(process.env.MONGODB_DATABASE);
  }
  return db;
}

// Initialize the database connection
connectToDatabase()
  .then((database) => {
    db = database;
  })
  .catch(console.error);

export { db };
