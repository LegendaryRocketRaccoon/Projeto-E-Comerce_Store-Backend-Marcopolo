import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { getDB } from '../config/database.js';

const router = Router();

const ACCESS_SECRET  = process.env.JWT_ACCESS_SECRET  || 'access_secret_dev';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh_secret_dev';

function generateTokens(userId) {
  const accessToken = jwt.sign({ userId: userId.toString() }, ACCESS_SECRET, {
    expiresIn: '15m',
  });
  const refreshToken = jwt.sign({ userId: userId.toString() }, REFRESH_SECRET, {
    expiresIn: '7d',
  });
  return { accessToken, refreshToken };
}


router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'name, email e password são obrigatórios.' });

    const db = getDB();
    const existing = await db.collection('users').findOne({ email });
    if (existing)
      return res.status(409).json({ error: 'E-mail já cadastrado.' });

    const passwordHash = await bcrypt.hash(password, 12);
    const now = new Date();
    const result = await db.collection('users').insertOne({
      name,
      email,
      passwordHash,
      cart: [],
      createdAt: now,
      updatedAt: now,
    });

    const userId = result.insertedId;
    const { accessToken, refreshToken } = generateTokens(userId);
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await db.collection('refreshTokens').insertOne({
      userId,
      token: refreshToken,
      expiresAt: refreshExpiresAt,
    });

    res.status(201).json({
      accessToken,
      refreshToken,
      user: { _id: userId, name, email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});


router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'email e password são obrigatórios.' });

    const db = getDB();
    const user = await db.collection('users').findOne({ email });
    if (!user)
      return res.status(401).json({ error: 'Credenciais inválidas.' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid)
      return res.status(401).json({ error: 'Credenciais inválidas.' });

    const { accessToken, refreshToken } = generateTokens(user._id);
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await db.collection('refreshTokens').insertOne({
      userId: user._id,
      token: refreshToken,
      expiresAt: refreshExpiresAt,
    });

    res.json({
      accessToken,
      refreshToken,
      user: { _id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});


router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(400).json({ error: 'refreshToken é obrigatório.' });

    let payload;
    try {
      payload = jwt.verify(refreshToken, REFRESH_SECRET);
    } catch {
      return res.status(401).json({ error: 'Refresh token inválido ou expirado.' });
    }

    const db = getDB();
    const stored = await db.collection('refreshTokens').findOne({ token: refreshToken });
    if (!stored || stored.expiresAt < new Date())
      return res.status(401).json({ error: 'Refresh token inválido ou expirado.' });

    await db.collection('refreshTokens').deleteOne({ token: refreshToken });

    const userId = new ObjectId(payload.userId);
    const tokens = generateTokens(userId);
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await db.collection('refreshTokens').insertOne({
      userId,
      token: tokens.refreshToken,
      expiresAt: refreshExpiresAt,
    });

    res.json(tokens);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});


router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      const db = getDB();
      await db.collection('refreshTokens').deleteOne({ token: refreshToken });
    }
    res.json({ message: 'Logout realizado.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

export default router;