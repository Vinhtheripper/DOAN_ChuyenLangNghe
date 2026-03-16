const { MongoClient } = require('mongodb');
require('dotenv').config();

async function checkMongoDB() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017');
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(process.env.DB_NAME || 'dacsan3mien');
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('\n📁 Available collections:');
    collections.forEach(col => console.log(`   - ${col.name}`));
    
    // Check document counts
    console.log('\n📊 Document counts:');
    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      console.log(`   ${col.name}: ${count} documents`);
    }
    
    // Check Product collection specifically
    if (collections.some(c => c.name === 'Product')) {
      console.log('\n🛍️ Product collection details:');
      const productCount = await db.collection('Product').countDocuments();
      console.log(`   Total products: ${productCount}`);
      
      // Show some sample products
      const sampleProducts = await db.collection('Product').find().limit(5).toArray();
      console.log('\n   Sample products:');
      sampleProducts.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.product_name || 'Unknown'}`);
      });
      
      // Check for any products with specific criteria
      const productsWithDiscount = await db.collection('Product').countDocuments({ discount: { $gt: 0 } });
      console.log(`   Products with discount: ${productsWithDiscount}`);
      
      const productsInStock = await db.collection('Product').countDocuments({ stocked_quantity: { $gt: 0 } });
      console.log(`   Products in stock: ${productsInStock}`);
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

checkMongoDB();
