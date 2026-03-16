const { MongoClient } = require('mongodb');
require('dotenv').config();

// Cấu hình kết nối MongoDB
const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const dbName = process.env.DB_NAME || "dacsan3mien";
const collectionName = "Product";

// Định nghĩa mapping từ category sang type
const categoryToTypeMapping = {
  // Thực phẩm khô
  'Thực phẩm khô': 'dried_food',
  'Đồ khô': 'dried_food',
  'Hạt khô': 'dried_food',
  'Nông sản khô': 'dried_food',
  'Khô': 'dried_food',
  
  // Thức uống
  'Đồ uống': 'beverages',
  'Thức uống': 'beverages',
  'Trà': 'beverages',
  'Cà phê': 'beverages',
  'Nước uống': 'beverages',
  'Uống': 'beverages',
  
  // Bánh kẹo
  'Bánh kẹo': 'sweets',
  'Bánh': 'sweets',
  'Kẹo': 'sweets',
  'Đồ ngọt': 'sweets',
  'Bánh trái': 'sweets',
  'Kẹo dẻo': 'sweets',
  
  // Thực phẩm đông lạnh
  'Thực phẩm đông lạnh': 'frozen_food',
  'Đông lạnh': 'frozen_food',
  'Thực phẩm tươi': 'frozen_food',
  'Thịt cá': 'frozen_food',
  'Tươi': 'frozen_food',
  
  // Gia vị
  'Gia vị': 'spices',
  'Gia vị nêm': 'spices',
  'Tương ớt': 'spices',
  'Nước mắm': 'spices',
  'Muối': 'spices',
  'Nêm nếm': 'spices',
  
  // Thực phẩm chung
  'Thực phẩm': 'general_food',
  'Đặc sản': 'general_food',
  'Nông sản': 'general_food',
  'Chế biến': 'general_food'
};

// Hàm xác định type dựa trên tên sản phẩm và mô tả
function determineProductType(product) {
  const name = (product.product_name || '').toLowerCase();
  const detail = (product.product_detail || '').toLowerCase();
  const category = (product.product_dept || '').toLowerCase();
  
  // Kiểm tra product_dept trước
  if (category) {
    for (const [cat, type] of Object.entries(categoryToTypeMapping)) {
      if (category.includes(cat.toLowerCase())) {
        return type;
      }
    }
  }
  
  // Kiểm tra tên sản phẩm
  if (name.includes('bánh') || name.includes('kẹo') || name.includes('bánh kẹo')) {
    return 'sweets';
  }
  if (name.includes('trà') || name.includes('cà phê') || name.includes('nước') || name.includes('đồ uống')) {
    return 'beverages';
  }
  if (name.includes('khô') || name.includes('sấy') || name.includes('hạt')) {
    return 'dried_food';
  }
  if (name.includes('đông lạnh') || name.includes('tươi') || name.includes('thịt') || name.includes('cá')) {
    return 'frozen_food';
  }
  if (name.includes('gia vị') || name.includes('tương') || name.includes('nước mắm') || name.includes('muối')) {
    return 'spices';
  }
  
  // Kiểm tra mô tả sản phẩm
  if (detail.includes('bánh') || detail.includes('kẹo') || detail.includes('ngọt')) {
    return 'sweets';
  }
  if (detail.includes('trà') || detail.includes('cà phê') || detail.includes('uống')) {
    return 'beverages';
  }
  if (detail.includes('khô') || detail.includes('sấy') || detail.includes('hạt')) {
    return 'dried_food';
  }
  if (detail.includes('đông lạnh') || detail.includes('tươi') || detail.includes('thịt')) {
    return 'frozen_food';
  }
  if (detail.includes('gia vị') || detail.includes('tương') || detail.includes('nước mắm')) {
    return 'spices';
  }
  
  // Mặc định là thực phẩm chung
  return 'general_food';
}

async function updateProductsWithType() {
  const client = new MongoClient(mongoUri);
  
  try {
    console.log('🔌 Đang kết nối MongoDB...');
    await client.connect();
    console.log('✅ Kết nối MongoDB thành công');
    
    const database = client.db(dbName);
    const collection = database.collection(collectionName);
    
    // Lấy tất cả sản phẩm
    console.log('📦 Đang lấy danh sách sản phẩm...');
    const products = await collection.find({}).toArray();
    console.log(`📊 Tìm thấy ${products.length} sản phẩm trong database`);
    
    if (products.length === 0) {
      console.log('❌ Không có sản phẩm nào trong database');
      return;
    }
    
    // Hiển thị một vài sản phẩm mẫu để kiểm tra
    console.log('\n📋 Mẫu sản phẩm hiện tại:');
    products.slice(0, 3).forEach((product, index) => {
      console.log(`${index + 1}. ${product.product_name} (dept: ${product.product_dept || 'N/A'})`);
    });
    
    console.log('\n🔄 Bắt đầu cập nhật trường type...');
    
    let updatedCount = 0;
    const typeStats = {};
    
    // Cập nhật từng sản phẩm
    for (const product of products) {
      const type = determineProductType(product);
      
      // Cập nhật sản phẩm với trường type
      await collection.updateOne(
        { _id: product._id },
        { $set: { type: type } }
      );
      
      updatedCount++;
      typeStats[type] = (typeStats[type] || 0) + 1;
      
      if (updatedCount % 10 === 0) {
        console.log(`⏳ Đã cập nhật ${updatedCount}/${products.length} sản phẩm...`);
      }
    }
    
    console.log(`\n✅ Hoàn thành cập nhật ${updatedCount} sản phẩm`);
    
    // Hiển thị thống kê
    console.log('\n📊 Thống kê phân loại sản phẩm:');
    Object.entries(typeStats).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} sản phẩm`);
    });
    
    // Kiểm tra kết quả
    console.log('\n🔍 Kiểm tra kết quả...');
    const sampleProducts = await collection.find({}).limit(5).toArray();
    console.log('\n📋 Mẫu sản phẩm sau khi cập nhật:');
    sampleProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.product_name} -> type: ${product.type}`);
    });
    
    console.log('\n🎉 Cập nhật hoàn tất! Tất cả sản phẩm đã có trường type.');
    
  } catch (error) {
    console.error('❌ Lỗi khi cập nhật:', error);
  } finally {
    await client.close();
    console.log('🔌 Đã đóng kết nối MongoDB');
  }
}

// Chạy script
console.log('🚀 Bắt đầu cập nhật trường type cho sản phẩm trong MongoDB...\n');
updateProductsWithType();
