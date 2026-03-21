function formatCurrency(value) {
  if (typeof value !== 'number') {
    return 'Chưa rõ giá';
  }

  return `${value.toLocaleString('vi-VN')} VND`;
}

function normalizeType(value) {
  if (typeof value !== 'string') {
    return '';
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized || ['nen', 'khac', 'other', 'default'].includes(normalized)) {
    return '';
  }

  return value.trim();
}

function buildProductAnswer(products) {
  if (!products || products.length === 0) {
    return 'Hiện mình chưa tìm thấy sản phẩm phù hợp trong hệ thống. Bạn có thể nói rõ hơn loại sản phẩm bạn đang quan tâm như gốm trang trí, quà tặng hay vật phẩm phong thủy.';
  }

  const intro = 'Hiện hệ thống có một số sản phẩm phù hợp:';
  const lines = products.slice(0, 3).map((product) => {
    const details = [
      product.product_name,
      `giá ${formatCurrency(product.unit_price)}`
    ];

    if (product.product_dept) {
      details.push(`thuộc ${product.product_dept}`);
    }

    const productType = normalizeType(product.type);
    if (productType) {
      details.push(`loại ${productType}`);
    }

    return `- ${details.join(', ')}.`;
  });

  return `${intro} ${lines.join(' ')}`.trim();
}

function buildBlogAnswer(blogs) {
  if (!blogs || blogs.length === 0) {
    return 'Hiện mình chưa tìm thấy bài viết phù hợp trong hệ thống.';
  }

  const intro = 'Bạn có thể tham khảo các bài viết sau:';
  const lines = blogs.slice(0, 2).map((blog) => `- ${blog.title}.`);
  return `${intro} ${lines.join(' ')}`.trim();
}

function buildCouponAnswer(coupons) {
  if (!coupons || coupons.length === 0) {
    return 'Hiện mình chưa thấy mã khuyến mãi đang hoạt động trong hệ thống.';
  }

  const intro = 'Hiện có một số mã khuyến mãi đang hoạt động:';
  const lines = coupons.slice(0, 2).map((coupon) => {
    const value = coupon.discountType === 'percentage'
      ? `${coupon.discountValue}%`
      : `${coupon.discountValue} VND`;
    return `- ${coupon.code}, mức giảm ${value}.`;
  });

  return `${intro} ${lines.join(' ')}`.trim();
}

module.exports = {
  buildProductAnswer,
  buildBlogAnswer,
  buildCouponAnswer
};
