# Local Vendor Marketplace

MERN-based hyperlocal marketplace MVP for nearby food and essential shops. Customers can browse approved local sellers, add products to a cart, share delivery location/address, place cash/offline orders, and cancel pending orders. Sellers manage their shop profile, business-specific products, delivery boy contacts, and order statuses. Admins approve shops, view marketplace data, suspend users, and manage categories.

## Stack

- Frontend: React, Vite, Tailwind CSS, Axios, React Router
- Mobile: React Native, Expo, React Navigation, AsyncStorage, Expo Location, Expo Image Picker
- Backend: Node.js, Express, MongoDB, Mongoose
- Auth: JWT with role-based access control
- Uploads: Cloudinary through multipart image upload
- Notifications: in-app notification center plus Expo push notifications

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

4. For Android/Expo apps, update both mobile `.env` files.

For production-like APK testing with the deployed Render backend:

```env
EXPO_PUBLIC_API_URL=https://loacal-vendor-shop.onrender.com/api
EXPO_PUBLIC_EAS_PROJECT_ID=your-eas-project-id
```

For local development only, use your laptop IP address:

```env
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:5000/api
EXPO_PUBLIC_EAS_PROJECT_ID=your-eas-project-id
```

Do not use `localhost` from a real Android phone. Use your laptop IP address, for example:

```env
EXPO_PUBLIC_API_URL=http://192.168.29.44:5000/api
```

5. Seed categories:

```bash
npm run seed
```

6. Optional for production demo: seed a fresh MVP baseline:

```bash
npm run seed:fresh
```

This creates or updates only:

- Admin: `admin@local.com` / `admin123`
- Biki seller: `biki@gmail.com` / `123456`
- Restaurant seller: `restaurant@localshop.in` / `Setup1234`
- Customer: `customer@localshop.in` / `Setup1234`
- Three MVP categories
- Biki Kirana Store with realistic grocery products

7. Optional for development only: seed quick-start demo admin, sellers, customers, shops, and starter products:

```bash
npm run seed:setup
```

This creates local test/demo accounts:

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

8. Start web backend and frontend:

```bash
npm run dev
```

Frontend: `http://localhost:5173`

Backend: `http://localhost:5000/api`

Deployed testing backend:

```text
https://loacal-vendor-shop.onrender.com/api
```

Health check:

```text
https://loacal-vendor-shop.onrender.com/api/health
```

9. Start the Android customer app:

```bash
npm run dev:customer-app
```

10. Start the Android seller app:

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

## Push Notifications

The customer and seller Expo apps use Expo Notifications and the backend sends through Expo Push Service. Expo's current setup requires the mobile app to request notification permission, generate an `ExpoPushToken` with an EAS project ID, and register Android FCM credentials through EAS.

Backend:

- `expo-server-sdk` sends push notifications.
- `EXPO_ACCESS_TOKEN` in `backend/.env` is optional, but recommended for production Expo Push Service access.
- Push failures are logged and do not roll back order creation or order status updates.

Mobile apps:

- Customer package: `com.localshop.customer`
- Seller package: `com.localshop.seller`
- `google-services.json` is gitignored in each app folder.
- Do not put Firebase service-account JSON or private keys in Expo public env variables.

Firebase / EAS setup:

1. Create two Android apps in Firebase:
   - `com.localshop.customer`
   - `com.localshop.seller`
2. Download each Firebase `google-services.json`.
3. Place the customer file at `customer-app/google-services.json`.
4. Place the seller file at `seller-app/google-services.json`.
5. Create or link EAS projects and copy the project IDs into each mobile `.env`:

```env
EXPO_PUBLIC_EAS_PROJECT_ID=your-eas-project-id
```

6. Build real Android binaries for push testing. Expo Go is not enough for final FCM validation:

```bash
cd customer-app
eas build -p android --profile preview

cd ../seller-app
eas build -p android --profile preview
```

## Android APK Testing Builds

The customer and seller APK preview builds use the deployed Render backend:

```text
https://loacal-vendor-shop.onrender.com/api
```

Both `customer-app/eas.json` and `seller-app/eas.json` set this value in the `preview` and `production` profiles through `EXPO_PUBLIC_API_URL`.

Customer APK:

```bash
cd customer-app
npm install
npx expo-doctor
eas build -p android --profile preview
```

Seller APK:

```bash
cd seller-app
npm install
npx expo-doctor
eas build -p android --profile preview
```

The `preview` profile generates installable APK files:

- Customer: `com.localshop.customer`
- Seller: `com.localshop.seller`

Download APK from EAS:

1. Open the EAS build URL shown after the build starts.
2. Wait for the Android build to complete.
3. Click `Download`.
4. Transfer the APK to the Android phone or open the link directly on the phone.

Install APK on Android:

1. Open the downloaded APK.
2. If Android blocks installation, enable `Install unknown apps` for Chrome, Files, or the app you used to open the APK.
3. Install Customer and Seller APKs. They can be installed together because they use different package names.

Two-app testing flow:

1. Login to Customer App.
2. Login to Seller App.
3. Customer places an order.
4. Seller accepts the order.
5. Seller marks Preparing, Out for Delivery, and Delivered.
6. Customer verifies the status changes in active order, orders list, and order details.

If Render is sleeping, first API call may take longer. The mobile API clients use a 30 second timeout and show a friendly retry message for slow/network failures.

To change API URL later:

```env
EXPO_PUBLIC_API_URL=https://your-new-backend.example.com/api
```

Then rebuild the APK with EAS.

For Play Store later, generate AAB files:

```bash
cd customer-app
eas build -p android --profile production

cd ../seller-app
eas build -p android --profile production
```

Notification API:

```text
GET /api/notifications
PATCH /api/notifications/:id/read
PATCH /api/notifications/read-all
POST /api/notifications/register-token
DELETE /api/notifications/unregister-token
```

Push events implemented:

- Customer places order: seller receives "New order".
- Seller updates order status: customer receives status update.
- Customer cancels a pending order: seller receives cancellation alert.
- Tapping an order notification opens the relevant order details screen when logged in.

Notification behavior:

- Both apps keep the existing polling/in-app flow as fallback.
- Both apps have a notification center with unread badge.
- Foreground pushes show the existing top toast with a View Order action when applicable.
- Android channels are configured separately for customer order updates and seller new-order/action alerts.

Web notification behavior:

- Customer Web uses centralized active-order polling every 10 seconds while an active order exists.
- Seller Web uses centralized order polling every 10 seconds for new-order awareness.
- Polling pauses while the browser tab is hidden and refreshes again when visible.
- Customer and seller web pages reuse the `/api/notifications` history endpoints through the navbar bell.
- Web toasts appear at the top of the page and include View Order actions when relevant.
- Browser push/FCM Web is prepared behind a service abstraction, but Firebase Web config is not hardcoded. Add Firebase Web config and token registration before enabling real browser push delivery.

## Production Cleanup

Before deployment, audit cleanup candidates first and run the database cleanup in dry-run mode.

```bash
npm run cleanup:dry
```

The dry run prints current record counts and all records that would be deleted. It does not delete anything.

Only after reviewing the dry-run output, run:

```bash
npm run cleanup:run
```

The cleanup script protects:

- `admin@local.com`
- `biki@gmail.com`
- approved shops
- users who own approved shops
- products from protected shops unless they are explicitly marked `isDemoProduct: true`

Cleanup targets include:

- demo/test users such as `@demo.com`, `@local.test`, `@test.local`, and `example.com`
- non-approved demo/test shops
- products linked to selected demo shops
- orders linked to selected demo users or demo shops
- exact duplicate categories after keeping the first record

Warning: never run `cleanup:run` against production without reading the dry-run table first.

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
- Push notifications require physical-device testing with EAS builds and Firebase Android credentials.
- Expo dependency audit may show moderate warnings from the React Native toolchain; current bundle/export checks pass.

## MVP Boundaries

This version intentionally excludes payment gateway integration, live delivery tracking, delivery boy app, OTP delivery verification, multi-city logic, AI features, and complex offers/coupons.
