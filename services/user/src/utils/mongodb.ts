import { MongoClient, Collection, Document } from 'mongodb';

let client: MongoClient;

export async function connectToMongoDB(): Promise<MongoClient> {
  if (!client) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    client = new MongoClient(uri);
    await client.connect();
  }
  return client;
}

export async function getCollection<T extends Document>(collectionName: string): Promise<Collection<T>> {
  const client = await connectToMongoDB();
  const db = client.db();
  return db.collection<T>(collectionName);
}

export async function closeMongoDBConnection(): Promise<void> {
  if (client) {
    await client.close();
  }
} 