import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Terminal, 
  CheckCircle, 
  Sparkles, 
  Clock, 
  RotateCcw,
  CheckCheck,
  Receipt,
  AlertCircle
} from 'lucide-react';
import { ChatMessage, AgentActivity } from '../types';

interface ChatSimulatorViewProps {
  onOrderPlaced: () => void;
}

export const ChatSimulatorView: React.FC<ChatSimulatorViewProps> = ({ onOrderPlaced }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'store',
      text: 'नमस्ते! मैं आपका किराना स्टोर AI ऑपरेटर हूँ। आप हिंदी, हिंग्लिश या इंग्लिश में किराना सामान मंगा सकते हैं (उदा. "2 packet Maggi aur 1 litre Amul milk bhej do")।',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [customerName, setCustomerName] = useState('Akshat');
  const [customerPhone, setCustomerPhone] = useState('9876543210');
  const [isLoading, setIsLoading] = useState(false);
  const [activeActivities, setActiveActivities] = useState<AgentActivity[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const quickPrompts = [
    'Bhai 2 packet Maggi noodles aur 1 litre Amul milk bhej do',
    '1 bag Aashirvaad Atta aur 1kg Madhur Sugar bhejo',
    '1 packet Tata Salt aur 2 packet Parle G biscuit',
    'Bhai 100 bag Atta bhej do (test low-stock safety)',
    '1 packet XYZ chocolate bhej do (test catalog miss)',
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    const userMsgId = `user-${Date.now()}`;
    const userMessage: ChatMessage = {
      id: userMsgId,
      sender: 'customer',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          sessionId: `sim-${customerPhone}`,
          customer: {
            name: customerName,
            phone: customerPhone,
          },
          source: 'web',
          messageId: `msg-${Date.now()}`,
        }),
      });

      const data = await response.json();

      if (data.activities && Array.isArray(data.activities)) {
        setActiveActivities(data.activities);
      }

      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'store',
        text: data.reply || 'Order processed successfully.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        orderData: data.order,
        activities: data.activities,
        rawResult: data,
      };

      setMessages((prev) => [...prev, botMessage]);

      if (data.order) {
        onOrderPlaced();
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'store',
          text: `Error processing request: ${err.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        sender: 'store',
        text: 'चैट रीसेट हो गई है। आप नया आर्डर दे सकते हैं!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ]);
    setActiveActivities([]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[640px]">
      {/* Left Column: Chat Conversation (7 cols) */}
      <div className="lg:col-span-7 bg-white rounded-xl border border-stone-200 shadow-xs flex flex-col h-[720px] overflow-hidden">
        {/* Chat Header */}
        <div className="px-4 py-3 border-b border-stone-200 bg-stone-50/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              🏪
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-stone-900 text-sm">Kirana Store Operator</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-[11px] text-stone-500">
                Direct WhatsApp / Chattify Customer Simulator
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-stone-500 bg-white px-2 py-1 rounded-md border border-stone-200">
              <User className="w-3.5 h-3.5 text-stone-400" />
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-16 outline-none font-medium text-stone-800"
                placeholder="Name"
                title="Customer Name"
              />
            </div>
            <button
              id="clear-chat-btn"
              onClick={handleClearChat}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
              title="Clear Conversation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Suggestion Pills */}
        <div className="px-4 py-2 border-b border-stone-100 bg-stone-50/40 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[11px]">
          <span className="text-stone-400 font-medium shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" /> Try:
          </span>
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-full bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 whitespace-nowrap transition-colors disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-stone-50/30">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'customer' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-xs ${
                  msg.sender === 'customer'
                    ? 'bg-stone-900 text-white rounded-br-xs'
                    : 'bg-white border border-stone-200/80 text-stone-800 rounded-bl-xs'
                }`}
              >
                <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>

                {/* If order confirmed, show visual receipt */}
                {msg.orderData && (
                  <div className="mt-3 pt-2.5 border-t border-stone-200 text-xs text-stone-700">
                    <div className="flex items-center justify-between font-semibold text-emerald-800 mb-1">
                      <span className="flex items-center gap-1">
                        <Receipt className="w-3.5 h-3.5" /> Order Confirmed
                      </span>
                      <span className="font-mono">{msg.orderData.orderId}</span>
                    </div>
                    <div className="space-y-1 my-1.5">
                      {msg.orderData.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-stone-600 text-[11px]">
                          <span>{item.quantity}x {item.name}</span>
                          <span className="font-mono">₹{item.total}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between font-bold text-stone-900 border-t border-stone-100 pt-1 text-xs">
                      <span>Total Amount:</span>
                      <span>₹{msg.orderData.totalAmount}</span>
                    </div>
                  </div>
                )}

                <div
                  className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                    msg.sender === 'customer' ? 'text-stone-400' : 'text-stone-400'
                  }`}
                >
                  <Clock className="w-2.5 h-2.5" />
                  <span>{msg.timestamp}</span>
                  {msg.sender === 'customer' && <CheckCheck className="w-3 h-3 text-sky-400" />}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start gap-2">
              <div className="bg-white border border-stone-200 rounded-2xl rounded-bl-xs px-4 py-3 shadow-xs">
                <div className="flex items-center gap-2 text-xs text-stone-500">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  <span>Agent querying MongoDB catalog & checking stock...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 border-t border-stone-200 bg-white flex items-center gap-2"
        >
          <input
            id="chat-simulator-input"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
            placeholder="Type order message in Hindi or English (e.g. 2 packet Maggi noodles)..."
            className="flex-1 px-3.5 py-2 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-stone-400"
          />
          <button
            id="chat-simulator-send-btn"
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-40 shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>

      {/* Right Column: AI Agent Tool Trace & Inspector (5 cols) */}
      <div className="lg:col-span-5 bg-white rounded-xl border border-stone-200 shadow-xs flex flex-col h-[720px] overflow-hidden">
        {/* Tool Trace Header */}
        <div className="px-4 py-3 border-b border-stone-200 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-xs tracking-wide uppercase">
              Agent Tool Calling Trace
            </span>
          </div>
          <span className="text-[10px] font-mono bg-stone-800 text-stone-300 px-2 py-0.5 rounded border border-stone-700">
            Groq LLaMA 3.3 70B
          </span>
        </div>

        {/* Activities List */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 font-mono text-xs bg-stone-950 text-stone-300">
          <div className="text-[11px] text-stone-500 border-b border-stone-800 pb-2">
            // Real-time trace of autonomous functions executed against MongoDB
          </div>

          {activeActivities.length === 0 ? (
            <div className="py-16 text-center text-stone-600 text-xs">
              <Bot className="w-8 h-8 mx-auto mb-2 text-stone-700 opacity-60" />
              Waiting for order message. Send an order to inspect tool arguments, MongoDB queries, and atomic reservation steps.
            </div>
          ) : (
            activeActivities.map((act, index) => (
              <div
                key={index}
                className="p-3 rounded-lg bg-stone-900/90 border border-stone-800 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-amber-400 font-bold flex items-center gap-1.5">
                    {act.status === 'success' ? (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    ) : act.status === 'failed' ? (
                      <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                    ) : (
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                    )}
                    {act.label}
                  </span>
                  <span className="text-[10px] text-stone-500">
                    {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>

                <div className="text-[11px] text-stone-400 flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-stone-800 text-stone-300 text-[10px]">
                    tool: {act.type}
                  </span>
                  <span className={`text-[10px] ${act.status === 'success' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    status: {act.status}
                  </span>
                </div>

                {act.details && (
                  <pre className="p-2 rounded bg-black/60 text-[10px] text-stone-300 overflow-x-auto scrollbar-none border border-stone-800/80">
                    {typeof act.details === 'string'
                      ? act.details
                      : JSON.stringify(act.details, null, 2)}
                  </pre>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 border-t border-stone-800 bg-stone-900 text-stone-400 text-[10px] flex items-center justify-between">
          <span>Engine: OpenAI-compatible Tool-Calling loop</span>
          <span className="text-emerald-400 font-mono">Atomic $inc Safe</span>
        </div>
      </div>
    </div>
  );
};
