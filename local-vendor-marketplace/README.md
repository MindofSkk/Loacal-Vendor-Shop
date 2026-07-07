# Local Vendor Marketplace

MERN-based hyperlocal marketplace MVP for nearby food and essential shops. Customers can browse approved local sellers, add products to a cart, share delivery location/address, place cash/offline orders, and cancel pending orders. Sellers manage their shop profile, business-specific products, delivery boy contacts, and order statuses. Admins approve shops, view marketplace data, suspend users, and manage categories.

## Stack

- Frontend: React, Vite, Tailwind CSS, Axios, React Router
- Backend: Node.js, Express, MongoDB, Mongoose
- Auth: JWT with role-based access control
- Uploads: Cloudinary through multipart image upload
- Notifications: basic in-app notification documents

## MVP Scope

The MVP is limited to three seller business types:

- Restaurant
- Grocery / Kirana Store
- Dairy and Bakery

Seed data only keeps these categories active. Running `npm run seed` also disables older unrelated categories.

Seller product fields change by business type:

- Restaurant: item name, description, price, veg/non-veg, food category, availability
- Grocery / Kirana Store: product name, brand, pack size, price, stock quantity, grocery category
- Dairy and Bakery: product name, dairy/bakery type, pack size, price, fresh stock today, availability

Checkout asks for browser location permission. If allowed, latitude and longitude are saved and converted to a Google Maps URL. If denied, customers can still place the order with manual full address, landmark, and phone number.

## Project Structure

```text
local-vendor-marketplace/
  backend/
    src/
      config/          MongoDB and Cloudinary config
      controllers/     REST controller logic
      data/            seed data
      middleware/      auth, validation, upload, error handling
      models/          Mongoose schemas
      routes/          Express routes
      utils/           shared helpers
      validators/      express-validator rules
    scripts/           seed and syntax scripts
    tests/             node:test smoke tests
  frontend/
    src/
      api/             Axios client and service layer
      components/      shared UI components
      context/         auth and cart state
      pages/           customer, seller, admin, auth pages
```

## Setup

1. Install dependencies:

```bash
npm install
npm run install:all
```

2. Create environment files:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

3. Update `backend/.env` with MongoDB, JWT, and Cloudinary values. Cloudinary is only required when uploading product images.

4. Seed categories:

```bash
npm run seed
```

5. Start both apps:

```bash
npm run dev
```

Frontend: `http://localhost:5173`

Backend: `http://localhost:5000/api`

## Admin User

Public registration allows `customer` and `seller` accounts only. Create the first admin directly in MongoDB or by a one-off script using the `User` model with `role: "admin"`.

## Useful Commands

```bash
npm run lint
npm run build
npm test
```

## MVP Boundaries

This version intentionally excludes payment gateway integration, live delivery tracking, delivery boy app, OTP delivery verification, multi-city logic, AI features, complex offers/coupons, and FCM push notifications.
