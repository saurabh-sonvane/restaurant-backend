-- Create database
CREATE DATABASE IF NOT EXISTS restaurant_search;
USE restaurant_search;


-- Restaurants
CREATE TABLE IF NOT EXISTS restaurants (
id INT AUTO_INCREMENT PRIMARY KEY,
name VARCHAR(255) NOT NULL,
city VARCHAR(100) NOT NULL
);


-- Menu items
CREATE TABLE IF NOT EXISTS menu_items (
id INT AUTO_INCREMENT PRIMARY KEY,
restaurant_id INT NOT NULL,
name VARCHAR(255) NOT NULL,
price DECIMAL(10,2) NOT NULL,
FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);


-- Orders (1 item per order for simplicity)
CREATE TABLE IF NOT EXISTS orders (
id INT AUTO_INCREMENT PRIMARY KEY,
restaurant_id INT NOT NULL,
menu_item_id INT NOT NULL,
order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
);


-- Sample seed data
INSERT INTO restaurants (name, city) VALUES
('Hyderabadi Spice House', 'Hyderabad'),
('Bombay Bites', 'Mumbai'),
('The Biryani Point', 'Hyderabad'),
('Kebab Corner', 'Delhi'),
('South Flavours', 'Bengaluru');


INSERT INTO menu_items (restaurant_id, name, price) VALUES
(1, 'Chicken Biryani', 220.00),
(1, 'Mutton Biryani', 280.00),
(2, 'Chicken Biryani', 260.00),
(2, 'Veg Biryani', 150.00),
(3, 'Chicken Biryani', 200.00),
(3, 'Egg Biryani', 170.00),
(4, 'Kebab Biryani', 300.00),
(5, 'Hyderabadi Biryani', 240.00);



INSERT INTO orders (restaurant_id, menu_item_id)
SELECT 1, 1 FROM dual
LIMIT 96; 



SET @i = 1;
(1,2),(1,2),(1,2),(2,4),(3,6),(4,7),(5,8),(5,8),(5,8),(5,8);