import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Clock, 
  CheckCircle, 
  Truck, 
  XCircle, 
  Copy, 
  Check, 
  Receipt,
  Phone,
  User,
  Filter
} from 'lucide-react';
import { Order } from '../types';

interface OrdersViewProps {
  orders: Order[];
  onRefresh: () => void;
  onUpdateStatus: (orderId: string, status: string) => Promise<void>;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  onRefresh,
  onUpdateStatus,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = selectedStatus === 'all' || o.status === selectedStatus;
    const matchesSource = selectedSource === 'all' || o.source === selectedSource;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      o.orderId.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      (o.customerPhone && o.customerPhone.includes(q)) ||
      o.items.some((i) => i.name.toLowerCase().includes(q));

    return matchesStatus && matchesSource && matchesSearch;
  });

  const handleCopyReceipt = (order: Order) => {
    const lines = [
      `🛒 *KIRANA STORE RECEIPT*`,
      `Order ID: ${order.orderId}`,
      `Customer: ${order.customerName}`,
      `Date: ${new Date(order.createdAt).toLocaleString()}`,
      `-----------------------------`,
      ...order.items.map((i) => `• ${i.quantity}x ${i.name} = ₹${i.total}`),
      `-----------------------------`,
      `*Grand Total: ₹${order.totalAmount}*`,
      `Status: ${order.status.toUpperCase()}`,
      `Aapka saman dispatch ho raha hai! Dhanyawad.`,
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedId(order.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleStatusChange = async (orderMongoId: string, newStatus: string) => {
    setUpdatingId(orderMongoId);
    try {
      await onUpdateStatus(orderMongoId, newStatus);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-stone-900 tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-stone-700" />
            Store Orders & Invoicing
          </h2>
          <p className="text-xs text-stone-500">
            Real orders received autonomously from WhatsApp, Chattify, or web simulator.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="orders-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order ID, customer, item..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        {/* Status Dropdowns / Filters */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto text-xs">
          <div className="flex items-center gap-1 text-stone-500">
            <Filter className="w-3.5 h-3.5" /> Status:
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1 bg-stone-50 border border-stone-200 rounded-md outline-none text-stone-700 font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="dispatched">Dispatched</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="px-2.5 py-1 bg-stone-50 border border-stone-200 rounded-md outline-none text-stone-700 font-medium"
          >
            <option value="all">All Sources</option>
            <option value="chattify">Chattify App</option>
            <option value="whatsapp">WhatsApp Cloud</option>
            <option value="web">Web Simulator</option>
          </select>
        </div>
      </div>

      {/* Orders Grid / Cards */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-xl border border-stone-200 p-12 text-center text-stone-400 text-xs shadow-xs">
          No orders found matching your filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredOrders.map((order) => {
            const isConfirmed = order.status === 'confirmed';
            const isDispatched = order.status === 'dispatched';
            const isDelivered = order.status === 'delivered';
            const isCancelled = order.status === 'cancelled' || order.status === 'rejected';

            return (
              <div
                key={order.id}
                className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-stone-300 transition-colors"
              >
                <div>
                  {/* Top Bar: Order ID, Source Badge, Status */}
                  <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-stone-900">
                        {order.orderId}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-stone-100 text-stone-600 border border-stone-200">
                        {order.source}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          isDelivered
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : isDispatched
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : isCancelled
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>

                  {/* Customer Info & Timestamp */}
                  <div className="my-3 flex items-center justify-between text-xs text-stone-600">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-stone-400" />
                      <span className="font-semibold text-stone-900">{order.customerName}</span>
                      {order.customerPhone && (
                        <span className="text-stone-400 font-mono text-[11px]">
                          ({order.customerPhone})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-stone-400">
                      <Clock className="w-3 h-3" />
                      {new Date(order.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="bg-stone-50 rounded-lg p-3 space-y-1.5 text-xs text-stone-700 border border-stone-100">
                    <div className="text-[10px] uppercase font-bold text-stone-400 tracking-wider mb-1">
                      Ordered Items:
                    </div>
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <span className="text-stone-800">
                          <span className="font-semibold text-stone-900">{item.quantity}x</span> {item.name}
                        </span>
                        <span className="font-mono text-stone-600">₹{item.total}</span>
                      </div>
                    ))}

                    <div className="pt-2 border-t border-stone-200/80 flex justify-between items-center font-bold text-xs text-stone-900">
                      <span>Grand Total:</span>
                      <span className="text-sm font-mono text-emerald-700">₹{order.totalAmount}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Controls: WhatsApp Bill Copy & Status Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-stone-100 gap-2">
                  <button
                    onClick={() => handleCopyReceipt(order)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
                    title="Copy WhatsApp formatted receipt to clipboard"
                  >
                    {copiedId === order.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-semibold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-stone-500" />
                        <span>Copy Bill</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1">
                    {order.status === 'confirmed' && (
                      <button
                        onClick={() => handleStatusChange(order.id, 'dispatched')}
                        disabled={updatingId === order.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                      >
                        <Truck className="w-3.5 h-3.5" /> Dispatch
                      </button>
                    )}
                    {(order.status === 'dispatched' || order.status === 'confirmed') && (
                      <button
                        onClick={() => handleStatusChange(order.id, 'delivered')}
                        disabled={updatingId === order.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Delivered
                      </button>
                    )}
                    {order.status !== 'cancelled' && order.status !== 'delivered' && (
                      <button
                        onClick={() => handleStatusChange(order.id, 'cancelled')}
                        disabled={updatingId === order.id}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Cancel Order"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
