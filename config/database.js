const { MongoClient } = require('mongodb');

let client;
let db;

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI não foi definido no .env');
    process.exit(1);
  }

  client = new MongoClient(uri);
  await client.connect();
  db = client.db();

  console.log('MongoDB conectado (driver nativo). Database:', db.databaseName);

  process.on('SIGINT', async () => {
    await client.close();
    console.log('Conexão Mongo encerrada (SIGINT).');
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await client.close();
    console.log('Conexão Mongo encerrada (SIGTERM).');
    process.exit(0);
  });

  return db;
}

function getDB() {
  if (!db) throw new Error('DB não inicializado. Chame connectDB() antes.');
  return db;
}

module.exports = { connectDB, getDB };