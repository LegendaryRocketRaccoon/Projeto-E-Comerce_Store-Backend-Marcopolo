/*require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const { toSlug } = require('../utils/slug');

(async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI não definido no .env');

    await mongoose.connect(uri);
    console.log('Conectado ao MongoDB');


    const legacyCats = await Product.distinct('category');
    console.log('Categorias legadas:', legacyCats);


    const slugToId = {};
    for (const name of legacyCats) {
      if (!name) continue;
      const slug = toSlug(name);
      let cat = await Category.findOne({ slug });
      if (!cat) {
        cat = await Category.create({ name, slug, parentId: null, isActive: true });
        console.log('Criada categoria:', name, '->', slug);
      }
      slugToId[slug] = cat._id;
    }


    const cursor = Product.find({}).cursor();
    let updated = 0;
    for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
      const slug = toSlug(doc.category || '');
      const catId = slugToId[slug];
      if (catId) {
        const set = new Set((doc.categories || []).map(id => String(id)));
        set.add(String(catId));
        doc.categories = Array.from(set);
        await doc.save();
        updated++;
      }
    }

    console.log(`Migração concluída. Produtos atualizados: ${updated}.`);
    console.log('Agora já dá para usar /products?category=<slug>');
    process.exit(0);
  } catch (e) {
    console.error('Erro na migração:', e.message);
    process.exit(1);
  }
})();
``*/