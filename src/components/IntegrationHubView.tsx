import React, { useState } from 'react';
import { 
  ExternalLink, 
  Copy, 
  Check, 
  Code, 
  ShieldCheck, 
  MessageSquare, 
  FileText, 
  ArrowRight,
  Sparkles,
  Layers
} from 'lucide-react';

export const IntegrationHubView: React.FC = () => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const envSnippet = `# Add these to your Chattify backend .env:
GROQ_API_KEY=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
STORE_BOT_USER_ID=6aaf8072dc34673e1203ac12`;

  const controllerImportSnippet = `import { processStoreOperatorMessage } from "../lib/storeOperator.js";`;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-stone-900 tracking-tight flex items-center gap-2">
          <ExternalLink className="w-5 h-5 text-blue-600" />
          Chattify App & WhatsApp Integration Hub
        </h2>
        <p className="text-xs text-stone-500">
          Everything you need to connect your chat app or WhatsApp Business Cloud API to this autonomous Kirana store.
        </p>
      </div>

      {/* Architecture Flow Diagram */}
      <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs">
        <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-stone-700" />
          Zero-Click Autonomous Ordering Pipeline
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 space-y-1.5">
            <div className="w-6 h-6 rounded-md bg-stone-900 text-white flex items-center justify-center font-bold text-[11px]">
              1
            </div>
            <div className="font-bold text-stone-900">Customer Messages</div>
            <p className="text-stone-500 text-[11px] leading-relaxed">
              Customer types Hindi/English order ("2 packet Maggi noodles aur 1 litre milk") in Chattify or WhatsApp.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 space-y-1.5">
            <div className="w-6 h-6 rounded-md bg-amber-500 text-white flex items-center justify-center font-bold text-[11px]">
              2
            </div>
            <div className="font-bold text-stone-900">Groq Tool Calling</div>
            <p className="text-stone-500 text-[11px] leading-relaxed">
              LLaMA 3.3 70B autonomously calls <code className="text-amber-700">search_product</code> and matches colloquial names.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 space-y-1.5">
            <div className="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center font-bold text-[11px]">
              3
            </div>
            <div className="font-bold text-stone-900">Atomic Reservation</div>
            <p className="text-stone-500 text-[11px] leading-relaxed">
              MongoDB <code className="text-emerald-700">$inc</code> atomic query decrements stock and ensures zero overselling.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 space-y-1.5">
            <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-[11px]">
              4
            </div>
            <div className="font-bold text-stone-900">Live Itemized Bill</div>
            <p className="text-stone-500 text-[11px] leading-relaxed">
              Receipt with real prices, grand total, and Order ID is sent back to customer via Socket.io / WhatsApp API.
            </p>
          </div>
        </div>
      </div>

      {/* Guide Card 1: .env Configuration */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-stone-600" />
            <h3 className="font-semibold text-stone-900 text-sm">
              1. Chattify Environment Variables (<code className="text-xs">backend/.env</code>)
            </h3>
          </div>
          <button
            onClick={() => copyToClipboard(envSnippet, 'env')}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
          >
            {copiedSection === 'env' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedSection === 'env' ? 'Copied' : 'Copy Env'}
          </button>
        </div>

        <pre className="p-3 rounded-lg bg-stone-900 text-stone-100 text-xs font-mono overflow-x-auto">
          {envSnippet}
        </pre>
      </div>

      {/* Guide Card 2: Controller & Operator Engine */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-stone-600" />
            <h3 className="font-semibold text-stone-900 text-sm">
              2. Detailed Documentation File Generated
            </h3>
          </div>
        </div>

        <p className="text-xs text-stone-600 leading-relaxed">
          A dedicated step-by-step file <code className="px-1.5 py-0.5 rounded bg-stone-100 font-mono text-stone-800">CHATTIFY_INTEGRATION_GUIDE.md</code> has been generated in your repository root with the exact copy-paste code for:
        </p>

        <ul className="text-xs text-stone-600 space-y-1.5 list-disc pl-5">
          <li><strong>backend/src/lib/storeOperator.js</strong>: Self-contained Kirana product models, atomic MongoDB `$inc` concurrency checks, and Groq function tools.</li>
          <li><strong>backend/src/controllers/message.controller.js</strong>: Drop-in replacement that catches messages addressed to <code className="text-stone-800 font-mono">STORE_BOT_USER_ID</code> and emits the reply to Socket.io.</li>
        </ul>
      </div>

      {/* WhatsApp Cloud API Webhook */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-emerald-600" />
          <h3 className="font-semibold text-stone-900 text-sm">
            3. Real Meta WhatsApp Cloud API Webhook
          </h3>
        </div>
        <p className="text-xs text-stone-500">
          This server also exposes a native Meta WhatsApp Cloud API webhook endpoint:
        </p>
        <div className="p-3 rounded-lg bg-stone-50 border border-stone-200 text-xs space-y-1 font-mono text-stone-800">
          <div>Webhook URL: <span className="text-emerald-700">/api/whatsapp/webhook</span></div>
          <div>Verification Token: <span className="text-stone-600">store_operator_token_123</span></div>
        </div>
      </div>
    </div>
  );
};
