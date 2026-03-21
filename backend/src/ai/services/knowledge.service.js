const { searchProducts, searchBlogs, searchCoupons } = require('../repositories/knowledge.repository');

async function retrieveKnowledge(question) {
  const [products, blogs, coupons] = await Promise.all([
    searchProducts(question),
    searchBlogs(question),
    searchCoupons(question)
  ]);

  return {
    products,
    blogs,
    coupons
  };
}

module.exports = {
  retrieveKnowledge
};
