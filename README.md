E-commerce backend (local JSON storage)

All main files attached and Zip folder of whole project is also attached (including nodemodules)

How to run:
1. unzip and cd into the folder
2. npm install
3. npm start
4. API runs on http://localhost:5000

Endpoints (examples):
- POST /api/auth/register    { name, email, password } -> { user, token }
- POST /api/auth/login       { email, password } -> { user, token }
- GET  /api/products
- GET  /api/products/:id
- POST /api/products         (admin) { title, price, description, image }
- GET  /api/shipping
- GET  /api/cart             (requires Bearer token)
- POST /api/cart             (requires Bearer) { productId, qty }
- PUT  /api/cart             (requires Bearer) { productId, qty }
- DELETE /api/cart/:productId (requires Bearer)
- POST /api/orders           (requires Bearer) { shipping, payment }
- GET  /api/orders           (requires Bearer)

Notes:
- Uses bcryptjs for hashing and jsonwebtoken for JWT.
- No lowdb or nanoid; uses Node's crypto.randomUUID and plain fs read/write to avoid ESM issues.
- Place your frontend files in the `public/` folder to serve them from the backend if you want.
