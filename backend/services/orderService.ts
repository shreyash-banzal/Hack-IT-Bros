import mongoose from 'mongoose';
import { Order, IOrder, IOrderItem } from '../models/Order.js';
import { Customer } from '../models/Customer.js';
import { reserveInventoryAtomic, rollbackReservations } from './inventoryService.js';

export interface CreateOrderParams {
  items: Array<{ productId: string; quantity: number }>;
  customer?: {
    name?: string;
    phone?: string;
    customerId?: string;
  };
  source?: 'web' | 'whatsapp';
  messageId?: string;
  sessionId?: string;
  notes?: string;
}

export async function createOrder(params: CreateOrderParams): Promise<{
  success: boolean;
  order?: any;
  error?: string;
  failedItem?: any;
}> {
  const { items, customer, source = 'web', messageId, sessionId, notes } = params;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return { success: false, error: 'Cannot create order: No items provided.' };
  }

  // Idempotency check for duplicate messages (e.g. repeated WhatsApp webhooks)
  if (messageId) {
    const existingOrder = await Order.findOne({ messageId }).lean();
    if (existingOrder) {
      console.log(`[OrderService] Idempotent hit: Order already created for messageId ${messageId}`);
      return {
        success: true,
        order: {
          id: existingOrder._id.toString(),
          orderId: existingOrder.orderId,
          totalAmount: existingOrder.totalAmount,
          items: existingOrder.items,
          status: existingOrder.status,
          createdAt: existingOrder.createdAt,
          isDuplicate: true,
        },
      };
    }
  }

  // 1. Atomically reserve inventory
  const reservationResult = await reserveInventoryAtomic(items);
  if (!reservationResult.success || !reservationResult.reservedItems) {
    return {
      success: false,
      error: reservationResult.error || 'Failed to reserve stock.',
      failedItem: reservationResult.failedItem,
    };
  }

  try {
    // 2. Compute backend order total using real MongoDB unit prices
    let calculatedTotal = 0;
    const orderItems: IOrderItem[] = reservationResult.reservedItems.map((r) => {
      const subtotal = Number((r.unitPrice * r.quantity).toFixed(2));
      calculatedTotal += subtotal;
      return {
        productId: new mongoose.Types.ObjectId(r.productId),
        productName: r.productName,
        quantity: r.quantity,
        unitPrice: r.unitPrice,
        subtotal,
      };
    });

    calculatedTotal = Number(calculatedTotal.toFixed(2));

    // 3. Generate unique order ID
    const uniqueSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const orderId = `ORD-${Date.now().toString().slice(-6)}-${uniqueSuffix}`;

    const customerName = customer?.name?.trim() || 'Valued Customer';
    const customerPhone = customer?.phone?.trim() || '';

    // 4. Create and save real Order in MongoDB
    const order = await Order.create({
      orderId,
      customerId: customer?.customerId,
      customerName,
      customerPhone,
      items: orderItems,
      totalAmount: calculatedTotal,
      status: 'confirmed',
      source,
      messageId,
      sessionId,
      notes: notes || '',
    });

    // 5. Update customer record if phone is provided
    if (customerPhone) {
      await Customer.findOneAndUpdate(
        { phone: customerPhone },
        {
          $setOnInsert: { name: customerName, phone: customerPhone },
          $inc: { totalOrders: 1 },
        },
        { upsert: true, returnDocument: 'after' }
      ).catch((err) => console.error('[Customer Update Warning]:', err.message));
    }

    return {
      success: true,
      order: {
        id: order._id.toString(),
        orderId: order.orderId,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        items: order.items.map((it: any) => ({
          productId: it.productId.toString(),
          productName: it.productName,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          subtotal: it.subtotal,
        })),
        totalAmount: order.totalAmount,
        status: order.status,
        source: order.source,
        createdAt: order.createdAt,
      },
    };
  } catch (creationError: any) {
    // If order document creation fails, roll back the reserved inventory!
    console.error('[OrderService] Order creation failed, rolling back reserved stock:', creationError.message);
    await rollbackReservations(items);
    return {
      success: false,
      error: `Order creation failed: ${creationError.message}`,
    };
  }
}

export async function getOrderById(orderId: string): Promise<any | null> {
  const order = await Order.findOne({
    $or: [{ orderId }, ...(mongoose.Types.ObjectId.isValid(orderId) ? [{ _id: orderId }] : [])],
  }).lean();

  if (!order) return null;
  return {
    id: order._id.toString(),
    orderId: order.orderId,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    items: order.items,
    totalAmount: order.totalAmount,
    status: order.status,
    source: order.source,
    createdAt: order.createdAt,
  };
}

export async function getAllOrders(filter: Record<string, any> = {}, limit: number = 50): Promise<any[]> {
  const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
  return orders.map((o) => ({
    id: o._id.toString(),
    orderId: o.orderId,
    customerName: o.customerName,
    customerPhone: o.customerPhone,
    items: o.items,
    totalAmount: o.totalAmount,
    status: o.status,
    source: o.source,
    createdAt: o.createdAt,
  }));
}

export async function updateOrderStatus(orderId: string, status: 'confirmed' | 'pending_approval' | 'cancelled' | 'rejected'): Promise<any | null> {
  const order = await Order.findOne({
    $or: [{ orderId }, ...(mongoose.Types.ObjectId.isValid(orderId) ? [{ _id: orderId }] : [])],
  });

  if (!order) return null;

  // If status is transitioning to cancelled/rejected from confirmed, restore stock
  if ((status === 'cancelled' || status === 'rejected') && order.status === 'confirmed') {
    const itemsToRestore = order.items.map((i: any) => ({
      productId: i.productId.toString(),
      quantity: i.quantity,
    }));
    await rollbackReservations(itemsToRestore);
  }

  order.status = status;
  await order.save();
  return {
    id: order._id.toString(),
    orderId: order.orderId,
    status: order.status,
  };
}

export async function getCustomerOrderHistory(customerPhoneOrId: string): Promise<any[]> {
  if (!customerPhoneOrId) return [];
  const orders = await Order.find({
    $or: [{ customerPhone: customerPhoneOrId }, { customerId: customerPhoneOrId }],
  })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  return orders.map((o) => ({
    orderId: o.orderId,
    items: o.items.map((i: any) => `${i.productName} (x${i.quantity})`).join(', '),
    totalAmount: o.totalAmount,
    status: o.status,
    createdAt: o.createdAt,
  }));
}
