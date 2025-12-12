
const pool = require('./db');


async function seed() {
try {

const inserts = [];

for (let i = 0; i < 96; i++) inserts.push([1,1]);

for (let i = 0; i < 60; i++) inserts.push([2,3]);

for (let i = 0; i < 40; i++) inserts.push([3,5]);


for (const [restaurant_id, menu_item_id] of inserts) {
await pool.query('INSERT INTO orders (restaurant_id, menu_item_id) VALUES (?,?)', [restaurant_id, menu_item_id]);
}


console.log('Seed completed');
process.exit(0);
} catch (err) {
console.error('Seed error', err);
process.exit(1);
}
}


seed();