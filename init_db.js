/*
  init_db.js
  - Creates DB (if allowed), tables, and seed data.
  - Safe to run multiple times (idempotent).
*/

const pool = require('./db');
const mysql2 = require('mysql2/promise');

async function ensureDatabase() {
  const dbName = process.env.DB_NAME || 'restaurant_search';

  try {
    const tmp = await mysql2.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });

    await tmp.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await tmp.end();
  } catch (err) {
    console.warn('CREATE DATABASE not permitted on this provider (normal on Railway). Continuing...');
  }
}

async function createTables() {
  const restaurantsSQL = `
    CREATE TABLE IF NOT EXISTS restaurants (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      city VARCHAR(100) NOT NULL
    );
  `;

  const menuSQL = `
    CREATE TABLE IF NOT EXISTS menu_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      restaurant_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
    );
  `;

  const ordersSQL = `
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      restaurant_id INT NOT NULL,
      menu_item_id INT NOT NULL,
      order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
      FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
    );
  `;

  await pool.query(restaurantsSQL);
  await pool.query(menuSQL);
  await pool.query(ordersSQL);
}

async function seedRestaurantsAndMenu() {
  const restaurants = [
    ['Hyderabadi Spice House', 'Hyderabad'],
    ['Bombay Bites', 'Mumbai'],
    ['The Biryani Point', 'Hyderabad'],
    ['Kebab Corner', 'Delhi'],
    ['South Flavours', 'Bengaluru']
  ];

  for (const [name, city] of restaurants) {
    await pool.query(
      `INSERT INTO restaurants (name, city)
       SELECT ?, ? FROM DUAL
       WHERE NOT EXISTS (SELECT 1 FROM restaurants WHERE name = ? LIMIT 1)`,
      [name, city, name]
    );
  }

  const menu = [
    [1, 'Chicken Biryani', 220.00],
    [1, 'Mutton Biryani', 280.00],
    [2, 'Chicken Biryani', 260.00],
    [2, 'Veg Biryani', 150.00],
    [3, 'Chicken Biryani', 200.00],
    [3, 'Egg Biryani', 170.00],
    [4, 'Kebab Biryani', 300.00],
    [5, 'Hyderabadi Biryani', 240.00]
  ];

  for (const [restaurant_id, name, price] of menu) {
    await pool.query(
      `INSERT INTO menu_items (restaurant_id, name, price)
       SELECT ?, ?, ? FROM DUAL
       WHERE NOT EXISTS (
         SELECT 1 FROM menu_items WHERE restaurant_id = ? AND name = ? LIMIT 1
       )`,
      [restaurant_id, name, price, restaurant_id, name]
    );
  }
}

async function seedOrders() {
  const targets = [
    { restaurantId: 1, menuName: 'Chicken Biryani', desired: 96 },
    { restaurantId: 2, menuName: 'Chicken Biryani', desired: 60 },
    { restaurantId: 3, menuName: 'Chicken Biryani', desired: 40 }
  ];

  for (const t of targets) {
    const [menuRows] = await pool.query(
      `SELECT id FROM menu_items
       WHERE restaurant_id = ? AND name = ? LIMIT 1`,
      [t.restaurantId, t.menuName]
    );

    if (menuRows.length === 0) continue;

    const menuId = menuRows[0].id;

    const [[{ count }]] = await pool.query(
      `SELECT COUNT(*) AS count FROM orders
       WHERE restaurant_id = ? AND menu_item_id = ?`,
      [t.restaurantId, menuId]
    );

    const toInsert = t.desired - count;
    if (toInsert <= 0) continue;

    const chunkSize = 500;
    let remaining = toInsert;

    while (remaining > 0) {
      const chunk = Math.min(chunkSize, remaining);

      const values = new Array(chunk).fill('(?, ?)').join(',');
      const params = [];
      for (let i = 0; i < chunk; i++) params.push(t.restaurantId, menuId);

      await pool.query(`INSERT INTO orders (restaurant_id, menu_item_id) VALUES ${values}`, params);
      remaining -= chunk;
    }
  }
}

async function run() {
  try {
    await ensureDatabase();
    await createTables();
    await seedRestaurantsAndMenu();
    await seedOrders();
    console.log('DB initialization complete.');
  } catch (err) {
    console.error('DB initialization error:', err);
  }
}

module.exports = { run };
