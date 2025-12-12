// server.js
const express = require('express');
const pool = require('./db');
const init = require('./init_db');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

/**
 * GET /search/dishes
 * Query params: name (required), minPrice (required), maxPrice (required)
 */
app.get('/search/dishes', async (req, res) => {
  try {
    const name = req.query.name;
    const minPrice = parseFloat(req.query.minPrice);
    const maxPrice = parseFloat(req.query.maxPrice);

    if (!name || Number.isNaN(minPrice) || Number.isNaN(maxPrice)) {
      return res.status(400).json({
        error: 'Missing or invalid required query params: name, minPrice, maxPrice'
      });
    }

    const sql = `
      SELECT
        r.id AS restaurantId,
        r.name AS restaurantName,
        r.city,
        mi.id AS menuItemId,
        mi.name AS dishName,
        mi.price AS dishPrice,
        COUNT(o.id) AS orderCount
      FROM menu_items mi
      JOIN restaurants r ON mi.restaurant_id = r.id
      LEFT JOIN orders o ON o.menu_item_id = mi.id
      WHERE LOWER(mi.name) LIKE CONCAT('%', LOWER(?), '%')
        AND mi.price BETWEEN ? AND ?
      GROUP BY r.id, mi.id
      ORDER BY orderCount DESC
      LIMIT 10;
    `;

    const [rows] = await pool.query(sql, [name, minPrice, maxPrice]);

    res.json({
      restaurants: rows.map(x => ({
        restaurantId: x.restaurantId,
        restaurantName: x.restaurantName,
        city: x.city,
        menuItemId: x.menuItemId,
        dishName: x.dishName,
        dishPrice: parseFloat(x.dishPrice),
        orderCount: parseInt(x.orderCount, 10)
      }))
    });
  } catch (err) {
    console.error('Error in GET /search/dishes:', err && err.stack ? err.stack : err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /restaurants
 * Optional query: city
 */
app.get('/restaurants', async (req, res) => {
  try {
    const city = req.query.city;
    let sql = `SELECT id AS restaurantId, name, city FROM restaurants`;
    const params = [];
    if (city) {
      sql += ` WHERE LOWER(city) = LOWER(?)`;
      params.push(city);
    }
    const [rows] = await pool.query(sql, params);
    res.json({ restaurants: rows });
  } catch (err) {
    console.error('Error in GET /restaurants:', err && err.stack ? err.stack : err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /restaurants/:id/menu
 */
app.get('/restaurants/:id/menu', async (req, res) => {
  try {
    const restaurantId = parseInt(req.params.id, 10);
    if (Number.isNaN(restaurantId)) {
      return res.status(400).json({ error: 'Invalid restaurant id' });
    }

    const sql = `SELECT id AS menuItemId, restaurant_id AS restaurantId, name, price FROM menu_items WHERE restaurant_id = ?`;
    const [rows] = await pool.query(sql, [restaurantId]);
    res.json({ menu: rows });
  } catch (err) {
    console.error('Error in GET /restaurants/:id/menu:', err && err.stack ? err.stack : err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /orders
 * Body: { restaurant_id: number, menu_item_id: number }
 */
app.post('/orders', async (req, res) => {
  try {
    const { restaurant_id, menu_item_id } = req.body;
    const rId = parseInt(restaurant_id, 10);
    const mId = parseInt(menu_item_id, 10);

    if (Number.isNaN(rId) || Number.isNaN(mId)) {
      return res.status(400).json({ error: 'restaurant_id and menu_item_id are required and must be numbers' });
    }

    const insertSql = `INSERT INTO orders (restaurant_id, menu_item_id) VALUES (?, ?)`;
    const [result] = await pool.query(insertSql, [rId, mId]);

    res.status(201).json({
      message: 'Order created successfully',
      orderId: result.insertId || null
    });
  } catch (err) {
    console.error('Error in POST /orders:', err && err.stack ? err.stack : err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /orders
 * Optional query: limit
 */
app.get('/orders', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 100;
    const [rows] = await pool.query(
      `SELECT o.id AS orderId, o.order_date AS orderDate, r.id AS restaurantId, r.name AS restaurantName,
              mi.id AS menuItemId, mi.name AS menuName, mi.price AS price
       FROM orders o
       JOIN restaurants r ON o.restaurant_id = r.id
       JOIN menu_items mi ON o.menu_item_id = mi.id
       ORDER BY o.order_date DESC
       LIMIT ?`,
      [limit]
    );

    res.json({ orders: rows });
  } catch (err) {
    console.error('Error in GET /orders:', err && err.stack ? err.stack : err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /orders/stats
 * Optional: menuName to filter by menu item name
 */
app.get('/orders/stats', async (req, res) => {
  try {
    const menuName = req.query.menuName;
    let sql = `
      SELECT
        r.id AS restaurantId,
        r.name AS restaurantName,
        mi.name AS menuName,
        COUNT(o.id) AS orderCount
      FROM orders o
      JOIN restaurants r ON o.restaurant_id = r.id
      JOIN menu_items mi ON o.menu_item_id = mi.id
    `;
    const params = [];

    if (menuName) {
      sql += ` WHERE LOWER(mi.name) = LOWER(?) `;
      params.push(menuName);
    }

    sql += ` GROUP BY r.id, mi.id ORDER BY orderCount DESC;`;

    const [rows] = await pool.query(sql, params);

    res.json({
      stats: rows.map(r => ({
        restaurantId: r.restaurantId,
        restaurantName: r.restaurantName,
        menuName: r.menuName,
        orderCount: parseInt(r.orderCount, 10)
      }))
    });
  } catch (err) {
    console.error('Error in GET /orders/stats:', err && err.stack ? err.stack : err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server — attempt DB initialization first, but don't crash server permanently if init has issues.
(async () => {
  try {
    console.log('Running DB initializer (init.run)...');
    await init.run();
    console.log('DB initializer finished.');
  } catch (err) {
    // Log error but continue to start server so you can debug endpoints (and still connect if DB is reachable later).
    console.error('DB init encountered an error (server will still start):', err && err.stack ? err.stack : err);
  } finally {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  }
})();
