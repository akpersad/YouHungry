#!/usr/bin/env node

/**
 * Migration Script: Local JSON Files to MongoDB
 *
 * This script migrates existing performance metrics from local JSON files
 * to MongoDB for centralized storage and querying.
 *
 * Usage:
 *   node migrate-to-mongodb.js
 */

const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const config = {
  metricsDir: './performance-metrics/daily-metrics',
  mongoUri: process.env.MONGODB_URI,
  mongoDatabase: process.env.MONGODB_DATABASE,
};

// Connect to MongoDB
async function connectToMongoDB() {
  if (!config.mongoUri || !config.mongoDatabase) {
    throw new Error(
      'MongoDB URI or database name not configured. Check your .env file.'
    );
  }

  const client = new MongoClient(config.mongoUri);
  await client.connect();
  const db = client.db(config.mongoDatabase);
  return { client, db };
}

// Get all metrics files
function getMetricsFiles() {
  if (!fs.existsSync(config.metricsDir)) {
    console.warn(`⚠️ Metrics directory not found: ${config.metricsDir}`);
    return [];
  }

  const files = fs.readdirSync(config.metricsDir);
  return files
    .filter((file) => file.startsWith('metrics-') && file.endsWith('.json'))
    .map((file) => ({
      filename: file,
      filepath: path.join(config.metricsDir, file),
      date: file.match(/metrics-(\d{4}-\d{2}-\d{2})\.json/)?.[1],
    }))
    .filter((item) => item.date);
}

// Read metrics from file
function readMetricsFile(filepath) {
  try {
    const content = fs.readFileSync(filepath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`❌ Error reading ${filepath}:`, error.message);
    return null;
  }
}

// Migrate metrics to MongoDB
async function migrateMetrics() {
  console.log('🚀 Starting migration from local files to MongoDB...\n');

  const { client, db } = await connectToMongoDB();
  const collection = db.collection('performanceMetrics');

  const files = getMetricsFiles();

  if (files.length === 0) {
    console.log('⚠️ No metrics files found to migrate.');
    await client.close();
    return;
  }

  console.log(`📊 Found ${files.length} metrics files to migrate:\n`);

  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  for (const file of files) {
    try {
      console.log(`  Processing: ${file.filename} (date: ${file.date})`);

      const metrics = readMetricsFile(file.filepath);
      if (!metrics) {
        console.log(`    ⚠️ Skipped (could not read file)`);
        skippedCount++;
        continue;
      }

      // Check if metrics already exist in MongoDB
      const existing = await collection.findOne({ date: file.date });
      if (existing) {
        console.log(`    ℹ️ Skipped (already exists in MongoDB)`);
        skippedCount++;
        continue;
      }

      // Prepare document
      const document = {
        date: file.date,
        ...metrics,
        migratedAt: new Date(),
      };

      // Insert into MongoDB
      await collection.updateOne(
        { date: file.date },
        { $set: document },
        { upsert: true }
      );

      console.log(`    ✅ Migrated successfully`);
      successCount++;
    } catch (error) {
      console.error(`    ❌ Error:`, error.message);
      errorCount++;
    }
  }

  // Create index on date field for efficient queries
  await collection.createIndex({ date: -1 });
  console.log('\n📑 Created index on date field');

  await client.close();

  console.log('\n✅ Migration completed!');
  console.log(`\n📈 Summary:`);
  console.log(`  - Total files: ${files.length}`);
  console.log(`  - Successfully migrated: ${successCount}`);
  console.log(`  - Skipped: ${skippedCount}`);
  console.log(`  - Errors: ${errorCount}`);

  if (successCount > 0) {
    console.log(
      '\n💡 Tip: You can now delete the local JSON files since they are in MongoDB.'
    );
    console.log(
      '   Run: rm -rf performance-metrics/daily-metrics performance-metrics/comparisons'
    );
  }
}

// Main execution
if (require.main === module) {
  migrateMetrics()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { migrateMetrics };
