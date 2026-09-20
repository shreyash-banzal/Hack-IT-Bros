import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomer extends Document {
  name: string;
  phone: string;
  whatsappId?: string;
  address?: string;
  totalOrders: number;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, index: true },
    whatsappId: { type: String, index: true, sparse: true },
    address: { type: String, default: '' },
    totalOrders: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

export const Customer = mongoose.models.Customer || mongoose.model<ICustomer>('Customer', CustomerSchema);
