import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { authenticate } from '../middleware/auth.js';
import { getDB } from '../config/database.js';

const router = Router();

router.use(authenticate);


router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(req.userId) },
      { projection: { cart: 1 } }
    );
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

    const cart = user.cart || [];
    if (cart.length === 0) return res.json([]);

    const productIds = cart.map(item => new ObjectId(item.productId));
    const products = await db.collection('products').aggregate([
      { $match: { _id: { $in: productIds } } },
      { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'category' } },
      { $set: { category: { $arrayElemAt: ['$category', 0] } } },
    ]).toArray();

    const productMap = {};
    products.forEach(p => { productMap[p._id.toString()] = p; });

    const populated = cart.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      product: productMap[item.productId] || null,
    }));

    res.json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});


router.post('/', async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    if (!productId) return res.status(400).json({ error: 'productId é obrigatório.' });

    const db = getDB();
    const product = await db.collection('products').findOne({ _id: new ObjectId(productId) });
    if (!product) return res.status(404).json({ error: 'Produto não encontrado.' });

    const user = await db.collection('users').findOne({ _id: new ObjectId(req.userId) });
    const cart = user.cart || [];
    const idx = cart.findIndex(i => i.productId === productId);

    if (idx >= 0) {
      cart[idx].quantity += quantity;
    } else {
      cart.push({ productId, quantity });
    }

    await db.collection('users').updateOne(
      { _id: new ObjectId(req.userId) },
      { $set: { cart, updatedAt: new Date() } }
    );

    res.json({ message: 'Produto adicionado ao carrinho.', cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});


router.patch('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
    if (!quantity || quantity < 1)
      return res.status(400).json({ error: 'quantity deve ser >= 1.' });

    const db = getDB();
    const user = await db.collection('users').findOne({ _id: new ObjectId(req.userId) });
    const cart = (user.cart || []).map(item =>
      item.productId === productId ? { ...item, quantity } : item
    );

    await db.collection('users').updateOne(
      { _id: new ObjectId(req.userId) },
      { $set: { cart, updatedAt: new Date() } }
    );

    res.json({ message: 'Quantidade atualizada.', cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});


router.delete('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const db = getDB();
    const user = await db.collection('users').findOne({ _id: new ObjectId(req.userId) });
    const cart = (user.cart || []).filter(item => item.productId !== productId);

    await db.collection('users').updateOne(
      { _id: new ObjectId(req.userId) },
      { $set: { cart, updatedAt: new Date() } }
    );

    res.json({ message: 'Produto removido do carrinho.', cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});


router.delete('/', async (req, res) => {
  try {
    const db = getDB();
    await db.collection('users').updateOne(
      { _id: new ObjectId(req.userId) },
      { $set: { cart: [], updatedAt: new Date() } }
    );
    res.json({ message: 'Carrinho limpo.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

export default router;