# SR Foods — Complete MERN Stack E-Commerce

## Project Structure
```
srfoods/
├── backend/              ← Express + MongoDB API
│   ├── server.js
│   ├── package.json
│   ├── .env.example      ← copy to .env
│   ├── config/seed.js    ← seeds DB on first run
│   ├── middleware/auth.js
│   ├── models/           ← User, Product, Order, Cart, Wishlist, Review, PromoCode, Contact, Newsletter
│   └── routes/           ← auth, products, cart, orders, reviews, wishlist, promo, newsletter, contacts, admin
└── frontend/             ← React app
    ├── package.json
    ├── public/index.html
    └── src/
        ├── index.js
        └── App.js        ← Complete UI (Home, Shop, Deals, Checkout, Orders, Profile, Reviews, Admin)
```

---

## HOW TO RUN IN VS CODE

### Prerequisites (install once)
1. Node.js v18+  →  https://nodejs.org
2. MongoDB Community  →  https://www.mongodb.com/try/download/community
3. VS Code  →  https://code.visualstudio.com

### Recommended VS Code Extensions
- ESLint
- Prettier
- MongoDB for VS Code
- Thunder Client (API testing)

---

### STEP 1 — Start MongoDB
Open a terminal (Ctrl+`) and run:
```
mongod
```
Or if installed as a service, it starts automatically.

---

### STEP 2 — Run the Backend
Open a NEW terminal in VS Code:
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```
You should see:
```
✅ MongoDB connected
🌱 Database seeded (products + promo codes + admin user)
🚀 SR Foods API running → http://localhost:5000/api/health
```

Test it: open http://localhost:5000/api/health in your browser.

---

### STEP 3 — Run the Frontend
Open ANOTHER terminal in VS Code (click the + icon):
```bash
cd frontend
npm install
npm start
```
Browser opens at http://localhost:3000 automatically.

---

### STEP 4 — Login as Admin
```
Email:    admin@srfoods.com
Password: Admin@1234
```

---

## Promo Codes (pre-seeded)
| Code       | Discount          | Min Order |
|------------|-------------------|-----------|
| SRFRESH20  | 20% off (max ₹100)| ₹99       |
| WELCOME10  | 10% off (max ₹50) | ₹49       |
| POORI15    | 15% off (max ₹75) | ₹59       |
| FLAT30     | ₹30 flat off      | ₹149      |
| COMBO25    | 25% off (max ₹120)| ₹129      |

---

## API Endpoints (port 5000)
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | /api/auth/register | — | Register |
| POST | /api/auth/login | — | Login → JWT |
| GET | /api/auth/me | ✅ | Current user |
| PUT | /api/auth/profile | ✅ | Update profile |
| PUT | /api/auth/change-password | ✅ | Change password |
| POST | /api/auth/address | ✅ | Add address |
| GET | /api/products | — | List products |
| GET | /api/products/:id | — | Single product |
| GET | /api/cart | ✅ | Get cart |
| POST | /api/cart/add | ✅ | Add to cart |
| PUT | /api/cart/update | ✅ | Update qty |
| DELETE | /api/cart/remove/:id | ✅ | Remove item |
| DELETE | /api/cart/clear | ✅ | Clear cart |
| POST | /api/orders | ✅ | Place order |
| GET | /api/orders | ✅ | My orders |
| GET | /api/orders/:id | ✅ | Single order |
| POST | /api/orders/:id/cancel | ✅ | Cancel order |
| GET | /api/orders/admin/all | 🔴 Admin | All orders |
| PUT | /api/orders/:id/status | 🔴 Admin | Update status |
| GET | /api/reviews/:productId | — | Get reviews |
| POST | /api/reviews | ✅ | Submit review |
| GET | /api/wishlist | ✅ | Get wishlist |
| POST | /api/wishlist/toggle/:id | ✅ | Toggle item |
| POST | /api/promo/validate | ✅ | Validate promo |
| GET | /api/promo | — | Active promos |
| POST | /api/newsletter | — | Subscribe |
| POST | /api/contacts | — | Submit enquiry |
| GET | /api/admin/dashboard | 🔴 Admin | Analytics |
| GET | /api/admin/users | 🔴 Admin | All users |

---

## Contact — SR Enterprise
- Phone: +91 9177231026 / +91 9088875006
- Email: srenterprises259@gmail.com
- Address: Kondayapalem, Nellore, AP - 524004
- FSSAI: 20126181000074
