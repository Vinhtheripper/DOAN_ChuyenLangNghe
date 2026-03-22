const { getGeminiConfig } = require('../config/gemini.config');

class GeminiServiceError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'GeminiServiceError';
    this.code = code;
  }
}

function extractTextFromResponse(data) {
  const candidate = data?.candidates?.[0];
  const parts = candidate?.content?.parts;

  if (!Array.isArray(parts)) {
    return '';
  }

  return parts
    .map((part) => (typeof part?.text === 'string' ? part.text : ''))
    .join('\n')
    .trim();
}

async function generateGeminiAnswer({ systemInstruction, history, userMessage }) {
  const { apiKey, model, apiBaseUrl } = getGeminiConfig();
  if (!apiKey) {
    throw new GeminiServiceError('GEMINI_API_KEY is not configured', 'GEMINI_API_KEY_MISSING');
  }

  const contents = [
    ...history.map((message) => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: message.content }]
    })),
    {
      role: 'user',
      parts: [{ text: userMessage }]
    }
  ];

  const response = await fetch(`${apiBaseUrl}/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      generationConfig: {
        temperature: 0.3,
        topP: 0.9,
        maxOutputTokens: 900
      },
      contents
    })
  });

  const data = await response.json();
  if (!response.ok) {
    const message = data?.error?.message || 'Gemini request failed';
    throw new GeminiServiceError(message, 'GEMINI_REQUEST_FAILED');
  }

  const text = extractTextFromResponse(data);
  if (!text) {
    throw new GeminiServiceError('Gemini returned an empty response', 'GEMINI_EMPTY_RESPONSE');
  }

  return text;
}

module.exports = {
  GeminiServiceError,
  generateGeminiAnswer
};
