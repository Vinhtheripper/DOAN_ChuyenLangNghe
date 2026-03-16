const express = require('express');
const { ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { getCollections } = require('../config/database');
const { requireAuth, requireRoleAction } = require('../middlewares/auth');
const { checkCouponAvailability, evaluateCouponDiscount, computeItemsSummary } = require('../utils/coupon');

const router = express.Router();

router.get('/me', requireAuth, async (req, res) => {
  const { orderCollection } = getCollections();
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  try {
    const filter = { userId: req.session.userId };
    const orders = await orderCollection.aggregate([
      { $match: filter },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'Product',
          let: { itemIds: '$selectedItems._id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: [
                    '$_id',
                    { $map: { input: '$$itemIds', as: 'id', in: { $toObjectId: { $ifNull: ['$$id', ''] } } } }
                  ]
                }
              }
            }
          ],
          as: 'products'
        }
      },
      {
        $addFields: {
          selectedItems: {
            $map: {
              input: '$selectedItems',
              as: 'item',
              in: {
                $let: {
                  vars: {
                    prod: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: '$products',
                            cond: { $eq: ['$$this._id', { $toObjectId: { $ifNull: ['$$item._id', ''] } }] }
                          }
                        },
                        0
                      ]
                    }
                  },
                  in: {
                    $mergeObjects: [
                      '$$item',
                      {
                        product_name: { $ifNull: ['$$prod.product_name', 'Sản phẩm'] },
                        image_1: '$$prod.image_1',
                        product_dept: { $ifNull: ['$$prod.product_dept', ''] }
                      }
                    ]
                  }
                }
              }
            }
          }
        }
      },
      { $project: { products: 0 } }
    ]).toArray();

    const total = await orderCollection.countDocuments(filter);
    return res.status(200).json({
      orders,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error('orders/me error:', err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/history/:userId', requireAuth, async (req, res) => {
  const { orderCollection } = getCollections();
  const requestedUserId = req.params.userId;
  const sessionUserId = req.session.userId?.toString();
  const isAdmin = req.session.role === 'admin';

  if (!isAdmin && sessionUserId !== requestedUserId) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  try {
    const userObjectId = ObjectId.isValid(requestedUserId) ? new ObjectId(requestedUserId) : null;
    const filter = userObjectId
      ? { $or: [{ userId: requestedUserId }, { userId: userObjectId }] }
      : { userId: requestedUserId };

    const orders = await orderCollection.find(filter).sort({ createdAt: -1 }).toArray();
    return res.status(200).json(orders);
  } catch {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/', requireRoleAction('admin', ['edit all', 'sales ctrl', 'view']), async (req, res) => {
  const { orderCollection } = getCollections();
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;
  const search = req.query.search || '';
  const status = req.query.status || '';

  const filter = {};
  if (search) {
    try {
      filter.$or = [{ userName: { $regex: search, $options: 'i' } }, { _id: new ObjectId(search) }];
    } catch {
      // ignore invalid ObjectId search value
    }
  }
  if (status) {
    filter.status = status;
  }

  try {
    const orders = await orderCollection.aggregate([
      { $match: filter },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'User',
          localField: 'userId',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      {
        $addFields: {
          userName: {
            $ifNull: [
              { $arrayElemAt: ['$userDetails.profileName', 0] },
              { $concat: ['$shippingAddress.firstName', ' ', '$shippingAddress.lastName'] }
            ]
          }
        }
      },
      { $project: { userDetails: 0 } }
    ]).toArray();

    const total = await orderCollection.countDocuments(filter);
    return res.status(200).json({
      orders,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  const { orderCollection, productCollection, couponCollection } = getCollections();
  const userId = req.session?.userId || null;
  const { selectedItems, totalPrice, paymentMethod, shippingAddress, couponCode, couponDiscount } = req.body;

  if (!Array.isArray(selectedItems) || selectedItems.length === 0) {
    return res.status(400).json({ message: 'selectedItems must be a non-empty array.' });
  }
  for (const item of selectedItems) {
    if (!item._id || typeof item.quantity !== 'number' || item.quantity <= 0 || typeof item.unit_price !== 'number' || item.unit_price < 0) {
      return res.status(400).json({ message: 'Invalid selectedItems format.' });
    }
  }
  if (!totalPrice || typeof totalPrice !== 'number' || totalPrice <= 0) {
    return res.status(400).json({ message: 'Invalid totalPrice.' });
  }
  if (!paymentMethod || typeof paymentMethod !== 'string') {
    return res.status(400).json({ message: 'Invalid paymentMethod.' });
  }
  if (!shippingAddress || !shippingAddress.firstName || !shippingAddress.lastName || !shippingAddress.address) {
    return res.status(400).json({ message: 'Invalid shippingAddress.' });
  }

  try {
    const { subtotal } = computeItemsSummary(selectedItems);
    let discountAmount = 0;
    let appliedCoupon = null;

    if (couponCode) {
      const code = String(couponCode).trim().toUpperCase();
      const coupon = await couponCollection.findOne({ code });
      const availability = checkCouponAvailability(coupon);
      if (!availability.ok) {
        return res.status(400).json({ message: availability.message });
      }

      const couponResult = evaluateCouponDiscount(coupon, selectedItems);
      if (!couponResult.eligible) {
        return res.status(400).json({ message: couponResult.message });
      }

      discountAmount = couponResult.discountAmount;
      appliedCoupon = coupon;

      if (couponDiscount !== undefined && Number(couponDiscount) !== discountAmount) {
        return res.status(400).json({ message: 'Coupon discount mismatch.' });
      }
    }

    const expectedTotal = subtotal - discountAmount;
    if (Math.abs(expectedTotal - Number(totalPrice)) > 1) {
      return res.status(400).json({ message: 'Invalid totalPrice.' });
    }

    const result = await orderCollection.insertOne({
      userId,
      selectedItems,
      subtotalPrice: subtotal,
      discountAmount,
      couponCode: couponCode ? String(couponCode).trim().toUpperCase() : null,
      totalPrice: expectedTotal,
      paymentMethod,
      shippingAddress,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'in_progress'
    });

    for (const item of selectedItems) {
      const productId = new ObjectId(item._id);
      const product = await productCollection.findOne({ _id: productId });
      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item._id}` });
      }
      if (product.stocked_quantity < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for product ID: ${item._id}` });
      }
      await productCollection.updateOne({ _id: productId }, { $inc: { stocked_quantity: -item.quantity } });
    }

    if (appliedCoupon) {
      await couponCollection.updateOne(
        { _id: appliedCoupon._id },
        { $inc: { usedCount: 1 }, $set: { updatedAt: new Date() } }
      );
    }

    return res.status(201).json({ message: 'Order placed successfully', orderId: result.insertedId });
  } catch {
    return res.status(500).json({ message: 'Failed to place order' });
  }
});

router.patch('/:id/status', requireRoleAction('admin', ['edit all', 'sales ctrl']), async (req, res) => {
  const { orderCollection } = getCollections();
  const { status } = req.body;
  if (!status) {
    return res.status(400).json({ message: 'Missing status field' });
  }

  try {
    const result = await orderCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { status, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    return res.status(200).json({ message: 'Order status updated successfully' });
  } catch {
    return res.status(500).json({ message: 'Failed to update order status' });
  }
});

router.delete('/:orderId', requireRoleAction('admin', ['edit all', 'sales ctrl']), async (req, res) => {
  const { orderCollection } = getCollections();
  const { orderId } = req.params;

  if (!ObjectId.isValid(orderId)) {
    return res.status(400).json({ message: 'Invalid order ID' });
  }

  try {
    const result = await orderCollection.deleteOne({ _id: new ObjectId(orderId) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    return res.status(200).json({ message: 'Order canceled successfully' });
  } catch {
    return res.status(500).json({ message: 'Failed to cancel the order' });
  }
});

router.get('/:orderId/invoice', requireAuth, async (req, res) => {
  const { orderCollection, productCollection } = getCollections();
  const { orderId } = req.params;

  try {
    const order = await orderCollection.findOne({ _id: new ObjectId(orderId) });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const productIds = order.selectedItems.map((item) => new ObjectId(item._id));
    const products = await productCollection.find({ _id: { $in: productIds } }).toArray();

    const itemsWithNames = order.selectedItems.map((item) => {
      const product = products.find((p) => p._id.toString() === item._id);
      return { ...item, name: product?.product_name || 'Unknown' };
    });

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const invoicesDir = path.join(process.cwd(), 'invoices');
    const fileName = `invoice-${orderId}.pdf`;
    const filePath = path.join(invoicesDir, fileName);

    if (!fs.existsSync(invoicesDir)) {
      fs.mkdirSync(invoicesDir, { recursive: true });
    }

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    const fontPath = path.join(process.cwd(), 'fonts', 'Roboto-Regular.ttf');
    if (fs.existsSync(fontPath)) {
      doc.font(fontPath);
    }

    const logoCandidates = [
      path.join(process.cwd(), 'Logo.png'),
      path.join(process.cwd(), 'logo.png')
    ];

    let logoDrawn = false;
    for (const logoPath of logoCandidates) {
      if (fs.existsSync(logoPath)) {
        try {
          doc.image(logoPath, 50, 30, { width: 100 });
          logoDrawn = true;
          break;
        } catch {
          // skip bad image and continue fallback
        }
      }
    }

    if (!logoDrawn) {
      doc.fontSize(16).text('LOGO', 50, 30);
    }

    doc.fontSize(20).text('Hoa don ban hang', 150, 50, { align: 'center' });
    doc.moveDown();

    doc.fontSize(12)
      .text(`Ma don hang: ${orderId}`)
      .text(`Ngay tao: ${new Date(order.createdAt).toLocaleDateString()}`)
      .text(`Khach hang: ${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`)
      .text(`Email: ${order.shippingAddress.email || ''}`)
      .text(`So dien thoai: ${order.shippingAddress.phone || ''}`)
      .text(`Dia chi: ${order.shippingAddress.address}`);

    doc.moveDown();
    doc.fontSize(14).text('Chi tiet don hang:');
    doc.moveDown();

    const columnWidths = [50, 200, 70, 100, 100];
    const tableStartX = 50;
    const tableStartY = doc.y;
    const header = ['STT', 'Ten san pham', 'So luong', 'Don gia', 'Thanh tien'];

    header.forEach((text, i) => {
      doc.text(text, tableStartX + columnWidths.slice(0, i).reduce((sum, w) => sum + w, 0), tableStartY, {
        width: columnWidths[i],
        align: i === 0 ? 'left' : 'center'
      });
    });

    const rowStartY = tableStartY + 20;
    itemsWithNames.forEach((item, index) => {
      const rowY = rowStartY + index * 20;
      const row = [
        index + 1,
        item.name,
        item.quantity,
        `${item.unit_price.toLocaleString()} VND`,
        `${(item.quantity * item.unit_price).toLocaleString()} VND`
      ];

      row.forEach((text, i) => {
        doc.text(text, tableStartX + columnWidths.slice(0, i).reduce((sum, w) => sum + w, 0), rowY, {
          width: columnWidths[i],
          align: i === 0 ? 'left' : 'center'
        });
      });
    });

    const totalRows = itemsWithNames.length + 1;
    const tableWidth = columnWidths.reduce((sum, width) => sum + width, 0);

    for (let i = 0; i <= totalRows; i += 1) {
      const y = tableStartY + i * 20;
      doc.moveTo(tableStartX, y).lineTo(tableStartX + tableWidth, y).stroke();
    }

    let currentX = tableStartX;
    columnWidths.forEach((w) => {
      doc.moveTo(currentX, tableStartY).lineTo(currentX, tableStartY + totalRows * 20).stroke();
      currentX += w;
    });
    doc.moveTo(currentX, tableStartY).lineTo(currentX, tableStartY + totalRows * 20).stroke();

    doc.moveDown(2);
    doc.fontSize(12)
      .text(`Tong gia tri: ${order.totalPrice.toLocaleString()} VND`, 50, doc.y, { align: 'right' })
      .moveDown(0.5)
      .text(`Phuong thuc thanh toan: ${order.paymentMethod}`, 50, doc.y, { align: 'right' });

    doc.moveDown(2);
    doc.fontSize(12)
      .text('Cam on ban da mua hang!', 50, doc.y, { align: 'center' })
      .moveDown(0.5)
      .text('Lien he voi chung toi: 079 2098 518', 50, doc.y, { align: 'center' });

    doc.end();

    stream.on('finish', () => {
      res.download(filePath, fileName, (err) => {
        if (err) {
          res.status(500).json({ message: 'Failed to download PDF' });
        }
        fs.unlink(filePath, () => {});
      });
    });
  } catch {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
