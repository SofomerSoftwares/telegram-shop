import express from 'express';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

// JWT Secret and Admin Password
const JWT_SECRET = process.env.JWT_SECRET || 'telegram-ecommerce-secret-key-98765';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Helper to load Firebase Config
function getFirebaseConfig() {
  const filePath = path.join(process.cwd(), 'firebase-applet-config.json');
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (error) {
    console.error('Failed to read firebase-applet-config.json', error);
  }
  return null;
}

const firebaseConfig = getFirebaseConfig();
if (!firebaseConfig) {
  console.error('CRITICAL: firebase-applet-config.json is missing or invalid.');
}

// Initialize Firebase using the client SDK
const firebaseApp = firebaseConfig ? initializeApp(firebaseConfig) : null;
const db = firebaseApp && firebaseConfig ? getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId) : null;

// Helper to get Firestore DB safely
function getDb() {
  if (!db) {
    throw new Error('Firestore is not initialized. Please verify firebase-applet-config.json.');
  }
  return db;
}

// Lazy initialization of Gemini API
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      aiClient = new GoogleGenAI({ apiKey });
    }
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json());

  // Authentication Middleware
  const authenticateAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
      return;
    }

    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      (req as any).admin = decoded;
      next();
    } catch (err) {
      res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
      return;
    }
  };

  // ==================== API ROUTES ====================

  // 1. Get Settings (Public fallback, Admin detailed)
  app.get('/api/settings', async (req, res) => {
    try {
      const firestoreDb = getDb();
      const settingsDocRef = doc(firestoreDb, 'settings', 'telegram_config');
      const docSnap = await getDoc(settingsDocRef);
      
      let config = {
        botToken: process.env.TELEGRAM_BOT_TOKEN || '',
        channelId: process.env.TELEGRAM_CHANNEL_ID || '',
        chatId: process.env.TELEGRAM_ADMIN_CHAT_ID || '',
        webhookUrl: process.env.APP_URL ? `${process.env.APP_URL}/api/telegram-webhook` : ''
      };

      if (docSnap.exists()) {
        const data = docSnap.data();
        config = {
          botToken: data.botToken || config.botToken,
          channelId: data.channelId || config.channelId,
          chatId: data.chatId || config.chatId,
          webhookUrl: data.webhookUrl || config.webhookUrl
        };
      }

      // Hide the actual token on public endpoint
      const maskedConfig = {
        channelId: config.channelId,
        chatId: config.chatId,
        webhookUrl: config.webhookUrl,
        hasBotToken: !!config.botToken,
        botToken: config.botToken ? `${config.botToken.substring(0, 6)}...` : ''
      };

      res.json(maskedConfig);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 2. Admin Login
  app.post('/api/admin/login', async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!password) {
        res.status(400).json({ error: 'Password is required' });
        return;
      }

      // Check fallback admin credential
      const fallbackMatches = (!username || username === 'admin') && password === ADMIN_PASSWORD;
      
      if (fallbackMatches) {
        const token = jwt.sign({ admin: true, username: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, username: 'admin' });
        return;
      }

      // If username is specified, search in DB
      if (username) {
        const firestoreDb = getDb();
        const adminsRef = collection(firestoreDb, 'admins');
        const q = query(adminsRef, where('username', '==', username.trim().toLowerCase()));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const adminDoc = querySnapshot.docs[0];
          const adminData = adminDoc.data();
          
          const crypto = await import('crypto');
          const hashedInput = crypto.createHash('sha256').update(password).digest('hex');

          if (adminData.passwordHash === hashedInput) {
            const token = jwt.sign({ admin: true, username: adminData.username }, JWT_SECRET, { expiresIn: '7d' });
            res.json({ token, username: adminData.username });
            return;
          }
        }
      }

      res.status(401).json({ error: 'Invalid username or password' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 2.5 Admin Register
  app.post('/api/admin/register', async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        res.status(400).json({ error: 'Username and password are required' });
        return;
      }

      if (username.trim().length < 3) {
        res.status(400).json({ error: 'Username must be at least 3 characters' });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({ error: 'Password must be at least 6 characters' });
        return;
      }

      const firestoreDb = getDb();
      const normalizedUsername = username.trim().toLowerCase();

      // Check if username already exists
      const adminsRef = collection(firestoreDb, 'admins');
      const q = query(adminsRef, where('username', '==', normalizedUsername));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty || normalizedUsername === 'admin') {
        res.status(400).json({ error: 'Username is already taken' });
        return;
      }

      // Hash password using crypto
      const crypto = await import('crypto');
      const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

      await addDoc(adminsRef, {
        username: normalizedUsername,
        passwordHash,
        createdAt: new Date().toISOString()
      });

      res.json({ success: true, message: 'Registration successful! You can now log in.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 3. Admin Get Full Settings
  app.get('/api/admin/settings', authenticateAdmin, async (req, res) => {
    try {
      const firestoreDb = getDb();
      const settingsDocRef = doc(firestoreDb, 'settings', 'telegram_config');
      const docSnap = await getDoc(settingsDocRef);
      
      let config = {
        botToken: process.env.TELEGRAM_BOT_TOKEN || '',
        channelId: process.env.TELEGRAM_CHANNEL_ID || '',
        chatId: process.env.TELEGRAM_ADMIN_CHAT_ID || '',
        webhookUrl: process.env.APP_URL ? `${process.env.APP_URL}/api/telegram-webhook` : ''
      };

      if (docSnap.exists()) {
        const data = docSnap.data();
        config = {
          botToken: data.botToken || config.botToken,
          channelId: data.channelId || config.channelId,
          chatId: data.chatId || config.chatId,
          webhookUrl: data.webhookUrl || config.webhookUrl
        };
      }

      res.json(config);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 4. Admin Save Settings
  app.post('/api/admin/settings', authenticateAdmin, async (req, res) => {
    try {
      const { botToken, channelId, chatId, webhookUrl } = req.body;
      const firestoreDb = getDb();
      
      const settingsDocRef = doc(firestoreDb, 'settings', 'telegram_config');
      await setDoc(settingsDocRef, {
        botToken,
        channelId,
        chatId,
        webhookUrl,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // If botToken and webhookUrl are set, try configuring Telegram Webhook
      let webhookStatus = 'saved';
      if (botToken && webhookUrl) {
        try {
          const setWebhookUrl = `https://api.telegram.org/bot${botToken}/setWebhook?url=${encodeURIComponent(webhookUrl)}`;
          const response = await fetch(setWebhookUrl);
          const responseData = await response.json();
          if (responseData.ok) {
            webhookStatus = 'webhook_registered';
          } else {
            webhookStatus = `webhook_error: ${responseData.description}`;
          }
        } catch (webhookErr: any) {
          webhookStatus = `webhook_failed: ${webhookErr.message}`;
        }
      }

      res.json({ success: true, webhookStatus });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 4.5 Admin Check Telegram Connection Status
  app.get('/api/admin/telegram-status', authenticateAdmin, async (req, res) => {
    try {
      const firestoreDb = getDb();
      const settingsDocRef = doc(firestoreDb, 'settings', 'telegram_config');
      const settingsSnap = await getDoc(settingsDocRef);

      let botToken = process.env.TELEGRAM_BOT_TOKEN || '';
      let channelId = process.env.TELEGRAM_CHANNEL_ID || '';

      if (settingsSnap.exists()) {
        const data = settingsSnap.data();
        botToken = data.botToken || botToken;
        channelId = data.channelId || channelId;
      }

      if (!botToken) {
        res.json({
          connected: false,
          reason: 'Bot Token is not configured'
        });
        return;
      }

      // Check Bot Status (getMe)
      const getMeUrl = `https://api.telegram.org/bot${botToken}/getMe`;
      const meResponse = await fetch(getMeUrl);
      const meData = await meResponse.json();

      if (!meData.ok) {
        res.json({
          connected: false,
          reason: `Invalid Bot Token: ${meData.description || 'Unknown API Error'}`
        });
        return;
      }

      const botUser = meData.result;

      // If channel ID is provided, try to verify if the bot is a member/admin of the channel
      let channelStatus = null;
      let channelTitle = '';
      if (channelId) {
        try {
          const getChatUrl = `https://api.telegram.org/bot${botToken}/getChat?chat_id=${encodeURIComponent(channelId)}`;
          const chatResponse = await fetch(getChatUrl);
          const chatData = await chatResponse.json();
          if (chatData.ok) {
            channelStatus = 'connected';
            channelTitle = chatData.result.title || chatData.result.username || channelId;
          } else {
            channelStatus = 'not_found_or_no_access';
            channelTitle = `Error: ${chatData.description || 'Unknown error'}`;
          }
        } catch (err: any) {
          channelStatus = 'fetch_failed';
          channelTitle = `Failed to contact API: ${err.message}`;
        }
      } else {
        channelStatus = 'not_configured';
      }

      res.json({
        connected: true,
        botUsername: botUser.username,
        botFirstName: botUser.first_name,
        channelId,
        channelStatus,
        channelTitle
      });

    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 5. Get Products (Public)
  app.get('/api/products', async (req, res) => {
    try {
      const firestoreDb = getDb();
      const productsRef = collection(firestoreDb, 'products');
      const q = query(productsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const products: any[] = [];
      querySnapshot.forEach((doc) => {
        products.push({ id: doc.id, ...doc.data() });
      });

      res.json(products);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 6. Get Product by ID (Public)
  app.get('/api/products/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const firestoreDb = getDb();
      const productRef = doc(firestoreDb, 'products', id);
      const docSnap = await getDoc(productRef);

      if (docSnap.exists()) {
        res.json({ id: docSnap.id, ...docSnap.data() });
      } else {
        res.status(404).json({ error: 'Product not found' });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 7. Admin Create/Update Product Manually
  app.post('/api/admin/products', authenticateAdmin, async (req, res) => {
    try {
      const productData = req.body;
      const firestoreDb = getDb();
      const now = new Date().toISOString();

      if (productData.id) {
        const productRef = doc(firestoreDb, 'products', productData.id);
        if (productData.stockCount !== undefined) {
          productData.stockCount = Number(productData.stockCount);
        }
        if (productData.discountedPrice !== undefined) {
          productData.discountedPrice = (productData.discountedPrice === '' || productData.discountedPrice === null) ? null : Number(productData.discountedPrice);
        }
        const dataToSave = {
          ...productData,
          updatedAt: now
        };
        delete dataToSave.id;
        await setDoc(productRef, dataToSave, { merge: true });
        res.json({ id: productData.id, ...dataToSave });
      } else {
        const productsRef = collection(firestoreDb, 'products');
        const newDocRef = await addDoc(productsRef, {
          title: productData.title,
          description: productData.description,
          price: Number(productData.price) || 0,
          discountedPrice: (productData.discountedPrice !== undefined && productData.discountedPrice !== '' && productData.discountedPrice !== null) ? Number(productData.discountedPrice) : null,
          images: productData.images || [],
          contactLink: productData.contactLink || '',
          category: productData.category || 'Other',
          stockCount: productData.stockCount !== undefined ? Number(productData.stockCount) : 10,
          createdAt: now,
          updatedAt: now
        });
        res.json({ id: newDocRef.id, ...productData, stockCount: productData.stockCount !== undefined ? Number(productData.stockCount) : 10, createdAt: now, updatedAt: now });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 7.5 Admin Post Product to Telegram Channel
  app.post('/api/admin/products/:id/post-telegram', authenticateAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const firestoreDb = getDb();

      // Fetch product details
      const productRef = doc(firestoreDb, 'products', id);
      const productSnap = await getDoc(productRef);

      if (!productSnap.exists()) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }

      const product = productSnap.data();

      // Fetch Telegram Credentials from settings
      const settingsDocRef = doc(firestoreDb, 'settings', 'telegram_config');
      const settingsSnap = await getDoc(settingsDocRef);

      let botToken = process.env.TELEGRAM_BOT_TOKEN || '';
      let channelId = process.env.TELEGRAM_CHANNEL_ID || '';

      if (settingsSnap.exists()) {
        const data = settingsSnap.data();
        botToken = data.botToken || botToken;
        channelId = data.channelId || channelId;
      }

      if (!botToken || !channelId) {
        res.status(400).json({ error: 'Telegram credentials (Bot Token & Channel ID) are not configured in settings.' });
        return;
      }

      // Format caption
      const captionText = `
🌟 <b>${product.title}</b> 🌟

${product.category ? `🏷️ <b>Category:</b> ${product.category}\n` : ''}💰 <b>Price:</b> $${Number(product.price).toFixed(2)}

${product.description}

💬 <b>Order Link/Contact:</b> ${product.contactLink || 'Contact seller directly'}
      `.trim();

      let telegramResponse;
      const imageUrl = product.images?.[0];

      if (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
        // Send as photo
        const sendPhotoUrl = `https://api.telegram.org/bot${botToken}/sendPhoto`;
        telegramResponse = await fetch(sendPhotoUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: channelId,
            photo: imageUrl,
            caption: captionText,
            parse_mode: 'HTML'
          })
        });
      } else {
        // Send as standard text message
        const sendMessageUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
        telegramResponse = await fetch(sendMessageUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: channelId,
            text: captionText,
            parse_mode: 'HTML'
          })
        });
      }

      const resData = await telegramResponse.json();

      if (!resData.ok) {
        throw new Error(resData.description || 'Unknown Telegram API error');
      }

      // Update product with telegramPostId and telegramChannel if successfully posted
      const messageId = resData.result.message_id;
      const chat = resData.result.chat || {};
      const channelUsername = chat.username ? `@${chat.username}` : (chat.title || channelId);

      await setDoc(productRef, {
        telegramPostId: messageId,
        telegramChannel: channelUsername,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      res.json({
        success: true,
        messageId,
        channel: channelUsername
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 8. Admin Delete Product
  app.delete('/api/admin/products/:id', authenticateAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const firestoreDb = getDb();
      const productRef = doc(firestoreDb, 'products', id);
      await deleteDoc(productRef);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 9. Admin Get Orders
  app.get('/api/admin/orders', authenticateAdmin, async (req, res) => {
    try {
      const firestoreDb = getDb();
      const ordersRef = collection(firestoreDb, 'orders');
      const q = query(ordersRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const orders: any[] = [];
      querySnapshot.forEach((doc) => {
        orders.push({ id: doc.id, ...doc.data() });
      });

      res.json(orders);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 9.5 Admin Update Order Status
  app.post('/api/admin/orders/:id/status', authenticateAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const firestoreDb = getDb();

      if (!status || !['pending', 'completed', 'cancelled'].includes(status)) {
        res.status(400).json({ error: 'Invalid or missing status' });
        return;
      }

      const orderRef = doc(firestoreDb, 'orders', id);
      const orderSnap = await getDoc(orderRef);

      if (!orderSnap.exists()) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      await updateDoc(orderRef, {
        status,
        updatedAt: new Date().toISOString()
      });

      res.json({ success: true, id, status });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 10. Admin Webhook Logs
  app.get('/api/admin/webhook-logs', authenticateAdmin, async (req, res) => {
    try {
      const firestoreDb = getDb();
      const logsRef = collection(firestoreDb, 'webhook_logs');
      const q = query(logsRef, orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const logs: any[] = [];
      querySnapshot.forEach((doc) => {
        logs.push({ id: doc.id, ...doc.data() });
      });

      res.json(logs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 11. Create Order and Notify Seller
  app.post('/api/orders', async (req, res) => {
    try {
      const { customerName, contactInfo, deliveryAddress, items, totalPrice } = req.body;
      const firestoreDb = getDb();

      if (!customerName || !contactInfo || !deliveryAddress || !items || items.length === 0) {
        res.status(400).json({ error: 'Missing required order fields' });
        return;
      }

      const now = new Date().toISOString();
      const ordersRef = collection(firestoreDb, 'orders');
      const newOrderRef = await addDoc(ordersRef, {
        customerName,
        contactInfo,
        deliveryAddress,
        items,
        totalPrice: Number(totalPrice),
        status: 'pending',
        createdAt: now
      });

      // Try fetching Telegram credentials to send notification
      const settingsDocRef = doc(firestoreDb, 'settings', 'telegram_config');
      const settingsSnap = await getDoc(settingsDocRef);
      
      let botToken = process.env.TELEGRAM_BOT_TOKEN || '';
      let chatId = process.env.TELEGRAM_ADMIN_CHAT_ID || '';

      if (settingsSnap.exists()) {
        const data = settingsSnap.data();
        botToken = data.botToken || botToken;
        chatId = data.chatId || chatId;
      }

      let notificationSent = false;
      let notificationError = '';

      if (botToken && chatId) {
        try {
          const messageText = `
📦 <b>New Order Received! (#${newOrderRef.id.substring(0, 6)})</b>

👤 <b>Customer Details:</b>
• <b>Name:</b> ${customerName}
• <b>Contact:</b> ${contactInfo}
• <b>Address:</b> ${deliveryAddress}

🛒 <b>Items Ordered:</b>
${items.map((item: any) => `• ${item.title} (x${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}`).join('\n')}

💰 <b>Total Price:</b> $${Number(totalPrice).toFixed(2)}
📅 <b>Date:</b> ${new Date(now).toLocaleString()}
          `.trim();

          const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
          const response = await fetch(telegramUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: messageText,
              parse_mode: 'HTML',
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: '✅ Accept Order', callback_data: `accept_order:${newOrderRef.id}` },
                    { text: '❌ Cancel Order', callback_data: `cancel_order:${newOrderRef.id}` }
                  ]
                ]
              }
            })
          });

          const resData = await response.json();
          if (resData.ok) {
            notificationSent = true;
          } else {
            notificationError = resData.description || 'Unknown Telegram error';
          }
        } catch (err: any) {
          notificationError = err.message;
        }
      } else {
        notificationError = 'Telegram credentials not fully configured in settings';
      }

      res.json({
        success: true,
        orderId: newOrderRef.id,
        notificationSent,
        notificationError: notificationSent ? undefined : notificationError
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==================== TELEGRAM HANDLER & PARSING ====================

  // Helper function to extract fields from channel post
  async function parseProductFromPost(text: string, images: string[]): Promise<any> {
    const ai = getGeminiClient();

    if (ai) {
      try {
        const prompt = `
You are an AI assistant that extracts structured e-commerce product information from a Telegram channel post.
Extract the following details from the message text:
1. Title (The product name, should be clean without unnecessary emojis)
2. Price (The numerical price, as a number. Extract only the number, e.g., if it is "$45.99" or "45.99 USD" or "Price: 45", output 45.99. Return 0 if not found)
3. Description (The detailed description of the product, explaining its features, specifications, or condition)
4. Contact/Order Link (If a contact username like @shop_support, telegram chat link like https://t.me/username, or other order link is provided, extract it. Otherwise leave blank)
5. Category (Categorize the product into a suitable short general category like Electronics, Apparel, Home, Gadgets, Books, Games, Retro, or similar, maximum 2 words)

Return ONLY a valid JSON object with the following fields:
{
  "title": "extracted title",
  "price": 45.99,
  "description": "extracted description",
  "contactLink": "extracted contact link",
  "category": "extracted category"
}
Do not wrap the output in markdown code blocks or add any other text. Return ONLY the raw JSON string.

Message text:
"${text}"
        `.trim();

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt
        });

        const rawText = response.text || '';
        const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const result = JSON.parse(cleanJson);
        
        return {
          title: result.title || 'Telegram Product',
          price: Number(result.price) || 0,
          description: result.description || text,
          contactLink: result.contactLink || '',
          category: result.category || 'Other',
          stockCount: 10,
          images: images
        };
      } catch (err) {
        console.error('Gemini extraction failed, using fallback regex parser:', err);
      }
    }

    // Fallback Regex parser
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      return { title: 'Telegram Product', price: 0, description: text, contactLink: '', category: 'Other', stockCount: 10, images };
    }

    let title = lines[0].replace(/[🌟⭐✨🔥📦🛍️👇]/g, '').trim();
    let price = 0;

    // Price regex
    const priceRegex = /(?:price|cost|💰|[\$€£¥]):?\s*([\d\.,]+)/i;
    const priceMatch = text.match(priceRegex);
    if (priceMatch) {
      price = parseFloat(priceMatch[1].replace(/,/g, ''));
    } else {
      const genericPriceRegex = /(?:[\$€£¥\s])([\d\.]+)/;
      const genericMatch = text.match(genericPriceRegex);
      if (genericMatch) {
        price = parseFloat(genericMatch[1]);
      } else {
        for (const line of lines) {
          if (/price|cost|💰/i.test(line)) {
            const numMatch = line.match(/[\d\.]+/);
            if (numMatch) {
              price = parseFloat(numMatch[0]);
              break;
            }
          }
        }
      }
    }

    let contactLink = '';
    const telegramLinkRegex = /(https?:\/\/t\.me\/[a-zA-Z0-9_\+]+|@[a-zA-Z0-9_]+)/i;
    const contactMatch = text.match(telegramLinkRegex);
    if (contactMatch) {
      contactLink = contactMatch[1];
      if (contactLink.startsWith('@')) {
        contactLink = `https://t.me/${contactLink.substring(1)}`;
      }
    }

    const descLines = lines.slice(1).filter(line => {
      if (priceMatch && line.includes(priceMatch[0])) return false;
      if (contactMatch && line.includes(contactMatch[0])) return false;
      return true;
    });

    return {
      title,
      price: isNaN(price) ? 0 : price,
      description: descLines.join('\n') || text,
      contactLink,
      category: 'Other',
      stockCount: 10,
      images
    };
  }

  // Helper to fetch Telegram File Path
  async function getTelegramFileUrl(botToken: string, fileId: string): Promise<string | null> {
    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`);
      const data = await response.json();
      if (data.ok && data.result?.file_path) {
        return `https://api.telegram.org/file/bot${botToken}/${data.result.file_path}`;
      }
    } catch (err) {
      console.error('Error fetching file path from Telegram:', err);
    }
    return null;
  }

  // Webhook Receiver
  app.post('/api/telegram-webhook', async (req, res) => {
    try {
      const update = req.body;
      const firestoreDb = getDb();

      // Log the incoming webhook payload for admin visualizer
      const logsRef = collection(firestoreDb, 'webhook_logs');
      await addDoc(logsRef, {
        payload: JSON.stringify(update, null, 2),
        timestamp: new Date().toISOString(),
        type: 'real_webhook'
      });

      // Handle callback query (inline button clicks)
      if (update.callback_query) {
        const callbackQuery = update.callback_query;
        const callbackData = callbackQuery.data || '';
        
        // Fetch Bot Token from settings
        const settingsDocRef = doc(firestoreDb, 'settings', 'telegram_config');
        const settingsSnap = await getDoc(settingsDocRef);
        let botToken = process.env.TELEGRAM_BOT_TOKEN || '';
        if (settingsSnap.exists()) {
          const data = settingsSnap.data();
          botToken = data.botToken || botToken;
        }

        if (callbackData.startsWith('accept_order:') || callbackData.startsWith('cancel_order:')) {
          const isAccept = callbackData.startsWith('accept_order:');
          const actionStatus = isAccept ? 'completed' : 'cancelled';
          const orderId = callbackData.split(':')[1];
          const orderDocRef = doc(firestoreDb, 'orders', orderId);
          const orderSnap = await getDoc(orderDocRef);

          if (orderSnap.exists()) {
            await updateDoc(orderDocRef, {
              status: actionStatus,
              updatedAt: new Date().toISOString()
            });

            if (botToken) {
              // Answer Callback Query
              await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  callback_query_id: callbackQuery.id,
                  text: `Order has been successfully ${isAccept ? 'accepted' : 'cancelled'}!`
                })
              }).catch(err => console.error('Error answering callback query:', err));

              // Edit the message text to show status and remove buttons
              const originalText = callbackQuery.message?.text || '';
              const statusEmoji = isAccept ? '✅' : '❌';
              const statusText = isAccept ? 'ACCEPTED & COMPLETED' : 'CANCELLED';
              const updatedText = `${originalText}\n\n${statusEmoji} <b>Status: ${statusText}</b> (Processed via Telegram)`;

              await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: callbackQuery.message.chat.id,
                  message_id: callbackQuery.message.message_id,
                  text: updatedText,
                  parse_mode: 'HTML',
                  reply_markup: {
                    inline_keyboard: [] // Removes buttons
                  }
                })
              }).catch(err => console.error('Error editing message text:', err));
            }

            res.json({ status: 'success', action: actionStatus, orderId });
            return;
          } else {
            if (botToken) {
              await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  callback_query_id: callbackQuery.id,
                  text: 'Error: Order not found.'
                })
              }).catch(err => console.error(err));
            }
            res.json({ status: 'error', reason: 'Order not found' });
            return;
          }
        }
      }

      const channelPost = update.channel_post;
      if (!channelPost) {
        res.json({ status: 'ignored', reason: 'Not a channel post' });
        return;
      }

      const messageId = channelPost.message_id;
      const text = channelPost.text || channelPost.caption || '';
      const chat = channelPost.chat || {};
      const channelTitle = chat.title || 'Telegram Channel';
      const channelUsername = chat.username ? `@${chat.username}` : '';

      if (!text) {
        res.json({ status: 'ignored', reason: 'No text or caption' });
        return;
      }

      // Fetch Bot Token from settings to resolve images
      const settingsDocRef = doc(firestoreDb, 'settings', 'telegram_config');
      const settingsSnap = await getDoc(settingsDocRef);
      let botToken = process.env.TELEGRAM_BOT_TOKEN || '';
      if (settingsSnap.exists()) {
        const data = settingsSnap.data();
        botToken = data.botToken || botToken;
      }

      const images: string[] = [];
      // If there's a photo array
      if (channelPost.photo && channelPost.photo.length > 0 && botToken) {
        // Take the largest photo size (last element)
        const largestPhoto = channelPost.photo[channelPost.photo.length - 1];
        const fileId = largestPhoto.file_id;
        const fileUrl = await getTelegramFileUrl(botToken, fileId);
        if (fileUrl) {
          images.push(fileUrl);
        }
      }

      const parsedProduct = await parseProductFromPost(text, images);
      parsedProduct.telegramPostId = messageId;
      parsedProduct.telegramChannel = channelUsername || channelTitle;
      parsedProduct.updatedAt = new Date().toISOString();

      // Find if we already have a product synced from this channel post ID to update it
      const productsRef = collection(firestoreDb, 'products');
      const q = query(productsRef, where('telegramPostId', '==', messageId));
      const querySnapshot = await getDocs(q);

      let savedId = '';
      if (!querySnapshot.empty) {
        // Update existing product
        const existingDoc = querySnapshot.docs[0];
        savedId = existingDoc.id;
        const existingProductRef = doc(firestoreDb, 'products', savedId);
        await setDoc(existingProductRef, parsedProduct, { merge: true });
      } else {
        // Add new product
        parsedProduct.createdAt = new Date().toISOString();
        const newDocRef = await addDoc(productsRef, parsedProduct);
        savedId = newDocRef.id;
      }

      res.json({
        status: 'success',
        productId: savedId,
        parsedProduct
      });
    } catch (err: any) {
      console.error('Error in webhook receiver:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Simulator Endpoint (allows developer / user to trigger channel post parser manually from Admin screen)
  app.post('/api/admin/simulate-webhook', authenticateAdmin, async (req, res) => {
    try {
      const { text, imageUrl, channelName } = req.body;
      const firestoreDb = getDb();

      const images = imageUrl ? [imageUrl] : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'];
      
      const parsedProduct = await parseProductFromPost(text, images);
      
      // Simulate unique messageId
      const simulatedMessageId = Math.floor(Math.random() * 100000);
      parsedProduct.telegramPostId = simulatedMessageId;
      parsedProduct.telegramChannel = channelName || '@SimulatedChannel';
      parsedProduct.createdAt = new Date().toISOString();
      parsedProduct.updatedAt = new Date().toISOString();

      // Add to products
      const productsRef = collection(firestoreDb, 'products');
      const docRef = await addDoc(productsRef, parsedProduct);

      // Log simulated webhook
      const logsRef = collection(firestoreDb, 'webhook_logs');
      await addDoc(logsRef, {
        payload: JSON.stringify({
          update_id: Math.floor(Math.random() * 100000000),
          channel_post: {
            message_id: simulatedMessageId,
            chat: {
              id: -1009999999,
              title: channelName || 'Simulated Channel',
              username: (channelName || '@SimulatedChannel').replace('@', ''),
              type: 'channel'
            },
            text,
            simulatedImage: imageUrl || undefined
          }
        }, null, 2),
        timestamp: new Date().toISOString(),
        type: 'simulated_webhook'
      });

      res.json({
        success: true,
        productId: docRef.id,
        parsedProduct
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });


  // ==================== STATIC FILES & VITE ====================

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
