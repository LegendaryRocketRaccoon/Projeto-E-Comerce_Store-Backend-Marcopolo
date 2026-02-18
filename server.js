const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');
const { connectDB } = require('./config/database');

const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');

dotenv.config();

const app = express();

(async () => {
  try {
    await connectDB();
    
    app.use(helmet());
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(morgan('dev'));

    app.get('/', (_req, res) => {
      res.json({
        message: 'FakeStore API - Driver mongodb nativo',
        version: '2.0.0',
        endpoints: {
          products: {
            all: 'GET /products',
            single: 'GET /products/:id',
            categories: 'GET /products/categories',
            byCategory: 'GET /products/category/:category',
            rate: 'POST /products/:id/rate'
          },
          categories: {
            list: 'GET /categories',
            detail: 'GET /categories/:id',
            create: 'POST /categories',
            update: 'PATCH /categories/:id',
            delete: 'DELETE /categories/:id'
          }
        }
      });
    });

    app.use('/products', productRoutes);
    app.use('/categories', categoryRoutes);

    // 404
    app.use((req, res) => {
      res.status(404).json({ 
        error: { message: 'Rota não encontrada', status: 404 } 
      });
    });

    // Erros
    app.use((err, _req, res, _next) => {
      console.error(err.stack);
      res.status(err.status || 500).json({
        error: { 
          message: err.message || 'Erro interno do servidor', 
          status: err.status || 500 
        }
      });
    });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
      console.log(`Ambiente: ${process.env.NODE_ENV}`);
      console.log(`http://localhost:${PORT}/`);
    });
  } catch (e) {
    console.error('Falha ao iniciar servidor:', e.message);
    process.exit(1);
  }
})();