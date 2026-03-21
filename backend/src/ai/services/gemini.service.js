const { getGeminiConfig } = require('../config/gemini.config');

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
    throw new Error('GEMINI_API_KEY is not configured');
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
    throw new Error(message);
  }

  const text = extractTextFromResponse(data);
  if (!text) {
    throw new Error('Gemini returned an empty response');
  }

  return text;
}

module.exports = {
  generateGeminiAnswer
};
