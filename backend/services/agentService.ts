import { getGroqClient } from '../ai/groqClient.js';
import { STORE_OPERATOR_SYSTEM_PROMPT } from '../ai/agentPrompt.js';
import { groqTools, executeBackendTool, ActivityEvent } from '../ai/tools.js';

interface MessagePayload {
  source: 'web' | 'whatsapp';
  customer?: {
    id?: string;
    name?: string;
    phone?: string;
    whatsappId?: string;
  };
  message: {
    id?: string;
    text: string;
    timestamp?: string;
  };
  sessionId?: string;
}

interface ConversationTurn {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content?: string | null;
  tool_calls?: any[];
  tool_call_id?: string;
  name?: string;
}

// In-memory session store for conversation continuity (max 20 turns per session)
const sessionStore = new Map<string, ConversationTurn[]>();

export function getSessionHistory(sessionId: string): ConversationTurn[] {
  return sessionStore.get(sessionId) || [];
}

export function clearSessionHistory(sessionId: string): void {
  sessionStore.delete(sessionId);
}

export async function processCustomerMessage(payload: MessagePayload): Promise<{
  success: boolean;
  reply: string;
  order: any | null;
  activities: ActivityEvent[];
  sessionId: string;
  error?: string;
}> {
  const activities: ActivityEvent[] = [];
  const now = () => new Date().toISOString();

  const sessionId = payload.sessionId || `sess-${Date.now().toString(36)}`;
  const messageText = payload.message?.text?.trim() || '';

  activities.push({
    type: 'message_received',
    label: `Customer message received (${payload.source})`,
    status: 'success',
    timestamp: now(),
    details: `"${messageText}" from ${payload.customer?.name || 'Customer'}`,
  });

  if (!messageText) {
    return {
      success: false,
      reply: 'Please provide a message or product request.',
      order: null,
      activities,
      sessionId,
      error: 'Empty message',
    };
  }

  // Check Groq client availability
  const { client: groq, error: groqError } = getGroqClient();
  if (!groq || groqError) {
    activities.push({
      type: 'groq_ai',
      label: 'Groq AI Service Unavailable',
      status: 'failed',
      timestamp: now(),
      details: groqError || 'GROQ_API_KEY environment variable is missing.',
    });
    return {
      success: false,
      reply: 'The Autonomous AI Operator requires a configured GROQ_API_KEY to process your order. Please add your GROQ_API_KEY to the environment variables to activate autonomous store operations.',
      order: null,
      activities,
      sessionId,
      error: groqError || 'GROQ_API_KEY is not configured',
    };
  }

  // Retrieve or initialize conversation history
  let history = sessionStore.get(sessionId);
  if (!history) {
    history = [
      {
        role: 'system',
        content: STORE_OPERATOR_SYSTEM_PROMPT,
      },
    ];
  }

  // Append new user message
  history.push({
    role: 'user',
    content: messageText,
  });

  let createdOrder: any = null;
  const MAX_AGENT_STEPS = 10;
  let stepsCount = 0;
  let finalAssistantReply = '';

  const modelName = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

  while (stepsCount < MAX_AGENT_STEPS) {
    stepsCount++;

    activities.push({
      type: 'groq_request',
      label: `Groq AI Reasoning Step ${stepsCount}`,
      status: 'pending',
      timestamp: now(),
      details: `Model: ${modelName}. Consulting LLM for tool selection...`,
    });

    let completion: any;
    try {
      completion = await groq.chat.completions.create({
        model: modelName,
        messages: history as any,
        tools: groqTools as any,
        tool_choice: 'auto',
        temperature: 0.1, // low temperature for precise tool calling
      });
    } catch (apiError: any) {
      console.error('[Groq API Error]:', apiError.message);
      activities.push({
        type: 'groq_request',
        label: `Groq AI API Call Failed`,
        status: 'failed',
        timestamp: now(),
        details: apiError.message,
      });
      return {
        success: false,
        reply: `AI service error: ${apiError.message}`,
        order: null,
        activities,
        sessionId,
        error: apiError.message,
      };
    }

    const choice = completion.choices?.[0];
    if (!choice || !choice.message) {
      break;
    }

    const responseMessage = choice.message;

    // Check if model decided to call tools
    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      // Record assistant message with tool calls in history
      history.push({
        role: 'assistant',
        content: responseMessage.content || null,
        tool_calls: responseMessage.tool_calls,
      });

      // Execute each tool call against real backend & MongoDB
      for (const toolCall of responseMessage.tool_calls) {
        const functionName = toolCall.function.name;
        let functionArgs: any = {};
        try {
          functionArgs = JSON.parse(toolCall.function.arguments || '{}');
        } catch {
          functionArgs = {};
        }

        activities.push({
          type: 'tool_execution',
          label: `Executing Backend Tool: ${functionName}`,
          status: 'pending',
          timestamp: now(),
          details: `Parameters: ${JSON.stringify(functionArgs)}`,
        });

        // Execute against real MongoDB backend service
        const toolExecution = await executeBackendTool(functionName, functionArgs, {
          source: payload.source,
          customer: payload.customer,
          sessionId,
          messageId: payload.message?.id,
        });

        // Append tool execution activities
        activities.push(...toolExecution.activities);

        // Check if an order was created
        if (functionName === 'create_order' && toolExecution.result?.success && toolExecution.result.order) {
          createdOrder = toolExecution.result.order;
        }

        // Return tool result back to Groq conversation
        history.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          name: functionName,
          content: JSON.stringify(toolExecution.result),
        });
      }

      // Loop continues so Groq can examine tool output and generate next tool call or final text
      continue;
    }

    // No tool calls: model has generated final response to customer
    finalAssistantReply = responseMessage.content || 'Your request has been processed.';
    history.push({
      role: 'assistant',
      content: finalAssistantReply,
    });

    activities.push({
      type: 'agent_complete',
      label: 'Store Operator Finalized Response',
      status: 'success',
      timestamp: now(),
      details: createdOrder ? `Order confirmed with Order ID: ${createdOrder.orderId}` : 'Customer response ready',
    });

    break;
  }

  // Trim session history to avoid overflowing context limits
  if (history.length > 25) {
    history = [history[0], ...history.slice(-20)];
  }
  sessionStore.set(sessionId, history);

  return {
    success: true,
    reply: finalAssistantReply,
    order: createdOrder,
    activities,
    sessionId,
  };
}
