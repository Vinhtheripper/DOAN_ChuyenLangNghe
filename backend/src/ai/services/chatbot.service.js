const { buildSystemInstruction } = require('../prompts/chatbot.prompt');
const { retrieveKnowledge } = require('./knowledge.service');
const { GeminiServiceError, generateGeminiAnswer } = require('./gemini.service');
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

function buildSources(knowledge) {
  return {
    products: knowledge.products.slice(0, 3).map((product) => product.product_name),
    blogs: knowledge.blogs.slice(0, 2).map((blog) => blog.title),
    coupons: knowledge.coupons.slice(0, 2).map((coupon) => coupon.code)
  };
}

function buildFallbackAnswer(knowledge) {
  const sections = [];

  if (knowledge.products.length > 0) {
    sections.push(buildProductAnswer(knowledge.products));
  }

  if (knowledge.blogs.length > 0) {
    sections.push(buildBlogAnswer(knowledge.blogs));
  }

  if (knowledge.coupons.length > 0) {
    sections.push(buildCouponAnswer(knowledge.coupons));
  }

  if (sections.length === 0) {
    return 'Hệ thống AI đang tạm gián đoạn nên mình chưa thể trả lời tự nhiên lúc này. Tuy vậy, mình cũng chưa tìm thấy dữ liệu liên quan trực tiếp trong hệ thống. Bạn hãy thử hỏi rõ hơn về sản phẩm, bài viết hoặc khuyến mãi.';
  }

  return `Trợ lý AI đang tạm gián đoạn nên mình trả lời theo dữ liệu hiện có trong hệ thống. ${sections.join(' ')}`.trim();
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
    sources = buildSources(knowledge);

    try {
      const systemInstruction = buildSystemInstruction(knowledge);
      answer = await generateGeminiAnswer({
        systemInstruction,
        history: normalizedHistory,
        userMessage: cleanMessage
      });
    } catch (error) {
      if (error instanceof GeminiServiceError && error.code === 'GEMINI_API_KEY_MISSING') {
        console.error('[ai/chat] Gemini API key is missing on the server.');
      } else {
        console.error('[ai/chat] Gemini fallback triggered:', error.message);
      }

      answer = buildFallbackAnswer(knowledge);
    }
  }

  return {
    answer: shortenAnswer(answer),
    sources
  };
}

module.exports = {
  createChatbotReply
};
