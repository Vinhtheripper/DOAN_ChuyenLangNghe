const { MongoClient } = require('mongodb');
const { MONGODB_URI, DB_NAME } = require('./env');

const client = new MongoClient(MONGODB_URI);
let collections = null;

async function connectDatabase() {
  if (collections) {
    return collections;
  }

  await client.connect();
  const database = client.db(DB_NAME);

  await Promise.all([
    database.collection('Product').createIndex({ updatedAt: -1, createdAt: -1, _id: -1 }),
    database.collection('Product').createIndex({ product_dept: 1, updatedAt: -1, createdAt: -1, _id: -1 }),
    database.collection('Product').createIndex({ type: 1, updatedAt: -1, createdAt: -1, _id: -1 }),
    database.collection('Product').createIndex({ product_dept: 1, type: 1, updatedAt: -1, createdAt: -1, _id: -1 }),
    database.collection('ProductImage').createIndex({ productId: 1, slot: 1 }, { unique: true }),
    database.collection('ProductImage').createIndex({ productId: 1, isPrimary: 1 }),
    database.collection('User').createIndex({ email: 1 }, { unique: true }),
    database.collection('User').createIndex({ profileName: 1 }),
    database.collection('Coupon').createIndex({ code: 1 }, { unique: true }),
    database.collection('Blog').createIndex({ slug: 1 }, { sparse: true }),
    database.collection('Order').createIndex({ createdAt: -1 }),
    database.collection('Order').createIndex({ userId: 1, createdAt: -1 }),
    database.collection('Order').createIndex({ status: 1, createdAt: -1 }),
    database.collection('Cart').createIndex({ userId: 1, productId: 1 }, { unique: true })
  ]);

  collections = {
    productCollection: database.collection('Product'),
    productImageCollection: database.collection('ProductImage'),
    userCollection: database.collection('User'),
    orderCollection: database.collection('Order'),
    feedbackCollection: database.collection('Feedback'),
    cartCollection: database.collection('Cart'),
    blogCollection: database.collection('Blog'),
    productReviewCollection: database.collection('ProductReview'),
    couponCollection: database.collection('Coupon')
  };

  return collections;
}

function getCollections() {
  if (!collections) {
    throw new Error('Database is not connected');
  }
  return collections;
}

module.exports = {
  client,
  connectDatabase,
  getCollections
};
