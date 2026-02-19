require('dotenv').config();
const { MongoClient } = require('mongodb');

const toSlug = (str = '') =>
  str
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI não definido no .env');
  process.exit(1);
}

const categoryDefinitions = [
  { name: 'Computer Accessories', description: 'Periféricos e acessórios para computador' },
  { name: 'Clothing',             description: 'Roupas e vestuário' },
  { name: 'Books',                description: 'Livros de diversos gêneros' },
  { name: 'Comics',               description: 'Quadrinhos e graphic novels' },
  { name: 'Collectibles',         description: 'Itens colecionáveis e action figures' },
  { name: 'Sports',               description: 'Equipamentos e acessórios esportivos' }
];

const productTemplates = [
  {
    title: 'Headset',
    price: 299.9,
    description: 'Headset Gamer com som surround 7.1, microfone com cancelamento de ruído.',
    categoryName: 'Computer Accessories',
    imageUrl: 'https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcS-CC1RXXYZ8k5d4MOUIAWdvop8Jxy_iXcfhio5RMM_d45qbnqCZ1ZhzWSk4UgazGVbnWxzenZnlVQh3l2PqUKPNP4KUUZcaiHny_mzo5C7Zt74U0bvo8rg36bLzxvvlx_I2unaFio&usqp=CAc',
    rating: { total: 89, sum: 400.5, avg: 4.5 }
  },
  {
    title: 'Camiseta Azul',
    price: 39.99,
    description: 'Camiseta básica azul, 100% algodão, confortável e versátil.',
    categoryName: 'Clothing',
    imageUrl: 'https://images.tcdn.com.br/img/img_prod/1103332/camiseta_adulto_azul_royal_sublimatica_739796345_1_7fb0c945d85b498676f5370980be1f8f.png',
    rating: { total: 156, sum: 655.2, avg: 4.2 }
  },
  {
    title: 'O Senhor dos Anéis Box Trilogy',
    price: 119.5,
    description: 'Box completo da trilogia O Senhor dos Anéis de J.R.R. Tolkien.',
    categoryName: 'Books',
    imageUrl: 'https://m.media-amazon.com/images/I/715afDdgKfL.jpg',
    rating: { total: 342, sum: 1710.0, avg: 5.0 }
  },
  {
    title: 'O Hobbit',
    price: 49.9,
    description: 'A aventura épica de Bilbo Bolseiro, obra clássica de J.R.R. Tolkien.',
    categoryName: 'Books',
    imageUrl: 'https://m.media-amazon.com/images/I/91M9xPIf10L.jpg',
    rating: { total: 567, sum: 2778.3, avg: 4.9 }
  },
  {
    title: 'Batman: Ano Um (HQ)',
    price: 69.9,
    description: 'História de origem do Batman por Frank Miller e David Mazzucchelli.',
    categoryName: 'Comics',
    imageUrl: 'https://m.media-amazon.com/images/I/61-2G84LF-L._AC_UF1000,1000_QL80_.jpg',
    rating: { total: 234, sum: 1123.2, avg: 4.8 }
  },
  {
    title: 'Batman - O Longo Dia das Bruxas - Edição Definitiva (HQ)',
    price: 129.9,
    description: 'Clássico da DC Comics por Jeph Loeb e Tim Sale.',
    categoryName: 'Comics',
    imageUrl: 'https://m.media-amazon.com/images/I/918kseGgo-L._AC_UF1000,1000_QL80_.jpg',
    rating: { total: 189, sum: 926.1, avg: 4.9 }
  },
  {
    title: 'Sandman Vol. 1: Prelúdios e Noturnos',
    price: 199.9,
    description: 'Primeira graphic novel da série Sandman de Neil Gaiman.',
    categoryName: 'Comics',
    imageUrl: 'https://m.media-amazon.com/images/I/81+7Wj+YYkL.jpg',
    rating: { total: 456, sum: 2280.0, avg: 5.0 }
  },
  {
    title: 'Homem Aranha Azul (HQ)',
    price: 99.9,
    description: 'Mini-série limitada sobre os primeiros dias do Homem-Aranha.',
    categoryName: 'Comics',
    imageUrl: 'https://d14d9vp3wdof84.cloudfront.net/image/589816272436/image_2rv8ifrkep1op1j0er424j3s6g/-S897-FWEBP',
    rating: { total: 123, sum: 578.1, avg: 4.7 }
  },
  {
    title: 'O Médico e o Monstro',
    price: 12.9,
    description: 'Clássico da literatura de terror de Robert Louis Stevenson.',
    categoryName: 'Books',
    imageUrl: 'https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcTU2Z8ALaXt21CbopG6C6gAMGNWBAje7OvXf2omtb6lfLGCXoT3bQcHthiMeGKeu_FyAytNcO0V_1VhH4glAiRDnSaTQ_4lEMVduJUZIEjf&usqp=CAc',
    rating: { total: 678, sum: 3119.0, avg: 4.6 }
  },
  {
    title: 'X-Men: A Canção do Carrasco (HQ)',
    price: 129.9,
    description: 'Saga clássica dos X-Men por Chris Claremont.',
    categoryName: 'Comics',
    imageUrl: 'https://d14d9vp3wdof84.cloudfront.net/image/589816272436/image_5uh4l545nh0ercbl7t97di341i/-S897-FWEBP',
    rating: { total: 201, sum: 964.8, avg: 4.8 }
  },
  {
    title: 'Teclado Mecânico RGB Gamer',
    price: 459.0,
    description: 'Teclado mecânico com switches mecânicos, iluminação RGB personalizável.',
    categoryName: 'Computer Accessories',
    imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcST_Kyipsu_C8Hx9E67h6Tb-qt2ORmFul1BUA&s',
    rating: { total: 312, sum: 1435.2, avg: 4.6 }
  },
  {
    title: 'Mouse Gamer',
    price: 199.9,
    description: 'Mouse gamer de alta precisão com sensor óptico e iluminação RGB.',
    categoryName: 'Computer Accessories',
    imageUrl: 'https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcSW_1Bv6l-KvY_b2WTW7WJs5HatvWRQ8EE-9AfjcEN6NeXBQrzcoi9KOQBNkyosq7tHzqRgt0tVQQDsl0FvmfGS-q8aP0z9n-Rq82ugUVhb-F0xHzTC7_j82OZCqv-XDOHJZmS014xPkA&usqp=CAc',
    rating: { total: 267, sum: 1174.8, avg: 4.4 }
  },
  {
    title: 'Action Figure The Batman',
    price: 249.9,
    description: 'Action figure colecionável do Batman com articulações e acessórios.',
    categoryName: 'Collectibles',
    imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSSI921k5xZmHvhwez831IxhoXpM0ahBSN9Vw&s',
    rating: { total: 145, sum: 681.5, avg: 4.7 }
  },
  {
    title: 'Cadeira Gamer Ergonômica',
    price: 599.0,
    description: 'Cadeira gamer com design ergonômico, ajuste de altura e inclinação.',
    categoryName: 'Computer Accessories',
    imageUrl: 'https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcRpTIiR5CyEikbv94SnxvLv0TFrqpO7TscixYDjDbbkoSaWYVUJAB828pC7Z1GCXRlNrBnTlBeog0-nPUsQ_NQMXCnIKb5K2w&usqp=CAc',
    rating: { total: 198, sum: 891.0, avg: 4.5 }
  },
  {
    title: 'Chuteira de Campo',
    price: 140.0,
    description: 'Chuteira de campo com design ergonômico e materiais resistentes.',
    categoryName: 'Sports',
    imageUrl: 'https://a-static.mlcdn.com.br/420x420/chuteira-masculina-de-campo-profissional-sola-costurada-super-resistente-a7/aliciamarchistore/a7-campo03-preto41/be934bebbb784e6c269a67f987d03b3c.jpeg',
    rating: { total: 89, sum: 400.5, avg: 4.5 }
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
    console.log('Banco de dados limpo.');

    const now = new Date();


    const categoriesDocs = categoryDefinitions.map(c => ({
      name: c.name,
      slug: toSlug(c.name), 
      description: c.description || '',
      createdAt: now,
      updatedAt: now
    }));


    const categoryInsert = await categoriesCol.insertMany(categoriesDocs, { ordered: false }).catch(e => {

      console.warn('Aviso ao inserir categorias (pode haver duplicatas preexistentes):', e?.code || e?.message);
      return { insertedCount: 0, insertedIds: {} };
    });

    console.log(`Categorias inseridas (novas): ${categoryInsert.insertedCount ?? 0}`);


    const categoriesOnDb = await categoriesCol
      .find({ slug: { $in: categoriesDocs.map(c => c.slug) } }, { projection: { _id: 1, name: 1, slug: 1 } })
      .toArray();

    const categoryMap = new Map(categoriesOnDb.map(c => [c.name, c._id]));

    
    if (categoryMap.size !== categoryDefinitions.length) {
      const missing = categoryDefinitions
        .filter(c => !categoryMap.has(c.name))
        .map(c => c.name);
      if (missing.length) {
        console.warn('Categorias não encontradas após inserção:', missing);
      }
    }


    const productsToInsert = productTemplates.map(p => {
      const categoryId = categoryMap.get(p.categoryName);
      if (!categoryId) {
        console.warn(`Aviso: categoria '${p.categoryName}' não encontrada para produto '${p.title}.'`);
      }
      return {
        title: p.title,
        price: p.price,
        description: p.description || '',
        imageUrl: p.imageUrl || '',
        category: categoryId || null,
        rating: {
          total: Number(p.rating?.total ?? 0),
          sum: Number(p.rating?.sum ?? 0),
          avg: Number(p.rating?.avg ?? 0)
        },
        createdAt: now,
        updatedAt: now
      };
    });


    const productResult = await productsCol.insertMany(productsToInsert, { ordered: false });
    console.log(`Produtos inseridos: ${productResult.insertedCount}`);


    console.log('\nResumo por categoria:');
    console.log('='.repeat(50));
    for (const cat of categoryDefinitions) {
      const catId = categoryMap.get(cat.name);
      const count = productsToInsert.filter(p => p.category && catId && p.category.equals(catId)).length;
      console.log(`${cat.name}: ${count} produto(s).`);
    }

    console.log('\nSeed concluído com sucesso.');
    process.exit(0);
  } catch (e) {
    console.error('Erro no seed:', e);
    process.exit(1);
  } finally {
    await client.close();
  }
})();