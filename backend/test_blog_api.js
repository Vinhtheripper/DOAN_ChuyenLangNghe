// Test script for Blog API
const http = require('http');

console.log('Testing Blog API...\n');

// Test 1: Get all blogs (public)
const testPublicBlogs = () => {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:3002/blogs', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ GET /blogs - SUCCESS');
          const result = JSON.parse(data);
          console.log(`   Found ${result.total} blogs\n`);
          resolve();
        } else {
          console.log('❌ GET /blogs - FAILED');
          console.log(`   Status: ${res.statusCode}\n`);
          reject();
        }
      });
    }).on('error', err => {
      console.log('❌ GET /blogs - ERROR');
      console.log(`   ${err.message}\n`);
      reject(err);
    });
  });
};

// Test 2: Create a sample blog
const testCreateBlog = () => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      title: 'Test Blog',
      description: 'This is a test blog',
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      author: 'Admin',
      published: true
    });

    const options = {
      hostname: 'localhost',
      port: 3002,
      path: '/blogs',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 201) {
          console.log('✅ POST /blogs - SUCCESS');
          console.log('   Blog created successfully\n');
          resolve();
        } else if (res.statusCode === 401 || res.statusCode === 403) {
          console.log('⚠️  POST /blogs - AUTHENTICATION REQUIRED');
          console.log('   (This is expected - need to be logged in as admin)\n');
          resolve();
        } else {
          console.log('❌ POST /blogs - FAILED');
          console.log(`   Status: ${res.statusCode}\n`);
          reject();
        }
      });
    });

    req.on('error', err => {
      console.log('❌ POST /blogs - ERROR');
      console.log(`   ${err.message}\n`);
      reject(err);
    });

    req.write(postData);
    req.end();
  });
};

// Run tests
(async () => {
  try {
    console.log('====================================');
    console.log('Starting Blog API Tests');
    console.log('====================================\n');
    
    await testPublicBlogs();
    await testCreateBlog();
    
    console.log('====================================');
    console.log('All tests completed!');
    console.log('====================================\n');
    console.log('If you see errors, make sure:');
    console.log('1. Backend is running (node index.js)');
    console.log('2. MongoDB is running');
    console.log('3. Port 3002 is available\n');
  } catch (err) {
    console.log('\n❌ Tests failed. Check the errors above.');
    process.exit(1);
  }
})();

