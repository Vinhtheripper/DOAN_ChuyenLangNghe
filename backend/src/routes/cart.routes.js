const express = require('express');
const { ObjectId } = require('mongodb');
const { getCollections } = require('../config/database');
const { requireAuth } = require('../middlewares/auth');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  const { cartCollection } = getCollections();
  try {
    const cartItems = await cartCollection.aggregate([
      { $match: { userId: req.session.userId } },
      {
        $lookup: {
          from: 'Product',
          localField: 'productId',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      { $unwind: '$productDetails' },
      {
        $project: {
          productId: 1,
          quantity: 1,
          unit_price: 1,
          userId: 1,
          product_name: '$productDetails.product_name',
          image_1: '$productDetails.image_1',
          stocked_quantity: '$productDetails.stocked_quantity'
        }
      }
    ]).toArray();

    return res.status(200).json(cartItems);
  } catch {
    return res.status(500).json({ message: 'Failed to retrieve cart items' });
  }
});

router.post('/add', requireAuth, async (req, res) => {
  const { cartCollection } = getCollections();
  const { productId, quantity, unit_price } = req.body;

  try {
    const itemToAdd = {
      userId: req.session.userId,
      productId: new ObjectId(productId),
      quantity,
      unit_price
    };

    const existingItem = await cartCollection.findOne({
      userId: req.session.userId,
      productId: itemToAdd.productId
    });

    if (existingItem) {
      await cartCollection.updateOne(
        { userId: req.session.userId, productId: itemToAdd.productId },
        { $inc: { quantity } }
      );
    } else {
      await cartCollection.insertOne(itemToAdd);
    }

    return res.status(200).json({ message: 'Item added to cart' });
  } catch {
    return res.status(500).json({ message: 'Failed to add item to cart' });
  }
});

router.delete('/remove/:productId', requireAuth, async (req, res) => {
  const { cartCollection } = getCollections();
  try {
    await cartCollection.deleteOne({
      userId: req.session.userId,
      productId: new ObjectId(req.params.productId)
    });
    return res.status(200).json({ message: 'Item removed from cart' });
  } catch {
    return res.status(500).json({ message: 'Failed to remove item from cart' });
  }
});

router.post('/removeOrderedItems', requireAuth, async (req, res) => {
  const { cartCollection } = getCollections();
  const { orderedItemIds } = req.body;

  if (!Array.isArray(orderedItemIds) || orderedItemIds.length === 0) {
    return res.status(400).json({ message: 'Invalid or missing orderedItemIds.' });
  }

  try {
    const objectIds = orderedItemIds.map((id) => new ObjectId(id));
    await cartCollection.deleteMany({
      userId: req.session.userId,
      productId: { $in: objectIds }
    });

    return res.status(200).json({ message: 'Ordered items removed from cart.' });
  } catch {
    return res.status(500).json({ message: 'Failed to remove ordered items.' });
  }
});

router.patch('/update', requireAuth, async (req, res) => {
  const { cartCollection } = getCollections();
  const { productId, quantity } = req.body;

  try {
    await cartCollection.updateOne(
      { userId: req.session.userId, productId: new ObjectId(productId) },
      { $set: { quantity } }
    );

    return res.status(200).json({ message: 'Cart item quantity updated' });
  } catch {
    return res.status(500).json({ message: 'Failed to update cart item quantity' });
  }
});

router.post('/saveSelectedItems', requireAuth, async (req, res) => {
  const { cartCollection } = getCollections();
  const { selectedItems } = req.body;

  if (!Array.isArray(selectedItems)) {
    return res.status(400).json({ message: 'Invalid selected items data' });
  }

  try {
    await cartCollection.updateMany(
      { userId: req.session.userId },
      { $set: { selectedItems } },
      { upsert: true }
    );

    return res.status(200).json({ message: 'Selected items saved successfully' });
  } catch {
    return res.status(500).json({ message: 'Failed to save selected items' });
  }
});

router.delete('/clear', requireAuth, async (req, res) => {
  const { cartCollection } = getCollections();
  try {
    await cartCollection.deleteMany({ userId: req.session.userId });
    return res.status(200).json({ message: 'Cart cleared' });
  } catch {
    return res.status(500).json({ message: 'Failed to clear cart' });
  }
});

module.exports = router;
