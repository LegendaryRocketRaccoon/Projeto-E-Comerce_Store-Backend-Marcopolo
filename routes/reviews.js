import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { authenticate } from '../middleware/auth.js';
import { getDB } from '../config/database.js';

const router = Router();


router.get('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const db = getDB();

    const reviews = await db.collection('reviews').aggregate([
      { $match: { productId: new ObjectId(productId) } },
      { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
      { $set: { user: { $arrayElemAt: ['$user', 0] } } },
      { $project: {
          rating: 1, comment: 1, createdAt: 1,
          'user._id': 1, 'user.name': 1,
      }},
      { $sort: { createdAt: -1 } },
    ]).toArray();

    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});


router.post('/:productId', authenticate, async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5)
      return res.status(400).json({ error: 'rating deve ser entre 1 e 5.' });

    const db = getDB();

    const product = await db.collection('products').findOne({ _id: new ObjectId(productId) });
    if (!product) return res.status(404).json({ error: 'Produto não encontrado.' });

    const existing = await db.collection('reviews').findOne({
      userId: new ObjectId(req.userId),
      productId: new ObjectId(productId),
    });

    const now = new Date();

    if (existing) {
      await db.collection('reviews').updateOne(
        { _id: existing._id },
        { $set: { rating, comment: comment || '', updatedAt: now } }
      );
    } else {
      await db.collection('reviews').insertOne({
        userId: new ObjectId(req.userId),
        productId: new ObjectId(productId),
        rating,
        comment: comment || '',
        createdAt: now,
        updatedAt: now,
      });
    }


    const allReviews = await db.collection('reviews')
      .find({ productId: new ObjectId(productId) })
      .toArray();

    const total = allReviews.length;
    const sum   = allReviews.reduce((acc, r) => acc + r.rating, 0);
    const avg   = total > 0 ? parseFloat((sum / total).toFixed(2)) : 0;

    await db.collection('products').updateOne(
      { _id: new ObjectId(productId) },
      { $set: { 'rating.total': total, 'rating.sum': sum, 'rating.avg': avg, updatedAt: now } }
    );

    res.status(201).json({ message: 'Avaliação salva.', rating: { total, sum, avg } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});


router.delete('/:productId', authenticate, async (req, res) => {
  try {
    const { productId } = req.params;
    const db = getDB();

    const result = await db.collection('reviews').deleteOne({
      userId: new ObjectId(req.userId),
      productId: new ObjectId(productId),
    });

    if (result.deletedCount === 0)
      return res.status(404).json({ error: 'Avaliação não encontrada.' });

    const allReviews = await db.collection('reviews')
      .find({ productId: new ObjectId(productId) })
      .toArray();

    const total = allReviews.length;
    const sum   = allReviews.reduce((acc, r) => acc + r.rating, 0);
    const avg   = total > 0 ? parseFloat((sum / total).toFixed(2)) : 0;

    await db.collection('products').updateOne(
      { _id: new ObjectId(productId) },
      { $set: { 'rating.total': total, 'rating.sum': sum, 'rating.avg': avg, updatedAt: new Date() } }
    );

    res.json({ message: 'Avaliação removida.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

export default router;