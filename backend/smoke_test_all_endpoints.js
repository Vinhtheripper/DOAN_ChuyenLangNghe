/*
 * Smoke test for backend endpoints (auth + CRUD core flows)
 * Usage:
 *   node smoke_test_all_endpoints.js
 * Optional env:
 *   BASE_URL=http://localhost:3002
 *   ADMIN_EMAIL=admin@uel.edu.vn
 *   ADMIN_PASSWORD=112233
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@uel.edu.vn';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '112233';

class ApiClient {
  constructor(name) {
    this.name = name;
    this.cookie = '';
  }

  async req(method, path, body, extra = {}) {
    const headers = { ...(extra.headers || {}) };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (this.cookie) headers.Cookie = this.cookie;

    const fetchFn = global.fetch || (await import('node-fetch')).default;

    const res = await fetchFn(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined
    });

    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      this.cookie = setCookie.split(',').map((v) => v.split(';')[0]).join('; ');
    }

    const contentType = res.headers.get('content-type') || '';
    let payload;
    if (contentType.includes('application/json')) {
      payload = await res.json();
    } else {
      payload = await res.text();
    }

    return { ok: res.ok, status: res.status, payload, headers: res.headers };
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function run() {
  const admin = new ApiClient('admin');
  const user = new ApiClient('user');

  const unique = Date.now();
  const userEmail = `smoke_user_${unique}@example.com`;
  const userPassword = '112233';

  const ids = {
    productId: null,
    feedbackId: null,
    blogId: null,
    orderId: null,
    userId: null,
    couponId: null
  };

  console.log(`Running smoke test against: ${BASE_URL}`);

  // Public checks
  let r = await user.req('GET', '/products?page=1&limit=5');
  assert(r.ok, `GET /products failed: ${r.status}`);

  r = await user.req('POST', '/feedback', {
    fullName: 'Smoke Test User',
    email: userEmail,
    phone: '0900000000',
    message: 'Smoke test feedback'
  });
  assert(r.ok, `POST /feedback failed: ${r.status}`);
  ids.feedbackId = r.payload.feedbackId;

  // User auth + profile
  r = await user.req('POST', '/user/signup', {
    profileName: 'Smoke User',
    email: userEmail,
    password: userPassword,
    gender: 'other',
    marketing: true
  });
  assert(r.ok, `POST /user/signup failed: ${r.status}`);
  ids.userId = r.payload.userId;

  r = await user.req('POST', '/user/login', {
    email: userEmail,
    password: userPassword,
    rememberMe: false
  });
  assert(r.ok, `POST /user/login failed: ${r.status}`);

  r = await user.req('GET', '/user/profile');
  assert(r.ok, `GET /user/profile failed: ${r.status}`);

  // Admin auth
  r = await admin.req('POST', '/user/login', {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    rememberMe: false
  });
  assert(r.ok, `Admin login failed: ${r.status}. Check admin seed data.`);

  // Product CRUD (admin)
  r = await admin.req('POST', '/products', {
    product_name: `Smoke Product ${unique}`,
    product_detail: 'created by smoke test',
    stocked_quantity: 50,
    unit_price: 120000,
    discount: 0,
    product_dept: 'Thuc pham',
    type: 'general_food',
    rating: 5,
    image_1: ''
  });
  assert(r.ok, `POST /products failed: ${r.status}`);
  ids.productId = r.payload.productId;

  r = await user.req('GET', `/products/${ids.productId}`);
  assert(r.ok, `GET /products/:id failed: ${r.status}`);

  r = await admin.req('PATCH', `/products/${ids.productId}`, {
    stocked_quantity: 45,
    unit_price: 110000
  });
  assert(r.ok, `PATCH /products/:id failed: ${r.status}`);

  // Coupon create + validate (admin/user)
  const couponCode = `SMOKE${unique}`;
  r = await admin.req('POST', '/coupons', {
    code: couponCode,
    description: 'Smoke coupon 10%',
    type: 'percentage',
    percentageOff: 10,
    usageLimit: 10,
    isActive: true
  });
  assert(r.ok, `POST /coupons failed: ${r.status}`);
  ids.couponId = r.payload.couponId;

  r = await user.req('POST', '/coupons/validate', {
    code: couponCode,
    selectedItems: [{ quantity: 1, unit_price: 110000 }]
  });
  assert(r.ok, `POST /coupons/validate failed: ${r.status}`);

  // Product review (user)
  r = await user.req('POST', `/products/${ids.productId}/reviews`, {
    rating: 5,
    comment: 'Smoke review'
  });
  assert(r.ok, `POST /products/:id/reviews failed: ${r.status}`);

  r = await user.req('GET', `/products/${ids.productId}/reviews?page=1&limit=5`);
  assert(r.ok, `GET /products/:id/reviews failed: ${r.status}`);

  // Cart flow (user)
  r = await user.req('POST', '/cart/add', {
    productId: ids.productId,
    quantity: 2,
    unit_price: 110000
  });
  assert(r.ok, `POST /cart/add failed: ${r.status}`);

  r = await user.req('GET', '/cart');
  assert(r.ok, `GET /cart failed: ${r.status}`);

  r = await user.req('PATCH', '/cart/update', {
    productId: ids.productId,
    quantity: 1
  });
  assert(r.ok, `PATCH /cart/update failed: ${r.status}`);

  r = await user.req('POST', '/cart/saveSelectedItems', {
    selectedItems: [{ productId: ids.productId, quantity: 1 }]
  });
  assert(r.ok, `POST /cart/saveSelectedItems failed: ${r.status}`);

  // Order flow
  r = await user.req('POST', '/orders', {
    selectedItems: [{ _id: ids.productId, quantity: 1, unit_price: 110000 }],
    totalPrice: 99000,
    couponCode,
    couponDiscount: 11000,
    paymentMethod: 'cod',
    shippingAddress: {
      firstName: 'Smoke',
      lastName: 'User',
      address: 'Smoke Address',
      province: 'HCM',
      district: 'District 1',
      ward: 'Ward 1',
      email: userEmail,
      phone: '0900000000'
    }
  });
  assert(r.ok, `POST /orders failed: ${r.status}`);
  ids.orderId = r.payload.orderId;

  r = await user.req('GET', '/orders/me?page=1&limit=5');
  assert(r.ok, `GET /orders/me failed: ${r.status}`);

  r = await user.req('GET', `/orders/history/${ids.userId}`);
  assert(r.ok, `GET /orders/history/:userId failed: ${r.status}`);

  r = await admin.req('GET', '/orders?page=1&limit=5');
  assert(r.ok, `GET /orders failed: ${r.status}`);

  r = await admin.req('PATCH', `/orders/${ids.orderId}/status`, { status: 'completed' });
  assert(r.ok, `PATCH /orders/:id/status failed: ${r.status}`);

  // Invoice (binary response)
  const fetchFn = global.fetch || (await import('node-fetch')).default;
  const invoiceRes = await fetchFn(`${BASE_URL}/orders/${ids.orderId}/invoice`, {
    method: 'GET',
    headers: { Cookie: user.cookie }
  });
  assert(invoiceRes.ok, `GET /orders/:id/invoice failed: ${invoiceRes.status}`);

  // Blogs CRUD (admin)
  r = await admin.req('POST', '/blogs', {
    title: `Smoke Blog ${unique}`,
    description: 'Smoke description',
    content: 'Smoke content',
    published: true
  });
  assert(r.ok, `POST /blogs failed: ${r.status}`);
  ids.blogId = r.payload.blogId;

  r = await user.req('GET', '/blogs?page=1&limit=5');
  assert(r.ok, `GET /blogs failed: ${r.status}`);

  r = await admin.req('PATCH', `/blogs/${ids.blogId}`, { description: 'Updated by smoke test' });
  assert(r.ok, `PATCH /blogs/:id failed: ${r.status}`);

  r = await admin.req('GET', '/blogs/admin/list?page=1&limit=5&search=Smoke');
  assert(r.ok, `GET /blogs/admin/list failed: ${r.status}`);

  // Feedback admin endpoints
  r = await admin.req('GET', '/feedback?page=1&limit=10');
  assert(r.ok, `GET /feedback failed: ${r.status}`);

  if (ids.feedbackId) {
    r = await admin.req('PATCH', `/feedback/${ids.feedbackId}/status`, { status: 'read' });
    assert(r.ok, `PATCH /feedback/:id/status failed: ${r.status}`);
  }

  // Dashboard endpoints (admin)
  r = await admin.req('GET', '/dashboard/stats');
  assert(r.ok, `GET /dashboard/stats failed: ${r.status}`);
  assert(Array.isArray(r.payload.salesData), 'dashboard stats missing salesData');

  r = await admin.req('GET', '/dashboard/activities');
  assert(r.ok, `GET /dashboard/activities failed: ${r.status}`);

  // Cleanup
  if (ids.blogId) {
    r = await admin.req('DELETE', `/blogs/${ids.blogId}`);
    assert(r.ok, `DELETE /blogs/:id failed: ${r.status}`);
  }

  if (ids.orderId) {
    r = await admin.req('DELETE', `/orders/${ids.orderId}`);
    assert(r.ok, `DELETE /orders/:orderId failed: ${r.status}`);
  }

  if (ids.productId) {
    r = await admin.req('DELETE', `/products/${ids.productId}`);
    assert(r.ok, `DELETE /products/:id failed: ${r.status}`);
  }

  if (ids.feedbackId) {
    r = await admin.req('DELETE', `/feedback/${ids.feedbackId}`);
    assert(r.ok, `DELETE /feedback/:id failed: ${r.status}`);
  }

  if (ids.couponId) {
    r = await admin.req('PATCH', `/coupons/${ids.couponId}`, { isActive: false });
    assert(r.ok, `PATCH /coupons/:id failed: ${r.status}`);
  }

  if (ids.userId) {
    r = await admin.req('DELETE', `/user/delete/${ids.userId}`);
    assert(r.ok, `DELETE /user/delete/:userId failed: ${r.status}`);
  }

  await user.req('GET', '/user/logout');
  await admin.req('GET', '/user/logout');

  console.log('Smoke test PASSED: auth + CRUD + dashboard + invoice');
}

run().catch((err) => {
  console.error('Smoke test FAILED:', err.message);
  process.exit(1);
});
