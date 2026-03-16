const express = require('express');
const { ObjectId } = require('mongodb');
const { getCollections } = require('../config/database');
const { requireRoleAction } = require('../middlewares/auth');
const { parseDate, checkCouponAvailability, evaluateCouponDiscount } = require('../utils/coupon');

const router = express.Router();

function normalizeCode(code) {
  return String(code || '').trim().toUpperCase();
}

function sanitizeCoupon(doc) {
  return {
    _id: doc?._id,
    code: doc?.code,
    description: doc?.description || '',
    type: doc?.type,
    percentageOff: doc?.percentageOff || null,
    minItems: doc?.minItems || null,
    discountAmount: doc?.discountAmount || null,
    usageLimit: doc?.usageLimit || null,
    usedCount: doc?.usedCount || 0,
    isActive: !!doc?.isActive,
    validFrom: doc?.validFrom || null,
    validTo: doc?.validTo || null,
    createdAt: doc?.createdAt || null,
    updatedAt: doc?.updatedAt || null
  };
}

router.get('/admin/list', requireRoleAction('admin', ['edit all', 'sales ctrl', 'view']), async (req, res) => {
  const { couponCollection } = getCollections();
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;
  const search = String(req.query.search || '').trim();

  const filter = {};
  if (search) {
    filter.$or = [
      { code: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  try {
    const [coupons, total] = await Promise.all([
      couponCollection.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
      couponCollection.countDocuments(filter)
    ]);

    return res.status(200).json({
      coupons: coupons.map(sanitizeCoupon),
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch {
    return res.status(500).json({ message: 'Failed to load coupons.' });
  }
});

router.post('/', requireRoleAction('admin', ['edit all', 'sales ctrl']), async (req, res) => {
  const { couponCollection } = getCollections();
  const {
    code,
    description,
    type,
    percentageOff,
    minItems,
    discountAmount,
    usageLimit,
    validFrom,
    validTo,
    isActive = true
  } = req.body;

  const couponCode = normalizeCode(code);
  if (!couponCode) {
    return res.status(400).json({ message: 'Mã giảm giá là bắt buộc.' });
  }

  if (!['percentage', 'item_threshold_amount'].includes(type)) {
    return res.status(400).json({ message: 'Loại mã giảm giá không hợp lệ.' });
  }

  if (type === 'percentage') {
    const pct = Number(percentageOff);
    if (!Number.isFinite(pct) || pct <= 0 || pct > 100) {
      return res.status(400).json({ message: 'Tỉ lệ giảm phải từ 1 đến 100.' });
    }
  }

  if (type === 'item_threshold_amount') {
    const min = Number(minItems);
    const amount = Number(discountAmount);
    if (!Number.isFinite(min) || min <= 0 || !Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Điều kiện số món và số tiền giảm không hợp lệ.' });
    }
  }

  const fromDate = parseDate(validFrom);
  const toDate = parseDate(validTo);
  if (validFrom && !fromDate) {
    return res.status(400).json({ message: 'Ngày bắt đầu không hợp lệ.' });
  }
  if (validTo && !toDate) {
    return res.status(400).json({ message: 'Ngày kết thúc không hợp lệ.' });
  }
  if (fromDate && toDate && fromDate > toDate) {
    return res.status(400).json({ message: 'Ngày bắt đầu phải trước ngày kết thúc.' });
  }

  try {
    const existing = await couponCollection.findOne({ code: couponCode });
    if (existing) {
      return res.status(409).json({ message: 'Mã giảm giá đã tồn tại.' });
    }

    const newCoupon = {
      code: couponCode,
      description: String(description || '').trim(),
      type,
      percentageOff: type === 'percentage' ? Number(percentageOff) : null,
      minItems: type === 'item_threshold_amount' ? Number(minItems) : null,
      discountAmount: type === 'item_threshold_amount' ? Number(discountAmount) : null,
      usageLimit: usageLimit ? Number(usageLimit) : null,
      usedCount: 0,
      isActive: !!isActive,
      validFrom: fromDate,
      validTo: toDate,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: req.session.userId || null
    };

    const result = await couponCollection.insertOne(newCoupon);
    return res.status(201).json({ message: 'Tạo mã giảm giá thành công.', couponId: result.insertedId });
  } catch {
    return res.status(500).json({ message: 'Không thể tạo mã giảm giá.' });
  }
});

router.patch('/:id', requireRoleAction('admin', ['edit all', 'sales ctrl']), async (req, res) => {
  const { couponCollection } = getCollections();
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'ID mã giảm giá không hợp lệ.' });
  }

  const update = { ...req.body };
  delete update._id;
  delete update.code;
  delete update.usedCount;

  if (update.validFrom !== undefined) {
    update.validFrom = parseDate(update.validFrom);
  }
  if (update.validTo !== undefined) {
    update.validTo = parseDate(update.validTo);
  }
  if (update.validFrom && update.validTo && update.validFrom > update.validTo) {
    return res.status(400).json({ message: 'Ngày bắt đầu phải trước ngày kết thúc.' });
  }

  if (update.percentageOff !== undefined) update.percentageOff = Number(update.percentageOff);
  if (update.minItems !== undefined) update.minItems = Number(update.minItems);
  if (update.discountAmount !== undefined) update.discountAmount = Number(update.discountAmount);
  if (update.usageLimit !== undefined) update.usageLimit = update.usageLimit ? Number(update.usageLimit) : null;

  update.updatedAt = new Date();

  try {
    const result = await couponCollection.updateOne({ _id: new ObjectId(id) }, { $set: update });
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Không tìm thấy mã giảm giá.' });
    }
    return res.status(200).json({ message: 'Cập nhật mã giảm giá thành công.' });
  } catch {
    return res.status(500).json({ message: 'Không thể cập nhật mã giảm giá.' });
  }
});

router.post('/validate', async (req, res) => {
  const { couponCollection } = getCollections();
  const code = normalizeCode(req.body?.code);
  const selectedItems = Array.isArray(req.body?.selectedItems) ? req.body.selectedItems : [];

  if (!code) {
    return res.status(400).json({ message: 'Vui lòng nhập mã giảm giá.' });
  }

  try {
    const coupon = await couponCollection.findOne({ code });
    const availability = checkCouponAvailability(coupon);
    if (!availability.ok) {
      return res.status(400).json({ message: availability.message });
    }

    const result = evaluateCouponDiscount(coupon, selectedItems);
    if (!result.eligible) {
      return res.status(400).json({ message: result.message, ...result });
    }

    return res.status(200).json({
      message: result.message,
      coupon: sanitizeCoupon(coupon),
      ...result
    });
  } catch {
    return res.status(500).json({ message: 'Không thể kiểm tra mã giảm giá.' });
  }
});

module.exports = router;
