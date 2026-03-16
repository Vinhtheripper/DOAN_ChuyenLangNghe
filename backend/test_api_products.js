const fetch = require('node-fetch');

async function testProductsAPI() {
  try {
    console.log('🔍 Đang kiểm tra API sản phẩm...');
    
    // Test API lấy tất cả sản phẩm
    const response = await fetch('http://localhost:3002/products?limit=100');
    const data = await response.json();
    
    console.log(`📊 Tổng số sản phẩm: ${data.total}`);
    console.log(`📦 Số sản phẩm trả về: ${data.products.length}`);
    
    // Kiểm tra trường type
    const productsWithType = data.products.filter(p => p.type);
    const productsWithoutType = data.products.filter(p => !p.type);
    
    console.log(`✅ Sản phẩm có trường type: ${productsWithType.length}`);
    console.log(`❌ Sản phẩm thiếu trường type: ${productsWithoutType.length}`);
    
    // Thống kê theo type
    const typeStats = {};
    productsWithType.forEach(product => {
      const type = product.type || 'unknown';
      typeStats[type] = (typeStats[type] || 0) + 1;
    });
    
    console.log('\n📊 Thống kê phân loại sản phẩm:');
    Object.entries(typeStats).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} sản phẩm`);
    });
    
    // Hiển thị mẫu sản phẩm
    console.log('\n📋 Mẫu sản phẩm:');
    data.products.slice(0, 5).forEach((product, index) => {
      console.log(`${index + 1}. ${product.product_name} -> type: ${product.type || 'N/A'}`);
    });
    
    if (productsWithoutType.length > 0) {
      console.log('\n⚠️  Các sản phẩm thiếu trường type:');
      productsWithoutType.slice(0, 3).forEach((product, index) => {
        console.log(`${index + 1}. ${product.product_name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Lỗi khi kiểm tra API:', error.message);
  }
}

// Chạy test
console.log('🚀 Bắt đầu kiểm tra API sản phẩm...\n');
testProductsAPI();
