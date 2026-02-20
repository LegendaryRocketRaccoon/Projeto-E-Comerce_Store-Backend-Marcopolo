import express from 'express';
import { getDB } from '../config/database.js';
import { toObjectId, now, pick } from '../utils/validators.js';

const router = express.Router();


router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const col = db.collection('categories');

    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize || '50', 10), 1), 100);

    const cursor = col.find({}).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize);
    const [items, total] = await Promise.all([cursor.toArray(), col.countDocuments({})]);

    res.json({ items, page, pageSize, total });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


router.get('/:id', async (req, res) => {
  try {
    const db = getDB();
    const col = db.collection('categories');
    const _id = toObjectId(req.params.id);
    if (!_id) return res.status(400).json({ error: 'ID inválido' });

    const doc = await col.findOne({ _id });
    if (!doc) return res.status(404).json({ error: 'Categoria não encontrada' });

    res.json(doc);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


router.post('/', async (req, res) => {
  try {
    const db = getDB();
    const col = db.collection('categories');
    const payload = pick(req.body, ['name', 'description']);

    if (!payload.name || typeof payload.name !== 'string') {
      return res.status(400).json({ error: 'name é obrigatório' });
    }

    const doc = {
      name: payload.name.trim(),
      description: (payload.description || '').trim(),
      createdAt: now(),
      updatedAt: now()
    };

    const result = await col.insertOne(doc);
    res.status(201).json({ ...doc, _id: result.insertedId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


router.patch('/:id', async (req, res) => {
  try {
    const db = getDB();
    const col = db.collection('categories');
    const _id = toObjectId(req.params.id);
    if (!_id) return res.status(400).json({ error: 'ID inválido' });

    const payload = pick(req.body, ['name', 'description']);
    const update = {};
    if (payload.name) update.name = payload.name.trim();
    if (payload.description !== undefined) update.description = (payload.description || '').trim();

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: 'Nada para atualizar' });
    }
    update.updatedAt = now();


    const updated = await col.findOneAndUpdate(
      { _id },
      { $set: update },
      { returnDocument: 'after' }
    );

    if (!updated) return res.status(404).json({ error: 'Categoria não encontrada' });

    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


router.delete('/:id', async (req, res) => {
  try {
    const db = getDB();
    const categories = db.collection('categories');
    const products = db.collection('products');

    const _id = toObjectId(req.params.id);
    if (!_id) return res.status(400).json({ error: 'ID inválido' });

    const referenced = await products.findOne({ category: _id }, { projection: { _id: 1 } });
    if (referenced) {
      return res.status(409).json({ error: 'Há produtos vinculados à categoria. Remova/mova-os antes.' });
    }

    const result = await categories.deleteOne({ _id });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Categoria não encontrada' });

    res.status(204).end();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;