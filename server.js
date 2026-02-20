import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/database.js';
import productsRouter from './routes/products.js';
import categoriesRouter from './routes/categories.js';

dotenv.config();


async function bootstrap() {
  const app  = express();
  const PORT = process.env.PORT || 3000;

  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  }));
  app.use(express.json());


  app.use('/products',   productsRouter);
  app.use('/categories', categoriesRouter);


  const [
    { default: authRouter    },
    { default: cartRouter    },
    { default: reviewsRouter },
  ] = await Promise.all([
    import('./routes/auth.js'),
    import('./routes/cart.js'),
    import('./routes/reviews.js'),
  ]);

  app.use('/auth',    authRouter);
  app.use('/cart',    cartRouter);
  app.use('/reviews', reviewsRouter);

  app.get('/health', (_, res) => res.json({ status: 'ok' }));

  await connectDB();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

bootstrap().catch(err => {
  console.error('Erro ao iniciar servidor:', err);
  process.exit(1);
});