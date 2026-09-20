import dotenv from 'dotenv';
import { processCustomerMessage } from './agentService.js';

dotenv.config();

export function getWhatsAppStatus() {
  const token = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const isConfigured = Boolean(token && phoneId);

  return {
    configured: isConfigured,
    status: isConfigured ? 'Configured' : 'Not configured',
    phoneNumberId: phoneId ? `${phoneId.substring(0, 4)}****` : null,
    apiVersion: process.env.WHATSAPP_API_VERSION || 'v21.0',
    notes: isConfigured
      ? 'Meta WhatsApp Cloud API credentials detected.'
      : 'WhatsApp integration credentials (WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID) are missing. See WHATSAPP_INTEGRATION.md for setup instructions or raw bridge code.',
  };
}

/**
 * Normalizes standard Meta WhatsApp Cloud API webhook body
 */
export function normalizeMetaWebhook(body: any): {
  customer: { id: string; name: string; phone: string; whatsappId: string };
  message: { id: string; text: string; timestamp: string };
} | null {
  try {
    const entry = body?.entry?.[0];
    const change = entry?.changes?.[0]?.value;
    const contact = change?.contacts?.[0];
    const msg = change?.messages?.[0];

    if (!msg || msg.type !== 'text') {
      return null;
    }

    const phone = contact?.wa_id || msg.from;
    const name = contact?.profile?.name || `Customer (${phone})`;

    return {
      customer: {
        id: phone,
        name,
        phone,
        whatsappId: phone,
      },
      message: {
        id: msg.id,
        text: msg.text?.body || '',
        timestamp: msg.timestamp || new Date().toISOString(),
      },
    };
  } catch (err) {
    console.error('[WhatsApp Normalization Error]:', err);
    return null;
  }
}

/**
 * Sends outgoing message via Meta WhatsApp Cloud API if configured
 */
export async function sendWhatsAppMessage(toPhone: string, text: string): Promise<{ success: boolean; data?: any; error?: string }> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const version = process.env.WHATSAPP_API_VERSION || 'v21.0';

  if (!token || !phoneId) {
    return {
      success: false,
      error: 'WhatsApp Cloud API credentials (WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID) not configured.',
    };
  }

  try {
    const response = await fetch(`https://graph.facebook.com/${version}/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: toPhone,
        type: 'text',
        text: { body: text },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: (data as any)?.error?.message || 'Failed to send WhatsApp message' };
    }

    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
