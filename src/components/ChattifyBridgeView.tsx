import React, { useState } from 'react';
import {
  Share2,
  Copy,
  Check,
  Code,
  Send,
  Terminal,
  Zap,
  ExternalLink,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export const ChattifyBridgeView: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [testText, setTestText] = useState('Bhai 2 packet Maggi noodles aur 1 litre Amul milk bhej do');
  const [testSenderName, setTestSenderName] = useState('Mohan Lal');
  const [testSenderPhone, setTestSenderPhone] = useState('9811223344');
  const [isSending, setIsSending] = useState(false);
  const [bridgeResult, setBridgeResult] = useState<any>(null);

  const endpointUrl = `${window.location.origin}/api/chat-app/chattify`;

  const alteredCode = `export const sendMessage = async (req, res) => {
    try {
        const {text, image} = req.body;
        const {id: receiverId} = req.params;
        const senderId = req.user._id;

        if(!text && !image){
            return res.status(400).json({ message: "Text or Image is required" });
        }
        if (senderId.equals(receiverId)) {
            return res.status(400).json({ message: "Cannot send message to yourself" });
        }
        const receiver = await User.findById(receiverId);
        if(!receiver){
            return res.status(404).json({ message: "Receiver not found" });
        }

        let imageUrl;
        if (image) {
            const sizeInBytes = Buffer.byteLength(image, 'base64');
            if (sizeInBytes > 5 * 1024 * 1024) {
                return res.status(413).json({ message: "Image exceeds 5MB limit" });
            }
            const uploadResponse = await cloudinary.uploader.upload(image, {
                folder: "chattify/messages",
                quality: "auto",
                fetch_format: "auto",
            });
            imageUrl = uploadResponse.secure_url;
        }

        // 1. Save and emit customer message immediately (snappy 0ms UI)
        const newMessage = new Message({
            senderId,
            receiverId,
            text,
            image: imageUrl,
        });

        await newMessage.save();

        const receiverSocketId = getReceiverSocketId(receiverId);
        if(receiverSocketId){
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }

        res.status(201).json(newMessage);

        // 2. DETECT IF RECEIVER IS THE STORE OPERATOR BOT
        // Checks if receiver is bot user, or STORE_BOT_USER_ID matches, or user has store_operator role
        const isStoreBot = 
            (process.env.STORE_BOT_USER_ID && receiverId.toString() === process.env.STORE_BOT_USER_ID) ||
            receiver.isBot === true ||
            receiver.role === "store_operator";

        if (isStoreBot && text) {
            // Asynchronously dispatch to Zero-Click Store Operator in background
            (async () => {
                try {
                    const STORE_OPERATOR_API_URL = process.env.STORE_OPERATOR_API_URL || 
                        "${endpointUrl}";

                    const response = await fetch(STORE_OPERATOR_API_URL, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            senderId: senderId.toString(),
                            senderName: req.user.fullName || req.user.name || "Customer",
                            senderPhone: req.user.phone || "9876543210",
                            receiverId: receiverId.toString(),
                            text: text,
                            messageId: newMessage._id.toString(),
                        }),
                    });

                    const operatorData = await response.json();

                    if (operatorData && operatorData.success && operatorData.reply) {
                        // Create and save the Store Operator's reply message
                        const botReplyMessage = new Message({
                            senderId: receiverId, // Bot sends reply
                            receiverId: senderId, // Customer receives reply
                            text: operatorData.reply,
                        });

                        await botReplyMessage.save();

                        // Emit live to customer via Socket.io
                        const senderSocketId = getReceiverSocketId(senderId);
                        if (senderSocketId) {
                            io.to(senderSocketId).emit("newMessage", botReplyMessage);
                        }
                    }
                } catch (botErr) {
                    console.error("[Store Operator Bridge Error]:", botErr);
                }
            })();
        }
    } catch (error) {
        console.log("Error in sendMessage controller: ", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(alteredCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestBridge = async () => {
    if (!testText.trim() || isSending) return;
    setIsSending(true);
    setBridgeResult(null);

    try {
      const res = await fetch('/api/chat-app/chattify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: 'chattify-user-402',
          senderName: testSenderName,
          senderPhone: testSenderPhone,
          receiverId: 'store-bot-account-id',
          text: testText,
          messageId: `msg-${Date.now()}`,
        }),
      });

      const data = await res.json();
      setBridgeResult(data);
    } catch (err: any) {
      setBridgeResult({ success: false, error: err.message });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider">
          <Share2 className="w-4 h-4" />
          <span>Chattify / Custom MERN Chat App Bridge</span>
        </div>
        <h1 className="text-2xl font-bold text-white mt-1">
          Hook Your Chat App into the Autonomous Store Operator
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-3xl">
          By updating your chat app&apos;s <code className="bg-slate-800 px-1.5 py-0.5 rounded text-emerald-300 font-mono text-xs">sendMessage</code> controller, whenever a customer chats with your Store Operator bot, this autonomous agent parses the order, checks MongoDB inventory, and emits the itemized receipt back through your existing Socket.io stream.
        </p>
      </div>

      {/* Live Bridge Simulator */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            <h2 className="font-semibold text-white text-sm">
              Live Bridge Interactive Tester
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
            POST /api/chat-app/chattify
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Sender Name (Customer)</label>
            <input
              type="text"
              value={testSenderName}
              onChange={(e) => setTestSenderName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Sender Phone</label>
            <input
              type="text"
              value={testSenderPhone}
              onChange={(e) => setTestSenderPhone(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Message Text</label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              placeholder="e.g. Bhai 2 packet Maggi noodles aur 1 litre Amul milk bhej do..."
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-emerald-500"
            />
            <button
              onClick={handleTestBridge}
              disabled={isSending || !testText.trim()}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs rounded-xl flex items-center space-x-1.5 transition-all shadow-sm disabled:opacity-40"
            >
              {isSending ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>Executing Agent...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send through Bridge</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Bridge Result Output */}
        {bridgeResult && (
          <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 font-sans space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-emerald-400 flex items-center space-x-1.5">
                <span>✓ Status 200 OK</span>
                {bridgeResult.orderId && (
                  <span className="font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                    {bridgeResult.orderId}
                  </span>
                )}
              </span>
              <span className="text-slate-400 text-[11px]">
                Emitted to Socket.io client
              </span>
            </div>

            <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 text-xs text-slate-200">
              <div className="text-[10px] uppercase font-semibold text-slate-400 mb-1">
                Bot Reply Message Preview:
              </div>
              <div className="prose prose-invert prose-xs max-w-none">
                <ReactMarkdown>{bridgeResult.reply}</ReactMarkdown>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Altered Code View */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Code className="w-4 h-4 text-emerald-400" />
            <h2 className="font-semibold text-white text-sm">
              Altered <code className="text-emerald-300 font-mono">sendMessage</code> Controller (Drop-in Replacement)
            </h2>
          </div>

          <button
            onClick={handleCopyCode}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-sm"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Code!' : 'Copy Altered Code'}</span>
          </button>
        </div>

        <div className="p-4 bg-slate-950 text-xs font-mono text-slate-300 overflow-x-auto max-h-[500px] leading-relaxed">
          <pre>{alteredCode}</pre>
        </div>
      </div>

      {/* 3 Step Integration Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs mb-3">
            1
          </div>
          <h3 className="text-sm font-bold text-white">Designate Store Bot User</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Create a user account in your chat app named &quot;Kirana Store Bot&quot; (or set <code className="bg-slate-800 px-1 text-emerald-400 font-mono">isBot: true</code> or copy its <code className="bg-slate-800 px-1 text-emerald-400 font-mono">_id</code>).
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs mb-3">
            2
          </div>
          <h3 className="text-sm font-bold text-white">Paste Altered Controller</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Replace your <code className="bg-slate-800 px-1 text-emerald-400 font-mono">sendMessage</code> function with the code above in your chat controllers file.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs mb-3">
            3
          </div>
          <h3 className="text-sm font-bold text-white">Real-Time Socket Delivery</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            When users chat with your store bot, the autonomous agent processes orders and emits the receipt right into their chat window!
          </p>
        </div>
      </div>
    </div>
  );
};
