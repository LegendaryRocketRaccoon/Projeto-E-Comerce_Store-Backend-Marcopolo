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

    let query = { category };
    let cursor = col.find(query);


    if (sort) {
      const [field, order] = sort.split('_');
      const safeFields = ['price', 'title'];
      if (safeFields.includes(field)) {
        const sortOrder = order === 'desc' ? -1 : 1;
        cursor = cursor.sort({ [field]: sortOrder });
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
    
    const {
      search,
      sort,
      limit
    } = req.query;

    let query = {};
    

    if (search && search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    let cursor = col.find(query);


    if (sort) {
      const [field, order] = sort.split('_');
      const safeFields = ['price', 'title'];
      if (safeFields.includes(field)) {
        const sortOrder = order === 'desc' ? -1 : 1;
        cursor = cursor.sort({ [field]: sortOrder });
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
    
    const payload = pick(req.body, [
      'title', 'price', 'description', 'image', 'category'
    ]);
    
    if (!payload.title || typeof payload.title !== 'string') {
      return res.status(400).json({ error: 'title é obrigatório' });
    }
    if (typeof payload.price !== 'number' || payload.price < 0) {
      return res.status(400).json({ error: 'price deve ser número >= 0' });
    }
    if (!payload.category) {
      return res.status(400).json({ error: 'category é obrigatório' });
    }

    const doc = {
      title: payload.title.trim(),
      price: payload.price,
      description: (payload.description || '').trim(),
      category: payload.category,
      image: (payload.image || '').trim(),
      rating: { rate: 0, count: 0 },
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
    
    const payload = pick(req.body, [
      'title', 'price', 'description', 'image', 'category'
    ]);
    
    const update = {};
    if (payload.title) update.title = payload.title.trim();
    if (payload.description !== undefined) update.description = (payload.description || '').trim();
    if (payload.image !== undefined) update.image = (payload.image || '').trim();
    if (payload.category) update.category = payload.category;
    
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
    
    const result = await col.findOneAndUpdate(
      { _id }, 
      { $set: update }, 
      { returnDocument: 'after' }
    );
    
    if (!result.value) return res.status(404).json({ error: 'Produto não encontrado' });
    
    res.json(result.value);
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