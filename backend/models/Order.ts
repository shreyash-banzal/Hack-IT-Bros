import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface IOrder extends Document {
  orderId: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  items: IOrderItem[];
  totalAmount: number;
  status: 'confirmed' | 'pending_approval' | 'cancelled' | 'rejected';
  source: 'web' | 'whatsapp';
  messageId?: string;
  sessionId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const OrderSchema: Schema = new Schema(
  {
    orderId: { type: String, required: true, unique: true, index: true },
    customerId: { type: String, index: true },
    customerName: { type: String, required: true, default: 'Customer' },
    customerPhone: { type: String, default: '' },
    items: { type: [OrderItemSchema], required: true },
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['confirmed', 'pending_approval', 'cancelled', 'rejected'],
      default: 'confirmed',
      index: true,
    },
    source: { type: String, enum: ['web', 'whatsapp'], default: 'web' },
    messageId: { type: String, index: true, sparse: true },
    sessionId: { type: String, index: true },
    notes: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

export const Order = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
