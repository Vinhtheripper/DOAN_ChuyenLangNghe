const express = require('express');
const { ObjectId } = require('mongodb');
const { getCollections } = require('../config/database');
const { requireAuth, requireAdmin, requireRoleAction } = require('../middlewares/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  const { productCollection } = getCollections();
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
  const skip = (page - 1) * limit;
  const productDept = req.query.dept || '';
  const productType = req.query.type || '';
  const includeImages = req.query.includeImages === 'all' ? 'all' : 'primary';

  const filter = {};
  if (productDept) filter.product_dept = productDept;
  if (productType) filter.type = productType;

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
    image_1: 1
  };

  if (includeImages === 'all') {
    projection.image_2 = 1;
    projection.image_3 = 1;
    projection.image_4 = 1;
    projection.image_5 = 1;
  }

  try {
    const products = await productCollection
      .find(filter, { projection })
      .sort({ updatedAt: -1, createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    const total = await productCollection.countDocuments(filter);
    res.status(200).json({
      products,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/:id', async (req, res) => {
  const { productCollection } = getCollections();
  try {
    const product = await productCollection.findOne({ _id: new ObjectId(req.params.id) });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    return res.status(200).json(product);
  } catch {
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
    const result = await productCollection.insertOne(newProduct);
    return res.status(201).json({ message: 'Product added successfully', productId: result.insertedId });
  } catch {
    return res.status(500).json({ message: 'Failed to add product' });
  }
});

router.patch('/:id', requireRoleAction('admin', ['edit all', 'sales ctrl', 'account ctrl']), async (req, res) => {
  const { productCollection } = getCollections();
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
    const result = await productCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { ...updateData, ...updatedImages, updatedAt: new Date() } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: 'Product not found or no changes made' });
    }

    return res.status(200).json({ message: 'Product updated successfully' });
  } catch {
    return res.status(500).json({ message: 'Failed to update product' });
  }
});

router.delete('/:id', requireRoleAction('admin', ['edit all', 'sales ctrl', 'account ctrl']), async (req, res) => {
  const { productCollection } = getCollections();
  try {
    const result = await productCollection.deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    return res.status(200).json({ message: 'Product deleted successfully' });
  } catch {
    return res.status(500).json({ message: 'Failed to delete product' });
  }
});

router.delete('/', requireAdmin, async (req, res) => {
  const { productCollection } = getCollections();
  const { productIds } = req.body;
  if (!Array.isArray(productIds) || productIds.length === 0) {
    return res.status(400).json({ message: 'No product IDs provided' });
  }

  try {
    const objectIds = productIds.map((id) => new ObjectId(id));
    const result = await productCollection.deleteMany({ _id: { $in: objectIds } });
    return res.status(200).json({ message: 'Products deleted successfully', deletedCount: result.deletedCount });
  } catch {
    return res.status(500).json({ message: 'Failed to delete products' });
  }
});

router.patch('/:id/update-stock', async (req, res) => {
  const { productCollection } = getCollections();
  try {
    const result = await productCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $inc: { stocked_quantity: -req.body.quantity } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: 'Product not found or stock not updated' });
    }
    return res.status(200).json({ message: 'Stock updated successfully' });
  } catch {
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
