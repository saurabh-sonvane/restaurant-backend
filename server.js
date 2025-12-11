const express = require('express');
const pool = require('./db');
const app = express();
const PORT = process.env.PORT || 3000;


app.use(express.json());


// Endpoint: /search/dishes?name=biryani&minPrice=150&maxPrice=300
app.get('/search/dishes', async (req, res) => {
try {
const name = req.query.name;
const minPrice = parseFloat(req.query.minPrice);
const maxPrice = parseFloat(req.query.maxPrice);


if (!name || isNaN(minPrice) || isNaN(maxPrice)) {
return res.status(400).json({ error: 'Missing required query params: name, minPrice, maxPrice' });
}


// Use case-insensitive match; menu item name should contain the search string
// Aggregate order counts per restaurant + menu_item


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


// Map to expected shape
const restaurants = rows.map(row => ({
restaurantId: row.restaurantId,
restaurantName: row.restaurantName,
city: row.city,
dishName: row.dishName,
dishPrice: parseFloat(row.dishPrice),
orderCount: parseInt(row.orderCount, 10)
}));


res.json({ restaurants });
} catch (err) {
console.error(err);
res.status(500).json({ error: 'Internal server error' });
}
});


app.listen(PORT, () => {
console.log(`Server listening on port ${PORT}`);
});