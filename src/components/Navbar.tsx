import React from 'react';
import { 
  Store, 
  Database, 
  Cpu, 
  RotateCcw, 
  LayoutDashboard, 
  MessageSquareCode, 
  Package, 
  ShoppingBag, 
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { SystemHealth } from '../types';

interface NavbarProps {
  activeTab: 'dashboard' | 'chat' | 'inventory' | 'orders' | 'integration';
  setActiveTab: (tab: 'dashboard' | 'chat' | 'inventory' | 'orders' | 'integration') => void;
  systemHealth: SystemHealth | null;
  onResetDatabase: () => void;
  isResetting: boolean;
  lowStockCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  systemHealth,
  onResetDatabase,
  isResetting,
  lowStockCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Store Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shadow-sm">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-stone-900 tracking-tight text-lg">
                  Zero-Click Store Operator
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Sparkles className="w-3 h-3 text-emerald-600" /> Kirana AI
                </span>
              </div>
              <p className="text-xs text-stone-500 font-normal">
                Autonomous Natural Language & Real Inventory Engine
              </p>
            </div>
          </div>

          {/* System Health Badges & Reset Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* MongoDB status badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-stone-100 border border-stone-200 text-stone-700" title={systemHealth?.databaseDetails?.uri || 'MongoDB Atlas'}>
              <span className={`w-2 h-2 rounded-full ${systemHealth?.database === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              <Database className="w-3.5 h-3.5 text-stone-500" />
              <span className="hidden md:inline">MongoDB Atlas</span>
            </div>

            {/* Groq LLaMA status badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 border border-amber-200 text-amber-800">
              <Cpu className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden md:inline">Groq LLaMA 3.3</span>
              <span className="md:hidden">AI</span>
            </div>

            {/* Seed / Reset DB Button */}
            <button
              id="reset-db-btn"
              onClick={onResetDatabase}
              disabled={isResetting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 border border-stone-200 transition-colors disabled:opacity-50"
              title="Reset catalog back to initial 20 Kirana products"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin text-amber-600' : ''}`} />
              <span className="hidden sm:inline">{isResetting ? 'Resetting...' : 'Reset Catalog'}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-1 sm:space-x-4 border-t border-stone-100 overflow-x-auto py-1 scrollbar-none">
          <button
            id="nav-tab-dashboard"
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
              activeTab === 'dashboard'
                ? 'text-stone-900 bg-stone-100 border border-stone-200/60 shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-stone-500" />
            Dashboard
          </button>

          <button
            id="nav-tab-chat"
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
              activeTab === 'chat'
                ? 'text-stone-900 bg-stone-100 border border-stone-200/60 shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <MessageSquareCode className="w-4 h-4 text-amber-600" />
            AI Simulator & Tool Trace
          </button>

          <button
            id="nav-tab-inventory"
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
              activeTab === 'inventory'
                ? 'text-stone-900 bg-stone-100 border border-stone-200/60 shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <Package className="w-4 h-4 text-stone-500" />
            Inventory
            {lowStockCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                {lowStockCount}
              </span>
            )}
          </button>

          <button
            id="nav-tab-orders"
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
              activeTab === 'orders'
                ? 'text-stone-900 bg-stone-100 border border-stone-200/60 shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-stone-500" />
            Orders
          </button>

          <button
            id="nav-tab-integration"
            onClick={() => setActiveTab('integration')}
            className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
              activeTab === 'integration'
                ? 'text-stone-900 bg-stone-100 border border-stone-200/60 shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <ExternalLink className="w-4 h-4 text-blue-600" />
            Chattify Integration
          </button>
        </nav>
      </div>
    </header>
  );
};
