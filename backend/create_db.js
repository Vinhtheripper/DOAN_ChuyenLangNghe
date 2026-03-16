/**
 * Tạo DB backend, khong seed product mock.
 * Chạy: node create_db.js
 */
require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const { sampleBlogs } = require('./seed_blogs');
const { sampleContacts } = require('./seed_contacts');

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const dbName = process.env.DB_NAME || 'dacsan3mien';
const COLLECTIONS = ['Product', 'User', 'Order', 'Feedback', 'Cart', 'Blog', 'ProductReview', 'Coupon'];

function convertIds(obj) {
  if (Array.isArray(obj)) return obj.map(convertIds);
  if (obj && typeof obj === 'object') {
    const newObj = {};
    for (const key in obj) {
      if (key === '_id' && obj[key] && obj[key].$oid) {
        newObj[key] = new ObjectId(obj[key].$oid);
      } else {
        newObj[key] = convertIds(obj[key]);
      }
    }
    return newObj;
  }
  return obj;
}

async function buildFallbackUsers() {
  const password = await bcrypt.hash('112233', 10);
  return [
    {
      profileName: 'Admin',
      email: 'admin@uel.edu.vn',
      password,
      role: 'admin',
      action: 'edit all',
      avatar: '',
      memberPoints: 0,
      memberTier: 'Member'
    },
    {
      profileName: 'User',
      email: 'user@uel.edu.vn',
      password,
      role: 'user',
      action: 'just view',
      avatar: '',
      memberPoints: 0,
      memberTier: 'Member'
    }
  ];
}

function normalizeObjectId(value) {
  if (value instanceof ObjectId) return value;
  if (ObjectId.isValid(value)) return new ObjectId(value);
  return new ObjectId();
}

async function createDatabase() {
  const client = new MongoClient(mongoUri);

  try {
    console.log('Dang ket noi MongoDB...');
    await client.connect();
    console.log('Ket noi thanh cong.\n');

    const db = client.db(dbName);

    console.log('Tao collections:');
    for (const colName of COLLECTIONS) {
      const exists = await db.listCollections({ name: colName }).toArray();
      if (exists.length > 0) {
        await db.collection(colName).drop();
        console.log(`- ${colName}: da xoa va tao lai`);
      }
      await db.createCollection(colName);
      console.log(`- ${colName}: OK`);
    }

    const userJsonPath = path.join(__dirname, 'EYECONIC.User.json');
    let users = [];

    if (fs.existsSync(userJsonPath)) {
      const userData = JSON.parse(fs.readFileSync(userJsonPath, 'utf-8'));
      users = convertIds(userData);
      console.log(`\nImport user tu EYECONIC.User.json: ${users.length}`);
    } else {
      users = await buildFallbackUsers();
      console.log('\nKhong tim thay EYECONIC.User.json -> dung user mock mac dinh');
    }

    const userInsertResult = await db.collection('User').insertMany(users);
    await db.collection('Blog').insertMany(sampleBlogs);
    await db.collection('Feedback').insertMany(sampleContacts);

    const adminIndex = Math.max(users.findIndex((u) => u.email === 'admin@uel.edu.vn'), 0);
    const adminUser = users[adminIndex] || users[0];
    const adminUserId = normalizeObjectId(adminUser?._id || userInsertResult.insertedIds[adminIndex]);

    const now = new Date();

    await db.collection('Coupon').insertMany([
      {
        code: 'SALE10',
        description: 'Giảm 10% cho toàn bộ giỏ hàng',
        type: 'percentage',
        percentageOff: 10,
        minItems: null,
        discountAmount: null,
        usageLimit: 1000,
        usedCount: 0,
        isActive: true,
        validFrom: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        validTo: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
        createdAt: now,
        updatedAt: now,
        createdBy: adminUserId
      },
      {
        code: 'MUA3GIAM50K',
        description: 'Mua từ 3 món giảm 50.000đ',
        type: 'item_threshold_amount',
        percentageOff: null,
        minItems: 3,
        discountAmount: 50000,
        usageLimit: 1000,
        usedCount: 0,
        isActive: true,
        validFrom: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        validTo: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
        createdAt: now,
        updatedAt: now,
        createdBy: adminUserId
      }
    ]);

    console.log(`\nSeed xong: User(${users.length}), Blog(${sampleBlogs.length}), Feedback(${sampleContacts.length}), Coupon(2)`);
    console.log('Product/Order/Cart/ProductReview khong seed mock. Hay import du lieu that sau khi tao DB.');
    console.log(`Collections de trong: Product(0), Order(0), Cart(0), ProductReview(0).`);
    console.log(`\nDB san sang: ${dbName}`);
    console.log('Tai khoan mac dinh (neu dung fallback): admin@uel.edu.vn / user@uel.edu.vn - mat khau 112233\n');
  } catch (err) {
    console.error('\nLoi:', err.message);
    if (err.message.includes('ECONNREFUSED')) {
      console.log('-> Kiem tra MongoDB da chay chua.');
    }
    process.exit(1);
  } finally {
    await client.close();
    console.log('Da dong ket noi MongoDB.');
  }
}

if (require.main === module) {
  createDatabase();
}

module.exports = { createDatabase };
