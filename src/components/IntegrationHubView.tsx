import React from 'react';

export const IntegrationHubView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-8 mt-12 bg-white rounded-3xl shadow-xl border border-stone-100 animate-in fade-in zoom-in duration-500">
      <div className="flex flex-col items-center justify-center text-center">

        {/* Header Icon */}
        <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </div>

        <h2 className="text-4xl font-extrabold text-stone-800 mb-6 font-['Outfit'] tracking-tight">
          Chattify Integration Live
        </h2>

        <p className="text-lg text-stone-600 mb-8 max-w-2xl leading-relaxed">
          The Zero-Click Store Operator has been seamlessly integrated into our deployed live messaging platform, <strong>Chattify</strong>. Customers don't need to navigate complex UI menus; they simply send a natural language chat message, and the AI agent automatically extracts the intent, updates inventory, and provisions the order simultaneously!
        </p>

        {/* Instructions Box */}
        <div className="bg-blue-50/80 p-8 rounded-2xl border border-blue-200 max-w-lg w-full mb-10 text-left shadow-sm">
          <h3 className="font-bold text-blue-900 mb-4 text-xl flex items-center gap-2">
            <span>🛠️</span> How to test it:
          </h3>
          <ol className="text-base text-blue-900 space-y-4 list-decimal pl-6 font-medium">
            <li>Click the button below to open the deployed Chattify platform.</li>
            <li>Send a message to the <span className="font-bold">"Kirana Store Operator"</span> contact.</li>
            <li className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm font-mono text-sm">
              "Bhaiya 1kg sugar and 2 packet maggi bhej do."
            </li>
            <li>Watch the intelligent order automatically appear in your local Dashboard's <strong>Orders</strong> tab within milliseconds!</li>
          </ol>
        </div>

        {/* CTA Button */}
        <a
          href="https://chattify-zzsr.onrender.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-full shadow-lg transition-transform transform hover:-translate-y-1 hover:shadow-blue-500/30 overflow-hidden"
        >
          <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-0"></span>
          <span className="relative z-10">Open Chattify App</span>
          <svg className="w-6 h-6 relative z-10 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </a>

      </div>
    </div>
  );
};
