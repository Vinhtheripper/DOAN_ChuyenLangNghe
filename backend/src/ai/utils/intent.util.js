function normalizeVietnamese(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function detectIntent(message) {
  const normalized = normalizeVietnamese(message);

  if (/(gom|su|san pham|gia|mua|ban|co .* khong|goi y)/.test(normalized)) {
    return 'product_lookup';
  }

  if (/(blog|bai viet|lang nghe|lich su|cau chuyen)/.test(normalized)) {
    return 'blog_lookup';
  }

  if (/(coupon|khuyen mai|giam gia|sale|ma giam)/.test(normalized)) {
    return 'coupon_lookup';
  }

  return 'general';
}

module.exports = {
  detectIntent
};
