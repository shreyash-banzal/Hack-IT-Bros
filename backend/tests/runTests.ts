import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { seedDatabase } from '../seed/seed.js';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { searchProducts, getProductById } from '../services/productService.js';
import { checkInventory } from '../services/inventoryService.js';
import { createOrder } from '../services/orderService.js';
import { executeBackendTool } from '../ai/tools.js';

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
  durationMs: number;
}

const testResults: TestResult[] = [];

async function runTest(name: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    const durationMs = Date.now() - start;
    testResults.push({ name, passed: true, details: 'Passed without errors', durationMs });
    console.log(` ✅ PASS: ${name} (${durationMs}ms)`);
  } catch (error: any) {
    const durationMs = Date.now() - start;
    testResults.push({ name, passed: false, details: error.message, durationMs });
    console.error(` ❌ FAIL: ${name} (${durationMs}ms):`, error.message);
  }
}

export async function runAllAutomatedTests() {
  console.log('\n======================================================');
  console.log(' RUNNING ZERO-CLICK STORE OPERATOR REAL AUTOMATED TESTS');
  console.log('======================================================\n');

  // Step 1: Connect to real MongoDB
  await connectDB();

  // Step 2: Seed database to pristine state
  console.log('[Setup] Seeding database to pristine known state...');
  await seedDatabase(true);

  // Test 1: Product Search & Alias Matching in MongoDB
  await runTest('1. Product Search & Alias Matching (Real MongoDB regex query)', async () => {
    // Search by alias "atta"
    const attaResults = await searchProducts('atta');
    if (attaResults.length === 0) throw new Error('Expected to find product by alias "atta"');
    const firstAtta = attaResults[0];
    if (!firstAtta.name.toLowerCase().includes('atta')) {
      throw new Error(`Expected product name to contain atta, got: ${firstAtta.name}`);
    }

    // Search by name "Maggi"
    const maggiResults = await searchProducts('Maggi');
    if (maggiResults.length === 0) throw new Error('Expected to find "Maggi"');
    if (maggiResults[0].price <= 0) throw new Error('Maggi price must be positive number');
  });

  // Test 2: Product Not Found Handling
  await runTest('2. Product Not Found Handling (XYZ Chocolate)', async () => {
    const notFoundResults = await searchProducts('XYZ NonExistent Chocolate 9999');
    if (notFoundResults.length !== 0) {
      throw new Error(`Expected 0 results for non-existent product, got ${notFoundResults.length}`);
    }
  });

  // Test 3: Inventory Check Tool Against Live MongoDB
  await runTest('3. Inventory Check Function & Live Stock Status', async () => {
    const maggi = await Product.findOne({ name: { $regex: /maggi/i } }).lean();
    if (!maggi) throw new Error('Maggi not found in database');

    const check = await checkInventory(maggi._id.toString(), 2);
    if ('error' in check) throw new Error(check.error);
    if (!check.isSufficient) throw new Error('Expected stock to be sufficient for 2 units');
    if (check.availableStock !== maggi.stock) {
      throw new Error(`Expected stock ${maggi.stock}, got ${check.availableStock}`);
    }
  });

  // Test 4: End-to-End Real Customer Order Execution & Verification
  await runTest('4. Real Customer Order Execution & MongoDB Verification', async () => {
    // Locate Atta and Maggi
    const atta = await Product.findOne({ name: { $regex: /aashirvaad/i } });
    const maggi = await Product.findOne({ name: { $regex: /maggi/i } });
    if (!atta || !maggi) throw new Error('Atta or Maggi missing from seeded database');

    const attaInitialStock = atta.stock;
    const maggiInitialStock = maggi.stock;
    const attaQty = 2;
    const maggiQty = 3;

    // Expected subtotal and total calculated using backend database prices
    const expectedAttaSubtotal = atta.price * attaQty;
    const expectedMaggiSubtotal = maggi.price * maggiQty;
    const expectedTotal = Number((expectedAttaSubtotal + expectedMaggiSubtotal).toFixed(2));

    // Execute order creation
    const orderResult = await createOrder({
      items: [
        { productId: atta._id.toString(), quantity: attaQty },
        { productId: maggi._id.toString(), quantity: maggiQty },
      ],
      customer: { name: 'Suresh Kumar', phone: '9876500001' },
      source: 'web',
      notes: 'Please ring bell',
    });

    if (!orderResult.success || !orderResult.order) {
      throw new Error(`Order creation failed: ${orderResult.error}`);
    }

    const createdOrder = orderResult.order;
    if (!createdOrder.orderId || !createdOrder.orderId.startsWith('ORD-')) {
      throw new Error(`Invalid orderId generated: ${createdOrder.orderId}`);
    }

    // 1. Verify in MongoDB that an Order document was actually created
    const dbOrder = await Order.findOne({ orderId: createdOrder.orderId }).lean();
    if (!dbOrder) {
      throw new Error(`Order document ${createdOrder.orderId} does not exist in MongoDB!`);
    }

    // 2. Verify in MongoDB that the correct total was stored
    if (dbOrder.totalAmount !== expectedTotal) {
      throw new Error(
        `Incorrect total in MongoDB! Expected ₹${expectedTotal} (Atta: ${atta.price}x${attaQty} + Maggi: ${maggi.price}x${maggiQty}), got ₹${dbOrder.totalAmount}`
      );
    }

    // 3. Verify in MongoDB that the inventory quantity actually decreased
    const updatedAtta = await Product.findById(atta._id).lean();
    const updatedMaggi = await Product.findById(maggi._id).lean();

    if (!updatedAtta || updatedAtta.stock !== attaInitialStock - attaQty) {
      throw new Error(
        `Atta stock did not decrease properly! Initial: ${attaInitialStock}, Expected: ${
          attaInitialStock - attaQty
        }, Actual in DB: ${updatedAtta?.stock}`
      );
    }

    if (!updatedMaggi || updatedMaggi.stock !== maggiInitialStock - maggiQty) {
      throw new Error(
        `Maggi stock did not decrease properly! Initial: ${maggiInitialStock}, Expected: ${
          maggiInitialStock - maggiQty
        }, Actual in DB: ${updatedMaggi?.stock}`
      );
    }
  });

  // Test 5: Insufficient-Stock Order Rejection and Zero Inventory Change
  await runTest('5. Insufficient-Stock Order (Must fail safely with zero deduction)', async () => {
    const milk = await Product.findOne({ name: { $regex: /amul.*milk/i } });
    if (!milk) throw new Error('Amul Milk not found in database');

    const initialMilkStock = milk.stock;
    const impossibleQty = initialMilkStock + 100; // Ask for way more than available

    const failOrder = await createOrder({
      items: [{ productId: milk._id.toString(), quantity: impossibleQty }],
      customer: { name: 'Greedy Buyer', phone: '9876500002' },
      source: 'web',
    });

    if (failOrder.success) {
      throw new Error('Order succeeded when stock was clearly insufficient!');
    }

    // Verify stock in MongoDB was NOT decreased
    const postCheckMilk = await Product.findById(milk._id).lean();
    if (!postCheckMilk || postCheckMilk.stock !== initialMilkStock) {
      throw new Error(
        `Inventory leaked during failed order! Expected: ${initialMilkStock}, Actual in DB: ${postCheckMilk?.stock}`
      );
    }
  });

  // Test 6: Concurrent Simultaneous Orders Against Limited Inventory Race Condition Protection
  await runTest('6. Concurrent Simultaneous Orders (Race Condition Protection)', async () => {
    // Create dedicated product with exactly 5 units in stock
    const raceItem = await Product.create({
      name: 'Limited Edition Biscuits (Race Test)',
      category: 'Test',
      price: 50,
      unit: 'pack',
      stock: 5,
      lowStockThreshold: 1,
      aliases: ['race biscuit'],
      isActive: true,
    });

    const raceItemId = raceItem._id.toString();

    // Fire 2 concurrent orders for 4 units each at the exact same instant
    const [orderA, orderB] = await Promise.all([
      createOrder({
        items: [{ productId: raceItemId, quantity: 4 }],
        customer: { name: 'Customer A', phone: '9876500003' },
      }),
      createOrder({
        items: [{ productId: raceItemId, quantity: 4 }],
        customer: { name: 'Customer B', phone: '9876500004' },
      }),
    ]);

    const successCount = (orderA.success ? 1 : 0) + (orderB.success ? 1 : 0);
    const failCount = (!orderA.success ? 1 : 0) + (!orderB.success ? 1 : 0);

    const finalRaceItem = await Product.findById(raceItemId).lean();
    const finalStock = finalRaceItem?.stock;

    if (successCount !== 1) {
      throw new Error(`Expected exactly 1 order to succeed out of two 4-unit orders against 5 units, got ${successCount}`);
    }

    if (failCount !== 1) {
      throw new Error(`Expected exactly 1 order to fail due to insufficient stock, got ${failCount}`);
    }

    if (finalStock !== 1) {
      throw new Error(`Expected final stock to be exactly 1 (5 - 4), but got ${finalStock}`);
    }

    if ((finalStock as number) < 0) {
      throw new Error(`CRITICAL DEFECT: Stock became negative: ${finalStock}`);
    }
  });

  // Test 7: Duplicate Request Idempotency
  await runTest('7. Duplicate Request Idempotency (Same messageId delivered twice)', async () => {
    const salt = await Product.findOne({ name: { $regex: /tata salt/i } });
    if (!salt) throw new Error('Tata Salt not found in database');

    const uniqueMsgId = `WA-TEST-MSG-${Date.now()}`;
    const initialStock = salt.stock;

    // Send first webhook
    const first = await createOrder({
      items: [{ productId: salt._id.toString(), quantity: 1 }],
      customer: { name: 'WhatsApp User', phone: '9876500005' },
      source: 'whatsapp',
      messageId: uniqueMsgId,
    });

    if (!first.success || !first.order) throw new Error(`First order failed: ${first.error}`);

    // Send duplicate webhook with the same messageId
    const second = await createOrder({
      items: [{ productId: salt._id.toString(), quantity: 1 }],
      customer: { name: 'WhatsApp User', phone: '9876500005' },
      source: 'whatsapp',
      messageId: uniqueMsgId,
    });

    if (!second.success) throw new Error('Duplicate delivery failed');
    if (second.order.orderId !== first.order.orderId) {
      throw new Error(
        `Idempotency failed: Created different orderId! Original: ${first.order.orderId}, Duplicate: ${second.order.orderId}`
      );
    }

    // Verify stock was only decremented ONCE
    const postSalt = await Product.findById(salt._id).lean();
    if (!postSalt || postSalt.stock !== initialStock - 1) {
      throw new Error(`Stock decremented multiple times for duplicate message! Expected: ${initialStock - 1}, Got: ${postSalt?.stock}`);
    }
  });

  // Test 8: Invalid Quantity Validation
  await runTest('8. Invalid Quantity Validation (Negative, zero, fractional)', async () => {
    const tea = await Product.findOne({ name: { $regex: /tea/i } });
    if (!tea) throw new Error('Tea not found in database');

    const negOrder = await createOrder({
      items: [{ productId: tea._id.toString(), quantity: -5 }],
      customer: { name: 'Negative Buyer', phone: '9876500006' },
    });
    if (negOrder.success) throw new Error('Expected negative quantity order to be rejected');

    const zeroOrder = await createOrder({
      items: [{ productId: tea._id.toString(), quantity: 0 }],
      customer: { name: 'Zero Buyer', phone: '9876500007' },
    });
    if (zeroOrder.success) throw new Error('Expected zero quantity order to be rejected');
  });

  // Test 9: Tool Execution Layer (Backend Tool Calling Simulation)
  await runTest('9. Backend Tool Calling Dispatcher (executeBackendTool)', async () => {
    const searchRes = await executeBackendTool('search_product', { query: 'oil' }, { source: 'web' });
    if (!searchRes.result.products || searchRes.result.products.length === 0) {
      throw new Error('search_product tool returned no products for query "oil"');
    }
    if (searchRes.activities.length === 0) {
      throw new Error('search_product tool did not emit activity event');
    }
  });

  console.log('\n======================================================');
  console.log(' TEST EXECUTION SUMMARY:');
  const allPassed = testResults.every((r) => r.passed);
  testResults.forEach((r, idx) => {
    console.log(` ${r.passed ? '✅' : '❌'} [${idx + 1}/${testResults.length}] ${r.name}`);
  });
  console.log(`\n Total Tests: ${testResults.length} | Passed: ${testResults.filter((r) => r.passed).length} | Failed: ${testResults.filter((r) => !r.passed).length}`);
  console.log('======================================================\n');

  if (!allPassed) {
    throw new Error('One or more automated tests failed!');
  }
}

// Run directly if invoked from CLI (e.g. npm run test)
if (process.argv[1]?.endsWith('runTests.ts') || process.argv[1]?.endsWith('runTests.js')) {
  runAllAutomatedTests()
    .then(() => {
      console.log('All tests passed successfully!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Test execution failed:', err);
      process.exit(1);
    });
}
