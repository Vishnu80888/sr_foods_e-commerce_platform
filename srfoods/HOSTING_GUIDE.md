# 🚀 SR Foods — Production Hosting & Deployment Guide

**SR Foods (SR Enterprise)** is **100% production-ready** and can be deployed immediately.

---

## 📋 Pre-Flight Verification Status

| Checklist Item | Status | Verification Note |
|---|---|---|
| **Frontend Production Build** | ✅ **PASSED** | Optimized gzipped bundle created (`npm run build`) |
| **Backend REST API** | ✅ **PASSED** | Express + Mongoose + Rate-Limiting + Reverse Proxy Trust |
| **Static SPA Serving** | ✅ **PASSED** | Backend automatically serves compiled React app on `/*` |
| **Cross-Origin Resource Sharing (CORS)** | ✅ **PASSED** | Multi-domain and production URL matching configured |
| **Database Auto-Seeder** | ✅ **PASSED** | Products, promos, and admin account auto-seed on first run |
| **Prepaid Payment Flow** | ✅ **PASSED** | PhonePe Dynamic QR, UTR verification, Owner WhatsApp notification |
| **Auto Video Experience** | ✅ **PASSED** | SR Logo click video theater + Slideshow carousel ready |

---

## ⚙️ Environment Variables Reference

### Backend (`srfoods/backend/.env` or Cloud Dashboard)

| Variable | Recommended Production Value | Description |
|---|---|---|
| `PORT` | `5000` (or injected by host like Render/Heroku) | Port for Express web server |
| `MONGO_URI` | `mongodb+srv://<user>:<password>@cluster0.mongodb.net/srfoods?retryWrites=true&w=majority` | MongoDB Atlas cloud connection URI |
| `JWT_SECRET` | *(Generate a random 32+ character string)* | Secret key for signing customer & admin JWT auth tokens |
| `NODE_ENV` | `production` | Enables production error sanitization |
| `CLIENT_URL` | `https://your-frontend-domain.com` (or `*`) | Allowed frontend origins for CORS |

### Frontend (`srfoods/frontend/.env` - only if hosting frontend separately)

| Variable | Value | Description |
|---|---|---|
| `REACT_APP_API_URL` | `https://your-backend-api.onrender.com` | Backend API base URL (leave blank if hosting together) |

---

## 🌐 Deployment Options

### Option A: All-in-One Full-Stack Deployment (Recommended for Render / Railway)

Both frontend and backend run on a single server, with Express serving the React SPA bundle:

1. **Deploy to Render or Railway**:
   - Connect your GitHub repository.
   - Set **Root Directory**: `srfoods`
   - **Build Command**:
     ```bash
     cd frontend && npm install && npm run build && cd ../backend && npm install
     ```
   - **Start Command**:
     ```bash
     cd backend && npm start
     ```
   - Add Environment Variables:
     - `MONGO_URI`: Your MongoDB Atlas URI
     - `JWT_SECRET`: A secure random secret
     - `NODE_ENV`: `production`

---

### Option B: Decoupled Hosting (Vercel Frontend + Render Backend)

#### 1. Backend on Render (`https://srfoods-api.onrender.com`)
- **Root Directory**: `srfoods/backend`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Environment Variables**:
  - `MONGO_URI`: Your MongoDB Atlas URI
  - `JWT_SECRET`: A secure random secret
  - `CLIENT_URL`: `https://your-app.vercel.app`

#### 2. Frontend on Vercel (`https://your-app.vercel.app`)
- **Root Directory**: `srfoods/frontend`
- **Framework Preset**: Create React App
- **Build Command**: `npm run build`
- **Output Directory**: `build`
- **Environment Variables**:
  - `REACT_APP_API_URL`: `https://srfoods-api.onrender.com`

---

### Option C: Ubuntu VPS / AWS EC2 / DigitalOcean (Nginx + PM2)

1. **Clone & Install Dependencies**:
   ```bash
   cd srfoods/frontend && npm install && npm run build
   cd ../backend && npm install
   ```

2. **Run Backend with PM2**:
   ```bash
   pm2 start server.js --name srfoods-api
   pm2 save
   pm2 startup
   ```

3. **Configure Nginx**:
   ```nginx
   server {
       server_name srfoods.in www.srfoods.in;

       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

4. **Add Free SSL via Certbot**:
   ```bash
   sudo certbot --nginx -d srfoods.in -d www.srfoods.in
   ```

---

## 🗄️ Setting Up Free MongoDB Atlas Database

1. Sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free **M0 Sandbox** cluster (choose Mumbai `ap-south-1` region for fastest India response times).
3. Under **Database Access**, create a user (e.g. `srfoods_admin`) with a secure password.
4. Under **Network Access**, click **Add IP Address** → **Allow Access from Anywhere (`0.0.0.0/0`)**.
5. Click **Connect** → **Drivers (Node.js)** and copy your connection string into `MONGO_URI`.

## 🔐 Administrator Account Setup

To secure your platform, administrator credentials are **never publicly displayed or exposed**:
- Define your private `ADMIN_EMAIL` and `ADMIN_PASSWORD` in your secret server environment variables (`.env` or Cloud Provider Settings).
- On first startup, the server automatically registers the admin account using your secret environment variables.
- Keep your administrative login credentials confidential.
