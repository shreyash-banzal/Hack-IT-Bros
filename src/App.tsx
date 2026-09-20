import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { ChatSimulatorView } from './components/ChatSimulatorView';
import { InventoryView } from './components/InventoryView';
import { OrdersView } from './components/OrdersView';
import { IntegrationHubView } from './components/IntegrationHubView';
import { Product, Order, DashboardStats, SystemHealth } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'chat' | 'inventory' | 'orders' | 'integration'>('dashboard');
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);

  // Fetch all live data from MongoDB
  const fetchAllData = useCallback(async () => {
    try {
      const [healthRes, statsRes, productsRes, ordersRes] = await Promise.all([
        fetch('/api/health').catch(() => null),
        fetch('/api/dashboard/stats').catch(() => null),
        fetch('/api/products').catch(() => null),
        fetch('/api/orders').catch(() => null),
      ]);

      if (healthRes && healthRes.ok) {
        const healthData = await healthRes.json();
        setSystemHealth(healthData);
      }

      if (statsRes && statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (productsRes && productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(productsData);
      }

      if (ordersRes && ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData);
      }
    } catch (err) {
      console.error('[App fetchAllData Error]:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
    // Periodic refresh every 10 seconds for real-time dashboard updates
    const interval = setInterval(fetchAllData, 10000);
    return () => clearInterval(interval);
  }, [fetchAllData]);

  // Reset database back to clean 20 Kirana items
  const handleResetDatabase = async () => {
    if (!window.confirm('Reset database back to initial 20 Kirana products with fresh stock?')) {
      return;
    }

    setIsResetting(true);
    try {
      const res = await fetch('/api/demo/reset', { method: 'POST' });
      if (res.ok) {
        await fetchAllData();
      }
    } catch (err) {
      console.error('Reset database failed:', err);
    } finally {
      setIsResetting(false);
    }
  };

  // Quick Restock handler (+10, +15, -1)
  const handleQuickRestock = async (productId: string, addQuantity: number) => {
    try {
      const current = products.find((p) => p.id === productId);
      const newStock = Math.max(0, (current?.stock ?? 0) + addQuantity);

      const res = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: newStock }),
      });

      if (res.ok) {
        await fetchAllData();
      }
    } catch (err) {
      console.error('Quick restock error:', err);
    }
  };

  // Create Product handler
  const handleCreateProduct = async (productData: Partial<Product>): Promise<boolean> => {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });

      if (res.ok) {
        await fetchAllData();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Create product error:', err);
      return false;
    }
  };

  // Update Order Status handler
  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        await fetchAllData();
      }
    } catch (err) {
      console.error('Update order status error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 font-sans antialiased flex flex-col selection:bg-amber-100 selection:text-amber-900">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        systemHealth={systemHealth}
        onResetDatabase={handleResetDatabase}
        isResetting={isResetting}
        lowStockCount={stats?.lowStockCount ?? 0}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading && !stats ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex items-center gap-3 text-stone-500 text-sm">
              <div className="w-5 h-5 border-2 border-stone-300 border-t-amber-600 rounded-full animate-spin" />
              <span>Connecting to MongoDB Atlas & Loading Store State...</span>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardView
                stats={stats}
                onNavigateTab={setActiveTab}
                onQuickRestock={handleQuickRestock}
              />
            )}

            {activeTab === 'chat' && (
              <ChatSimulatorView
                onOrderPlaced={fetchAllData}
              />
            )}

            {activeTab === 'inventory' && (
              <InventoryView
                products={products}
                onRefresh={fetchAllData}
                onQuickRestock={handleQuickRestock}
                onCreateProduct={handleCreateProduct}
              />
            )}

            {activeTab === 'orders' && (
              <OrdersView
                orders={orders}
                onRefresh={fetchAllData}
                onUpdateStatus={handleUpdateOrderStatus}
              />
            )}

            {activeTab === 'integration' && (
              <IntegrationHubView />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200/80 bg-white/70 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-500">
          <div>
            <strong>Zero-Click Store Operator</strong> • Autonomous Kirana & Supermarket Agent Engine
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[11px] text-stone-400">
              MongoDB Atlas • Groq LLaMA 3.3 70B • Socket.io Safe
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
