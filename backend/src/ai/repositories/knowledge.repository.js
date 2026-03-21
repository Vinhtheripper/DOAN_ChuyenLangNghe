const { getCollections } = require('../../config/database');

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractKeywords(question) {
  const normalized = (question || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ');

  return Array.from(new Set(
    normalized
      .split(/\s+/)
      .map((keyword) => keyword.trim())
      .filter((keyword) => keyword.length >= 2)
      .slice(0, 8)
  ));
}

function buildKeywordRegex(keywords) {
  if (keywords.length === 0) {
    return null;
  }
  return new RegExp(keywords.map(escapeRegex).join('|'), 'i');
}

async function searchProducts(question, limit = 3) {
  const { productCollection } = getCollections();
  const keywords = extractKeywords(question);
  const keywordRegex = buildKeywordRegex(keywords);
  const filter = keywordRegex
    ? {
        $or: [
          { product_name: keywordRegex },
          { product_detail: keywordRegex },
          { product_dept: keywordRegex },
          { type: keywordRegex }
        ]
      }
    : {};

  return productCollection
    .find(filter)
    .sort({ updatedAt: -1, createdAt: -1, _id: -1 })
    .limit(limit)
    .project({
      product_name: 1,
      product_detail: 1,
      product_dept: 1,
      type: 1,
      unit_price: 1,
      discount: 1,
      stocked_quantity: 1,
      rating: 1
    })
    .toArray();
}

async function searchBlogs(question, limit = 2) {
  const { blogCollection } = getCollections();
  const keywords = extractKeywords(question);
  const keywordRegex = buildKeywordRegex(keywords);
  const filter = keywordRegex
    ? {
        published: true,
        $or: [
          { title: keywordRegex },
          { description: keywordRegex },
          { content: keywordRegex }
        ]
      }
    : { published: true };

  return blogCollection
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .project({
      title: 1,
      description: 1,
      content: 1
    })
    .toArray();
}

async function searchCoupons(question, limit = 2) {
  const { couponCollection } = getCollections();
  const keywords = extractKeywords(question);
  const wantsCouponInfo = keywords.some((keyword) => ['khuyen', 'mai', 'giam', 'gia', 'coupon', 'ma', 'sale'].includes(keyword));

  if (!wantsCouponInfo) {
    return [];
  }

  return couponCollection
    .find({ isActive: true })
    .sort({ updatedAt: -1, createdAt: -1, _id: -1 })
    .limit(limit)
    .project({
      code: 1,
      discountType: 1,
      discountValue: 1,
      isActive: 1
    })
    .toArray();
}

module.exports = {
  searchProducts,
  searchBlogs,
  searchCoupons
};
