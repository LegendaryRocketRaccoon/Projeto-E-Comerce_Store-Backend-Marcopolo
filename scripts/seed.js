require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI não definido no .env');
  process.exit(1);
}


const categoryDefinitions = [
  { 
    name: 'Computer Accessories', 
    slug: 'computer-accessories',
    description: 'Periféricos e acessórios para computador' 
  },
  { 
    name: 'Clothing', 
    slug: 'clothing',
    description: 'Roupas e vestuário' 
  },
  { 
    name: 'Books', 
    slug: 'books',
    description: 'Livros de diversos gêneros' 
  },
  { 
    name: 'Comics', 
    slug: 'comics',
    description: 'Quadrinhos e graphic novels' 
  },
  { 
    name: 'Collectibles', 
    slug: 'collectibles',
    description: 'Itens colecionáveis e action figures' 
  }
];


const productTemplates = [
  {
    fakestoreId: 1,
    title: 'Headset',
    price: 299.9,
    description: 'Headset Gamer com som surround 7.1, microfone com cancelamento de ruído e iluminação RGB.',
    categorySlug: 'computer-accessories',
    image: 'https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcS-CC1RXXYZ8k5d4MOUIAWdvop8Jxy_iXcfhio5RMM_d45qbnqCZ1ZhzWSk4UgazGVbnWxzenZnlVQh3l2PqUKPNP4KUUZcaiHny_mzo5C7Zt74U0bvo8rg36bLzxvvlx_I2unaFio&usqp=CAc',
    rating: { rate: 4.5, count: 89 }
  },
  {
    fakestoreId: 2,
    title: 'Camiseta Azul',
    price: 39.99,
    description: 'Camiseta básica azul, 100% algodão, confortável e versátil.',
    categorySlug: 'clothing',
    image: 'https://images.tcdn.com.br/img/img_prod/1103332/camiseta_adulto_azul_royal_sublimatica_739796345_1_7fb0c945d85b498676f5370980be1f8f.png',
    rating: { rate: 4.2, count: 156 }
  },
  {
    fakestoreId: 3,
    title: 'O Senhor dos Anéis Box Trilogy',
    price: 119.5,
    description: 'Box completo da trilogia O Senhor dos Anéis de J.R.R. Tolkien.',
    categorySlug: 'books',
    image: 'https://m.media-amazon.com/images/I/715afDdgKfL.jpg',
    rating: { rate: 5.0, count: 342 }
  },
  {
    fakestoreId: 4,
    title: 'O Hobbit',
    price: 49.9,
    description: 'A aventura épica de Bilbo Bolseiro, obra clássica de J.R.R. Tolkien.',
    categorySlug: 'books',
    image: 'https://m.media-amazon.com/images/I/91M9xPIf10L.jpg',
    rating: { rate: 4.9, count: 567 }
  },
  {
    fakestoreId: 5,
    title: 'Batman: Ano Um (HQ)',
    price: 69.9,
    description: 'História de origem do Batman por Frank Miller e David Mazzucchelli.',
    categorySlug: 'comics',
    image: 'https://m.media-amazon.com/images/I/61-2G84LF-L._AC_UF1000,1000_QL80_.jpg',
    rating: { rate: 4.8, count: 234 }
  },
  {
    fakestoreId: 6,
    title: 'Batman - O Longo Dia das Bruxas - Edição Definitiva (HQ)',
    price: 129.9,
    description: 'Clássico da DC Comics por Jeph Loeb e Tim Sale.',
    categorySlug: 'comics',
    image: 'https://m.media-amazon.com/images/I/918kseGgo-L._AC_UF1000,1000_QL80_.jpg',
    rating: { rate: 4.9, count: 189 }
  },
  {
    fakestoreId: 7,
    title: 'Sandman Vol. 1: Prelúdios e Noturnos',
    price: 199.9,
    description: 'Primeira graphic novel da série Sandman de Neil Gaiman.',
    categorySlug: 'comics',
    image: 'https://m.media-amazon.com/images/I/81+7Wj+YYkL.jpg',
    rating: { rate: 5.0, count: 456 }
  },
  {
    fakestoreId: 8,
    title: 'Homem Aranha Azul (HQ)',
    price: 99.9,
    description: 'Mini-série limitada sobre os primeiros dias do Homem-Aranha.',
    categorySlug: 'comics',
    image: 'https://d14d9vp3wdof84.cloudfront.net/image/589816272436/image_2rv8ifrkep1op1j0er424j3s6g/-S897-FWEBP',
    rating: { rate: 4.7, count: 123 }
  },
  {
    fakestoreId: 9,
    title: 'O Médico e o Monstro',
    price: 12.9,
    description: 'Clássico da literatura de terror de Robert Louis Stevenson.',
    categorySlug: 'books',
    image: 'https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcTU2Z8ALaXt21CbopG6C6gAMGNWBAje7OvXf2omtb6lfLGCXoT3bQcHthiMeGKeu_FyAytNcO0V_1VhH4glAiRDnSaTQ_4lEMVduJUZIEjf&usqp=CAc',
    rating: { rate: 4.6, count: 678 }
  },
  {
    fakestoreId: 10,
    title: 'X-Men: A Canção do Carrasco (HQ)',
    price: 129.9,
    description: 'Saga clássica dos X-Men por Chris Claremont.',
    categorySlug: 'comics',
    image: 'https://d14d9vp3wdof84.cloudfront.net/image/589816272436/image_5uh4l545nh0ercbl7t97di341i/-S897-FWEBP',
    rating: { rate: 4.8, count: 201 }
  },
  {
    fakestoreId: 11,
    title: 'Teclado Mecânico RGB Gamer',
    price: 459.0,
    description: 'Teclado mecânico com switches mecânicos, iluminação RGB personalizável.',
    categorySlug: 'computer-accessories',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcST_Kyipsu_C8Hx9E67h6Tb-qt2ORmFul1BUA&s',
    rating: { rate: 4.6, count: 312 }
  },
  {
    fakestoreId: 12,
    title: 'Mouse Gamer',
    price: 199.9,
    description: 'Mouse gamer de alta precisão com sensor óptico e iluminação RGB.',
    categorySlug: 'computer-accessories',
    image: 'https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcSW_1Bv6l-KvY_b2WTW7WJs5HatvWRQ8EE-9AfjcEN6NeXBQrzcoi9KOQBNkyosq7tHzqRgt0tVQQDsl0FvmfGS-q8aP0z9n-Rq82ugUVhb-F0xHzTC7_j82OZCqv-XDOHJZmS014xPkA&usqp=CAc',
    rating: { rate: 4.4, count: 267 }
  },
  {
    fakestoreId: 13,
    title: 'Action Figure The Batman',
    price: 249.9,
    description: 'Action figure colecionável do Batman com articulações e acessórios.',
    categorySlug: 'collectibles',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSSI921k5xZmHvhwez831IxhoXpM0ahBSN9Vw&s',
    rating: { rate: 4.7, count: 145 }
  },
  {
    fakestoreId: 14,
    title: 'Cadeira Gamer Ergonômica',
    price: 599.0,
    description: 'Cadeira gamer com design ergonômico, ajuste de altura e inclinação.',
    categorySlug: 'computer-accessories',
    image: 'https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcRpTIiR5CyEikbv94SnxvLv0TFrqpO7TscixYDjDbbkoSaWYVUJAB828pC7Z1GCXRlNrBnTlBeog0-nPUsQ_NQMXCnIKb5K2w&usqp=CAc',
    rating: { rate: 4.5, count: 198 }
  }
];

(async () => {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    const categoriesCol = db.collection('categories');
    const productsCol = db.collection('products');


    await categoriesCol.deleteMany({});
    await productsCol.deleteMany({});
    console.log('Banco de dados limpo!');


    const now = new Date();
    const categoriesWithTimestamps = categoryDefinitions.map(c => ({
      ...c,
      createdAt: now,
      updatedAt: now
    }));

    const categoryResult = await categoriesCol.insertMany(categoriesWithTimestamps);
    console.log(`${Object.keys(categoryResult.insertedIds).length} categorias criadas!`);


    const categoryMap = {};
    for (let i = 0; i < categoryDefinitions.length; i++) {
      const slug = categoryDefinitions[i].slug;
      const id = categoryResult.insertedIds[i];
      categoryMap[slug] = id;
    }


    const productsWithCategory = productTemplates.map(p => {
      const categoryId = categoryMap[p.categorySlug];
      
      if (!categoryId) {
        console.warn(`Aviso: categoria '${p.categorySlug}' não encontrada para produto '${p.title}'`);
      }


      const { categorySlug, ...product } = p;
      
      return {
        ...product,
        category: categoryId,
        createdAt: now,
        updatedAt: now
      };
    });

    const productResult = await productsCol.insertMany(productsWithCategory);
    console.log(`${Object.keys(productResult.insertedIds).length} produtos criados!`);


    console.log('\nResumo:');
    console.log('='.repeat(50));
    
    for (const cat of categoryDefinitions) {
      const count = productsWithCategory.filter(p => 
        p.category && p.category.equals(categoryMap[cat.slug])
      ).length;
      console.log(`${cat.name} (${cat.slug}): ${count} produtos`);
    }

    console.log('\nSeed concluído com sucesso.');
    console.log('\nEndpoints disponíveis:');
    console.log('GET /products - Listar todos os produtos');
    console.log('GET /products/:id - Obter produto específico');
    console.log('GET /products/categories - Listar categorias');
    console.log('GET /categories - Listar categorias completas');

    process.exit(0);
  } catch (e) {
    console.error('Erro no seed:', e);
    process.exit(1);
  } finally {
    await client.close();
  }
})();