// Test script for Contact/Feedback API
const http = require('http');

console.log('Testing Contact API...\n');

// Test 1: Create a new contact (public endpoint)
const testCreateContact = () => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      fullName: 'Test User',
      email: 'test@example.com',
      phone: '0900000000',
      message: 'This is a test message from API test script.'
    });

    const options = {
      hostname: 'localhost',
      port: 3002,
      path: '/feedback',
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
          console.log('✅ POST /feedback - SUCCESS (Create contact)');
          console.log('   Contact created successfully\n');
          resolve();
        } else {
          console.log('❌ POST /feedback - FAILED');
          console.log(`   Status: ${res.statusCode}`);
          console.log(`   Response: ${data}\n`);
          reject();
        }
      });
    });

    req.on('error', err => {
      console.log('❌ POST /feedback - ERROR');
      console.log(`   ${err.message}\n`);
      reject(err);
    });

    req.write(postData);
    req.end();
  });
};

// Test 2: Get contacts (admin endpoint - will fail without auth)
const testGetContacts = () => {
  return new Promise((resolve) => {
    http.get('http://localhost:3002/feedback', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ GET /feedback - SUCCESS');
          const result = JSON.parse(data);
          console.log(`   Found ${result.total} contacts\n`);
          resolve();
        } else if (res.statusCode === 401 || res.statusCode === 403) {
          console.log('⚠️  GET /feedback - AUTHENTICATION REQUIRED');
          console.log('   (This is expected - need to be logged in as admin)\n');
          resolve();
        } else {
          console.log('❌ GET /feedback - FAILED');
          console.log(`   Status: ${res.statusCode}\n`);
          resolve();
        }
      });
    }).on('error', err => {
      console.log('❌ GET /feedback - ERROR');
      console.log(`   ${err.message}`);
      console.log('   ⚠️  Make sure backend is running on port 3002!\n');
      resolve();
    });
  });
};

// Run tests
(async () => {
  try {
    console.log('====================================');
    console.log('Starting Contact API Tests');
    console.log('====================================\n');
    
    await testCreateContact();
    await testGetContacts();
    
    console.log('====================================');
    console.log('All tests completed!');
    console.log('====================================\n');
    console.log('Next steps:');
    console.log('1. Make sure backend is running: node index.js');
    console.log('2. Run: node seed_contacts.js');
    console.log('3. Login to admin panel');
    console.log('4. Visit: http://localhost:4200/admin/contact-adm\n');
  } catch (err) {
    console.log('\n❌ Tests failed. Check the errors above.');
    console.log('\nMake sure:');
    console.log('1. Backend is running (node index.js)');
    console.log('2. MongoDB is running');
    console.log('3. Port 3002 is available\n');
    process.exit(1);
  }
})();

