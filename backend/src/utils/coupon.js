function parseDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function computeItemsSummary(items) {
  if (!Array.isArray(items)) {
    return { subtotal: 0, totalItems: 0 };
  }

  let subtotal = 0;
  let totalItems = 0;

  for (const item of items) {
    const quantity = Number(item?.quantity || 0);
    const unitPrice = Number(item?.unit_price || 0);
    if (quantity > 0 && unitPrice >= 0) {
      subtotal += quantity * unitPrice;
      totalItems += quantity;
    }
  }

  return { subtotal, totalItems };
}

function checkCouponAvailability(coupon, now = new Date()) {
  if (!coupon) {
    return { ok: false, message: 'Mã giảm giá không tồn tại.' };
  }

  if (!coupon.isActive) {
    return { ok: false, message: 'Mã giảm giá đang bị khóa.' };
  }

  const validFrom = parseDate(coupon.validFrom);
  const validTo = parseDate(coupon.validTo);

  if (validFrom && now < validFrom) {
    return { ok: false, message: 'Mã giảm giá chưa đến thời gian áp dụng.' };
  }

  if (validTo && now > validTo) {
    return { ok: false, message: 'Mã giảm giá đã hết hạn.' };
  }

  if (typeof coupon.usageLimit === 'number' && coupon.usageLimit > 0) {
    const usedCount = Number(coupon.usedCount || 0);
    if (usedCount >= coupon.usageLimit) {
      return { ok: false, message: 'Mã giảm giá đã hết lượt sử dụng.' };
    }
  }

  return { ok: true };
}

function evaluateCouponDiscount(coupon, items) {
  const { subtotal, totalItems } = computeItemsSummary(items);

  if (subtotal <= 0 || totalItems <= 0) {
    return {
      eligible: false,
      discountAmount: 0,
      subtotal,
      totalItems,
      finalTotal: subtotal,
      message: 'Giỏ hàng không hợp lệ để áp mã.'
    };
  }

  let discountAmount = 0;

  if (coupon.type === 'percentage') {
    const percentage = Number(coupon.percentageOff || 0);
    if (percentage <= 0 || percentage > 100) {
      return {
        eligible: false,
        discountAmount: 0,
        subtotal,
        totalItems,
        finalTotal: subtotal,
        message: 'Cấu hình phần trăm giảm không hợp lệ.'
      };
    }
    discountAmount = Math.round((subtotal * percentage) / 100);
  } else if (coupon.type === 'item_threshold_amount') {
    const minItems = Number(coupon.minItems || 0);
    const fixedDiscount = Number(coupon.discountAmount || 0);
    if (minItems <= 0 || fixedDiscount <= 0) {
      return {
        eligible: false,
        discountAmount: 0,
        subtotal,
        totalItems,
        finalTotal: subtotal,
        message: 'Cấu hình giảm giá theo số lượng không hợp lệ.'
      };
    }

    if (totalItems < minItems) {
      return {
        eligible: false,
        discountAmount: 0,
        subtotal,
        totalItems,
        finalTotal: subtotal,
        message: `Cần mua tối thiểu ${minItems} món để áp mã.`
      };
    }

    discountAmount = Math.round(fixedDiscount);
  } else {
    return {
      eligible: false,
      discountAmount: 0,
      subtotal,
      totalItems,
      finalTotal: subtotal,
      message: 'Loại mã giảm giá không được hỗ trợ.'
    };
  }

  if (discountAmount < 0) discountAmount = 0;
  if (discountAmount > subtotal) discountAmount = subtotal;

  return {
    eligible: true,
    discountAmount,
    subtotal,
    totalItems,
    finalTotal: subtotal - discountAmount,
    message: 'Áp mã thành công.'
  };
}

module.exports = {
  parseDate,
  computeItemsSummary,
  checkCouponAvailability,
  evaluateCouponDiscount
};
