import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from '../config/db.js';
import { Product } from '../models/Product.js';
import { Customer } from '../models/Customer.js';
import { Order } from '../models/Order.js';

dotenv.config();

export const INITIAL_PRODUCTS = [
  {
    name: 'Aashirvaad Shudh Chakki Atta',
    aliases: ['atta', 'aashirvaad atta', 'wheat flour', 'aashirvaad', 'chakki atta', 'gehu atta'],
    category: 'Grains & Flours',
    price: 210,
    unit: '5kg pack',
    stock: 25,
    lowStockThreshold: 5,
    description: '100% whole wheat grain chakki fresh flour for soft rotis.',
    isActive: true,
  },
  {
    name: 'Fortune Sunlite Sunflower Oil',
    aliases: ['sunflower oil', 'fortune oil', 'refined oil', 'oil', 'tel', 'cooking oil'],
    category: 'Cooking Oils',
    price: 155,
    unit: '1L pouch',
    stock: 20,
    lowStockThreshold: 5,
    description: 'Refined sunflower oil enriched with vitamins A & D.',
    isActive: true,
  },
  {
    name: 'Fortune Kachi Ghani Mustard Oil',
    aliases: ['mustard oil', 'sarson ka tel', 'sarson tel', 'mustard', 'fortune mustard oil'],
    category: 'Cooking Oils',
    price: 165,
    unit: '1L bottle',
    stock: 15,
    lowStockThreshold: 4,
    description: 'Cold pressed authentic pungent kachi ghani pure mustard oil.',
    isActive: true,
  },
  {
    name: 'Maggi 2-Minute Masala Noodles',
    aliases: ['maggi', 'noodles', 'maggi noodles', 'masala maggi', 'magi'],
    category: 'Instant Food',
    price: 14,
    unit: 'pack (70g)',
    stock: 35,
    lowStockThreshold: 8,
    description: 'Classic favorite masala taste with roasted spices.',
    isActive: true,
  },
  {
    name: 'Pepsi Soft Drink',
    aliases: ['pepsi', 'cold drink', 'soft drink', 'soda'],
    category: 'Beverages',
    price: 40,
    unit: '750ml bottle',
    stock: 18,
    lowStockThreshold: 5,
    description: 'Refreshing carbonated cola flavored beverage.',
    isActive: true,
  },
  {
    name: 'Coca Cola',
    aliases: ['coca cola', 'coke', 'cola', 'cold drink'],
    category: 'Beverages',
    price: 40,
    unit: '750ml bottle',
    stock: 18,
    lowStockThreshold: 5,
    description: 'Original taste sparkling cola beverage.',
    isActive: true,
  },
  {
    name: 'Thums Up',
    aliases: ['thums up', 'thumbs up', 'toofan', 'strong cola'],
    category: 'Beverages',
    price: 40,
    unit: '750ml bottle',
    stock: 22,
    lowStockThreshold: 6,
    description: 'Bold, masculine spicy carbonated cola.',
    isActive: true,
  },
  {
    name: 'Britannia Daily Fresh White Bread',
    aliases: ['bread', 'white bread', 'britannia bread', 'double roti'],
    category: 'Bakery & Dairy',
    price: 30,
    unit: '400g loaf',
    stock: 12,
    lowStockThreshold: 4,
    description: 'Soft and wholesome sandwich bread for breakfast.',
    isActive: true,
  },
  {
    name: 'Amul Butter Pasteurised',
    aliases: ['butter', 'amul butter', 'makhan'],
    category: 'Bakery & Dairy',
    price: 56,
    unit: '100g pack',
    stock: 20,
    lowStockThreshold: 5,
    description: 'Utterly butterly delicious creamy salted butter.',
    isActive: true,
  },
  {
    name: 'Amul Taaza Homogenised Toned Milk',
    aliases: ['milk', 'amul milk', 'doodh', 'taaza milk', 'amul taaza'],
    category: 'Bakery & Dairy',
    price: 33,
    unit: '500ml pouch',
    stock: 30,
    lowStockThreshold: 6,
    description: 'Fresh toned pasteurized wholesome milk.',
    isActive: true,
  },
  {
    name: 'Parle-G Original Gluco Biscuits',
    aliases: ['parle g', 'parle-g', 'biscuit', 'gluco biscuit', 'parleg'],
    category: 'Snacks & Biscuits',
    price: 10,
    unit: '130g pack',
    stock: 40,
    lowStockThreshold: 10,
    description: 'India’s most loved glucose biscuits packed with milk and wheat.',
    isActive: true,
  },
  {
    name: 'Tata Salt Vacuum Evaporated',
    aliases: ['salt', 'tata salt', 'namak', 'iodized salt'],
    category: 'Spices & Seasoning',
    price: 28,
    unit: '1kg pack',
    stock: 25,
    lowStockThreshold: 5,
    description: 'Desh Ka Namak - vacuum evaporated iodized salt.',
    isActive: true,
  },
  {
    name: 'Surf Excel Quick Wash Detergent Powder',
    aliases: ['surf excel', 'surf', 'detergent', 'washing powder', 'surf powder'],
    category: 'Household & Cleaning',
    price: 140,
    unit: '1kg pack',
    stock: 14,
    lowStockThreshold: 4,
    description: 'Advanced stain removal detergent powder.',
    isActive: true,
  },
  {
    name: 'Colgate Strong Teeth Toothpaste',
    aliases: ['colgate', 'toothpaste', 'colgate toothpaste', 'dant manjan'],
    category: 'Personal Care',
    price: 65,
    unit: '100g tube',
    stock: 16,
    lowStockThreshold: 4,
    description: 'Calcium boost formula for all-round oral protection.',
    isActive: true,
  },
  {
    name: 'Cadbury Dairy Milk Chocolate',
    aliases: ['dairy milk', 'chocolate', 'cadbury', 'cadbury chocolate', 'meetha'],
    category: 'Snacks & Biscuits',
    price: 20,
    unit: '24g bar',
    stock: 30,
    lowStockThreshold: 6,
    description: 'Classic milk chocolate bar with rich velvety taste.',
    isActive: true,
  },
  {
    name: 'Lay\'s India\'s Magic Masala Potato Chips',
    aliases: ['lays', 'chips', 'magic masala', 'potato chips', 'blue lays'],
    category: 'Snacks & Biscuits',
    price: 20,
    unit: '50g pack',
    stock: 25,
    lowStockThreshold: 5,
    description: 'Spicy seasoned crispy ridged potato chips.',
    isActive: true,
  },
  {
    name: 'Kurkure Masala Munch',
    aliases: ['kurkure', 'masala munch', 'namkeen', 'tedha medha'],
    category: 'Snacks & Biscuits',
    price: 20,
    unit: '85g pack',
    stock: 25,
    lowStockThreshold: 5,
    description: 'Crunchy tedha-medha corn curls seasoned with spices.',
    isActive: true,
  },
  {
    name: 'Tata Tea Premium Desh Ki Chai',
    aliases: ['tea', 'chai', 'tata tea', 'chai patti', 'tata premium'],
    category: 'Beverages',
    price: 145,
    unit: '250g pack',
    stock: 15,
    lowStockThreshold: 4,
    description: 'Rich blend of robust Assam CTC and long leaves.',
    isActive: true,
  },
  {
    name: 'Nescafé Classic Instant Coffee',
    aliases: ['coffee', 'nescafe', 'instant coffee', 'nescafe classic'],
    category: 'Beverages',
    price: 160,
    unit: '50g glass jar',
    stock: 12,
    lowStockThreshold: 3,
    description: '100% pure instant coffee granules for rich aroma.',
    isActive: true,
  },
  {
    name: 'Dettol Original Antiseptic Liquid',
    aliases: ['dettol', 'antiseptic', 'dettol liquid', 'disinfectant'],
    category: 'Household & Cleaning',
    price: 90,
    unit: '125ml bottle',
    stock: 10,
    lowStockThreshold: 3,
    description: 'Trusted multi-purpose antiseptic liquid.',
    isActive: true,
  },
];

export async function seedDatabase(clearOrders = false) {
  console.log('[Seed] Connecting to MongoDB...');
  await connectDB();

  console.log('[Seed] Clearing previous products...');
  await Product.deleteMany({});

  if (clearOrders) {
    console.log('[Seed] Clearing orders and customers...');
    await Order.deleteMany({});
    await Customer.deleteMany({});
  }

  console.log(`[Seed] Inserting ${INITIAL_PRODUCTS.length} initial Kirana store products...`);
  const inserted = await Product.insertMany(INITIAL_PRODUCTS);
  console.log(`[Seed] Successfully inserted ${inserted.length} products into MongoDB.`);

  // Create demo customer
  const demoCustomer = await Customer.findOneAndUpdate(
    { phone: '9876543210' },
    {
      name: 'Ramesh Sharma',
      phone: '9876543210',
      address: 'Flat 402, Shanti Vihar, Civil Lines',
      totalOrders: 0,
    },
    { upsert: true, returnDocument: 'after' }
  );
  console.log(`[Seed] Demo customer ready: ${demoCustomer.name} (${demoCustomer.phone})`);

  return {
    productsCount: inserted.length,
    customer: demoCustomer,
  };
}

// If executed directly from command line (e.g. npm run seed)
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  seedDatabase(true)
    .then((res) => {
      console.log('[Seed Finished] Database populated successfully:', res.productsCount, 'products.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Seed Error]:', err);
      process.exit(1);
    });
}
