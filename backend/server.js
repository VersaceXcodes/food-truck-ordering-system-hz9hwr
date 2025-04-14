// server.mjs
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Pool } from 'pg';
import http from 'http';
import { Server } from 'socket.io';
import { randomUUID } from 'crypto';

// Postgres DB connection snippet as provided in the requirements
const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD, PORT, JWT_SECRET } = process.env;
const pool = new Pool({
  host: PGHOST || "ep-ancient-dream-abbsot9k-pooler.eu-west-2.aws.neon.tech",
  database: PGDATABASE || "neondb",
  username: PGUSER || "neondb_owner",
  password: PGPASSWORD || "npg_jAS3aITLC5DX",
  port: 5432,
  ssl: {
    require: true,
  },
});

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Middlewares
app.use(express.json());
app.use(cors());
app.use(morgan('combined'));

// Utility function: generate current unix timestamp in seconds
const currentTimestamp = () => Math.floor(Date.now() / 1000);

// Utility: JWT authentication middleware for Express
function authenticateToken(req, res, next) {
  // Get token from authorization header: "Bearer token"
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  jwt.verify(token, JWT_SECRET || "secret", (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
}

// Socket.io middleware for authentication
io.use((socket, next) => {
  const token = socket.handshake.query.token;
  if (!token) return next(new Error("Authentication error"));
  jwt.verify(token, JWT_SECRET || "secret", (err, user) => {
    if (err) return next(new Error("Authentication error"));
    socket.user = user;
    // Join room by user id to enable targeted events
    socket.join(`user_${user.id}`);
    next();
  });
});

// @@need:external-api: Simulate Payment Gateway transaction
// This function mocks an external payment gateway by returning a simulated transaction ID.
// In a production scenario, you could integrate with Stripe or another payment provider.
async function simulatePayment(paymentDetails) {
  // In a real implementation, you would integrate with a payment provider.
  return { transaction_id: "txn_" + randomUUID() };
}

// ---------------------
// Authentication Routes
// ---------------------

/*
  Register a new user.
  - Inserts a record into 'users' table with hashed password.
  - Generates and returns a JWT token along with user details.
*/
app.post('/api/auth/register', async (req, res) => {
  try {
    const { full_name, email, password, phone, role } = req.body;
    if (!full_name || !email || !password || !role) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const id = randomUUID();
    const hashedPassword = await bcrypt.hash(password, 10);
    const timestamp = currentTimestamp();
    const queryText = `
      INSERT INTO users (id, full_name, email, password_hash, phone, role, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
      RETURNING id, full_name, email, phone, role, created_at, updated_at
    `;
    const values = [id, full_name, email, hashedPassword, phone || null, role, timestamp];
    const result = await pool.query(queryText, values);
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET || "secret", { expiresIn: '1d' });
    return res.json({ success: true, user, token });
  } catch (err) {
    console.error("Registration error:", err);
    return res.status(400).json({ message: "Registration failed", error: err.message });
  }
});

/*
  Login an existing user.
  - Retrieves user by email, compares passwords, and returns a JWT token.
*/
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Missing email or password" });
    const queryText = `SELECT * FROM users WHERE email = $1`;
    const result = await pool.query(queryText, [email]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) return res.status(401).json({ message: "Invalid credentials" });
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET || "secret", { expiresIn: '1d' });
    // Remove password_hash from the response
    delete user.password_hash;
    return res.json({ success: true, user, token });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(400).json({ message: "Login failed", error: err.message });
  }
});

// ---------------------
// User Profile Routes
// ---------------------

/*
  Retrieve the authenticated user's profile.
  - Queries user info from 'users' and associated addresses from 'user_addresses'.
*/
app.get('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userResult = await pool.query(`SELECT id, full_name, email, phone, role, created_at, updated_at FROM users WHERE id = $1`, [userId]);
    if (userResult.rowCount === 0) return res.status(404).json({ message: "User not found" });
    const user = userResult.rows[0];
    const addressesResult = await pool.query(`SELECT id, address, city, state, zip_code, is_default, created_at, updated_at FROM user_addresses WHERE user_id = $1`, [userId]);
    user.addresses = addressesResult.rows;
    return res.json({ user });
  } catch (err) {
    console.error("Profile retrieval error:", err);
    return res.status(400).json({ message: "Error retrieving profile", error: err.message });
  }
});

/*
  Update the authenticated user's profile.
  - Updates 'users' and associated 'user_addresses' with new information.
*/
app.put('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { full_name, phone, addresses } = req.body;
    if (!full_name) return res.status(400).json({ message: "full_name is required" });
    const timestamp = currentTimestamp();
    // Update user record
    await pool.query(`UPDATE users SET full_name = $1, phone = $2, updated_at = $3 WHERE id = $4`, [full_name, phone || null, timestamp, userId]);
    
    // Process addresses update/insert
    if (addresses && Array.isArray(addresses)) {
      for (const addr of addresses) {
        if (addr.id) {
          // Update existing address
          await pool.query(
            `UPDATE user_addresses SET address = $1, city = $2, state = $3, zip_code = $4, is_default = $5, updated_at = $6 WHERE id = $7 AND user_id = $8`,
            [addr.address, addr.city, addr.state, addr.zip_code, addr.is_default, timestamp, addr.id, userId]
          );
        } else {
          // Insert new address
          const addrId = randomUUID();
          await pool.query(
            `INSERT INTO user_addresses (id, user_id, address, city, state, zip_code, is_default, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)`,
            [addrId, userId, addr.address, addr.city, addr.state, addr.zip_code, addr.is_default, timestamp]
          );
        }
      }
    }
    // Retrieve updated user profile
    const userResult = await pool.query(`SELECT id, full_name, email, phone, role, created_at, updated_at FROM users WHERE id = $1`, [userId]);
    const updatedUser = userResult.rows[0];
    const addressesResult = await pool.query(`SELECT id, address, city, state, zip_code, is_default, created_at, updated_at FROM user_addresses WHERE user_id = $1`, [userId]);
    updatedUser.addresses = addressesResult.rows;
    return res.json({ success: true, updated_user: updatedUser });
  } catch (err) {
    console.error("Profile update error:", err);
    return res.status(400).json({ message: "Error updating profile", error: err.message });
  }
});

// ----------------------------
// Food Truck Discovery Routes
// ----------------------------

/*
  List active food trucks with optional filters.
  - Retrieves records from 'food_trucks' where active = 'true'.
  - Applies search, cuisine_type, and location filters if provided.
*/
app.get('/api/foodtrucks', async (req, res) => {
  try {
    const { search, cuisine_type, location } = req.query;
    let queryText = `SELECT * FROM food_trucks WHERE active = 'true'`;
    const queryParams = [];
    if (search) {
      queryParams.push(`%${search}%`);
      queryText += ` AND (truck_name ILIKE $${queryParams.length} OR description ILIKE $${queryParams.length})`;
    }
    if (cuisine_type) {
      queryParams.push(cuisine_type);
      queryText += ` AND cuisine_type = $${queryParams.length}`;
    }
    if (location) {
      queryParams.push(location);
      queryText += ` AND location = $${queryParams.length}`;
    }
    const result = await pool.query(queryText, queryParams);
    return res.json({ food_trucks: result.rows });
  } catch (err) {
    console.error("Food truck listing error:", err);
    return res.status(400).json({ message: "Error retrieving food trucks", error: err.message });
  }
});

/*
  Get details of a specific food truck including its menu items.
  - Retrieves food truck from 'food_trucks' table.
  - Retrieves associated menu items from 'menu_items' table.
*/
app.get('/api/foodtrucks/:id', async (req, res) => {
  try {
    const truckId = req.params.id;
    const truckResult = await pool.query(`SELECT * FROM food_trucks WHERE id = $1`, [truckId]);
    if (truckResult.rowCount === 0) return res.status(404).json({ message: "Food truck not found" });
    const food_truck = truckResult.rows[0];
    const menuResult = await pool.query(`SELECT * FROM menu_items WHERE food_truck_id = $1`, [truckId]);
    food_truck.menu_items = menuResult.rows;
    return res.json({ food_truck });
  } catch (err) {
    console.error("Food truck detail error:", err);
    return res.status(400).json({ message: "Error retrieving food truck details", error: err.message });
  }
});

// ----------------------------
// Menu Item CRUD Routes (Operator)
// ----------------------------

/*
  Create a new menu item. (Operator only)
  - Inserts a record into 'menu_items' table.
*/
app.post('/api/menu-items', authenticateToken, async (req, res) => {
  try {
    // Only operators are allowed to create menu items
    if (req.user.role !== 'operator') {
      return res.status(403).json({ message: "Access denied" });
    }
    const { food_truck_id, title, description, price, category, image_url, modifiers, is_sold_out } = req.body;
    if (!food_truck_id || !title || price === undefined || !category || !is_sold_out) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const id = randomUUID();
    const timestamp = currentTimestamp();
    const queryText = `
      INSERT INTO menu_items (id, food_truck_id, title, description, price, category, image_url, modifiers, is_sold_out, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10)
      RETURNING *
    `;
    const values = [id, food_truck_id, title, description || '', price, category, image_url || '', modifiers || '', is_sold_out, timestamp];
    const result = await pool.query(queryText, values);
    return res.json({ success: true, menu_item: result.rows[0] });
  } catch (err) {
    console.error("Create menu item error:", err);
    return res.status(400).json({ message: "Error creating menu item", error: err.message });
  }
});

/*
  List menu items for a specific food truck.
*/
app.get('/api/menu-items', async (req, res) => {
  try {
    const { food_truck_id } = req.query;
    if (!food_truck_id) return res.status(400).json({ message: "food_truck_id is required" });
    const result = await pool.query(`SELECT * FROM menu_items WHERE food_truck_id = $1`, [food_truck_id]);
    return res.json({ menu_items: result.rows });
  } catch (err) {
    console.error("List menu items error:", err);
    return res.status(400).json({ message: "Error retrieving menu items", error: err.message });
  }
});

/*
  Update an existing menu item.
*/
app.put('/api/menu-items/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'operator') {
      return res.status(403).json({ message: "Access denied" });
    }
    const menuItemId = req.params.id;
    const { food_truck_id, title, description, price, category, image_url, modifiers, is_sold_out } = req.body;
    const timestamp = currentTimestamp();
    const queryText = `
      UPDATE menu_items SET food_truck_id = $1, title = $2, description = $3, price = $4, category = $5,
      image_url = $6, modifiers = $7, is_sold_out = $8, updated_at = $9
      WHERE id = $10 RETURNING *
    `;
    const values = [food_truck_id, title, description || '', price, category, image_url || '', modifiers || '', is_sold_out, timestamp, menuItemId];
    const result = await pool.query(queryText, values);
    if (result.rowCount === 0) return res.status(404).json({ message: "Menu item not found" });
    return res.json({ success: true, menu_item: result.rows[0] });
  } catch (err) {
    console.error("Update menu item error:", err);
    return res.status(400).json({ message: "Error updating menu item", error: err.message });
  }
});

/*
  Delete a menu item.
*/
app.delete('/api/menu-items/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'operator') {
      return res.status(403).json({ message: "Access denied" });
    }
    const menuItemId = req.params.id;
    const result = await pool.query(`DELETE FROM menu_items WHERE id = $1`, [menuItemId]);
    if (result.rowCount === 0) return res.status(404).json({ message: "Menu item not found" });
    return res.json({ success: true });
  } catch (err) {
    console.error("Delete menu item error:", err);
    return res.status(400).json({ message: "Error deleting menu item", error: err.message });
  }
});

// ----------------------------
// Order Routes
// ----------------------------

/*
  Place a new order.
  - Inserts into 'orders' and 'order_items' tables.
  - For online payments, uses a simulated payment gateway.
  - Inserts an initial entry into 'order_status_history'.
  - Emits a new_order_notification event to the operator.
*/
app.post('/api/orders', authenticateToken, async (req, res) => {
  try {
    // Only customers can place orders
    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: "Only customers can place orders" });
    }
    const { food_truck_id, payment_method, total_amount, cart_items } = req.body;
    if (!food_truck_id || !payment_method || total_amount === undefined || !Array.isArray(cart_items) || cart_items.length === 0) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const orderId = randomUUID();
    const timestamp = currentTimestamp();
    let payment_details = "";
    if (payment_method === 'online') {
      // Simulated payment gateway call
      const paymentResult = await simulatePayment({ amount: total_amount });
      payment_details = JSON.stringify(paymentResult);
    }
    // Insert order record
    const orderQuery = `
      INSERT INTO orders (id, customer_id, food_truck_id, order_status, payment_method, total_amount, payment_details, created_at, updated_at)
      VALUES ($1, $2, $3, 'pending', $4, $5, $6, $7, $7)
      RETURNING *
    `;
    const orderValues = [orderId, req.user.id, food_truck_id, payment_method, total_amount, payment_details, timestamp];
    const orderResult = await pool.query(orderQuery, orderValues);
    const order = orderResult.rows[0];
    // Process each cart item and insert into order_items table
    for (const item of cart_items) {
      // Retrieve current price from menu_items table
      const menuItemResult = await pool.query(`SELECT price FROM menu_items WHERE id = $1`, [item.menu_item_id]);
      if (menuItemResult.rowCount === 0) continue;
      const price_at_time = menuItemResult.rows[0].price;
      const subtotal = price_at_time * item.quantity;
      const orderItemId = randomUUID();
      const orderItemQuery = `
        INSERT INTO order_items (id, order_id, menu_item_id, quantity, customizations, price_at_time, subtotal)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;
      const orderItemValues = [orderItemId, orderId, item.menu_item_id, item.quantity, item.customizations || '', price_at_time, subtotal];
      await pool.query(orderItemQuery, orderItemValues);
    }
    // Insert initial order status history record
    const historyId = randomUUID();
    await pool.query(
      `INSERT INTO order_status_history (id, order_id, status, changed_at)
       VALUES ($1, $2, 'pending', $3)`,
      [historyId, orderId, timestamp]
    );
    // Emit new_order_notification event to the operator of the food truck
    const ftResult = await pool.query(`SELECT operator_id FROM food_trucks WHERE id = $1`, [food_truck_id]);
    if (ftResult.rowCount > 0) {
      const operatorId = ftResult.rows[0].operator_id;
      io.to(`user_${operatorId}`).emit('new_order_notification', {
        order_id: orderId,
        customer_id: req.user.id,
        food_truck_id,
        order_status: "pending",
        created_at: timestamp
      });
    }
    // Retrieve order items to include in the order response
    const orderItemsResult = await pool.query(`SELECT * FROM order_items WHERE order_id = $1`, [orderId]);
    order.order_items = orderItemsResult.rows;
    return res.json({ success: true, order });
  } catch (err) {
    console.error("Place order error:", err);
    return res.status(400).json({ message: "Error placing order", error: err.message });
  }
});

/*
  Retrieve orders for the authenticated user.
  - For customers: returns orders by customer_id.
  - For operators: returns orders for food trucks they operate.
*/
app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    let ordersResult;
    if (req.user.role === 'customer') {
      ordersResult = await pool.query(`SELECT * FROM orders WHERE customer_id = $1 ORDER BY created_at DESC`, [req.user.id]);
    } else if (req.user.role === 'operator') {
      // Retrieve orders for food trucks operated by the user
      ordersResult = await pool.query(`
        SELECT o.* FROM orders o
        JOIN food_trucks ft ON o.food_truck_id = ft.id
        WHERE ft.operator_id = $1 ORDER BY o.created_at DESC
      `, [req.user.id]);
    } else {
      ordersResult = { rows: [] };
    }
    // For each order, retrieve order items.
    for (let order of ordersResult.rows) {
      const oiResult = await pool.query(`SELECT * FROM order_items WHERE order_id = $1`, [order.id]);
      order.order_items = oiResult.rows;
    }
    return res.json({ orders: ordersResult.rows });
  } catch (err) {
    console.error("List orders error:", err);
    return res.status(400).json({ message: "Error retrieving orders", error: err.message });
  }
});

/*
  Update order status (operator only).
  - Updates 'orders' table and logs the change in 'order_status_history'.
  - Emits an order_status_update event to the customer.
*/
app.patch('/api/orders/:id/status', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'operator') {
      return res.status(403).json({ message: "Access denied" });
    }
    const orderId = req.params.id;
    const { order_status } = req.body;
    if (!order_status) return res.status(400).json({ message: "order_status is required" });
    const timestamp = currentTimestamp();
    // Update order status
    const updateResult = await pool.query(
      `UPDATE orders SET order_status = $1, updated_at = $2 WHERE id = $3 RETURNING *`,
      [order_status, timestamp, orderId]
    );
    if (updateResult.rowCount === 0) return res.status(404).json({ message: "Order not found" });
    const order = updateResult.rows[0];
    // Insert status history record
    const historyId = randomUUID();
    await pool.query(
      `INSERT INTO order_status_history (id, order_id, status, changed_at)
       VALUES ($1, $2, $3, $4)`,
      [historyId, orderId, order_status, timestamp]
    );
    // Emit order_status_update event to the customer who placed the order
    io.to(`user_${order.customer_id}`).emit('order_status_update', {
      order_id: orderId,
      new_status: order_status,
      changed_at: timestamp
    });
    // Retrieve order items to include full order details in the response
    const oiResult = await pool.query(`SELECT * FROM order_items WHERE order_id = $1`, [orderId]);
    order.order_items = oiResult.rows;
    return res.json({ success: true, order });
  } catch (err) {
    console.error("Update order status error:", err);
    return res.status(400).json({ message: "Error updating order status", error: err.message });
  }
});

// ----------------------------
// Reviews Route
// ----------------------------

/*
  Submit a review for a completed order.
  - Validates that the order is completed.
  - Inserts into 'reviews' table.
*/
app.post('/api/reviews', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: "Only customers can submit reviews" });
    }
    const { order_id, food_truck_id, rating, review_text } = req.body;
    if (!order_id || !food_truck_id || rating === undefined) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    // Validate that the order is completed
    const orderResult = await pool.query(`SELECT order_status FROM orders WHERE id = $1`, [order_id]);
    if (orderResult.rowCount === 0) return res.status(404).json({ message: "Order not found" });
    if (orderResult.rows[0].order_status !== 'completed') {
      return res.status(400).json({ message: "Review can only be submitted for completed orders" });
    }
    const reviewId = randomUUID();
    const timestamp = currentTimestamp();
    const insertQuery = `
      INSERT INTO reviews (id, order_id, customer_id, food_truck_id, rating, review_text, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [reviewId, order_id, req.user.id, food_truck_id, rating, review_text || '', timestamp];
    const result = await pool.query(insertQuery, values);
    return res.json({ success: true, review: result.rows[0] });
  } catch (err) {
    console.error("Submit review error:", err);
    return res.status(400).json({ message: "Error submitting review", error: err.message });
  }
});

// ----------------------------
// Notifications Route
// ----------------------------

/*
  Retrieve notifications for the authenticated user.
  - Optionally filters by is_read status.
*/
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const { is_read } = req.query;
    let queryText = `SELECT * FROM notifications WHERE user_id = $1`;
    const queryParams = [req.user.id];
    if (is_read === 'true' || is_read === 'false') {
      queryParams.push(is_read);
      queryText += ` AND is_read = $${queryParams.length}`;
    }
    const result = await pool.query(queryText, queryParams);
    return res.json({ notifications: result.rows });
  } catch (err) {
    console.error("Retrieve notifications error:", err);
    return res.status(400).json({ message: "Error retrieving notifications", error: err.message });
  }
});

// ----------------------------
// Socket.io: Notification Read Event
// ----------------------------
io.on('connection', (socket) => {
  socket.on('notification_read', async (data) => {
    try {
      const { notification_id, is_read } = data;
      if (is_read !== "true") return; // Only process if marked as read
      await pool.query(`UPDATE notifications SET is_read = 'true' WHERE id = $1`, [notification_id]);
      socket.emit('notification_update_ack', { ack: "Notification updated" });
    } catch (err) {
      console.error("Notification read event error:", err);
      socket.emit('notification_update_ack', { ack: "Error updating notification" });
    }
  });
});

// ----------------------------
// Start Server
// ----------------------------
const port = PORT || 1337;
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});