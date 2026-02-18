const express = require('express');
const router = express.Router();
const { getDB } = require('../config/database');
const { toObjectId, now, pick } = require('../utils/validators');


router.get('/categories', async (req, res) => {
  try {
    const db = getDB();
    const col = db.collection('products');
    const categories = await col.distinct('category');
    res.json(categories);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


router.get('/category/:category', async (req, res) => {
  try {
    const db = getDB();
    const col = db.collection('products');
    const { category } = req.params;
    const { sort, limit } = req.query;

    const categoryId = toObjectId(category);
    if (!categoryId) return res.status(400).json({ error: 'ID de categoria inválido' });

    let query = { category: categoryId };
    let cursor = col.find(query);

    if (sort) {
      const [field, order] = sort.split('_');
      const safeFields = ['price', 'title'];
      if (safeFields.includes(field)) {
        cursor = cursor.sort({ [field]: order === 'desc' ? -1 : 1 });
      }
    }

    if (limit) {
      cursor = cursor.limit(parseInt(limit, 10));
    }

    const products = await cursor.toArray();
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

    let query = {};

    if (search && search.trim()) {
      query.title = { $regex: search.trim(), $options: 'i' };
    }

    let cursor = col.find(query);

    if (sort) {
      const [field, order] = sort.split('_');
      const safeFields = ['price', 'title'];
      if (safeFields.includes(field)) {
        cursor = cursor.sort({ [field]: order === 'desc' ? -1 : 1 });
      }
    }

    if (limit) {
      cursor = cursor.limit(parseInt(limit, 10));
    }

    const products = await cursor.toArray();
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

    const doc = await col.findOne({ _id });
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
    res.status(201).json({ ...doc, _id: result.insertedId });
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

    res.json(updated);
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

module.exports = router;