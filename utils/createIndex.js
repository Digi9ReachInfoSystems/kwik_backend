// createIndex.js
const client = require('./elasticsearch');

const createProductIndex = async () => {
  const indexExists = await client.indices.exists({ index: 'products' });
  if (!indexExists.body) {
    await client.indices.create({
      index: 'products',
      body: {
        mappings: {
          properties: {
            product_name: { type: 'text' },
            product_des: { type: 'text' },
            product_image: { type: 'keyword' },
            Brand: { type: 'keyword' },
            category_ref: { type: 'keyword' },
            sub_category_ref: { type: 'keyword' },
            variations: { type: 'nested' },
            warehouse_ref: { type: 'keyword' },
            sku: { type: 'keyword' },
            product_video: { type: 'keyword' },
            review: { type: 'nested' },
            draft: { type: 'boolean' },
            zoneRack: { type: 'keyword' },
            created_time: { type: 'date' },
          },
        },
      },
    });
    console.log('Product index created');
  } else {
    console.log('Product index already exists');
  }
};

createProductIndex().catch(console.error);
