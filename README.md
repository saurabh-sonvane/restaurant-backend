### Deployed URL : https://restaurant-backend-convertcart.up.railway.app

# 🍽️ Restaurant Search Backend – Node.js + Express + MySQL (Railway Deployment)

This project is a backend service built with Node.js, Express.js, and MySQL (hosted on Railway).
It provides powerful APIs to:

🔍 Search dishes across restaurants using name + price filters

🍽️ Retrieve restaurant lists and their menus

🧾 Create and fetch customer orders

📊 View order statistics

It includes full database initialization with pre-seeded data, and is fully compatible with Railway’s managed MySQL service for easy deployment.

## 📘 API Endpoint Table

| **Method** | **Endpoint**                                                                                                 | **Description**                           | **Body (if applicable)**                          |
| ---------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------- | ------------------------------------------------- |
| **GET**    | `https://restaurant-backend-convertcart.up.railway.app/health`                                               | Health check                              | —                                                 |
| **GET**    | `https://restaurant-backend-convertcart.up.railway.app/search/dishes?name=biryani&minPrice=100&maxPrice=300` | Search dishes by name and price range     | —                                                 |
| **GET**    | `https://restaurant-backend-convertcart.up.railway.app/restaurants`                                          | Get all restaurants                       | —                                                 |
| **GET**    | `https://restaurant-backend-convertcart.up.railway.app/restaurants?city=Hyderabad`                           | Filter restaurants by city                | —                                                 |
| **GET**    | `https://restaurant-backend-convertcart.up.railway.app/restaurants/1/menu`                                   | Get menu items for a specific restaurant  | —                                                 |
| **POST**   | `https://restaurant-backend-convertcart.up.railway.app/orders`                                               | Create a new order                        | `json { "restaurant_id": 1, "menu_item_id": 3 } ` |
| **GET**    | `https://restaurant-backend-convertcart.up.railway.app/orders`                                               | List all orders                           | —                                                 |
| **GET**    | `https://restaurant-backend-convertcart.up.railway.app/orders?limit=20`                                      | List limited number of orders             | —                                                 |
| **GET**    | `https://restaurant-backend-convertcart.up.railway.app/orders/stats`                                         | View order statistics (all menus)         | —                                                 |
| **GET**    | `https://restaurant-backend-convertcart.up.railway.app/orders/stats?menuName=Chicken%20Biryani`              | View order stats for a specific menu item | —                                                 |


## Key files:

server.js — Express app + routes

db.js — MySQL pool configuration

init_db.js — Creates tables + seeds data (idempotent)

package.json — scripts and dependencies


## Requirements

Node.js (v16+ recommended)

npm (or yarn)

MySQL server (local) or managed MySQL (Railway)

Railway account for backend + database deployment


## Setup (local)

1. Clone repo:

```sh
git clone https://github.com/saurabh-sonvane/restaurant-backend.git
cd restaurant-backend
```

2. Install dependencies:

```sh
npm install
```

3. Create a .env file in the project root.
4. Initialize the database:
Creates tables and seeds initial data:

```sh
node init_db.js
```

5. Start the server:

```sh
node server.js
# or
npm start
# or (recommended during development)
npm run dev
```
Server runs by default on http://localhost:3000
 (or the PORT you set).

---

## Environment variables

Create a .env file or set these variables on Railway.
The backend accepts both full URL and separate fields.

```sh
# Option A: Full MySQL connection URL (Railway provides this)
MYSQL_URL=mysql://user:password@host:port/database

# Option B: Individual fields
MYSQLHOST=localhost
MYSQLPORT=3306
MYSQLUSER=root
MYSQLPASSWORD=
MYSQLDATABASE=restaurant_search

# Backward / alternate naming supported
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=restaurant_search

# App port
PORT=3000
```
Use either MYSQL_URL OR the separate MYSQL* variables.

---

Database initialization
Run:

```sh
node init_db.js
```

The initializer will:

Attempt CREATE DATABASE IF NOT EXISTS (if permitted)

Create tables: restaurants, menu_items, orders

Seed:

- Restaurant names

- Biryani-related menu items

- Order counts to simulate real data

Important:
init_db.js does NOT close the shared MySQL pool; this ensures the running server can continue using it.
Do not call pool.end() inside init scripts.

---

## Run locally

```sh
node init_db.js
node server.js
```

## Verify server running:

```sh
http://localhost:3000/health
```

---

## Deployment (Railway)
Steps:

1. Push your project to GitHub.

2. Create new Railway project → Deploy from GitHub repo.

3.  Add MySQL Plugin (Railway-managed database).

Railway automatically injects:

- MYSQL_URL

- MYSQLHOST

- MYSQLUSER

- MYSQLPASSWORD

- MYSQLDATABASE

- MYSQLPORT

Deploy the backend service.

Get your public backend URL from Railway → Settings → Domains.

Examples:

```sh
https://<random-subdomain>.up.railway.app
```
Use this as your BASE_URL in Postman and your frontend.

---

## API Endpoints (list + examples)

Base URL:
```sh
https://<random-subdomain>.up.railway.app
```
1. Health Check

GET /health

Purpose: Confirm server is running.

Example:
```sh
curl https://<your-railway-domain>/health
```

2. Search dishes

GET /search/dishes

Required query params:

- name

- minPrice

- maxPrice

Example:
```sh
GET https://<your-railway-domain>/search/dishes?name=biryani&minPrice=100&maxPrice=300
```
Returns top restaurants by order count.

3. List restaurants

GET /restaurants

Optional:

- city (case-insensitive)

Examples:
```sh
GET /restaurants
GET /restaurants?city=Hyderabad
```

4. Get menu for a restaurant

GET /restaurants/:id/menu

Example:
```sh
GET /restaurants/1/menu
```

5. Create an order

POST /orders

Headers:
```sh
Content-Type: application/json
```

Body:
```sh
{
  "restaurant_id": 1,
  "menu_item_id": 3
}
```

6. List orders

GET /orders

Optional query:

- limit (default 100)

Examples:
```sh
GET /orders
GET /orders?limit=50
```

7. Order statistics

GET /orders/stats

Optional:

- menuName

Examples:
```sh
GET /orders/stats
GET /orders/stats?menuName=Chicken%20Biryani
```
