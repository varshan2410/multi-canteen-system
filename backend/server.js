const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const socketIo = require('socket.io');
const http = require('http');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:19006"],
    methods: ["GET", "POST"]
  }
});

// Environment variables
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'multi_canteen_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
};

// Initialize PostgreSQL connection
const db = new Pool(DB_CONFIG);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100
});
app.use('/api/', limiter);

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', (data) => {
    const { userId, role } = data;
    socket.join(`user_${userId}`);
    
    if (role === 'canteen_admin') {
      socket.join(`canteen_${data.canteenId}`);
    }
    
    console.log(`User ${userId} joined room`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Utility function to generate order number
const generateOrderNumber = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

// AUTH ROUTES
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, role = 'student' } = req.body;
    
    // Check if user already exists
    const existingUser = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert new user
    const result = await db.query(
      'INSERT INTO users (email, password, first_name, last_name, phone, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [email, hashedPassword, firstName, lastName, phone, role]
    );
    
    const user = result.rows[0];
    delete user.password;
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.status(201).json({ user, token });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    
    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    delete user.password;
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({ user, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// CANTEEN ROUTES
app.get('/api/canteens', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT c.*, u.first_name || ' ' || u.last_name as admin_name 
      FROM canteens c 
      LEFT JOIN users u ON c.admin_id = u.id 
      WHERE c.is_active = true 
      ORDER BY c.name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Fetch canteens error:', error);
    res.status(500).json({ error: 'Failed to fetch canteens' });
  }
});

app.get('/api/canteens/:id/menu', async (req, res) => {
  try {
    const canteenId = req.params.id;
    
    // Get categories with items
    const categoriesResult = await db.query(
      'SELECT * FROM menu_categories WHERE canteen_id = $1 AND is_active = true ORDER BY sort_order, name',
      [canteenId]
    );
    
    const categories = categoriesResult.rows;
    
    // Get menu items for each category
    for (let category of categories) {
      const itemsResult = await db.query(`
        SELECT mi.*, 
               COALESCE(AVG(r.rating), 0) as avg_rating,
               COUNT(r.id) as review_count
        FROM menu_items mi
        LEFT JOIN reviews r ON mi.id = r.menu_item_id AND r.is_approved = true
        WHERE mi.category_id = $1 AND mi.is_available = true
        GROUP BY mi.id
        ORDER BY mi.name
      `, [category.id]);
      
      category.items = itemsResult.rows;
    }
    
    res.json(categories);
  } catch (error) {
    console.error('Fetch menu error:', error);
    res.status(500).json({ error: 'Failed to fetch menu' });
  }
});

// ORDER ROUTES
app.post('/api/orders', authenticateToken, async (req, res) => {
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    
    const { canteenId, items, paymentMethod, specialInstructions } = req.body;
    const userId = req.user.userId;
    
    // Calculate total amount
    let totalAmount = 0;
    const orderItems = [];
    
    for (let item of items) {
      const menuItemResult = await client.query(
        'SELECT * FROM menu_items WHERE id = $1 AND is_available = true',
        [item.menuItemId]
      );
      
      if (menuItemResult.rows.length === 0) {
        throw new Error(`Menu item ${item.menuItemId} not available`);
      }
      
      const menuItem = menuItemResult.rows[0];
      const itemTotal = menuItem.price * item.quantity;
      totalAmount += itemTotal;
      
      orderItems.push({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        unitPrice: menuItem.price,
        totalPrice: itemTotal,
        specialRequests: item.specialRequests || null
      });
    }
    
    // Create order
    const orderNumber = generateOrderNumber();
    const estimatedTime = moment().add(30, 'minutes').toISOString();
    
    const orderResult = await client.query(`
      INSERT INTO orders (order_number, user_id, canteen_id, total_amount, payment_method, 
                         estimated_completion_time, special_instructions)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
    `, [orderNumber, userId, canteenId, totalAmount, paymentMethod, estimatedTime, specialInstructions]);
    
    const order = orderResult.rows[0];
    
    // Add order items
    for (let item of orderItems) {
      await client.query(`
        INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, total_price, special_requests)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [order.id, item.menuItemId, item.quantity, item.unitPrice, item.totalPrice, item.specialRequests]);
    }
    
    await client.query('COMMIT');
    
    // Emit real-time update to canteen admins
    io.to(`canteen_${canteenId}`).emit('new_order', {
      orderId: order.id,
      orderNumber: order.order_number,
      totalAmount: order.total_amount
    });
    
    res.status(201).json({ order });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create order error:', error);
    res.status(500).json({ error: error.message || 'Failed to create order' });
  } finally {
    client.release();
  }
});

app.get('/api/orders/my-orders', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const result = await db.query(`
      SELECT o.*, c.name as canteen_name,
             COUNT(oi.id) as item_count
      FROM orders o
      JOIN canteens c ON o.canteen_id = c.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = $1
      GROUP BY o.id, c.name
      ORDER BY o.created_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Fetch orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.get('/api/orders/:id', authenticateToken, async (req, res) => {
  try {
    const orderId = req.params.id;
    
    // Get order details
    const orderResult = await db.query(`
      SELECT o.*, c.name as canteen_name, c.location as canteen_location,
             u.first_name, u.last_name, u.phone
      FROM orders o
      JOIN canteens c ON o.canteen_id = c.id
      JOIN users u ON o.user_id = u.id
      WHERE o.id = $1
    `, [orderId]);
    
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const order = orderResult.rows[0];
    
    // Check authorization
    if (req.user.role === 'student' && order.user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Get order items
    const itemsResult = await db.query(`
      SELECT oi.*, mi.name as item_name, mi.image_url
      FROM order_items oi
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE oi.order_id = $1
      ORDER BY oi.id
    `, [orderId]);
    
    order.items = itemsResult.rows;
    
    res.json(order);
  } catch (error) {
    console.error('Fetch order error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Socket.IO server ready for connections');
});