const express = require('express');
const { createChatbotReply } = require('../ai/services/chatbot.service');

const router = express.Router();

router.post('/chat', async (req, res) => {
  try {
    const result = await createChatbotReply({
      message: req.body?.message,
      history: req.body?.history
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('[ai/chat] Request failed:', error);
    const status = error.message === 'Message is required' ? 400 : 500;
    return res.status(status).json({
      message: error.message || 'AI chat failed'
    });
  }
});

module.exports = router;
