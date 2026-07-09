# Local Vendor Marketplace

MERN-based hyperlocal marketplace MVP for nearby food and essential shops. Customers can browse approved local sellers, add products to a cart, share delivery location/address, place cash/offline orders, and cancel pending orders. Sellers manage their shop profile, business-specific products, delivery boy contacts, and order statuses. Admins approve shops, view marketplace data, suspend users, and manage categories.

## Stack

- Frontend: React, Vite, Tailwind CSS, Axios, React Router
- Mobile: React Native, Expo, React Navigation, AsyncStorage, Expo Location, Expo Image Picker
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
  customer-app/        Expo Android app for customer flow
    src/
      api/             Mobile Axios service layer
      components/      reusable React Native UI
      context/         auth and cart state
      navigation/      protected stacks and bottom tabs
      screens/         customer screens
  seller-app/          Expo Android app for seller flow
    src/
      api/             Mobile Axios service layer
      components/      reusable React Native UI
      context/         seller auth state
      navigation/      protected stacks and bottom tabs
      screens/         seller screens
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
cp customer-app/.env.example customer-app/.env
cp seller-app/.env.example seller-app/.env
```

3. Update `backend/.env` with MongoDB, JWT, and Cloudinary values. Cloudinary is only required when uploading product images.

4. For Android/Expo apps, update both mobile `.env` files:

```env
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:5000/api
```

Do not use `localhost` from a real Android phone. Use your laptop IP address, for example:

```env
EXPO_PUBLIC_API_URL=http://192.168.29.44:5000/api
```

5. Seed categories:

```bash
npm run seed
```

6. Optional: seed quick-start admin, sellers, customers, shops, and starter products:

```bash
npm run seed:setup
```

This creates:

- Admin: `admin@local.com` / `admin123`
- Restaurant seller: `restaurant.seller@local.test` / `Setup1234`
- Grocery seller: `grocery.seller@local.test` / `Setup1234`
- Dairy/Bakery seller: `dairy.seller@local.test` / `Setup1234`
- Customers:
  - `rahul.customer@local.test` / `Setup1234`
  - `priya.customer@local.test` / `Setup1234`
  - `imran.customer@local.test` / `Setup1234`
- Restaurant shop with 20 menu items
- Grocery / Kirana shop with 50 products
- Dairy and Bakery shop with starter fresh products

The setup seed is rerunnable. It upserts setup users and shops, then replaces only those setup shops' products.

7. Start web backend and frontend:

```bash
npm run dev
```

Frontend: `http://localhost:5173`

Backend: `http://localhost:5000/api`

8. Start the Android customer app:

```bash
npm run dev:customer-app
```

9. Start the Android seller app:

```bash
npm run dev:seller-app
```

Use Expo Go on Android to scan the QR code, or run:

```bash
npm run android:customer-app
npm run android:seller-app
```

Find your laptop IP on Windows:

```powershell
ipconfig
```

Use the IPv4 address of your active Wi-Fi/LAN adapter in `EXPO_PUBLIC_API_URL`. Example:

```env
EXPO_PUBLIC_API_URL=http://192.168.29.44:5000/api
```

## Local Flow

1. Customer:
   - Open `http://localhost:5173`
   - Browse shops and categories without logging in
   - View shop products
   - Login with a customer account before checkout
   - Add products from one shop to cart
   - Checkout with manual address or browser location
   - View the order confirmation page and order history

2. Seller:
   - Register or login as a seller
   - Create a shop profile
   - Configure Business Settings: working hours, temporary closure, and delivery rules
   - Add products for the selected business type
   - Open the Orders tab after a customer places an order
   - Accept/reject orders, update status, open Google Maps, or share to WhatsApp

3. Admin:
   - Login with `admin@local.com` / `admin123`
   - Approve/reject/suspend shops
   - View users, shops, orders, and categories
   - Filter shops and orders by category/status
   - Suspend or restore users

## Mobile Apps

Admin remains web-only. The mobile apps reuse the same backend APIs, JWT auth, validation rules, product fields, order statuses, delivery address rules, and seller business settings from the web app.

Customer Android app:

- Register/login as customer
- Browse Restaurant, Grocery / Kirana Store, Dairy and Bakery
- View open/nearby shops and products
- Add to cart and update quantities
- Checkout with manual address and optional GPS location through Expo Location
- Place order through `POST /api/orders`
- View order history and cancel pending orders
- Profile and logout

Seller Android app:

- Register/login as seller
- Create/edit shop profile and select business type
- Add/edit/delete products with business-specific fields
- Pick product images through Expo Image Picker and upload to existing Cloudinary-backed product API
- View orders, delivery address, and ordered items
- Update order status
- Open Google Maps links and share order details via WhatsApp Linking API
- Manage working hours, temporary closure, delivery settings, and delivery boys

Mobile auth behavior:

- JWT is stored in AsyncStorage.
- Axios request interceptors attach `Authorization: Bearer TOKEN`.
- Axios response interceptors clear the stored session on `401` and return the user to login.

Mobile checks:

```bash
npm run check:mobile
```

This exports Android bundles for both Expo apps and catches import/navigation/bundling errors.

## Admin User

Public registration allows `customer` and `seller` accounts only. For local setup, run `npm run seed:setup` to create `admin@local.com` / `admin123`.

## Shop Settings API

Seller-only routes:

```text
GET /api/shops/seller/settings
PATCH /api/shops/seller/settings
POST /api/shops/seller/logo
```

`PATCH` body:

```json
{
  "workingHours": [
    { "day": "Monday", "openTime": "09:00", "closeTime": "21:00", "closed": false }
  ],
  "temporaryClosure": {
    "enabled": false,
    "reason": "Holiday",
    "customReason": ""
  },
  "deliverySettings": {
    "radiusKm": 5,
    "minimumOrder": 100,
    "deliveryCharge": 20,
    "freeDeliveryAbove": 400,
    "estimatedDeliveryTime": "25 Minutes"
  }
}
```

Validation:

- `radiusKm` must be greater than `0`
- `minimumOrder`, `deliveryCharge`, and `freeDeliveryAbove` must be `0` or more
- `estimatedDeliveryTime` is required

Customer-facing shop APIs include computed fields:

- `openStatus`
- `distanceKm`
- `deliveryEligibility`

`POST /api/shops/seller/logo` accepts multipart form-data with a `logo` image file and returns:

```json
{
  "logoUrl": "https://res.cloudinary.com/.../image/upload/..."
}
```

The seller app uses this endpoint after Expo Image Picker selection, then saves the returned `logoUrl` on the existing shop profile.

## Useful Commands

```bash
npm run lint
npm run build
npm test
npm run check:mobile
```

Mobile start checks:

```bash
cd customer-app
npx expo start -c

cd ../seller-app
npx expo start -c
```

Known issues:

- Android device and backend must be on the same network for local IP testing.
- Product image and shop logo upload require Cloudinary env values in `backend/.env`.
- Expo dependency audit may show moderate warnings from the React Native toolchain; current bundle/export checks pass.

## MVP Boundaries

This version intentionally excludes payment gateway integration, live delivery tracking, delivery boy app, OTP delivery verification, multi-city logic, AI features, complex offers/coupons, and FCM push notifications.
