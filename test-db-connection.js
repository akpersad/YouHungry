import { MongoClient, ObjectId } from 'mongodb';

async function testDatabaseConnection() {
  console.log('🔍 Testing MongoDB connection...');

  // Check if environment variables are set
  const mongoUri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DATABASE;

  console.log('Environment variables:');
  console.log('- MONGODB_URI:', mongoUri ? '✅ Set' : '❌ Missing');
  console.log('- MONGODB_DATABASE:', dbName ? '✅ Set' : '❌ Missing');

  if (!mongoUri || !dbName) {
    console.log('\n❌ Missing required environment variables!');
    console.log('Please create a .env.local file with:');
    console.log(
      'MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/'
    );
    console.log('MONGODB_DATABASE=you-hungry');
    return;
  }

  let client;
  try {
    // Connect to MongoDB
    client = new MongoClient(mongoUri);
    await client.connect();
    console.log('\n✅ Successfully connected to MongoDB!');

    const db = client.db(dbName);

    // Test collection creation
    console.log('\n🧪 Testing collection creation...');

    const testCollection = {
      name: 'Test Collection',
      description: 'This is a test collection created by the test script',
      type: 'personal',
      ownerId: new ObjectId(), // Generate a dummy ObjectId
      restaurantIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('collections').insertOne(testCollection);
    console.log('✅ Test collection created with ID:', result.insertedId);

    // Verify the collection was created
    const createdCollection = await db
      .collection('collections')
      .findOne({ _id: result.insertedId });
    console.log('✅ Collection retrieved:', {
      id: createdCollection._id,
      name: createdCollection.name,
      type: createdCollection.type,
    });

    // Clean up - delete the test collection
    await db.collection('collections').deleteOne({ _id: result.insertedId });
    console.log('✅ Test collection cleaned up');

    // List all collections to see what's in the database
    console.log('\n📋 Current collections in database:');
    const allCollections = await db
      .collection('collections')
      .find({})
      .toArray();
    console.log(`Found ${allCollections.length} collections:`);
    allCollections.forEach((collection, index) => {
      console.log(
        `${index + 1}. ${collection.name} (${collection.type}) - ID: ${collection._id}`
      );
    });
  } catch (error) {
    console.error('\n❌ Database connection failed:', error.message);
    if (error.message.includes('authentication')) {
      console.log(
        '💡 Check your MongoDB credentials and make sure the user has proper permissions'
      );
    } else if (
      error.message.includes('ENOTFOUND') ||
      error.message.includes('ETIMEDOUT')
    ) {
      console.log(
        '💡 Check your MongoDB connection string and network connectivity'
      );
    }
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Load environment variables from .env.local if it exists
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  const envPath = path.join(__dirname, '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach((line) => {
      const [key, value] = line.split('=');
      if (key && value) {
        process.env[key.trim()] = value.trim();
      }
    });
    console.log('✅ Loaded environment variables from .env.local');
  } else {
    console.log(
      '⚠️  No .env.local file found, using system environment variables'
    );
  }
} catch {
  console.log(
    '⚠️  Could not load .env.local, using system environment variables'
  );
}

testDatabaseConnection().catch(console.error);
