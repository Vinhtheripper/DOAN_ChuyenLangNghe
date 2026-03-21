const { buildSystemInstruction } = require('../prompts/chatbot.prompt');
const { retrieveKnowledge } = require('./knowledge.service');
const { generateGeminiAnswer } = require('./gemini.service');
const { shortenAnswer } = require('../utils/answer-format.util');
const { detectIntent } = require('../utils/intent.util');
const { buildProductAnswer, buildBlogAnswer, buildCouponAnswer } = require('../utils/response-builder.util');

function sanitizeHistory(history) {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .filter((message) => message && typeof message.content === 'string' && ['user', 'assistant'].includes(message.role))
    .slice(-8)
    .map((message) => ({
      role: message.role,
      content: message.content.trim().slice(0, 2000)
    }))
    .filter((message) => message.content.length > 0);
}

async function createChatbotReply({ message, history }) {
  const cleanMessage = typeof message === 'string' ? message.trim() : '';
  if (!cleanMessage) {
    throw new Error('Message is required');
  }

  const normalizedHistory = sanitizeHistory(history);
  const knowledge = await retrieveKnowledge(cleanMessage);
  const intent = detectIntent(cleanMessage);

  let answer;
  let sources;
  if (intent === 'product_lookup') {
    answer = buildProductAnswer(knowledge.products);
    sources = {
      products: knowledge.products.slice(0, 3).map((product) => product.product_name),
      blogs: [],
      coupons: []
    };
  } else if (intent === 'blog_lookup') {
    answer = buildBlogAnswer(knowledge.blogs);
    sources = {
      products: [],
      blogs: knowledge.blogs.slice(0, 2).map((blog) => blog.title),
      coupons: []
    };
  } else if (intent === 'coupon_lookup') {
    answer = buildCouponAnswer(knowledge.coupons);
    sources = {
      products: [],
      blogs: [],
      coupons: knowledge.coupons.slice(0, 2).map((coupon) => coupon.code)
    };
  } else {
    const systemInstruction = buildSystemInstruction(knowledge);
    answer = await generateGeminiAnswer({
      systemInstruction,
      history: normalizedHistory,
      userMessage: cleanMessage
    });
    sources = {
      products: knowledge.products.slice(0, 3).map((product) => product.product_name),
      blogs: knowledge.blogs.slice(0, 2).map((blog) => blog.title),
      coupons: knowledge.coupons.slice(0, 2).map((coupon) => coupon.code)
    };
  }

  return {
    answer: shortenAnswer(answer),
    sources
  };
}

module.exports = {
  createChatbotReply
};
