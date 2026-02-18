/*const mongoose = require('mongoose');
const dotenv = require('dotenv');

const Product = require('./models/Product');
const Category = require('./models/Category');
const { toSlug } = require('./utils/slug');

dotenv.config();

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('❌ MONGODB_URI não definido no .env');
  process.exit(1);
}

const categoryDefinitions = [
  { name: 'Books', slug: 'books' },
  { name: 'Comics', slug: 'comics' },
  { name: 'Clothing', slug: 'clothing' },
  { name: 'Computer Accessories', slug: 'computer-accessories' },
  { name: 'Collectibles', slug: 'collectibles' }
];

const items = [
  {
    fakestoreId: 1,
    title: 'Headset',
    price: 299.9,
    description: 'Headset Gamer com som surround 7.1, microfone com cancelamento de ruído e iluminação RGB.',
    categories: ['computer-accessories'],
    image: 'https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcS-CC1RXXYZ8k5d4MOUIAWdvop8Jxy_iXcfhio5RMM_d45qbnqCZ1ZhzWSk4UgazGVbnWxzenZnlVQh3l2PqUKPNP4KUUZcaiHny_mzo5C7Zt74U0bvo8rg36bLzxvvlx_I2unaFio&usqp=CAc'
  },
  {
    fakestoreId: 2,
    title: 'Camiseta Azul',
    price: 39.99,
    categories: ['clothing'],
    image: 'https://images.tcdn.com.br/img/img_prod/1103332/camiseta_adulto_azul_royal_sublimatica_739796345_1_7fb0c945d85b498676f5370980be1f8f.png'
  },
  {
    fakestoreId: 3,
    title: 'O Senhor dos Anéis Box Trilogy',
    price: 119.5,
    categories: ['books'],
    image: 'https://m.media-amazon.com/images/I/715afDdgKfL.jpg'
  },
  {
    fakestoreId: 4,
    title: 'O Hobbit',
    price: 49.9,
    categories: ['books'],
    image: 'https://m.media-amazon.com/images/I/91M9xPIf10L.jpg'
  },
  {
    fakestoreId: 5,
    title: 'Batman: Ano Um (HQ)',
    price: 69.9,
    categories: ['comics'],
    image: 'https://m.media-amazon.com/images/I/61-2G84LF-L._AC_UF1000,1000_QL80_.jpg'
  },
  {
    fakestoreId: 6,
    title: 'Batman - O Longo Dia das Bruxas - Edição Definitiva (HQ)',
    price: 129.9,
    categories: ['comics'],
    image: 'https://m.media-amazon.com/images/I/918kseGgo-L._AC_UF1000,1000_QL80_.jpg'
  },
  {
    fakestoreId: 7,
    title: 'Sandman Vol. 1: Prelúdios e Noturnos',
    price: 199.9,
    categories: ['comics'],
    image: 'https://m.media-amazon.com/images/I/81+7Wj+YYkL.jpg'
  },
  {
    fakestoreId: 8,
    title: 'Homem Aranha Azul (HQ)',
    price: 99.9,
    categories: ['comics'],
    image: 'https://d14d9vp3wdof84.cloudfront.net/image/589816272436/image_2rv8ifrkep1op1j0er424j3s6g/-S897-FWEBP'
  },
  {
    fakestoreId: 9,
    title: 'O Médico e o Monstro',
    price: 12.9,
    categories: ['books'],
    image: 'https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcTU2Z8ALaXt21CbopG6C6gAMGNWBAje7OvXf2omtb6lfLGCXoT3bQcHthiMeGKeu_FyAytNcO0V_1VhH4glAiRDnSaTQ_4lEMVduJUZIEjf&usqp=CAc'
  },
  {
    fakestoreId: 10,
    title: 'X-Men: A Canção do Carrasco (HQ)',
    price: 129.9,
    categories: ['comics'],
    image: 'https://d14d9vp3wdof84.cloudfront.net/image/589816272436/image_5uh4l545nh0ercbl7t97di341i/-S897-FWEBP'
  },
  {
    fakestoreId: 11,
    title: 'Teclado Mecânico RGB Gamer',
    price: 459.0,
    categories: ['computer-accessories'],
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcST_Kyipsu_C8Hx9E67h6Tb-qt2ORmFul1BUA&s'
  },
  {
    fakestoreId: 12,
    title: 'Mouse Gamer',
    price: 199.9,
    categories: ['computer-accessories'],
    image: 'https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcSW_1Bv6l-KvY_b2WTW7WJs5HatvWRQ8EE-9AfjcEN6NeXBQrzcoi9KOQBNkyosq7tHzqRgt0tVQQDsl0FvmfGS-q8aP0z9n-Rq82ugUVhb-F0xHzTC7_j82OZCqv-XDOHJZmS014xPkA&usqp=CAc'
  },
  {
    fakestoreId: 13,
    title: 'Action Figure The Batman',
    price: 249.9,
    categories: ['collectibles'],
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSSI921k5xZmHvhwez831IxhoXpM0ahBSN9Vw&s'
  },
  {
    fakestoreId: 14,
    title: 'Cadeira Gamer Ergonômica',
    price: 599.0,
    categories: ['computer-accessories'],
    image: 'https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcRpTIiR5CyEikbv94SnxvLv0TFrqpO7TscixYDjDbbkoSaWYVUJAB828pC7Z1GCXRlNrBnTlBeog0-nPUsQ_NQMXCnIKb5K2w&usqp=CAc'
  }
];

async function upsertCategories(defs) {
  const slugToDoc = {};
  for (const def of defs) {
    const slug = toSlug(def.slug || def.name);
    let parentId = null;

    if (def.parentSlug) {
      const parent = await Category.findOne({ slug: def.parentSlug });
      if (!parent) throw new Error(`Categoria pai inexistente: ${def.parentSlug}`);
      parentId = parent._id;
    }

    let cat = await Category.findOne({ slug });
    if (!cat) {
      cat = await Category.create({
        name: def.name,
        slug,
        parentId,
        isActive: true,
        sortOrder: 0
      });
    } else if (String(cat.parentId || '') !== String(parentId || '')) {
      cat.parentId = parentId || null;
      await cat.save();
    }

    slugToDoc[slug] = cat;
  }
  return slugToDoc;
}

async function run() {
  try {
    await mongoose.connect(uri);
    console.log('✅ Conectado ao MongoDB');

    await Product.deleteMany({});


    const slugToCat = await upsertCategories(categoryDefinitions);
    console.log('Categorias prontas:', Object.keys(slugToCat).join(', '));

    const productsDocs = items.map((p, idx) => {
      const objectIds = (p.categories || [])
        .map(slug => slugToCat[toSlug(slug)])
        .filter(Boolean)
        .map(cat => cat._id);

      return {
        fakestoreId: p.fakestoreId != null ? p.fakestoreId : 1000 + idx,
        title: p.title || `Produto ${idx + 1}`,
        price: typeof p.price === 'number' ? p.price : 0,
        description: p.description || 'Sem descrição.',
        image: p.image || '',
        rating: p.rating || { rate: 0, count: 0 },
        isActive: true,
        categories: objectIds
      };
    });

    const created = await Product.insertMany(productsDocs);
    console.log(`${created.length} produtos inseridos.`);

    const agg = await Product.aggregate([
      { $unwind: '$categories' },
      { $group: { _id: '$categories', total: { $sum: 1 } } },
      { $sort: { total: -1 } }
    ]);

    for (const row of agg) {
      const cat = await Category.findById(row._id).lean();
      console.log(`${cat?.name || row._id}: ${row.total} produtos`);
    }

    console.log('Seed concluído.');
    process.exit(0);
  } catch (e) {
    console.error('Erro no seed:', e.message);
    process.exit(1);
  }
}

run();*/