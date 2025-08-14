const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const { randomUUID } = require('crypto');

const DATA_FILE = path.join(__dirname, 'data', 'db.json');
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_to_a_strong_secret';

// ensure db exists
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ users: [], products: [], carts: [], orders: [], shipping: [] }, null, 2));
}

function readDB() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

function writeDB(db) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// seed shipping options and sample products if empty
const init = () => {
  const db = readDB();
  if (!db.shipping || db.shipping.length === 0) {
    db.shipping = [
      { code: 'PK', name: 'Pakistan', flag: '🇵🇰', cost: 5.00 },
      { code: 'US', name: 'United States', flag: '🇺🇸', cost: 15.00 },
      { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', cost: 12.00 }
    ];
  }
  if (!db.products || db.products.length === 0) {
    db.products = [
      { id: 'p1', title: 'Sample Product 1', price: 29.99, image: '/assets/sample1.jpg', description: 'Demo product 1' },
      { id: 'p2', title: 'Sample Product 2', price: 49.99, image: '/assets/sample2.jpg', description: 'Demo product 2' }
    ];
  }
  writeDB(db);
};
init();

// auth helper
function createToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Missing Authorization header' });
  const parts = header.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'Bad Authorization format' });
  const token = parts[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// --- Routes --- //

// Register
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });
  const db = readDB();
  if (db.users.find(u => u.email === email)) return res.status(400).json({ error: 'User already exists' });
  const hashed = await bcrypt.hash(password, 10);
  const user = { id: randomUUID(), name: name||'', email, password: hashed, createdAt: Date.now() };
  db.users.push(user);
  writeDB(db);
  const token = createToken(user);
  res.json({ user: { id: user.id, name: user.name, email: user.email }, token });
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const db = readDB();
  const user = db.users.find(u => u.email === email);
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(400).json({ error: 'Invalid credentials' });
  const token = createToken(user);
  res.json({ user: { id: user.id, name: user.name, email: user.email }, token });
});

// Get products
app.get('/api/products', (req, res) => {
  const db = readDB();
  res.json(db.products || []);
});

// Get single product
app.get('/api/products/:id', (req, res) => {
  const db = readDB();
  const p = (db.products||[]).find(x => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Not found' });
  res.json(p);
});

// Add product (admin) - simple, no auth required in this scaffold (you can add auth later)
app.post('/api/products', (req, res) => {
  const { title, price, description, image } = req.body;
  if (!title || !price) return res.status(400).json({ error: 'Missing title or price' });
  const db = readDB();
  const product = { id: randomUUID(), title, price: Number(price), description: description||'', image: image||'' };
  db.products.push(product);
  writeDB(db);
  res.json(product);
});

// Shipping options
app.get('/api/shipping', (req, res) => {
  const db = readDB();
  res.json(db.shipping || []);
});

// Cart endpoints (per-user)
app.get('/api/cart', authMiddleware, (req, res) => {
  const db = readDB();
  const cart = (db.carts||[]).find(c => c.userId === req.user.id) || { userId: req.user.id, items: [] };
  res.json(cart);
});

app.post('/api/cart', authMiddleware, (req, res) => {
  const { productId, qty } = req.body;
  if (!productId) return res.status(400).json({ error: 'Missing productId' });
  const db = readDB();
  db.carts = db.carts || [];
  let cart = db.carts.find(c => c.userId === req.user.id);
  if (!cart) { cart = { userId: req.user.id, items: [] }; db.carts.push(cart); }
  const item = cart.items.find(i => i.productId === productId);
  if (item) item.qty = (item.qty||0) + (Number(qty)||1);
  else cart.items.push({ productId, qty: Number(qty)||1 });
  writeDB(db);
  res.json(cart);
});

app.put('/api/cart', authMiddleware, (req, res) => {
  const { productId, qty } = req.body;
  const db = readDB();
  let cart = (db.carts||[]).find(c => c.userId === req.user.id);
  if (!cart) return res.status(404).json({ error: 'Cart not found' });
  const item = cart.items.find(i => i.productId === productId);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  item.qty = Number(qty)||0;
  cart.items = cart.items.filter(i => i.qty>0);
  writeDB(db);
  res.json(cart);
});

app.delete('/api/cart/:productId', authMiddleware, (req, res) => {
  const pid = req.params.productId;
  const db = readDB();
  let cart = (db.carts||[]).find(c => c.userId === req.user.id);
  if (!cart) return res.status(404).json({ error: 'Cart not found' });
  cart.items = cart.items.filter(i => i.productId !== pid);
  writeDB(db);
  res.json(cart);
});

// Orders
app.post('/api/orders', authMiddleware, (req, res) => {
  const { shipping, payment } = req.body;
  const db = readDB();
  const cart = (db.carts||[]).find(c => c.userId === req.user.id) || { items: [] };
  const order = { id: randomUUID(), userId: req.user.id, items: cart.items, shipping: shipping||{}, payment: payment||{}, status: 'created', createdAt: Date.now() };
  db.orders = db.orders || [];
  db.orders.push(order);
  // clear cart
  db.carts = (db.carts||[]).filter(c => c.userId !== req.user.id);
  writeDB(db);
  res.json(order);
});

app.get('/api/orders', authMiddleware, (req, res) => {
  const db = readDB();
  const orders = (db.orders||[]).filter(o => o.userId === req.user.id);
  res.json(orders);
});

// Simple health check
app.get('/api/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log('Ecom backend running on port', PORT);
});
