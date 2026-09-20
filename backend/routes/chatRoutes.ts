import express from 'express';
import { processCustomerMessage, getSessionHistory, clearSessionHistory } from '../services/agentService.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { message, sessionId, customer, source = 'web', messageId } = req.body;

    if (!message || (typeof message === 'string' && !message.trim())) {
      res.status(400).json({
        success: false,
        error: 'Message text is required and cannot be empty.',
      });
      return;
    }

    const messageText = typeof message === 'string' ? message : message.text;

    const result = await processCustomerMessage({
      source,
      customer: customer || { name: 'Customer' },
      message: {
        id: messageId || `msg-${Date.now()}`,
        text: messageText,
        timestamp: new Date().toISOString(),
      },
      sessionId,
    });

    res.json(result);
  } catch (error: any) {
    console.error('[Chat API Error]:', error);
    res.status(500).json({
      success: false,
      reply: 'An unexpected error occurred while processing the request.',
      error: error.message,
      activities: [
        {
          type: 'error',
          label: 'System Error',
          status: 'failed',
          timestamp: new Date().toISOString(),
          details: error.message,
        },
      ],
    });
  }
});

router.get('/history/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const history = getSessionHistory(sessionId);
  res.json({ sessionId, history });
});

router.post('/clear/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  clearSessionHistory(sessionId);
  res.json({ success: true, message: `Session ${sessionId} cleared.` });
});

export default router;
