import React, { useState } from 'react';
import { 
  TrendingUp, 
  ShoppingBag, 
  AlertTriangle, 
  Package, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  ArrowRight,
  Clock,
  Plus
} from 'lucide-react';
import { DashboardStats } from '../types';

interface DashboardViewProps {
  stats: DashboardStats | null;
  onNavigateTab: (tab: 'dashboard' | 'chat' | 'inventory' | 'orders' | 'integration') => void;
  onQuickRestock: (productId: string, addQuantity: number) => Promise<void>;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  onNavigateTab,
  onQuickRestock,
}) => {
  const [concurrencyResult, setConcurrencyResult] = useState<any | null>(null);
  const [isTestingConcurrency, setIsTestingConcurrency] = useState(false);
  const [restockingId, setRestockingId] = useState<string | null>(null);

  const handleRunConcurrencyTest = async () => {
    setIsTestingConcurrency(true);
    setConcurrencyResult(null);
    try {
      const res = await fetch('/api/demo/test-concurrency', { method: 'POST' });
      const data = await res.json();
      setConcurrencyResult(data);
    } catch (err: any) {
      setConcurrencyResult({ error: err.message });
    } finally {
      setIsTestingConcurrency(false);
    }
  };

  const handleRestock = async (productId: string) => {
    setRestockingId(productId);
    try {
      await onQuickRestock(productId, 15);
    } finally {
      setRestockingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div id="kpi-total-sales" className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Sales</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-stone-900 tracking-tight">
            ₹{stats?.totalSales.toLocaleString('en-IN') ?? '0'}
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Confirmed & completed orders
          </p>
        </div>

        {/* Today's Orders */}
        <div id="kpi-today-orders" className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Today's Orders</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-stone-900 tracking-tight">
            {stats?.todayOrders ?? 0}
          </div>
          <p className="text-xs text-stone-500 mt-1">
            ₹{stats?.todaySales.toLocaleString('en-IN') ?? '0'} generated today
          </p>
        </div>

        {/* Low Stock Alerts */}
        <div id="kpi-low-stock" className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Stock Alerts</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-700 tracking-tight">
            {stats?.lowStockCount ?? 0}
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Items below reorder threshold
          </p>
        </div>

        {/* Catalog Items */}
        <div id="kpi-total-products" className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Catalog</span>
            <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-stone-900 tracking-tight">
            {stats?.totalProducts ?? 0}
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Kirana SKUs in MongoDB
          </p>
        </div>
      </div>

      {/* Real Concurrency Protection Runner & Verification */}
      <div id="concurrency-test-card" className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="font-semibold text-stone-900 text-sm">
                Atomic Concurrency & Race-Condition Protection
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                MongoDB $inc Safe
              </span>
            </div>
            <p className="text-xs text-stone-500 max-w-2xl">
              Simulates two customers simultaneously ordering 4 units each at the exact same millisecond against a product with only 5 units in stock. Demonstrates zero-overselling protection.
            </p>
          </div>
          <button
            id="run-concurrency-test-btn"
            onClick={handleRunConcurrencyTest}
            disabled={isTestingConcurrency}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-stone-900 hover:bg-stone-800 text-white transition-colors disabled:opacity-50 shrink-0"
          >
            <Zap className={`w-3.5 h-3.5 text-amber-400 ${isTestingConcurrency ? 'animate-bounce' : ''}`} />
            {isTestingConcurrency ? 'Running Concurrent Orders...' : 'Run Simultaneous Test'}
          </button>
        </div>

        {concurrencyResult && (
          <div className="mt-4 p-4 rounded-lg bg-stone-50 border border-stone-200 text-xs">
            <div className="flex items-center justify-between font-semibold text-stone-800 mb-2">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Concurrency Test Result: {concurrencyResult.raceConditionPrevented ? 'RACE CONDITION PREVENTED' : 'Test Complete'}
              </span>
              <span className="text-stone-500 font-mono">
                Final Stock: {concurrencyResult.finalStock} units (Started at {concurrencyResult.initialStock})
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-stone-600">
              <div className="p-2.5 rounded bg-white border border-stone-200">
                <div className="font-semibold text-stone-900 mb-0.5">Order A (4 units)</div>
                <div className={concurrencyResult.orderA?.success ? 'text-emerald-700' : 'text-amber-700'}>
                  {concurrencyResult.orderA?.success 
                    ? `Placed successfully (${concurrencyResult.orderA.orderId})` 
                    : `Rejected safely: ${concurrencyResult.orderA?.error}`}
                </div>
              </div>
              <div className="p-2.5 rounded bg-white border border-stone-200">
                <div className="font-semibold text-stone-900 mb-0.5">Order B (4 units)</div>
                <div className={concurrencyResult.orderB?.success ? 'text-emerald-700' : 'text-amber-700'}>
                  {concurrencyResult.orderB?.success 
                    ? `Placed successfully (${concurrencyResult.orderB.orderId})` 
                    : `Rejected safely: ${concurrencyResult.orderB?.error}`}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Two Column Grid: Low Stock Warnings & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Items */}
        <div id="dashboard-low-stock-panel" className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h3 className="font-semibold text-stone-900 text-sm">Low Stock Items</h3>
              </div>
              <button
                onClick={() => onNavigateTab('inventory')}
                className="text-xs font-medium text-amber-700 hover:text-amber-800 flex items-center gap-1"
              >
                View all <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {(!stats?.lowStockProducts || stats.lowStockProducts.length === 0) ? (
              <div className="py-8 text-center text-xs text-stone-400">
                All inventory items are well-stocked above thresholds!
              </div>
            ) : (
              <div className="space-y-2">
                {stats.lowStockProducts.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-stone-50 border border-stone-200/60"
                  >
                    <div>
                      <div className="text-xs font-semibold text-stone-900">{item.name}</div>
                      <div className="text-[11px] text-stone-500">
                        ₹{item.price} • {item.unit}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        {item.stock} left
                      </span>
                      <button
                        onClick={() => handleRestock(item.id)}
                        disabled={restockingId === item.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        {restockingId === item.id ? 'Adding...' : '+15'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div id="dashboard-recent-orders-panel" className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-stone-600" />
                <h3 className="font-semibold text-stone-900 text-sm">Recent Store Orders</h3>
              </div>
              <button
                onClick={() => onNavigateTab('orders')}
                className="text-xs font-medium text-stone-600 hover:text-stone-900 flex items-center gap-1"
              >
                View all <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {(!stats?.recentOrders || stats.recentOrders.length === 0) ? (
              <div className="py-8 text-center text-xs text-stone-400">
                No orders placed yet today. Try sending a message in the Simulator!
              </div>
            ) : (
              <div className="space-y-2">
                {stats.recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-stone-50 border border-stone-200/60"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-stone-900">
                          {order.orderId}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {order.status}
                        </span>
                        <span className="text-[10px] text-stone-400 uppercase">
                          {order.source}
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-500 mt-0.5">
                        {order.customerName} • {order.itemsCount} items
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-stone-900">
                        ₹{order.totalAmount}
                      </div>
                      <div className="text-[10px] text-stone-400 flex items-center gap-1 justify-end">
                        <Clock className="w-3 h-3" />
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
