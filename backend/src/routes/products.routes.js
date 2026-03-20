const express = require('express');
const { ObjectId } = require('mongodb');
const { getCollections } = require('../config/database');
const { requireAuth, requireAdmin, requireRoleAction } = require('../middlewares/auth');

const router = express.Router();
const PRODUCT_LIST_CACHE_TTL_MS = 60 * 1000;
const productListCache = new Map();
const productImageCache = new Map();

const logProductsError = (action, err, extra = {}) => {
  console.error(`[products] ${action} failed`, {
    message: err.message,
    stack: err.stack,
    ...extra
  });
};
const PRODUCT_SORT = { updatedAt: -1, createdAt: -1, _id: -1 };
const PRODUCT_NEW_DAYS = 30;

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parseBoolean = (value) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return null;
};

const getProductListHint = (filter) => {
  if (filter.product_dept && filter.type) {
    return { product_dept: 1, type: 1, updatedAt: -1, createdAt: -1, _id: -1 };
  }
  if (filter.product_dept) {
    return { product_dept: 1, updatedAt: -1, createdAt: -1, _id: -1 };
  }
  if (filter.type) {
    return { type: 1, updatedAt: -1, createdAt: -1, _id: -1 };
  }
  return { updatedAt: -1, createdAt: -1, _id: -1 };
};

const getCachedProductList = (key) => {
  const entry = productListCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    productListCache.delete(key);
    return null;
  }
  return entry.value;
};

const setCachedProductList = (key, value) => {
  productListCache.set(key, {
    value,
    expiresAt: Date.now() + PRODUCT_LIST_CACHE_TTL_MS
  });
};

const getCachedProductImage = (key) => {
  const entry = productImageCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    productImageCache.delete(key);
    return null;
  }
  return entry.value;
};

const setCachedProductImage = (key, value) => {
  productImageCache.set(key, {
    value,
    expiresAt: Date.now() + 5 * 60 * 1000
  });
};

const getImageFieldName = (slot) => {
  if (![1, 2, 3, 4, 5].includes(slot)) {
    return null;
  }
  return `image_${slot}`;
};

const parseImagePayload = (value) => {
  if (!value || typeof value !== 'string') {
    return null;
  }

  if (value.startsWith('data:')) {
    const match = value.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
      return null;
    }
    return {
      kind: 'binary',
      contentType: match[1],
      buffer: Buffer.from(match[2], 'base64')
    };
  }

  if (/^https?:\/\//i.test(value)) {
    return {
      kind: 'redirect',
      location: value
    };
  }

  if (value.startsWith('/assets/') || value.startsWith('assets/')) {
    return {
      kind: 'passthrough',
      location: value.startsWith('/') ? value : `/${value}`
    };
  }

  return null;
};

const normalizeListImage = (product, apiBaseUrl) => {
  if (!product?.image_1 || typeof product.image_1 !== 'string') {
    return product;
  }

  if (product.image_1.startsWith('data:image/')) {
    return {
      ...product,
      image_1: `${apiBaseUrl}/products/${product._id}/image/1`
    };
  }

  if (/^https?:\/\//i.test(product.image_1)) {
    return product;
  }

  if (product.image_1.startsWith('/assets/') || product.image_1.startsWith('assets/')) {
    return product;
  }

  return {
    ...product,
    image_1: `${apiBaseUrl}/products/${product._id}/image/1`
  };
};

const normalizeDetailImages = (product, apiBaseUrl) => {
  if (!product) {
    return product;
  }

  const normalized = { ...product };

  for (const slot of [1, 2, 3, 4, 5]) {
    const field = `image_${slot}`;
    const value = normalized[field];
    if (!value || typeof value !== 'string') {
      continue;
    }

    if (/^https?:\/\//i.test(value) || value.startsWith('/assets/') || value.startsWith('assets/')) {
      continue;
    }

    normalized[field] = `${apiBaseUrl}/products/${product._id}/image/${slot}`;
  }

  return normalized;
};

const buildProductFilter = (query) => {
  const filter = {};
  const productDept = typeof query.dept === 'string' ? query.dept.trim() : '';
  const productType = typeof query.type === 'string' ? query.type.trim() : '';
  const search = typeof query.search === 'string' ? query.search.trim() : '';
  const minPrice = Number(query.minPrice);
  const maxPrice = Number(query.maxPrice);
  const minRating = Number(query.minRating);
  const onlyDiscounted = parseBoolean(query.discount);
  const onlyNew = parseBoolean(query.isNew);
  const inStock = parseBoolean(query.inStock);

  if (productDept) filter.product_dept = productDept;
  if (productType) filter.type = productType;
  if (search) {
    const pattern = new RegExp(escapeRegex(search), 'i');
    filter.$or = [
      { product_name: pattern },
      { product_detail: pattern }
    ];
  }
  if (!Number.isNaN(minPrice) || !Number.isNaN(maxPrice)) {
    filter.unit_price = {};
    if (!Number.isNaN(minPrice)) filter.unit_price.$gte = minPrice;
    if (!Number.isNaN(maxPrice)) filter.unit_price.$lte = maxPrice;
  }
  if (!Number.isNaN(minRating)) {
    filter.rating = { $gte: minRating };
  }
  if (onlyDiscounted === true) {
    filter.discount = { $gt: 0 };
  }
  if (onlyNew === true) {
    filter.createdAt = { $gte: new Date(Date.now() - PRODUCT_NEW_DAYS * 24 * 60 * 60 * 1000) };
  }
  if (inStock === true) {
    filter.stocked_quantity = { $gt: 0 };
  }
  if (inStock === false) {
    filter.stocked_quantity = { $lte: 0 };
  }

  return filter;
};

const getProductSort = (sortBy) => {
  if (sortBy === 'price_asc') return { unit_price: 1, _id: -1 };
  if (sortBy === 'price_desc') return { unit_price: -1, _id: -1 };
  if (sortBy === 'rating_desc') return { rating: -1, updatedAt: -1, _id: -1 };
  return PRODUCT_SORT;
};

const getCatalogMetaCacheKey = () => 'catalog-meta';

router.get('/meta/catalog', async (_req, res) => {
  try {
    const cached = getCachedProductList(getCatalogMetaCacheKey());
    if (cached) {
      return res.status(200).json(cached);
    }

    const { productCollection } = getCollections();
    const [provinceStats, priceStats] = await Promise.all([
      productCollection.aggregate([
        { $match: { product_dept: { $nin: [null, ''] } } },
        {
          $group: {
            _id: '$product_dept',
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]).toArray(),
      productCollection.aggregate([
        {
          $group: {
            _id: null,
            minPrice: { $min: '$unit_price' },
            maxPrice: { $max: '$unit_price' }
          }
        }
      ]).toArray()
    ]);

    const response = {
      provinces: provinceStats.map((item) => item._id).filter(Boolean).sort((a, b) => a.localeCompare(b, 'vi')),
      provinceCounts: provinceStats.reduce((acc, item) => {
        if (item._id) {
          acc[item._id] = item.count;
        }
        return acc;
      }, {}),
      minPrice: priceStats[0]?.minPrice ?? 0,
      maxPrice: priceStats[0]?.maxPrice ?? 5000000
    };

    setCachedProductList(getCatalogMetaCacheKey(), response);
    res.set('Cache-Control', 'public, max-age=60');
    return res.status(200).json(response);
  } catch (err) {
    logProductsError('catalog meta', err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/', async (req, res) => {
  try {
    const { productCollection } = getCollections();
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const skip = (page - 1) * limit;
    const sort = typeof req.query.sort === 'string' ? req.query.sort : '';
    const includeImages = req.query.includeImages === 'all'
      ? 'all'
      : req.query.includeImages === 'primary'
        ? 'primary'
        : 'none';

    const filter = buildProductFilter(req.query);

    const projection = {
      product_name: 1,
      product_detail: 1,
      stocked_quantity: 1,
      unit_price: 1,
      discount: 1,
      product_dept: 1,
      type: 1,
      rating: 1,
      createdAt: 1,
      updatedAt: 1,
    };

    if (includeImages === 'primary' || includeImages === 'all') {
      projection.image_1 = 1;
    }

    if (includeImages === 'all') {
      projection.image_2 = 1;
      projection.image_3 = 1;
      projection.image_4 = 1;
      projection.image_5 = 1;
    }

    const sortSpec = getProductSort(sort);
    const cacheKey = JSON.stringify({ page, limit, filter, includeImages, sortSpec });
    const cached = getCachedProductList(cacheKey);
    if (cached) {
      res.set('Cache-Control', 'public, max-age=60');
      return res.status(200).json(cached);
    }

    const hint = getProductListHint(filter);
    const [products, total] = await Promise.all([
      productCollection
        .find(filter, { projection, hint })
        .sort(sortSpec)
        .allowDiskUse(true)
        .skip(skip)
        .limit(limit)
        .toArray(),
      productCollection.countDocuments(filter, { hint })
    ]);
    const apiBaseUrl = `${req.protocol}://${req.get('host')}`;
    const response = {
      products: products.map((product) => normalizeListImage(product, apiBaseUrl)),
      total,
      page,
      pages: Math.ceil(total / limit)
    };

    setCachedProductList(cacheKey, response);
    res.set('Cache-Control', 'public, max-age=60');
    return res.status(200).json(response);
  } catch (err) {
    logProductsError('list products', err, { query: req.query });
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/:id/image/:slot', async (req, res) => {
  try {
    const { productCollection, productImageCollection } = getCollections();
    const slot = Number(req.params.slot);
    const imageField = getImageFieldName(slot);

    if (!imageField) {
      return res.status(400).json({ message: 'Invalid image slot' });
    }

    const cacheKey = `${req.params.id}:${imageField}`;
    const cachedImage = getCachedProductImage(cacheKey);
    if (cachedImage) {
      if (cachedImage.kind === 'redirect') {
        return res.redirect(cachedImage.location);
      }
      if (cachedImage.kind === 'passthrough') {
        return res.redirect(cachedImage.location);
      }
      res.set('Content-Type', cachedImage.contentType);
      res.set('Cache-Control', 'public, max-age=86400');
      return res.send(cachedImage.buffer);
    }

    const externalImage = await productImageCollection.findOne(
      { productId: new ObjectId(req.params.id), slot },
      { projection: { url: 1 } }
    );

    if (externalImage?.url) {
      const externalPayload = {
        kind: 'redirect',
        location: externalImage.url
      };
      setCachedProductImage(cacheKey, externalPayload);
      return res.redirect(externalImage.url);
    }

    const product = await productCollection.findOne(
      { _id: new ObjectId(req.params.id) },
      { projection: { [imageField]: 1 } }
    );

    const imagePayload = parseImagePayload(product?.[imageField]);
    if (!imagePayload) {
      return res.status(404).json({ message: 'Image not found' });
    }

    setCachedProductImage(cacheKey, imagePayload);

    if (imagePayload.kind === 'redirect') {
      return res.redirect(imagePayload.location);
    }
    if (imagePayload.kind === 'passthrough') {
      return res.redirect(imagePayload.location);
    }

    res.set('Content-Type', imagePayload.contentType);
    res.set('Cache-Control', 'public, max-age=86400');
    return res.send(imagePayload.buffer);
  } catch (err) {
    logProductsError('get product image', err, { productId: req.params.id, slot: req.params.slot });
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { productCollection } = getCollections();
    const product = await productCollection.findOne({ _id: new ObjectId(req.params.id) });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    const apiBaseUrl = `${req.protocol}://${req.get('host')}`;
    return res.status(200).json(normalizeDetailImages(product, apiBaseUrl));
  } catch (err) {
    logProductsError('get product by id', err, { productId: req.params.id });
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.post('/', requireRoleAction('admin', ['edit all', 'sales ctrl', 'account ctrl']), async (req, res) => {
  const { productCollection } = getCollections();
  const {
    product_name,
    product_detail,
    stocked_quantity,
    unit_price,
    discount,
    product_dept,
    type,
    rating,
    image_1,
    image_2,
    image_3,
    image_4,
    image_5
  } = req.body;

  if (!product_name || !unit_price) {
    return res.status(400).json({ message: 'Please provide all required fields.' });
  }
  if (typeof unit_price !== 'number' || unit_price < 0) {
    return res.status(400).json({ message: 'unit_price must be a non-negative number.' });
  }
  if (typeof stocked_quantity !== 'number' || stocked_quantity < 0) {
    return res.status(400).json({ message: 'stocked_quantity must be a non-negative number.' });
  }
  if (discount !== undefined && (discount < 0 || discount > 1)) {
    return res.status(400).json({ message: 'discount must be between 0 and 1.' });
  }

  const images = [image_1, image_2, image_3, image_4, image_5].filter(Boolean);
  for (const img of images) {
    if (typeof img !== 'string' || !img.startsWith('data:image/')) {
      return res.status(400).json({ message: 'Invalid image format. Must be Base64.' });
    }
  }

  const newProduct = {
    product_name,
    product_detail: product_detail || '',
    stocked_quantity: stocked_quantity || 0,
    unit_price,
    discount: discount || 0,
    product_dept: product_dept || '',
    type: type || 'food',
    rating: rating || 4,
    createdAt: new Date(),
    updatedAt: new Date(),
    image_1: image_1 || '',
    image_2: image_2 || '',
    image_3: image_3 || '',
    image_4: image_4 || '',
    image_5: image_5 || ''
  };

  try {
    const { productCollection } = getCollections();
    const result = await productCollection.insertOne(newProduct);
    return res.status(201).json({ message: 'Product added successfully', productId: result.insertedId });
  } catch (err) {
    logProductsError('create product', err, { bodyKeys: Object.keys(req.body || {}) });
    return res.status(500).json({ message: 'Failed to add product' });
  }
});

router.patch('/:id', requireRoleAction('admin', ['edit all', 'sales ctrl', 'account ctrl']), async (req, res) => {
  const { image_1, image_2, image_3, image_4, image_5, ...updateData } = req.body;

  const images = [image_1, image_2, image_3, image_4, image_5];
  for (const img of images) {
    if (img && (typeof img !== 'string' || !img.startsWith('data:image/'))) {
      return res.status(400).json({ message: 'Invalid image format. Must be Base64.' });
    }
  }

  const updatedImages = {
    image_1: image_1 || '',
    image_2: image_2 || '',
    image_3: image_3 || '',
    image_4: image_4 || '',
    image_5: image_5 || ''
  };

  try {
    const { productCollection } = getCollections();
    const result = await productCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { ...updateData, ...updatedImages, updatedAt: new Date() } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: 'Product not found or no changes made' });
    }

    return res.status(200).json({ message: 'Product updated successfully' });
  } catch (err) {
    logProductsError('update product', err, { productId: req.params.id, bodyKeys: Object.keys(req.body || {}) });
    return res.status(500).json({ message: 'Failed to update product' });
  }
});

router.delete('/:id', requireRoleAction('admin', ['edit all', 'sales ctrl', 'account ctrl']), async (req, res) => {
  try {
    const { productCollection } = getCollections();
    const result = await productCollection.deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    return res.status(200).json({ message: 'Product deleted successfully' });
  } catch (err) {
    logProductsError('delete product', err, { productId: req.params.id });
    return res.status(500).json({ message: 'Failed to delete product' });
  }
});

router.delete('/', requireAdmin, async (req, res) => {
  const { productIds } = req.body;
  if (!Array.isArray(productIds) || productIds.length === 0) {
    return res.status(400).json({ message: 'No product IDs provided' });
  }

  try {
    const { productCollection } = getCollections();
    const objectIds = productIds.map((id) => new ObjectId(id));
    const result = await productCollection.deleteMany({ _id: { $in: objectIds } });
    return res.status(200).json({ message: 'Products deleted successfully', deletedCount: result.deletedCount });
  } catch (err) {
    logProductsError('bulk delete products', err, { count: productIds.length });
    return res.status(500).json({ message: 'Failed to delete products' });
  }
});

router.patch('/:id/update-stock', async (req, res) => {
  try {
    const { productCollection } = getCollections();
    const result = await productCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $inc: { stocked_quantity: -req.body.quantity } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: 'Product not found or stock not updated' });
    }
    return res.status(200).json({ message: 'Stock updated successfully' });
  } catch (err) {
    logProductsError('update product stock', err, { productId: req.params.id, quantity: req.body?.quantity });
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/:id/reviews', async (req, res) => {
  const { productReviewCollection } = getCollections();
  const productId = req.params.id;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
  const sortOrder = req.query.sort === 'oldest' ? 1 : -1;
  const skip = (page - 1) * limit;

  try {
    if (!productReviewCollection) {
      return res.status(200).json({ reviews: [], total: 0, page, pages: 0, averageRating: 0, ratingCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } });
    }

    const filter = { productId };
    const [reviews, total, agg] = await Promise.all([
      productReviewCollection.find(filter).sort({ createdAt: sortOrder }).skip(skip).limit(limit).toArray(),
      productReviewCollection.countDocuments(filter),
      productReviewCollection.aggregate([
        { $match: { productId } },
        { $group: { _id: null, avg: { $avg: '$rating' }, counts: { $push: '$rating' } } }
      ]).toArray()
    ]);

    const averageRating = agg[0] ? Math.round(agg[0].avg * 10) / 10 : 0;
    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const counts = agg[0]?.counts || [];
    counts.forEach((r) => {
      const key = Math.round(Number(r));
      if (key >= 1 && key <= 5) ratingCounts[key] += 1;
    });

    return res.status(200).json({
      reviews,
      total,
      page,
      pages: Math.ceil(total / limit),
      averageRating,
      ratingCounts
    });
  } catch (err) {
    console.error('Error fetching product reviews:', err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.post('/:id/reviews', requireAuth, async (req, res) => {
  const { productCollection, userCollection, productReviewCollection } = getCollections();
  const productId = req.params.id;
  const { rating, comment, images } = req.body;

  if (rating == null || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'rating must be between 1 and 5.' });
  }

  const commentStr = typeof comment === 'string' ? comment.trim() : '';
  const imagesArr = Array.isArray(images)
    ? images.filter((img) => typeof img === 'string' && img.startsWith('data:image/')).slice(0, 5)
    : [];

  try {
    const product = await productCollection.findOne({ _id: new ObjectId(productId) });
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    const user = await userCollection.findOne({ _id: new ObjectId(req.session.userId) });
    const userName = user?.profileName || (user?.email ? user.email.split('@')[0] : 'Khách');
    const userEmail = user?.email || '';

    await productReviewCollection.insertOne({
      productId,
      userId: req.session.userId.toString(),
      userName,
      userEmail,
      rating: Number(rating),
      comment: commentStr,
      images: imagesArr,
      createdAt: new Date(),
      verified: true
    });

    return res.status(201).json({ message: 'Review submitted successfully' });
  } catch (err) {
    console.error('Error submitting review:', err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
