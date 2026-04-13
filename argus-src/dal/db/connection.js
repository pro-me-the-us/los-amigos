const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'argus_db';

let client = null;
let db = null;

async function connect() {
  if (db) return db;

  client = new MongoClient(MONGO_URI);
  await client.connect();
  db = client.db(DB_NAME);
  console.log(`[MongoDB] Connected to database: ${DB_NAME}`);
  return db;
}

async function getDb() {
  if (!db) await connect();
  return db;
}

async function disconnect() {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('[MongoDB] Disconnected');
  }
}

module.exports = { connect, getDb, disconnect };
