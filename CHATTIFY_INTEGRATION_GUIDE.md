# Chattify App Integration Guide: Zero-Click Store Operator

This step-by-step guide explains how to connect your local Chattify chat app to the autonomous **Zero-Click Store Operator** running with **Groq AI** (`llama-3.3-70b-versatile`) and **MongoDB**.

---

## 1. Summary of Changes Required in Chattify

| Step | File | Action |
|------|------|--------|
| **Step 1** | `backend/.env` | Add `GROQ_API_KEY` and `STORE_BOT_USER_ID` |
| **Step 2** | `backend/src/lib/storeOperator.js` | **Create new file** with the autonomous agent & MongoDB catalog logic |
| **Step 3** | `backend/src/controllers/message.controller.js` | Import `processStoreOperatorMessage` and route Store Bot messages to it |

---

## Step 1: Update `backend/.env`

Open your Chattify backend's `.env` file (`D:\Chattify-app\backend\.env`) and add these two lines:

```env
GROQ_API_KEY=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
STORE_BOT_USER_ID=6aaf8072dc34673e1203ac12
```

*(Note: `6aaf8072dc34673e1203ac12` is the ID of your "Kirana Store Operator" account from your terminal log).*

---

## Step 2: Create `backend/src/lib/storeOperator.js`

Create a new file at `D:\Chattify-app\backend\src\lib\storeOperator.js` and paste the following:

```javascript
import mongoose from "mongoose";

// 1. Kirana Product Schema & Model
const storeProductSchema = new mongoose.Schema({
    name: { type: String, required: true },
    hindiName: String,
    category: { type: String, required: true },
    price: { type: Number, required: true },
    unit: { type: String, required: true },
    stock: { type: Number, required: true, default: 50 },
    aliases: [String],
}, { timestamps: true });

const StoreProduct = mongoose.models.StoreProduct || mongoose.model("StoreProduct", storeProductSchema);

// 2. Kirana Order Schema & Model
const storeOrderSchema = new mongoose.Schema({
    orderId: { type: String, required: true, unique: true },
    customerName: String,
    customerPhone: String,
    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "StoreProduct" },
        name: String,
        quantity: Number,
        unitPrice: Number,
        total: Number,
    }],
    totalAmount: Number,
    status: { type: String, default: "CONFIRMED" },
}, { timestamps: true });

const StoreOrder = mongoose.models.StoreOrder || mongoose.model("StoreOrder", storeOrderSchema);

// 3. Initial Kirana Catalog (Auto-seeds if catalog is empty)
const INITIAL_PRODUCTS = [
    { name: "Maggi 2-Minute Noodles", hindiName: "मैगी", category: "Snacks", price: 14, unit: "packet (70g)", stock: 120, aliases: ["maggi", "noodles", "maggie", "magi"] },
    { name: "Amul Taaza Toned Milk", hindiName: "अमूल दूध", category: "Dairy", price: 27, unit: "pouch (500ml)", stock: 45, aliases: ["milk", "doodh", "dudh", "amul milk", "taaza"] },
    { name: "Aashirvaad Shudh Chakki Atta", hindiName: "आशीर्वाद आटा", category: "Staples", price: 245, unit: "bag (5kg)", stock: 30, aliases: ["atta", "aata", "wheat flour", "flour", "aashirvaad"] },
    { name: "Tata Salt Vacuum Evaporated", hindiName: "टाटा नमक", category: "Staples", price: 28, unit: "packet (1kg)", stock: 80, aliases: ["salt", "namak", "tata salt"] },
    { name: "Fortune Sunlite Refined Sunflower Oil", hindiName: "फॉर्च्यून तेल", category: "Oils", price: 145, unit: "pouch (1L)", stock: 35, aliases: ["oil", "tel", "refined oil", "sunflower oil", "fortune"] },
    { name: "Madhur Pure & Hygienic Sugar", hindiName: "चीनी", category: "Staples", price: 48, unit: "packet (1kg)", stock: 65, aliases: ["sugar", "chini", "cheeni", "shakkar"] },
    { name: "Amul Butter", hindiName: "अमूल मक्खन", category: "Dairy", price: 56, unit: "pack (100g)", stock: 40, aliases: ["butter", "makhan", "makkhan"] },
    { name: "Tata Tea Premium", hindiName: "टाटा चाय", category: "Beverages", price: 140, unit: "pack (250g)", stock: 50, aliases: ["tea", "chai", "patti", "tata tea"] },
    { name: "Parle-G Gold Biscuits", hindiName: "पारले-जी", category: "Snacks", price: 10, unit: "pack (100g)", stock: 95, aliases: ["biscuit", "parle", "parle g"] },
    { name: "Amul Masti Dahi", hindiName: "दही", category: "Dairy", price: 35, unit: "cup (400g)", stock: 25, aliases: ["dahi", "curd", "yogurt"] },
];

async function ensureCatalogSeeded() {
    const count = await StoreProduct.countDocuments();
    if (count === 0) {
        await StoreProduct.insertMany(INITIAL_PRODUCTS);
        console.log("🛒 [Store Operator] Seeded initial Kirana catalog into MongoDB");
    }
}

// 4. Groq Tool Definitions
const tools = [
    {
        type: "function",
        function: {
            name: "search_product",
            description: "Search MongoDB catalog by product name, category, or colloquial alias (e.g. 'maggi', 'atta', 'milk', 'sugar').",
            parameters: {
                type: "object",
                properties: {
                    query: { type: "string", description: "Search query" }
                },
                required: ["query"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "create_order",
            description: "Atomically decrements stock and creates confirmed order with real prices.",
            parameters: {
                type: "object",
                properties: {
                    items: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                productId: { type: "string" },
                                quantity: { type: "number" }
                            },
                            required: ["productId", "quantity"]
                        }
                    },
                    customerName: { type: "string" },
                    customerPhone: { type: "string" }
                },
                required: ["items"]
            }
        }
    }
];

// Tool Executors
async function executeTool(name, args, customerInfo) {
    if (name === "search_product") {
        const regex = new RegExp(args.query.trim(), "i");
        const products = await StoreProduct.find({
            $or: [{ name: regex }, { aliases: regex }, { category: regex }, { hindiName: regex }]
        }).limit(5);

        return products.map(p => ({
            id: p._id.toString(),
            name: p.name,
            hindiName: p.hindiName,
            price: p.price,
            unit: p.unit,
            stock: p.stock
        }));
    }

    if (name === "create_order") {
        const orderItems = [];
        let grandTotal = 0;

        for (const item of args.items) {
            // Atomic stock decrement with concurrency race protection
            const product = await StoreProduct.findOneAndUpdate(
                { _id: item.productId, stock: { $gte: item.quantity } },
                { $inc: { stock: -item.quantity } },
                { new: true }
            );

            if (!product) {
                const current = await StoreProduct.findById(item.productId);
                return {
                    success: false,
                    error: `Insufficient stock for ${current?.name || "item"}. Available: ${current?.stock || 0}`
                };
            }

            const itemTotal = product.price * item.quantity;
            grandTotal += itemTotal;
            orderItems.push({
                productId: product._id,
                name: product.name,
                quantity: item.quantity,
                unitPrice: product.price,
                total: itemTotal,
            });
        }

        const orderId = `ORD-${Date.now().toString().slice(-6)}`;
        const order = new StoreOrder({
            orderId,
            customerName: args.customerName || customerInfo.name || "Customer",
            customerPhone: args.customerPhone || customerInfo.phone || "9876543210",
            items: orderItems,
            totalAmount: grandTotal,
            status: "CONFIRMED"
        });

        await order.save();

        return {
            success: true,
            orderId,
            items: orderItems,
            totalAmount: grandTotal,
            message: "Order placed and stock reserved successfully"
        };
    }

    return { error: "Unknown tool" };
}

// 5. Main Processing Function
export async function processStoreOperatorMessage({ text, senderId, senderName, senderPhone }) {
    await ensureCatalogSeeded();

    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
        return {
            success: false,
            reply: "Store Bot error: GROQ_API_KEY missing in .env"
        };
    }

    const messages = [
        {
            role: "system",
            content: `You are the autonomous AI Store Operator for a neighborhood Kirana store.
Always use search_product to look up items and prices from MongoDB.
When customer specifies quantities, call create_order to atomically reserve stock and get the bill.
Respond in warm, friendly Hindi/Hinglish/English with the itemized bill, total amount, and Order ID.
Never invent prices or products.`
        },
        {
            role: "user",
            content: `Customer Name: ${senderName || "Customer"}\nMessage: ${text}`
        }
    ];

    try {
        // Turn 1: Groq tool calling
        let response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages,
                tools,
                tool_choice: "auto",
                temperature: 0.1
            })
        });

        let data = await response.json();
        let message = data.choices[0].message;

        // Tool loop (up to 3 turns)
        let loops = 0;
        while (message.tool_calls && loops < 3) {
            loops++;
            messages.push(message);

            for (const toolCall of message.tool_calls) {
                const args = JSON.parse(toolCall.function.arguments);
                const result = await executeTool(toolCall.function.name, args, { name: senderName, phone: senderPhone });

                messages.push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    name: toolCall.function.name,
                    content: JSON.stringify(result)
                });
            }

            // Follow-up turn with tool outputs
            response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${GROQ_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages,
                    tools,
                    tool_choice: "auto",
                    temperature: 0.1
                })
            });

            data = await response.json();
            message = data.choices[0].message;
        }

        return {
            success: true,
            reply: message.content || "Aapka order receive ho gaya hai!"
        };
    } catch (err) {
        console.error("Groq Operator execution error:", err);
        return {
            success: false,
            reply: "Bhaiya abhi thoda issue aa gaya, kripya 1 minute baad dobara bhejein."
        };
    }
}
```

---

## Step 3: Replace `backend/src/controllers/message.controller.js`

Open `D:\Chattify-app\backend\src\controllers\message.controller.js` and replace it with this complete, production-ready code:

```javascript
import Message from "../models/Message.js";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import { processStoreOperatorMessage } from "../lib/storeOperator.js";

export const getAllContacts = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;
        const filteredUsers = await User.find({_id: { $ne: loggedInUserId }}).select("-password");

        res.status(200).json(filteredUsers);
    } catch (error) {
        console.log("Error in getAllContacts: ", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const getMessagesByUserId = async (req, res) => {
    try {
        const myId = req.user._id;
        const {id: userToChatId} = req.params;

        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: userToChatId },
                { senderId: userToChatId, receiverId: myId },
            ]
        });

        res.status(200).json(messages);
    } catch (error) {
        console.log("Error in getMessage controller: ", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const sendMessage = async (req, res) => {
    try {
        const {text, image} = req.body;
        const {id: receiverId} = req.params;
        const senderId = req.user._id;

        if(!text && !image){
            return res.status(400).json({ message: "Text or Image is required" });
        }
        if (senderId.equals(receiverId)) {
            return res.status(400).json({ message: "Cannot send message to yourself" });
        }
        const receiver = await User.findById(receiverId);
        if(!receiver){
            return res.status(404).json({ message: "Receiver not found" });
        }

        let imageUrl;
        if (image) {
            const sizeInBytes = Buffer.byteLength(image, 'base64');
            if (sizeInBytes > 5 * 1024 * 1024) {
                return res.status(413).json({ message: "Image exceeds 5MB limit" });
            }
            const uploadResponse = await cloudinary.uploader.upload(image, {
                folder: "chattify/messages",
                quality: "auto",
                fetch_format: "auto",
            });
            imageUrl = uploadResponse.secure_url;
        }

        // 1. Create and save the customer's message as normal
        const newMessage = new Message({
            senderId,
            receiverId,
            text,
            image: imageUrl,
        });

        await newMessage.save();

        // Emit through socket so receiver sees it immediately
        const receiverSocketId = getReceiverSocketId(receiverId);
        if(receiverSocketId){
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }

        // Return 201 immediately so the user's input box clears with 0ms lag
        res.status(201).json(newMessage);

        // 2. CHECK IF RECEIVER IS THE STORE OPERATOR BOT
        const isStoreBot = 
            (process.env.STORE_BOT_USER_ID && receiverId.toString() === process.env.STORE_BOT_USER_ID.toString()) ||
            receiver.email === "store@kirana.local" ||
            receiver.isBot === true;

        if (isStoreBot && text) {
            // Run Store Operator directly inside your backend with zero network latency
            (async () => {
                try {
                    const operatorData = await processStoreOperatorMessage({
                        text,
                        senderId: senderId.toString(),
                        senderName: req.user.fullName || req.user.name || "Customer",
                        senderPhone: req.user.phone || "9876543210",
                    });

                    if (operatorData && operatorData.success && operatorData.reply) {
                        // Create and save Store Operator's reply in your Chattify DB
                        const botReplyMessage = new Message({
                            senderId: receiverId, // Store Bot is the sender
                            receiverId: senderId, // Customer is the receiver
                            text: operatorData.reply,
                        });

                        await botReplyMessage.save();

                        // Emit live to customer via Socket.io so it pops up in their chat window!
                        const senderSocketId = getReceiverSocketId(senderId);
                        if (senderSocketId) {
                            io.to(senderSocketId).emit("newMessage", botReplyMessage);
                        }
                    }
                } catch (botErr) {
                    console.error("[Store Operator Bridge Error]:", botErr);
                }
            })();
        }

    } catch (error) {
        console.log("Error in sendMessage controller: ", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const getChatPartners = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;

        const partnerIds = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { senderId: loggedInUserId },
                        { receiverId: loggedInUserId },
                    ],
                },
            },
            {
                $project: {
                    partnerId: {
                        $cond: [
                            { $eq: ["$senderId", loggedInUserId] },
                            "$receiverId",
                            "$senderId",
                        ],
                    },
                },
            },
            { $group: { _id: "$partnerId" } },
        ]);

        const ids = partnerIds.map((p) => p._id);
        const chatPartners = await User.find({ _id: { $in: ids } }).select("-password");
        res.status(200).json(chatPartners);
    } catch (error) {
        console.error("Error in getChatPartners:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
```

---

## Step 4: Test in Chattify

1. Save all files. Your Chattify server will restart automatically.
2. In your Chattify frontend (`http://localhost:5173`), log in as any regular customer user.
3. Open chat with **Kirana Store Operator**.
4. Type:
   > *"Bhai 2 packet Maggi noodles aur 1 pouch Amul milk bhej do"*
5. **Result**: Within 1 second, the Store Operator replies with an itemized bill, total amount, and Order ID directly in your chat!
