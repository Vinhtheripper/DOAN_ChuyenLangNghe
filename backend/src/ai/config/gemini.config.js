const { GEMINI_API_KEY, GEMINI_MODEL, GEMINI_API_BASE_URL } = require('../../config/env');

function getGeminiConfig() {
  return {
    apiKey: GEMINI_API_KEY,
    model: GEMINI_MODEL,
    apiBaseUrl: GEMINI_API_BASE_URL
  };
}

module.exports = {
  getGeminiConfig
};
