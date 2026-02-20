import express from 'express';
import { getDB } from '../config/database.js';
import { toObjectId, now, pick } from '../utils/validators.js';

const router = express.Router();


function categoryLookup() {
  return [
    {
      $lookup: {
        from: 'categories',
        localField: 'category',
        foreignField: '_id',
        as: 'category'
      }
    },
    {
      $set: {
        category: { $arrayElemAt: ['$category', 0] }
      }
    }
  ];
}


router.get('/categories', async (req, res) => {
  try {
    const db = getDB();
    const col = db.collection('categories');
    const categories = await col.find({}, { projection: { slug: 0 } }).toArray();
    res.json(categories);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


router.get('/category/:category', async (req, res) => {
  try {
    const db = getDB();
    const col = db.collection('products');
    const { sort, limit } = req.query;

    const categoryId = toObjectId(req.params.category);
    if (!categoryId) return res.status(400).json({ error: 'ID de categoria inválido' });

    const pipeline = [
      { $match: { category: categoryId } },
      ...categoryLookup()
    ];

    if (sort) {
      const [field, order] = sort.split('_');
      if (['price', 'title'].includes(field)) {
        pipeline.push({ $sort: { [field]: order === 'desc' ? -1 : 1 } });
      }
    }

    if (limit) {
      pipeline.push({ $limit: parseInt(limit, 10) });
    }

    const products = await col.aggregate(pipeline).toArray();
    res.json(products);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const col = db.collection('products');
    const { search, sort, limit } = req.query;

    const pipeline = [];

    if (search && search.trim()) {
      pipeline.push({ $match: { title: { $regex: search.trim(), $options: 'i' } } });
    }

    pipeline.push(...categoryLookup());

    if (sort) {
      const [field, order] = sort.split('_');
      if (['price', 'title'].includes(field)) {
        pipeline.push({ $sort: { [field]: order === 'desc' ? -1 : 1 } });
      }
    }

    if (limit) {
      pipeline.push({ $limit: parseInt(limit, 10) });
    }

    const products = await col.aggregate(pipeline).toArray();
    res.json(products);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


router.get('/:id', async (req, res) => {
  try {
    const db = getDB();
    const col = db.collection('products');
    const _id = toObjectId(req.params.id);

    if (!_id) return res.status(400).json({ error: 'ID inválido' });

    const [doc] = await col.aggregate([
      { $match: { _id } },
      ...categoryLookup()
    ]).toArray();

    if (!doc) return res.status(404).json({ error: 'Produto não encontrado' });

    res.json(doc);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


router.post('/', async (req, res) => {
  try {
    const db = getDB();
    const col = db.collection('products');

    const payload = pick(req.body, ['title', 'price', 'description', 'imageUrl', 'category']);

    if (!payload.title || typeof payload.title !== 'string') {
      return res.status(400).json({ error: 'title é obrigatório' });
    }
    if (typeof payload.price !== 'number' || payload.price < 0) {
      return res.status(400).json({ error: 'price deve ser número >= 0' });
    }
    if (!payload.category) {
      return res.status(400).json({ error: 'category é obrigatório' });
    }

    const categoryId = toObjectId(payload.category);
    if (!categoryId) return res.status(400).json({ error: 'category ID inválido' });

    const doc = {
      title: payload.title.trim(),
      price: payload.price,
      description: (payload.description || '').trim(),
      imageUrl: (payload.imageUrl || '').trim(),
      category: categoryId,
      rating: { total: 0, sum: 0, avg: 0 },
      createdAt: now(),
      updatedAt: now()
    };

    const result = await col.insertOne(doc);

    const [created] = await col.aggregate([
      { $match: { _id: result.insertedId } },
      ...categoryLookup()
    ]).toArray();

    res.status(201).json(created);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});


router.patch('/:id', async (req, res) => {
  try {
    const db = getDB();
    const col = db.collection('products');
    const _id = toObjectId(req.params.id);

    if (!_id) return res.status(400).json({ error: 'ID inválido' });

    const payload = pick(req.body, ['title', 'price', 'description', 'imageUrl', 'category']);
    const update = {};

    if (payload.title) update.title = payload.title.trim();
    if (payload.description !== undefined) update.description = (payload.description || '').trim();
    if (payload.imageUrl !== undefined) update.imageUrl = (payload.imageUrl || '').trim();
    if (payload.category) {
      const categoryId = toObjectId(payload.category);
      if (!categoryId) return res.status(400).json({ error: 'category ID inválido' });
      update.category = categoryId;
    }
    if (payload.price !== undefined) {
      if (typeof payload.price !== 'number' || payload.price < 0) {
        return res.status(400).json({ error: 'price deve ser número >= 0' });
      }
      update.price = payload.price;
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: 'Nada para atualizar' });
    }
    update.updatedAt = now();

    const updated = await col.findOneAndUpdate(
      { _id },
      { $set: update },
      { returnDocument: 'after' }
    );

    if (!updated) return res.status(404).json({ error: 'Produto não encontrado' });

    const [populated] = await col.aggregate([
      { $match: { _id } },
      ...categoryLookup()
    ]).toArray();

    res.json(populated);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});


router.delete('/:id', async (req, res) => {
  try {
    const db = getDB();
    const col = db.collection('products');
    const _id = toObjectId(req.params.id);

    if (!_id) return res.status(400).json({ error: 'ID inválido' });

    const result = await col.deleteOne({ _id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    res.status(204).end();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;