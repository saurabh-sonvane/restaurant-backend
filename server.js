const express = require('express');
const pool = require('./db');
const init = require('./init_db');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Search endpoint
app.get('/search/dishes', async (req, res) => {
  try {
    const name = req.query.name;
    const minPrice = parseFloat(req.query.minPrice);
    const maxPrice = parseFloat(req.query.maxPrice);

    if (!name || isNaN(minPrice) || isNaN(maxPrice)) {
      return res.status(400).json({
        error: 'Missing required query params: name, minPrice, maxPrice'
      });
    }

    const sql = `
      SELECT
        r.id AS restaurantId,
        r.name AS restaurantName,
        r.city,
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
        dishName: x.dishName,
        dishPrice: parseFloat(x.dishPrice),
        orderCount: parseInt(x.orderCount, 10)
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start AFTER DB initialization
(async () => {
  try {
    await init.run();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("DB init failed. Server not started.");
    process.exit(1);
  }
})();
