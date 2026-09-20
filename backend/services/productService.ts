import mongoose from 'mongoose';
import { Product, IProduct } from '../models/Product.js';

export async function searchProducts(query: string): Promise<any[]> {
  if (!query || typeof query !== 'string') return [];
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  const regex = new RegExp(cleanQuery.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');

  // Search by exact/partial name, category, or in aliases array
  const products = await Product.find({
    isActive: true,
    $or: [
      { name: regex },
      { category: regex },
      { aliases: regex },
      { description: regex },
    ],
  })
    .select('_id name aliases category price unit stock lowStockThreshold description')
    .lean();

  return products.map((p) => ({
    id: p._id.toString(),
    name: p.name,
    aliases: p.aliases,
    category: p.category,
    price: p.price,
    unit: p.unit,
    stock: p.stock,
    lowStockThreshold: p.lowStockThreshold,
    description: p.description,
  }));
}

export async function getProductById(productId: string): Promise<any | null> {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return null;
  }
  const product = await Product.findById(productId).lean();
  if (!product) return null;
  return {
    id: product._id.toString(),
    name: product.name,
    aliases: product.aliases,
    category: product.category,
    price: product.price,
    unit: product.unit,
    stock: product.stock,
    lowStockThreshold: product.lowStockThreshold,
    description: product.description,
    isActive: product.isActive,
  };
}

export async function getAllProducts(filter: Record<string, any> = {}): Promise<any[]> {
  const products = await Product.find(filter).sort({ name: 1 }).lean();
  return products.map((p) => ({
    id: p._id.toString(),
    _id: p._id.toString(),
    name: p.name,
    aliases: p.aliases,
    category: p.category,
    price: p.price,
    unit: p.unit,
    stock: p.stock,
    lowStockThreshold: p.lowStockThreshold,
    description: p.description,
    isActive: p.isActive,
    updatedAt: p.updatedAt,
  }));
}

export async function createProduct(data: {
  name: string;
  category: string;
  price: number;
  unit?: string;
  stock?: number;
  lowStockThreshold?: number;
  aliases?: string[] | string;
  description?: string;
}): Promise<any> {
  const aliasesArray = Array.isArray(data.aliases)
    ? data.aliases
    : typeof data.aliases === 'string'
    ? data.aliases.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const product = await Product.create({
    name: data.name.trim(),
    category: data.category.trim(),
    price: Number(data.price),
    unit: (data.unit || 'piece').trim(),
    stock: Number(data.stock ?? 0),
    lowStockThreshold: Number(data.lowStockThreshold ?? 5),
    aliases: aliasesArray,
    description: (data.description || '').trim(),
    isActive: true,
  });

  return {
    id: product._id.toString(),
    _id: product._id.toString(),
    name: product.name,
    aliases: product.aliases,
    category: product.category,
    price: product.price,
    unit: product.unit,
    stock: product.stock,
    lowStockThreshold: product.lowStockThreshold,
    description: product.description,
    isActive: product.isActive,
  };
}

export async function updateProduct(
  id: string,
  data: Partial<{
    name: string;
    category: string;
    price: number;
    unit: string;
    stock: number;
    lowStockThreshold: number;
    aliases: string[] | string;
    description: string;
    isActive: boolean;
  }>
): Promise<any | null> {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;

  const updatePayload: any = {};
  if (data.name !== undefined) updatePayload.name = data.name.trim();
  if (data.category !== undefined) updatePayload.category = data.category.trim();
  if (data.price !== undefined) updatePayload.price = Number(data.price);
  if (data.unit !== undefined) updatePayload.unit = data.unit.trim();
  if (data.stock !== undefined) updatePayload.stock = Number(data.stock);
  if (data.lowStockThreshold !== undefined) updatePayload.lowStockThreshold = Number(data.lowStockThreshold);
  if (data.description !== undefined) updatePayload.description = data.description.trim();
  if (data.isActive !== undefined) updatePayload.isActive = Boolean(data.isActive);
  if (data.aliases !== undefined) {
    updatePayload.aliases = Array.isArray(data.aliases)
      ? data.aliases
      : typeof data.aliases === 'string'
      ? data.aliases.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
  }

  const updated = await Product.findByIdAndUpdate(id, updatePayload, { new: true }).lean();
  if (!updated) return null;
  return {
    id: updated._id.toString(),
    _id: updated._id.toString(),
    name: updated.name,
    aliases: updated.aliases,
    category: updated.category,
    price: updated.price,
    unit: updated.unit,
    stock: updated.stock,
    lowStockThreshold: updated.lowStockThreshold,
    description: updated.description,
    isActive: updated.isActive,
  };
}

export async function deleteProduct(id: string): Promise<boolean> {
  if (!mongoose.Types.ObjectId.isValid(id)) return false;
  const res = await Product.findByIdAndDelete(id);
  return !!res;
}

export async function getLowStockProducts(): Promise<any[]> {
  const lowStock = await Product.find({
    isActive: true,
    $expr: { $lte: ['$stock', '$lowStockThreshold'] },
  })
    .sort({ stock: 1 })
    .lean();

  return lowStock.map((p) => ({
    id: p._id.toString(),
    name: p.name,
    stock: p.stock,
    lowStockThreshold: p.lowStockThreshold,
    unit: p.unit,
    price: p.price,
    category: p.category,
  }));
}

export async function findAlternatives(productId: string): Promise<any[]> {
  if (!mongoose.Types.ObjectId.isValid(productId)) return [];
  const product = await Product.findById(productId).lean();
  if (!product) return [];

  const alternatives = await Product.find({
    _id: { $ne: product._id },
    category: product.category,
    isActive: true,
    stock: { $gt: 0 },
  })
    .limit(3)
    .lean();

  return alternatives.map((a) => ({
    id: a._id.toString(),
    name: a.name,
    price: a.price,
    stock: a.stock,
    unit: a.unit,
  }));
}
