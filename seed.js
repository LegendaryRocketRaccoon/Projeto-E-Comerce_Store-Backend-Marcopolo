/*const mongoose = require('mongoose');
const dotenv = require('dotenv');
const axios = require('axios');
const https = require('https');
const Product = require('./models/Product');

dotenv.config();

const seedDatabase = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI não definido em .env');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado ao MongoDB');

    console.log('Buscando produtos em https://fakestoreapi.com/products ...');
    const httpsAgent = new https.Agent({ rejectUnauthorized: false });
    const response = await axios.get('https://fakestoreapi.com/products', { httpsAgent });
    const products = response.data;

    if (!Array.isArray(products) || products.length === 0) {
      console.log('Nenhum produto retornado da FakeStore API. Abortando.');
      process.exit(1);
    }

    // Limpar banco
    await Product.deleteMany({});
    console.log('Banco de dados limpo.');

    // Mapear produtos para o formato do schema (incluir fakestoreId)
    const mapped = products.map(p => ({
      fakestoreId: p.id,
      title: p.title,
      price: p.price,
      description: p.description,
      category: p.category,
      image: p.image,
      rating: p.rating
    }));

    const createdProducts = await Product.insertMany(mapped);
    console.log(`${createdProducts.length} produtos criados.`);

    const categories = await Product.distinct('category');
    console.log('\nCategorias disponíveis:');
    categories.forEach(cat => console.log(`- ${cat}`));

    console.log('\n✅ Banco de dados populado com sucesso.');
    process.exit(0);
  } catch (error) {
    console.error('Erro ao popular banco de dados:', error.message || error);
    process.exit(1);
  }
};

seedDatabase();*/