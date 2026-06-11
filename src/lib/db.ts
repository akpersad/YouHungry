import { MongoClient, Db } from 'mongodb';

// Cache the client promise on globalThis so it survives Next.js HMR in dev
// and is shared across invocations within a warm serverless instance.
declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function getClientPromise(): Promise<MongoClient> {
  if (!globalThis._mongoClientPromise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    globalThis._mongoClientPromise = new MongoClient(uri)
      .connect()
      .catch((error) => {
        // Drop the cached promise so the next call can retry instead of
        // permanently rejecting for the lifetime of the instance.
        globalThis._mongoClientPromise = undefined;
        throw error;
      });
  }
  return globalThis._mongoClientPromise;
}

export async function connectToDatabase(): Promise<Db> {
  const client = await getClientPromise();
  return client.db(process.env.MONGODB_DATABASE);
}
