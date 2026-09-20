import mongoose from 'mongoose';
import { Product } from '../models/Product.js';

export interface StockCheckResult {
  productId: string;
  productName: string;
  requestedQuantity: number;
  availableStock: number;
  isSufficient: boolean;
  unit: string;
}

export async function checkInventory(
  productId: string,
  quantity: number = 1
): Promise<StockCheckResult | { error: string }> {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return { error: `Invalid product ID: ${productId}` };
  }
  const product = await Product.findById(productId).lean();
  if (!product) {
    return { error: `Product not found in database with ID: ${productId}` };
  }

  const isSufficient = product.stock >= quantity;
  return {
    productId: product._id.toString(),
    productName: product.name,
    requestedQuantity: quantity,
    availableStock: product.stock,
    isSufficient,
    unit: product.unit,
  };
}

/**
 * Atomically reserve inventory for multiple items.
 * If any product has insufficient stock, immediately roll back all previously reserved items.
 * Uses atomic MongoDB findOneAndUpdate with condition { stock: { $gte: quantity } }.
 */
export async function reserveInventoryAtomic(
  items: Array<{ productId: string; quantity: number }>
): Promise<{
  success: boolean;
  reservedItems?: Array<{ productId: string; productName: string; quantity: number; unitPrice: number; remainingStock: number }>;
  failedItem?: { productId: string; productName: string; requestedQuantity: number; availableStock: number };
  error?: string;
}> {
  const reservedSuccessfully: Array<{ productId: string; quantity: number }> = [];
  const detailedReserved: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    remainingStock: number;
  }> = [];

  for (const item of items) {
    if (!mongoose.Types.ObjectId.isValid(item.productId)) {
      await rollbackReservations(reservedSuccessfully);
      return { success: false, error: `Invalid product ID: ${item.productId}` };
    }

    if (item.quantity <= 0 || !Number.isInteger(item.quantity)) {
      await rollbackReservations(reservedSuccessfully);
      return { success: false, error: `Quantity must be a positive integer. Received: ${item.quantity}` };
    }

    // Atomic decrement if and only if current stock >= quantity
    const updated = await Product.findOneAndUpdate(
      {
        _id: item.productId,
        isActive: true,
        stock: { $gte: item.quantity },
      },
      {
        $inc: { stock: -item.quantity },
      },
      {
        returnDocument: 'after',
      }
    ).lean();

    if (!updated) {
      // Find current stock to inform user accurately
      const current = await Product.findById(item.productId).lean();
      await rollbackReservations(reservedSuccessfully);
      return {
        success: false,
        failedItem: {
          productId: item.productId,
          productName: current ? current.name : 'Unknown Product',
          requestedQuantity: item.quantity,
          availableStock: current ? current.stock : 0,
        },
        error: `Insufficient stock for ${current ? current.name : 'product'}. Requested ${item.quantity}, but only ${
          current ? current.stock : 0
        } available.`,
      };
    }

    reservedSuccessfully.push({ productId: item.productId, quantity: item.quantity });
    detailedReserved.push({
      productId: updated._id.toString(),
      productName: updated.name,
      quantity: item.quantity,
      unitPrice: updated.price,
      remainingStock: updated.stock,
    });
  }

  return {
    success: true,
    reservedItems: detailedReserved,
  };
}

/**
 * Restores reserved inventory back to MongoDB in case of failure or cancellation.
 */
export async function rollbackReservations(
  items: Array<{ productId: string; quantity: number }>
): Promise<void> {
  for (const item of items) {
    try {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: item.quantity },
      });
    } catch (err: any) {
      console.error(`[Inventory Rollback Error] for product ${item.productId}:`, err.message);
    }
  }
}
