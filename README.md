# SR Foods — Premium MERN Stack D2C E-Commerce Platform

A production-ready, full-stack MERN e-commerce application built for **SR Foods (SR Enterprise)** — specialists in ready-to-cook, 100% whole chakki fresh atta flatbreads (Chapati, Poori, and Chitti Poori) with zero preservatives.

---

## 🌟 Key Features & Enhancements

### 🎬 Home Page Auto-Videos & Interactive Showcase
- **Click SR Logo for Auto Videos**: Clicking the **SR** brand logo in the top navbar instantly navigates to Home and launches the full-screen **Auto Video Culinary Theater** (`ProductVideoModal`).
  - Auto-advancing live cooking demonstrations:
    - 🫓 **Tawa Chapati**: 30-second pan balloon puffing.
    - 🟡 **Golden Poori**: 40-second crispy flash-fry in hot kadai oil.
    - 🔶 **Chitti Poori**: Crispy bite-sized cocktail pooris.
    - 🌾 **Chakki Atta Mill**: 100% whole grain stone grinding with zero maida and zero preservatives.
  - Features real-time steam particle physics, interactive progress scrubber bar, instant video playlist switcher thumbnails, step-by-step cooking guides, and ambient culinary sizzle audio synthesizer via Web Audio API.
- **Auto-Advancing Product Slideshow Carousel (`ProductSlideshow`)**:
  - 4 high-impact hero slides rotating automatically every 4.5 seconds with live timer progress bar.
  - Smooth slide transitions, previous/next controls, slide dot indicators, direct "Order Now" cart buttons, and "▶ Watch Auto Video" triggers.
- **Comprehensive Products Overview & Quality Matrix (`ProductsOverview`)**:
  - Interactive category filter tabs (All, Chapati, Poori, Chitti Poori, Combos).
  - Side-by-side showcase of authentic retail pouch packaging and cooked hot dish presentations.
  - Complete nutritional facts per piece (energy, protein, carbs, dietary fiber).
  - Step-by-step cooking speed metrics (30s tawa / 40s kadai).
  - **SR Foods vs Commercial Brands Comparison Matrix**: Highlights 100% whole wheat chakki atta purity, zero INS preservatives, easy digestibility, and daily morning fresh batch rolling.

### 💳 Prepaid-Only PhonePe QR & Verification Workflow
- **Discontinued Cash on Delivery (COD)**: Strictly prepaid orders to guarantee kitchen freshness.
- **Official PhonePe Dynamic QR Code**: Real-time UPI QR (`srenterprises259@gmail.com` / `9177231026`) with 1-click UPI apps intent (PhonePe, GPay, Paytm).
- **12-Digit UTR Bank Submission**: Customer inputs their transaction reference for verification.
- **Real-Time Customer Verification Tracker**: Live status screen polling for owner approval with direct WhatsApp verification link to store owner Vishnu.
- **Location-Based Delivery Fee Engine**: Auto-computed delivery tiers (Nellore ₹0, AP ₹40, Neighbouring States ₹70, Rest of India ₹110) with ₹199 free delivery threshold.

### 🎨 Gourmet D2C Storefront & Design System
- **Curated Food Palette**: Saffron Warmth (`#E8590C`), Fresh Herb Green (`#2B8A3E`), Royal Navy (`#0B2545`), and Warm Porcelain (`#FAF8F5`).
- **Modern Editorial Typography**: **Outfit** for bold, appetizing headlines and **Plus Jakarta Sans** for crisp, modern body text.
- **Glassmorphic UI & Micro-Interactions**: Translucent sticky header, smooth card elevation on hover, badge animations, and responsive layouts.
- **Top Announcement Bar**: Live promotional ticker with delivery destination selector modal.
- **Slide-Over Cart Drawer**: Slide-in cart with free delivery threshold progress indicator.
- **Product Quick-View Modal**: Detailed nutritional facts per serving, ingredients list, and storage instructions.
- **Order Tracking**: Real-time order progress timeline for members and guests by Order ID or phone number.
- **Floating WhatsApp Quick-Order**: Sticky quick-action button for one-click mobile order inquiries.
- **Admin Management Panel**: Real-time KPI cards, revenue metrics, 1-click payment verification button, and WhatsApp dispatch updates.

---

## 📁 Project Architecture

```
srfoods/
├── backend/                        ← Express + MongoDB REST API
│   ├── .env                        ← Server environment configuration
│   ├── server.js                   ← Express app & database connection
│   ├── package.json
│   ├── config/
│   │   └── seed.js                 ← Database auto-seeder (Products, Promos, Admin)
│   ├── middleware/
│   │   └── auth.js                 ← JWT authentication (protect, optionalAuth, adminOnly)
│   ├── models/
│   │   ├── Cart.js
│   │   ├── Contact.js
│   │   ├── Newsletter.js
│   │   ├── Order.js                ← Supports guest & user orders with orderId auto-gen
│   │   ├── Product.js              ← Products with nutrition, ingredients & shelf life
│   │   ├── PromoCode.js
│   │   ├── Review.js               ← Product reviews with aggregate rating sync
│   │   ├── User.js
│   │   └── Wishlist.js
│   └── routes/
│       ├── admin.js                ← Dashboard analytics, sales stats, order list
│       ├── auth.js                 ← Register, login, profile, change password
│       ├── cart.js                 ← Add, update, remove, clear cart items
│       ├── contacts.js             ← Contact inquiries
│       ├── newsletter.js           ← Email newsletter subscriptions
│       ├── orders.js               ← Guest/user checkout, tracking, order history
│       ├── products.js             ← Product catalog, filtering, search
│       ├── promo.js                ← Promo validation & active coupons
│       ├── reviews.js              ← Customer feedback and star ratings
│       └── wishlist.js             ← Wishlist toggles and user saved items
└── frontend/                       ← React 18 Single Page Application
    ├── package.json
    ├── public/
    │   ├── index.html              ← Google Fonts preconnect, SEO meta tags, favicon
    │   └── images/
    │       ├── chapati.jpg         ← Authentic SR Foods Chapati packaging
    │       ├── poori.jpg           ← Authentic SR Foods Poori packaging
    │       ├── chitti-poori.jpg    ← Authentic SR Foods Chitti Poori packaging
    │       ├── hero-spread.jpg     ← Editorial breakfast spread photography
    │       ├── tawa-puff.jpg       ← Tawa chapati puffing demonstration
    │       └── poori-fry.jpg       ← Golden poori frying demonstration
    └── src/
        ├── index.js                ← App bootstrap
        ├── index.css               ← Complete CSS design tokens & animations
        └── App.js                  ← Complete UI components & client state
```

---

## 🚀 How to Run Locally

### Prerequisites
- **Node.js**: v18+ (verified on v24.15.0)
- **MongoDB**: Community Server (running locally on port `27017` or MongoDB Atlas URI)

### Step 1: Start MongoDB
Ensure MongoDB is running on your system:
```powershell
# Windows service check
Get-Service -Name MongoDB
```
Or start manually:
```bash
mongod
```

### Step 2: Start the Backend API
In a new terminal:
```bash
cd backend
npm install
npm start
```
The server will connect to MongoDB, seed sample data on first run, and listen on **port 5000**:
```
✅ MongoDB connected
🌱 Database seeded with products, promo codes & admin user
🚀 SR Foods API running → http://localhost:5000/api/health
```

### Step 3: Start the Frontend App
In a second terminal:
```bash
cd frontend
npm install
npm start
```
The React development server will compile and open [http://localhost:3000](http://localhost:3000).

---

## 🔐 Credentials & Demo Accounts

### Administrator Login
- **Email:** `admin@srfoods.com`
- **Password:** `Admin@1234`
- **Admin Panel:** Navigate to **Admin Panel** in the top navigation bar to view analytics, change order statuses, and review sales figures.

---

## 🏷️ Active Promo Codes

| Code | Discount | Minimum Order | Usage Details |
|---|---|---|---|
| `SRFRESH20` | **20% OFF** (max ₹100) | ₹99 | Weekend special on all products |
| `WELCOME10` | **10% OFF** (max ₹50) | ₹49 | New customer welcome bonus |
| `POORI15` | **15% OFF** (max ₹75) | ₹59 | Special discount on Poori packs |
| `FLAT30` | **₹30 FLAT OFF** | ₹149 | Orders ₹149 and above |
| `COMBO25` | **25% OFF** (max ₹120) | ₹129 | Family combo value bundles |

---

## 📡 REST API Endpoints

### Authentication (`/api/auth`)
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create new customer account |
| POST | `/api/auth/login` | Public | Sign in & receive JWT token |
| GET | `/api/auth/me` | Authenticated | Retrieve authenticated user profile |
| PUT | `/api/auth/profile` | Authenticated | Update user name & phone |
| PUT | `/api/auth/change-password` | Authenticated | Update account password |

### Products (`/api/products`)
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/products` | Public | List products (supports `q`, `category`, `sort`, `page`) |
| GET | `/api/products/featured` | Public | Retrieve featured bestseller items |
| GET | `/api/products/:id` | Public | Retrieve product by MongoDB ID or slug |
| POST | `/api/products` | Admin | Create product |
| PUT | `/api/products/:id` | Admin | Update product details |
| DELETE | `/api/products/:id` | Admin | Deactivate product |

### Orders (`/api/orders`)
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/orders` | Optional Auth | Place order (supports both guest & member orders) |
| GET | `/api/orders` | Optional Auth | List user orders or filter by `phone`/`email` |
| GET | `/api/orders/:id` | Optional Auth | Get single order status by Order ID or `_id` |
| POST | `/api/orders/:id/cancel` | Authenticated | Cancel order & restore inventory |
| GET | `/api/orders/admin/all` | Admin | View all system orders with search & status filters |
| PUT | `/api/orders/:id/status` | Admin | Update order status & append status history |

### Cart (`/api/cart`)
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/cart` | Authenticated | Get user cart items & subtotal |
| POST | `/api/cart/add` | Authenticated | Add item to cart with stock check |
| PUT | `/api/cart/update` | Authenticated | Update item quantity in cart |
| DELETE | `/api/cart/remove/:productId` | Authenticated | Remove item from cart |
| DELETE | `/api/cart/clear` | Authenticated | Empty all cart items |

### Promo & Reviews (`/api/promo`, `/api/reviews`)
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/promo/validate` | Optional Auth | Validate promo code & compute discount |
| GET | `/api/promo` | Public | List currently active promo offers |
| GET | `/api/reviews/:productId` | Public | Get verified reviews & average rating |
| POST | `/api/reviews` | Optional Auth | Submit rating and product review |

### Admin Analytics (`/api/admin`)
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/dashboard` | Admin | Summary statistics, daily revenue, top products |
| GET | `/api/admin/users` | Admin | View registered customers |
| GET | `/api/admin/reviews` | Admin | Manage customer reviews |

---

## 🏢 Manufacturer Information

- **Company:** SR Enterprise
- **Address:** Kondayapalem, Nellore, Andhra Pradesh - 524004
- **Customer Care:** +91 9177231026 / +91 9088875006
- **Email:** srenterprises259@gmail.com
- **FSSAI License:** `20126181000074`
