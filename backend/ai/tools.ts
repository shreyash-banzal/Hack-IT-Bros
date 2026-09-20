import {
  searchProducts,
  getProductById,
  getLowStockProducts,
  findAlternatives,
} from '../services/productService.js';
import { checkInventory } from '../services/inventoryService.js';
import { createOrder, getOrderById, getCustomerOrderHistory } from '../services/orderService.js';

export interface ActivityEvent {
  type: string;
  label: string;
  status: 'pending' | 'success' | 'failed';
  timestamp: string;
  details?: string;
}

export const groqTools = [
  {
    type: 'function',
    function: {
      name: 'search_product',
      description: 'Search MongoDB product catalog by product name, brand, category, or colloquial alias (e.g. "atta", "dahi", "oil", "maggi"). Returns matching real products with real prices, units, and available stock.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query or product name to search for in MongoDB.',
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_product_details',
      description: 'Fetch complete real MongoDB document details for a product by its MongoDB ID.',
      parameters: {
        type: 'object',
        properties: {
          productId: {
            type: 'string',
            description: 'The MongoDB ObjectId of the product.',
          },
        },
        required: ['productId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'check_inventory',
      description: 'Check real MongoDB stock for a specific product and requested quantity. Returns exact available stock and whether sufficient.',
      parameters: {
        type: 'object',
        properties: {
          productId: {
            type: 'string',
            description: 'The MongoDB ObjectId of the product.',
          },
          quantity: {
            type: 'number',
            description: 'The quantity the customer wishes to order.',
          },
        },
        required: ['productId', 'quantity'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_product_price',
      description: 'Retrieve the verified, real-time MongoDB price for a product. Never assume prices.',
      parameters: {
        type: 'object',
        properties: {
          productId: {
            type: 'string',
            description: 'The MongoDB ObjectId of the product.',
          },
        },
        required: ['productId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_order',
      description: 'Create a real order in MongoDB. Automatically performs atomic inventory decrements with concurrency and race-condition safety, computes the exact total using verified database prices, and stores the order document. ONLY call when customer explicitly requested to order and products/quantities have been identified.',
      parameters: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            description: 'List of items to order with productId and quantity.',
            items: {
              type: 'object',
              properties: {
                productId: { type: 'string', description: 'MongoDB ObjectId of the product' },
                quantity: { type: 'number', description: 'Quantity to order (positive integer)' },
              },
              required: ['productId', 'quantity'],
            },
          },
          customerName: {
            type: 'string',
            description: 'Customer name if known.',
          },
          customerPhone: {
            type: 'string',
            description: 'Customer phone number if known.',
          },
          notes: {
            type: 'string',
            description: 'Any delivery instructions or notes.',
          },
        },
        required: ['items'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_order',
      description: 'Lookup an existing order in MongoDB by order ID.',
      parameters: {
        type: 'object',
        properties: {
          orderId: {
            type: 'string',
            description: 'The orderId (e.g. ORD-...) to retrieve.',
          },
        },
        required: ['orderId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_customer_history',
      description: 'Retrieve past real orders from MongoDB for a customer phone number.',
      parameters: {
        type: 'object',
        properties: {
          phone: {
            type: 'string',
            description: 'Customer phone number.',
          },
        },
        required: ['phone'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_low_stock_products',
      description: 'Query MongoDB for all products that are currently below their low-stock threshold.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'find_alternative_products',
      description: 'Query MongoDB for in-stock alternatives in the same category when a product is out of stock.',
      parameters: {
        type: 'object',
        properties: {
          productId: {
            type: 'string',
            description: 'MongoDB ObjectId of the unavailable product.',
          },
        },
        required: ['productId'],
      },
    },
  },
];

export async function executeBackendTool(
  toolName: string,
  args: any,
  context: {
    source: 'web' | 'whatsapp';
    customer?: { name?: string; phone?: string; customerId?: string };
    sessionId?: string;
    messageId?: string;
  }
): Promise<{ result: any; activities: ActivityEvent[] }> {
  const activities: ActivityEvent[] = [];
  const now = () => new Date().toISOString();

  try {
    switch (toolName) {
      case 'search_product': {
        const query = args.query;
        const products = await searchProducts(query);
        activities.push({
          type: 'product_search',
          label: `Product Search: "${query}"`,
          status: 'success',
          timestamp: now(),
          details: `Found ${products.length} product(s) in MongoDB: ${products
            .map((p) => `${p.name} (Stock: ${p.stock}, ₹${p.price})`)
            .join('; ')}`,
        });
        return { result: { count: products.length, products }, activities };
      }

      case 'get_product_details': {
        const p = await getProductById(args.productId);
        if (!p) {
          activities.push({
            type: 'product_lookup',
            label: `Product Lookup: ${args.productId}`,
            status: 'failed',
            timestamp: now(),
            details: `Product ID ${args.productId} not found in MongoDB.`,
          });
          return { result: { error: 'Product not found in database' }, activities };
        }
        activities.push({
          type: 'product_lookup',
          label: `Product Lookup: ${p.name}`,
          status: 'success',
          timestamp: now(),
          details: `${p.name} — ₹${p.price} | Stock: ${p.stock} ${p.unit}`,
        });
        return { result: p, activities };
      }

      case 'check_inventory': {
        const check = await checkInventory(args.productId, args.quantity);
        if ('error' in check) {
          activities.push({
            type: 'inventory_check',
            label: 'Inventory Check Failed',
            status: 'failed',
            timestamp: now(),
            details: check.error,
          });
          return { result: check, activities };
        }
        activities.push({
          type: 'inventory_check',
          label: `Inventory Check: ${check.productName}`,
          status: check.isSufficient ? 'success' : 'failed',
          timestamp: now(),
          details: `Requested: ${check.requestedQuantity} | Available in MongoDB: ${check.availableStock} ${check.unit} (${
            check.isSufficient ? 'Sufficient' : 'INSUFFICIENT'
          })`,
        });
        return { result: check, activities };
      }

      case 'get_product_price': {
        const p = await getProductById(args.productId);
        if (!p) {
          activities.push({
            type: 'price_lookup',
            label: 'Price Lookup Failed',
            status: 'failed',
            timestamp: now(),
            details: `Product ${args.productId} not found`,
          });
          return { result: { error: 'Product not found' }, activities };
        }
        activities.push({
          type: 'price_lookup',
          label: `Price Lookup: ${p.name}`,
          status: 'success',
          timestamp: now(),
          details: `Current MongoDB Price: ₹${p.price} per ${p.unit}`,
        });
        return { result: { productId: p.id, name: p.name, price: p.price, unit: p.unit }, activities };
      }

      case 'create_order': {
        activities.push({
          type: 'order_processing',
          label: 'Processing Order Creation',
          status: 'pending',
          timestamp: now(),
          details: `Reserving inventory atomically and validating backend prices...`,
        });

        const orderResult = await createOrder({
          items: args.items,
          customer: {
            name: args.customerName || context.customer?.name,
            phone: args.customerPhone || context.customer?.phone,
            customerId: context.customer?.customerId,
          },
          source: context.source,
          messageId: context.messageId,
          sessionId: context.sessionId,
          notes: args.notes,
        });

        if (!orderResult.success || !orderResult.order) {
          activities.push({
            type: 'order_creation',
            label: 'Order Creation Failed',
            status: 'failed',
            timestamp: now(),
            details: orderResult.error || 'Inventory decrement or validation failed.',
          });
          return { result: orderResult, activities };
        }

        const o = orderResult.order;
        activities.push({
          type: 'inventory_update',
          label: 'Inventory Atomically Decremented',
          status: 'success',
          timestamp: now(),
          details: o.items
            .map((it: any) => `${it.productName}: -${it.quantity} units`)
            .join(', '),
        });

        activities.push({
          type: 'order_creation',
          label: `Order Created: ${o.orderId}`,
          status: 'success',
          timestamp: now(),
          details: `Total: ₹${o.totalAmount} for ${o.items.length} item(s). Status: ${o.status}`,
        });

        return { result: orderResult, activities };
      }

      case 'get_order': {
        const order = await getOrderById(args.orderId);
        activities.push({
          type: 'order_lookup',
          label: `Order Lookup: ${args.orderId}`,
          status: order ? 'success' : 'failed',
          timestamp: now(),
          details: order ? `Found: ₹${order.totalAmount}, Status: ${order.status}` : 'Not found',
        });
        return { result: order || { error: 'Order not found' }, activities };
      }

      case 'get_customer_history': {
        const history = await getCustomerOrderHistory(args.phone);
        activities.push({
          type: 'customer_history',
          label: `Customer History: ${args.phone}`,
          status: 'success',
          timestamp: now(),
          details: `Found ${history.length} past order(s)`,
        });
        return { result: { history }, activities };
      }

      case 'get_low_stock_products': {
        const lowStock = await getLowStockProducts();
        activities.push({
          type: 'low_stock_check',
          label: 'Low Stock Query',
          status: 'success',
          timestamp: now(),
          details: `${lowStock.length} item(s) below threshold`,
        });
        return { result: { lowStock }, activities };
      }

      case 'find_alternative_products': {
        const alts = await findAlternatives(args.productId);
        activities.push({
          type: 'alternative_search',
          label: 'Alternative Product Search',
          status: 'success',
          timestamp: now(),
          details: `Found ${alts.length} in-stock alternative(s) in category`,
        });
        return { result: { alternatives: alts }, activities };
      }

      default:
        activities.push({
          type: 'unknown_tool',
          label: `Unknown Tool: ${toolName}`,
          status: 'failed',
          timestamp: now(),
          details: `Tool ${toolName} is not recognized by backend.`,
        });
        return { result: { error: `Tool ${toolName} not supported` }, activities };
    }
  } catch (error: any) {
    activities.push({
      type: 'tool_error',
      label: `Tool Error: ${toolName}`,
      status: 'failed',
      timestamp: now(),
      details: error.message,
    });
    return { result: { error: error.message }, activities };
  }
}
