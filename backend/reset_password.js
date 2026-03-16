/**
 * Reset mật khẩu admin@uel.edu.vn và user@uel.edu.vn về 112233
 * Chạy: node reset_password.js
 */
require('dotenv').config();
const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const dbName = process.env.DB_NAME || 'dacsan3mien';

async function resetPasswords() {
  const client = new MongoClient(mongoUri);
  const newPassword = '112233';
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  try {
    await client.connect();
    const db = client.db(dbName);
    const userCollection = db.collection('User');

    const result = await userCollection.updateMany(
      { email: { $in: ['admin@uel.edu.vn', 'user@uel.edu.vn'] } },
      { $set: { password: hashedPassword } }
    );

    console.log(`Đã reset mật khẩu ${result.modifiedCount} tài khoản về "112233"`);
    console.log('admin@uel.edu.vn / user@uel.edu.vn - mật khẩu: 112233');
  } catch (err) {
    console.error('Lỗi:', err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

resetPasswords();
