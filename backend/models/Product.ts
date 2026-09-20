import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  aliases: string[];
  category: string;
  price: number;
  unit: string;
  stock: number;
  lowStockThreshold: number;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    aliases: { type: [String], default: [], index: true },
    category: { type: String, required: true, trim: true, index: true },
    price: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, default: 'piece' },
    stock: { type: Number, required: true, min: 0, default: 0 },
    lowStockThreshold: { type: Number, required: true, default: 5 },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
  }
);

// Compound text index for robust full-text and partial search
ProductSchema.index({ name: 'text', aliases: 'text', category: 'text', description: 'text' });

export const Product = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
