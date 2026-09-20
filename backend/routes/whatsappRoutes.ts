import express from 'express';
import {
  getWhatsAppStatus,
  normalizeMetaWebhook,
  sendWhatsAppMessage,
} from '../services/whatsappService.js';
import { processCustomerMessage } from '../services/agentService.js';

const router = express.Router();

// GET /api/whatsapp/status
router.get('/status', (req, res) => {
  res.json(getWhatsAppStatus());
});

// GET /api/whatsapp/webhook (Meta Webhook verification)
router.get('/webhook', (req, res) => {
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('[WhatsApp Webhook] Verification succeeded!');
    res.status(200).send(challenge);
    return;
  }

  res.status(403).send('Verification failed');
});

// POST /api/whatsapp/webhook (Meta Cloud API inbound messages)
router.post('/webhook', async (req, res) => {
  // Acknowledge Meta immediately to avoid duplicate webhooks
  res.status(200).send('EVENT_RECEIVED');

  const normalized = normalizeMetaWebhook(req.body);
  if (!normalized) {
    return;
  }

  try {
    const result = await processCustomerMessage({
      source: 'whatsapp',
      customer: normalized.customer,
      message: normalized.message,
      sessionId: `wa-${normalized.customer.phone}`,
    });

    if (result.reply) {
      await sendWhatsAppMessage(normalized.customer.phone, result.reply);
    }
  } catch (err: any) {
    console.error('[WhatsApp Webhook Processing Error]:', err);
  }
});

// POST /api/whatsapp/raw (Channel-independent bridge for existing MERN WhatsApp bot)
router.post('/raw', async (req, res) => {
  try {
    const { customer, message, sessionId } = req.body;

    if (!message || !message.text) {
      res.status(400).json({
        success: false,
        error: 'Missing required field "message.text" in request body.',
      });
      return;
    }

    const result = await processCustomerMessage({
      source: 'whatsapp',
      customer: customer || { name: 'WhatsApp User' },
      message: {
        id: message.id || `raw-${Date.now()}`,
        text: message.text,
        timestamp: message.timestamp || new Date().toISOString(),
      },
      sessionId: sessionId || (customer?.phone ? `wa-${customer.phone}` : undefined),
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/chat-app/message & POST /api/whatsapp/chattify
 * Dedicated bridge for your custom MERN / Chattify chat application.
 * Accepts senderId, senderName, senderPhone, receiverId, text, and messageId.
 * Executes the autonomous Store Operator, reserves inventory, and returns the bot's reply.
 */
const handleChatAppMessage = async (req: express.Request, res: express.Response) => {
  try {
    const {
      senderId,
      senderName,
      senderPhone,
      receiverId,
      text,
      messageId,
    } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      res.status(400).json({
        success: false,
        error: 'Missing required field "text" (message text) in request body.',
      });
      return;
    }

    const customerId = senderId || senderPhone || 'chattify-user';
    const customerFullName = senderName || `Chat Customer (${String(customerId).slice(-4)})`;
    const customerPhoneNumber = senderPhone || (typeof senderId === 'string' && /^\d+$/.test(senderId) ? senderId : '9876543210');

    const result = await processCustomerMessage({
      source: 'whatsapp',
      customer: {
        id: String(customerId),
        name: customerFullName,
        phone: customerPhoneNumber,
        whatsappId: String(customerId),
      },
      message: {
        id: messageId || `chattify-${Date.now()}`,
        text: text.trim(),
        timestamp: new Date().toISOString(),
      },
      sessionId: `chat-${customerId}`,
    });

    res.status(200).json({
      success: true,
      reply: result.reply,
      order: result.order || null,
      orderId: result.order?.orderId || null,
      totalAmount: result.order?.totalAmount || null,
      activities: result.activities || [],
      senderId,
      receiverId,
    });
  } catch (err: any) {
    console.error('[Chat App Bridge Error]:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Internal server error while processing chat app message',
    });
  }
};

router.post('/chattify', handleChatAppMessage);
router.post('/bridge', handleChatAppMessage);

export default router;
