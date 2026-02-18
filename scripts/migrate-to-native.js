require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('❌ MONGODB_URI não definido no .env');
  process.exit(1);
}

(async () => {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    const oldProducts = db.collection('products');
    const categories = db.collection('categories');

    const cursor = oldProducts.find({});
    let updated = 0;
    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      const update = {};
      if (doc.image && !doc.imageUrl) update.imageUrl = doc.image;

      if (Array.isArray(doc.categories) && doc.categories.length > 0) {
        const primary = doc.categories[0];
        if (ObjectId.isValid(primary)) {
          update.category = new ObjectId(primary);
        }
      }

      if (!doc.rating || typeof doc.rating !== 'object') {
        update.rating = { total: 0, sum: 0, avg: 0 };
      } else {
        const total = Number(doc.rating.count || doc.rating.total || 0);
        const avg = Number(doc.rating.rate || doc.rating.avg || 0);
        const sum = Number.isFinite(total * avg) ? total * avg : 0;
        update.rating = { total, sum, avg: total > 0 ? sum / total : 0 };
      }

      if (!doc.createdAt) update.createdAt = new Date(doc._id.getTimestamp());
      update.updatedAt = new Date();

      if (Object.keys(update).length > 0) {
        await oldProducts.updateOne({ _id: doc._id }, { $set: update, $unset: { image: '' } });
        updated++;
      }
    }

    console.log(`Migração concluída. Documentos atualizados: ${updated}`);
    process.exit(0);
  } catch (e) {
    console.error('Erro na migração:', e);
    process.exit(1);
  } finally {
    await client.close();
  }
})();
