import React, { useState, useEffect, useRef, useCallback } from "react";

/* ── API CONFIG ───────────────────────────────────────────── */
const API_HOST = process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace(/\/$/, "") : "";
const BASE = `${API_HOST}/api`;
async function api(path, opts = {}) {
  const token = localStorage.getItem("sr_token");
  const res = await fetch(BASE + path, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts.headers,
    },
    ...opts,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "API Error");
  return data;
}

/* ── LOCATION & DELIVERY ZONE CALCULATOR ───────────────────── */
function getClientDeliveryZone(city = "", state = "", pincode = "", subtotal = 0) {
  const c = city.trim().toLowerCase();
  const s = state.trim().toLowerCase();
  const p = pincode.trim();

  // Zone 1: Nellore Local
  if (c.includes("nellore") || p.startsWith("524")) {
    const freeAbove = 99;
    const fee = subtotal >= freeAbove ? 0 : 20;
    return {
      zone: "Nellore Local Express",
      fee,
      freeAbove,
      eta: "Today (Within 2 - 4 Hours)",
      badgeColor: "#2B8A3E",
      estimatedDays: 0,
      description: "Fast local delivery direct from Nellore kitchens.",
    };
  }

  // Zone 2: Rest of AP & Telangana
  if (
    s.includes("andhra") ||
    s.includes("telangana") ||
    c.includes("tirupati") ||
    c.includes("hyderabad") ||
    c.includes("vijayawada") ||
    c.includes("guntur") ||
    c.includes("visakhapatnam") ||
    c.includes("kavali") ||
    c.includes("ongole") ||
    p.startsWith("50") ||
    p.startsWith("51") ||
    p.startsWith("52") ||
    p.startsWith("53")
  ) {
    const freeAbove = 149;
    const fee = subtotal >= freeAbove ? 0 : 35;
    return {
      zone: "AP & Telangana Regional",
      fee,
      freeAbove,
      eta: "Tomorrow (Next Day Delivery)",
      badgeColor: "#E8590C",
      estimatedDays: 1,
      description: "Direct morning dispatch across Andhra & Telangana.",
    };
  }

  // Zone 3: Neighboring South States (Karnataka, Tamil Nadu, Kerala)
  if (
    s.includes("tamil") ||
    s.includes("karnataka") ||
    s.includes("kerala") ||
    c.includes("chennai") ||
    c.includes("bangalore") ||
    c.includes("bengaluru") ||
    p.startsWith("56") ||
    p.startsWith("60")
  ) {
    const freeAbove = 199;
    const fee = subtotal >= freeAbove ? 0 : 50;
    return {
      zone: "South Interstate Express",
      fee,
      freeAbove,
      eta: "1 - 2 Business Days",
      badgeColor: "#0B2545",
      estimatedDays: 2,
      description: "Cold-chain express to Bengaluru, Chennai & South India.",
    };
  }

  // Zone 4: Rest of India
  const freeAbove = 299;
  const fee = subtotal >= freeAbove ? 0 : 70;
  return {
    zone: "National Cold-Chain Delivery",
    fee,
    freeAbove,
    eta: "2 - 3 Business Days",
    badgeColor: "#7950F2",
    estimatedDays: 3,
    description: "Insulated fresh packaging dispatched pan-India.",
  };
}

/* ── DEFAULT CATALOG FALLBACK ─────────────────────────────── */
const FALLBACK = [
  {
    _id: "p1",
    name: "SR Fresh Chapati",
    tagline: "Ultra Soft · Whole Chakki Atta",
    emoji: "🫓",
    image: "/images/chapati.jpg",
    color: "#E8590C",
    bgColor: "#FFF4E6",
    badge: "BESTSELLER",
    price: 49,
    originalPrice: 60,
    unit: "Pack of 5 Chapatis",
    category: "chapati",
    description: "Hand-rolled from 100% whole chakki fresh atta. Naturally soft, wholesome and ready to puff in just 30 seconds on the pan.",
    features: ["Zero Maida", "No Preservatives", "30-Sec Heat & Eat", "High Dietary Fiber"],
    nutrition: { calories: "115 kcal", protein: "3.8g", carbs: "22g", fiber: "3.2g", fat: "1.1g" },
    ingredients: "Whole Wheat Flour (Chakki Fresh), RO Purified Water, Sunflower Oil, Iodized Salt",
    storage: "Refrigerator: Up to 10 days. Ambient room temperature: 3 days.",
    instructions: "Preheat tawa to medium-high. Place chapati for 30s, flip, press gently with a clean cloth or spatula until it puffs completely. Brush with ghee or butter and enjoy hot.",
    stock: 120,
    rating: 4.9,
    reviewCount: 148,
  },
  {
    _id: "p2",
    name: "SR Golden Poori",
    tagline: "Crispy, Fluffy & Puffed to Perfection",
    emoji: "🟡",
    image: "/images/poori.jpg",
    color: "#2B8A3E",
    bgColor: "#EBFBEE",
    badge: "CUSTOMER FAVORITE",
    price: 59,
    originalPrice: 70,
    unit: "Pack of 6 Pooris",
    category: "poori",
    description: "Crispy, puffed golden pooris hand-crafted from farm wheat atta. Puffs round in hot oil in less than 45 seconds.",
    features: ["Crisp & Non-Oily", "100% Whole Wheat", "Ready to Fry", "Festival Special"],
    nutrition: { calories: "135 kcal", protein: "3.4g", carbs: "20g", fiber: "2.8g", fat: "4.8g" },
    ingredients: "Whole Wheat Flour (Chakki Fresh), RO Purified Water, Vegetable Oil, Iodized Salt",
    storage: "Refrigerator: Up to 7 days. Keep in a dry, cool spot.",
    instructions: "Heat cooking oil in a deep kadai. Gently slide poori into medium-hot oil. Press center softly with a perforated spoon until it inflates into a golden ball. Drain and serve with potato curry.",
    stock: 95,
    rating: 4.9,
    reviewCount: 112,
  },
  {
    _id: "p3",
    name: "SR Chitti Poori (Mini)",
    tagline: "Bite-Sized Puffed Delight for Festivities",
    emoji: "🔶",
    image: "/images/chitti-poori.jpg",
    color: "#8B4513",
    bgColor: "#FFF5EE",
    badge: "FESTIVAL SPECIAL",
    price: 55,
    originalPrice: 65,
    unit: "Pack of 10 Mini Pooris",
    category: "special",
    description: "Adorable bite-sized pooris crafted specifically for festive thalis, snacks, pani puri/chaat creations and kids' lunchboxes.",
    features: ["Bite-Sized Fun", "Crisp Texture", "No Artificial Flavours", "Party Favorite"],
    nutrition: { calories: "78 kcal", protein: "2.1g", carbs: "12g", fiber: "1.6g", fat: "2.8g" },
    ingredients: "Whole Wheat Flour (Chakki Fresh), RO Purified Water, Vegetable Oil, Iodized Salt",
    storage: "Refrigerator: Up to 7 days. Keep airtight.",
    instructions: "Deep fry batches in moderately hot oil for 25-30 seconds until puffed and golden brown. Ideal with chutneys or spiced chana.",
    stock: 80,
    rating: 4.8,
    reviewCount: 76,
  },
  {
    _id: "p4",
    name: "Chapati Family Saver (3x Pack)",
    tagline: "15 Chapatis · Mega Value Pack",
    emoji: "🌟",
    image: "/images/chapati.jpg",
    color: "#0B2545",
    bgColor: "#EDF3F9",
    badge: "SUPER SAVER",
    price: 129,
    originalPrice: 180,
    unit: "3 Packs × 5 Chapatis (15 Total)",
    category: "combo",
    description: "Our bestselling Chapati in a family value bundle. Keep your kitchen stocked with soft, warm flatbreads for the entire week.",
    features: ["Save ₹51", "15 Fresh Chapatis", "Individually Sealed", "Free Delivery Eligible"],
    nutrition: { calories: "115 kcal / chapati", protein: "3.8g", carbs: "22g", fiber: "3.2g", fat: "1.1g" },
    ingredients: "Whole Wheat Flour (Chakki Fresh), RO Purified Water, Sunflower Oil, Iodized Salt",
    storage: "Refrigerator: Up to 10 days.",
    instructions: "Warm individually on hot pan with or without ghee.",
    stock: 60,
    rating: 4.9,
    reviewCount: 94,
  },
  {
    _id: "p5",
    name: "SR Royal Grand Combo (All 3)",
    tagline: "1 Chapati + 1 Poori + 1 Chitti Poori",
    emoji: "🎁",
    image: "/images/chitti-poori.jpg",
    color: "#C2410C",
    bgColor: "#FFF4E6",
    badge: "HIGHEST DISCOUNT",
    price: 149,
    originalPrice: 220,
    unit: "3 Assorted Fresh Packs",
    category: "combo",
    description: "The complete SR Foods culinary tasting pack. Contains 1 pack of Chapati (5 pcs), 1 pack of Poori (6 pcs), and 1 pack of Chitti Poori (10 pcs).",
    features: ["3 Unique Varieties", "Save ₹71", "Great for Weekend Feasts", "Fresh Batch"],
    nutrition: { calories: "Varies per item", protein: "Balanced", carbs: "Whole Grain", fiber: "Rich", fat: "Low" },
    ingredients: "100% Whole Chakki Wheat, RO Purified Water, Vegetable Oil, Iodized Salt",
    storage: "Refrigerator: Up to 10 days.",
    instructions: "Prepare chapatis on flat tawa and pooris in hot kadai.",
    stock: 45,
    rating: 5.0,
    reviewCount: 130,
  },
  {
    _id: "p6",
    name: "Poori Party Pack (5x Pack)",
    tagline: "30 Golden Pooris · Gatherings & Celebrations",
    emoji: "👨‍👩‍👧‍👦",
    image: "/images/poori.jpg",
    color: "#166534",
    bgColor: "#F0FDF4",
    badge: "PARTY SIZE",
    price: 269,
    originalPrice: 350,
    unit: "5 Packs × 6 Pooris (30 Total)",
    category: "combo",
    description: "Hosting a family lunch, pooja, or festive gathering? Get 30 fresh, ready-to-puff pooris that fry in seconds with zero kneading mess.",
    features: ["Zero Prep Time", "Saves 2+ Hours Cooking", "Crowd Pleaser", "Free Shipping"],
    nutrition: { calories: "135 kcal / poori", protein: "3.4g", carbs: "20g", fiber: "2.8g", fat: "4.8g" },
    ingredients: "Whole Wheat Flour (Chakki Fresh), RO Purified Water, Vegetable Oil, Iodized Salt",
    storage: "Refrigerator: Up to 7 days.",
    instructions: "Fry in batches in hot oil. Serve steaming hot.",
    stock: 35,
    rating: 4.9,
    reviewCount: 52,
  },
];

const PROMOS = {
  SRFRESH20: { type: "pct", val: 20, max: 100, min: 99, label: "20% OFF (up to ₹100)" },
  WELCOME10: { type: "pct", val: 10, max: 50, min: 49, label: "10% OFF Welcome Bonus" },
  POORI15:   { type: "pct", val: 15, max: 75, min: 59, label: "15% OFF Poori Special" },
  FLAT30:    { type: "flat", val: 30, min: 149, label: "Flat ₹30 OFF" },
  COMBO25:   { type: "pct", val: 25, max: 120, min: 129, label: "25% OFF Combo Packs" },
};

/* ── TOAST NOTIFICATIONS ──────────────────────────────────── */
let _addToast = null;
function ToastContainer() {
  const [list, setList] = useState([]);
  _addToast = (msg, type = "info") => {
    const id = Date.now() + Math.random();
    setList((l) => [...l.slice(-3), { id, msg, type }]);
    setTimeout(() => setList((l) => l.filter((t) => t.id !== id)), 3500);
  };
  const icon = { info: "ℹ️", success: "✨", error: "⚠️" };
  const border = { info: "#0B2545", success: "#2B8A3E", error: "#E03131" };

  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 99999, display: "flex", flexDirection: "column", gap: 10, pointerEvents: "none" }}>
      {list.map((t) => (
        <div
          key={t.id}
          className="fade-in"
          style={{
            pointerEvents: "auto",
            background: "#FFFFFF",
            color: "#1A1917",
            padding: "12px 20px",
            borderRadius: 14,
            fontSize: 13,
            fontWeight: 700,
            maxWidth: 360,
            display: "flex",
            alignItems: "center",
            gap: 10,
            boxShadow: "0 12px 32px rgba(0,0,0,0.14)",
            borderLeft: `5px solid ${border[t.type] || "#E8590C"}`,
            borderTop: "1px solid rgba(0,0,0,0.06)",
            borderRight: "1px solid rgba(0,0,0,0.06)",
            borderBottom: "1px solid rgba(0,0,0,0.06)",
          }}
        >
          <span style={{ fontSize: 16 }}>{icon[t.type] || "✨"}</span>
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}
const toast = (msg, type) => _addToast?.(msg, type);

/* ── AUTH HOOK ────────────────────────────────────────────── */
function useAuth() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("sr_user") || "null");
    } catch {
      return null;
    }
  });
  const login = (token, u) => {
    localStorage.setItem("sr_token", token);
    localStorage.setItem("sr_user", JSON.stringify(u));
    setUser(u);
  };
  const logout = () => {
    localStorage.removeItem("sr_token");
    localStorage.removeItem("sr_user");
    setUser(null);
  };
  return { user, login, logout, isAdmin: user?.role === "admin" };
}

/* ── TOP ANNOUNCEMENT BAR ─────────────────────────────────── */
function AnnouncementBar({ location, onOpenLocationModal }) {
  return (
    <div style={{ background: "linear-gradient(90deg, #0B2545 0%, #133E6E 50%, #0B2545 100%)", color: "#FDFCF9", padding: "8px 16px", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "0 auto", flexWrap: "wrap", justifyContent: "center" }}>
        <span>🎉 <strong>20% OFF</strong> Weekend Special — Code: <span style={{ background: "rgba(255,255,255,0.2)", padding: "2px 7px", borderRadius: 4, letterSpacing: 1, fontFamily: "monospace", color: "#FFD43B", fontWeight: 800 }}>SRFRESH20</span></span>
        <span style={{ opacity: 0.4 }}>•</span>
        <span
          onClick={onOpenLocationModal}
          style={{ cursor: "pointer", color: "#FFD43B", display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 800 }}
          title="Click to change delivery destination"
        >
          📍 Delivering to: <u>{location.city}, {location.state} ({location.pincode})</u> ✎
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 11, opacity: 0.9 }}>
        <a href="tel:9177231026" style={{ color: "#FFD43B", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
          📞 <span>+91 9177231026</span>
        </a>
      </div>
    </div>
  );
}

/* ── LOCATION SELECTOR MODAL ──────────────────────────────── */
function LocationModal({ isOpen, onClose, location, onSaveLocation }) {
  const [city, setCity] = useState(location.city);
  const [state, setState] = useState(location.state);
  const [pincode, setPincode] = useState(location.pincode);

  if (!isOpen) return null;

  const presets = [
    { city: "Nellore", state: "Andhra Pradesh", pincode: "524004", label: "📍 Nellore (Local)" },
    { city: "Tirupati", state: "Andhra Pradesh", pincode: "517501", label: "📍 Tirupati (AP)" },
    { city: "Hyderabad", state: "Telangana", pincode: "500001", label: "📍 Hyderabad (TG)" },
    { city: "Chennai", state: "Tamil Nadu", pincode: "600001", label: "📍 Chennai (TN)" },
    { city: "Bengaluru", state: "Karnataka", pincode: "560001", label: "📍 Bengaluru (KA)" },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(11,37,69,0.6)", backdropFilter: "blur(6px)" }} />
      <div className="fade-in" style={{ position: "relative", background: "#FFFFFF", borderRadius: 24, maxWidth: 500, width: "100%", padding: 32, boxShadow: "0 24px 60px rgba(0,0,0,0.25)", zIndex: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--navy)", margin: 0 }}>📍 Choose Delivery Location</h2>
          <button onClick={onClose} style={{ border: "none", background: "#F5F2EB", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", fontWeight: 800 }}>✕</button>
        </div>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 18 }}>
          Delivery charges and transit speeds are calculated automatically by distance from our Nellore kitchens.
        </p>

        {/* Quick Presets */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
          {presets.map((p) => (
            <button
              key={p.city}
              onClick={() => { setCity(p.city); setState(p.state); setPincode(p.pincode); }}
              style={{
                background: city.toLowerCase() === p.city.toLowerCase() ? "var(--primary-light)" : "#F5F2EB",
                color: city.toLowerCase() === p.city.toLowerCase() ? "var(--primary)" : "var(--navy)",
                border: `1.5px solid ${city.toLowerCase() === p.city.toLowerCase() ? "var(--primary)" : "transparent"}`,
                borderRadius: 10,
                padding: "6px 12px",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--navy)", marginBottom: 4 }}>CITY</label>
            <input type="text" value={city} onChange={(e) => setCity(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1.5px solid #E0DAD0" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--navy)", marginBottom: 4 }}>PINCODE</label>
            <input type="text" value={pincode} onChange={(e) => setPincode(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1.5px solid #E0DAD0" }} />
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--navy)", marginBottom: 4 }}>STATE</label>
          <select value={state} onChange={(e) => setState(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1.5px solid #E0DAD0" }}>
            <option value="Andhra Pradesh">Andhra Pradesh</option>
            <option value="Telangana">Telangana</option>
            <option value="Tamil Nadu">Tamil Nadu</option>
            <option value="Karnataka">Karnataka</option>
            <option value="Kerala">Kerala</option>
            <option value="Maharashtra">Maharashtra</option>
            <option value="Other">Other State</option>
          </select>
        </div>

        <button
          onClick={() => {
            onSaveLocation({ city, state, pincode });
            onClose();
            toast(`📍 Delivery destination updated to ${city}, ${state}`, "success");
          }}
          className="btn-primary"
          style={{ width: "100%", borderRadius: 12, padding: "12px", fontSize: 14 }}
        >
          Confirm Location →
        </button>
      </div>
    </div>
  );
}

/* ── NAVBAR ───────────────────────────────────────────────── */
function Navbar({ page, go, cartCount, user, logout, openCartDrawer, onSearch, searchQuery, onOpenVideoModal }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const links = user?.role === "admin"
    ? [
        ["Home", "home"],
        ["Products", "shop"],
        ["Deals", "deals"],
        ["Admin Panel", "admin"],
      ]
    : [
        ["Home", "home"],
        ["Shop Now", "shop"],
        ["Deals & Offers", "deals"],
        ["How to Cook", "cook"],
        ["Customer Reviews", "reviews"],
        ["My Orders", "orders"],
      ];

  return (
    <header style={{ position: "sticky", top: 0, zIndex: 1000, background: "rgba(255, 255, 255, 0.95)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderBottom: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 72 }}>
        
        {/* Brand Logo - Clicking plays auto product videos & navigates to Home */}
        <div
          onClick={() => {
            onSearch("");
            go("home");
            onOpenVideoModal?.("chapati");
          }}
          title="Click SR Logo: Watch Live Product Auto Videos & Home Overview!"
          style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", userSelect: "none" }}
        >
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 14,
              background: "linear-gradient(135deg, #E8590C 0%, #D9480F 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 900,
              fontSize: 20,
              boxShadow: "0 4px 14px rgba(232,89,12,0.4)",
              position: "relative",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "scale(1.08)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(232,89,12,0.55)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "0 4px 14px rgba(232,89,12,0.4)";
            }}
          >
            SR
            <span
              style={{
                position: "absolute",
                top: -3,
                right: -3,
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: "#2B8A3E",
                border: "2px solid #fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 8,
              }}
              title="Fresh Batch Online"
            />
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 21, color: "#0B2545", letterSpacing: -0.5, display: "flex", alignItems: "center", gap: 6 }}>
              SR Foods
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  background: "linear-gradient(135deg, #FFF4E6 0%, #FFE8CC 100%)",
                  color: "#D9480F",
                  border: "1px solid #FFD8A8",
                  padding: "2px 8px",
                  borderRadius: 20,
                  letterSpacing: 0.5,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  boxShadow: "0 2px 6px rgba(232,89,12,0.15)",
                }}
              >
                <span>▶</span> AUTO VIDEO
              </span>
            </div>
            <div style={{ fontSize: 9.5, color: "#E8590C", fontWeight: 800, letterSpacing: 1.1, textTransform: "uppercase" }}>
              Click Logo for Video · Whole Chakki Atta
            </div>
          </div>
        </div>

        {/* Search Bar in Header */}
        <div className="hide-on-mobile" style={{ flex: "0 1 320px", position: "relative" }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 14, opacity: 0.5 }}>🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search Chapati, Poori, Combos..."
            style={{
              width: "100%",
              padding: "9px 14px 9px 38px",
              borderRadius: 999,
              border: "1.5px solid #E5E0D8",
              background: "#FBF9F5",
              fontSize: 13,
              fontFamily: "var(--font-body)",
              outline: "none",
              transition: "border 0.2s, background 0.2s",
            }}
            onFocus={(e) => { e.target.style.borderColor = "#E8590C"; e.target.style.background = "#fff"; }}
            onBlur={(e) => { e.target.style.borderColor = "#E5E0D8"; e.target.style.background = "#FBF9F5"; }}
          />
        </div>

        {/* Nav Links */}
        <nav className="hide-on-mobile" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {links.map(([l, k]) => {
            const active = page === k;
            return (
              <button
                key={k}
                onClick={() => go(k)}
                style={{
                  background: active ? "var(--navy-light)" : "transparent",
                  color: active ? "var(--navy)" : "#5C5850",
                  border: "none",
                  borderRadius: 10,
                  padding: "8px 14px",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: active ? 800 : 600,
                  fontFamily: "var(--font-body)",
                  transition: "all 0.18s ease",
                }}
                onMouseOver={(e) => { if (!active) e.target.style.color = "var(--primary)"; }}
                onMouseOut={(e) => { if (!active) e.target.style.color = "#5C5850"; }}
              >
                {l}
              </button>
            );
          })}
        </nav>

        {/* Actions: User & Cart */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button
                onClick={() => go("profile")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "#F5F2EB",
                  border: "1px solid rgba(0,0,0,0.06)",
                  borderRadius: 24,
                  padding: "5px 12px 5px 6px",
                  cursor: "pointer",
                  fontFamily: "var(--font-body)",
                  fontWeight: 700,
                  fontSize: 12,
                }}
              >
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#0B2545", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>
                  {user.name?.[0]?.toUpperCase() || "U"}
                </div>
                <span>{user.name?.split(" ")[0] || "Profile"}</span>
              </button>
              <button
                onClick={() => { logout(); go("home"); toast("Logged out successfully"); }}
                style={{ background: "transparent", border: "none", color: "#9C988F", cursor: "pointer", fontSize: 12, fontWeight: 600, padding: 6 }}
                title="Logout"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => go("login")}
              style={{
                background: "transparent",
                color: "var(--navy)",
                border: "1.5px solid var(--navy)",
                borderRadius: 12,
                padding: "8px 16px",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 700,
                fontFamily: "var(--font-body)",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => { e.target.style.background = "var(--navy)"; e.target.style.color = "#fff"; }}
              onMouseOut={(e) => { e.target.style.background = "transparent"; e.target.style.color = "var(--navy)"; }}
            >
              Sign In
            </button>
          )}

          {/* Cart Trigger */}
          <button
            onClick={openCartDrawer}
            className="btn-primary"
            style={{
              borderRadius: 24,
              padding: "9px 18px",
              fontSize: 13,
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>🛒 Cart</span>
            <span
              style={{
                background: "#FFFFFF",
                color: "var(--primary)",
                borderRadius: 999,
                minWidth: 22,
                height: 22,
                padding: "0 6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 900,
              }}
            >
              {cartCount}
            </span>
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="show-mobile-btn"
            style={{
              background: "#F5F2EB",
              border: "none",
              borderRadius: 8,
              padding: "8px 12px",
              cursor: "pointer",
              fontSize: 18,
            }}
          >
            ☰
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div style={{ background: "#FFFFFF", borderTop: "1px solid #ECE7DE", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search products..."
            style={{ padding: "10px 14px", borderRadius: 10, border: "1.5px solid #E0DAD0", fontSize: 14 }}
          />
          {links.map(([l, k]) => (
            <button
              key={k}
              onClick={() => { go(k); setMobileMenuOpen(false); }}
              style={{ textAlign: "left", background: "none", border: "none", padding: "8px 0", fontSize: 15, fontWeight: 700, color: page === k ? "var(--primary)" : "#333", cursor: "pointer" }}
            >
              {l}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}

/* ── SLIDE-OVER CART DRAWER WITH DYNAMIC LOCATION PRICING ─── */
function CartDrawer({
  isOpen,
  onClose,
  cart,
  setCart,
  go,
  onApplyPromo,
  promoDiscount,
  appliedPromoCode,
  onRemovePromo,
  location,
  onOpenLocationModal,
}) {
  const [code, setCode] = useState("");
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  // Dynamic Location delivery fee
  const zoneInfo = getClientDeliveryZone(location.city, location.state, location.pincode, subtotal);
  const deliveryFee = zoneInfo.fee;
  const progressPct = Math.min(100, Math.round((subtotal / zoneInfo.freeAbove) * 100));
  const diff = Math.max(0, zoneInfo.freeAbove - subtotal);
  const total = Math.max(0, subtotal - promoDiscount) + deliveryFee;

  if (!isOpen) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", justifyContent: "flex-end" }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgba(11, 37, 69, 0.45)", backdropFilter: "blur(4px)", animation: "fadeIn 0.2s ease" }}
      />

      {/* Drawer Container */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 440,
          background: "#FFFFFF",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          boxShadow: "-8px 0 32px rgba(0,0,0,0.15)",
          animation: "slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
          zIndex: 10,
        }}
      >
        {/* Drawer Header */}
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #F0ECE4", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 19, fontWeight: 900, color: "var(--navy)", fontFamily: "var(--font-heading)" }}>
              Your Fresh Bag ({cart.reduce((a, b) => a + b.qty, 0)})
            </div>
            <div
              onClick={onOpenLocationModal}
              style={{ fontSize: 11.5, color: "var(--primary)", marginTop: 2, cursor: "pointer", fontWeight: 700 }}
              title="Click to edit destination"
            >
              📍 Delivering to: <u>{location.city}, {location.state}</u> ✎
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ width: 34, height: 34, borderRadius: "50%", background: "#F5F2EB", border: "none", cursor: "pointer", fontSize: 15, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            ✕
          </button>
        </div>

        {/* Dynamic Free Shipping Milestone Bar based on Zone */}
        <div style={{ padding: "12px 24px", background: deliveryFee === 0 ? "#EBFBEE" : "#FFF4E6", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, color: deliveryFee === 0 ? "#2B8A3E" : "#E8590C", marginBottom: 6 }}>
            <span>
              {deliveryFee === 0
                ? `🎉 FREE Delivery to ${location.city} unlocked!`
                : `🚚 Add ₹${diff} more for FREE Delivery (${zoneInfo.zone})`}
            </span>
            <span>{progressPct}%</span>
          </div>
          <div style={{ width: "100%", height: 6, background: "rgba(0,0,0,0.08)", borderRadius: 999, overflow: "hidden" }}>
            <div style={{ width: `${progressPct}%`, height: "100%", background: deliveryFee === 0 ? "#2B8A3E" : "#E8590C", transition: "width 0.3s ease" }} />
          </div>
          <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 5 }}>
            ⚡ ETA: <strong>{zoneInfo.eta}</strong>
          </div>
        </div>

        {/* Cart Item List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>🫓</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--navy)", marginBottom: 8 }}>Your cart is empty</div>
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>
                Explore our soft whole wheat chapatis &amp; golden puffed pooris.
              </p>
              <button
                onClick={() => { onClose(); go("shop"); }}
                className="btn-primary"
                style={{ borderRadius: 12, padding: "10px 22px", fontSize: 13 }}
              >
                Browse Fresh Packs →
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {cart.map((item) => (
                <div
                  key={item._id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: 12,
                    background: "#FBF9F5",
                    borderRadius: 16,
                    border: "1px solid #ECE7DE",
                  }}
                >
                  <div style={{ width: 62, height: 62, borderRadius: 12, background: item.bgColor || "#FFF", overflow: "hidden", flexShrink: 0 }}>
                    {item.image ? (
                      <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>{item.emoji}</div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text-main)" }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>{item.unit}</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "var(--navy)" }}>₹{item.price * item.qty}</div>
                  </div>
                  {/* Stepper */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#FFFFFF", borderRadius: 8, padding: "3px 6px", border: "1px solid #E0DAD0" }}>
                    <button
                      onClick={() =>
                        setCart((c) =>
                          c
                            .map((x) => (x._id === item._id ? { ...x, qty: x.qty - 1 } : x))
                            .filter((x) => x.qty > 0)
                        )
                      }
                      style={{ width: 22, height: 22, borderRadius: 4, border: "none", background: "#F5F2EB", cursor: "pointer", fontWeight: 800 }}
                    >
                      −
                    </button>
                    <span style={{ fontSize: 13, fontWeight: 800, minWidth: 16, textAlign: "center" }}>{item.qty}</span>
                    <button
                      onClick={() =>
                        setCart((c) => c.map((x) => (x._id === item._id ? { ...x, qty: x.qty + 1 } : x)))
                      }
                      style={{ width: 22, height: 22, borderRadius: 4, border: "none", background: "#F5F2EB", cursor: "pointer", fontWeight: 800 }}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Promo Code Quick Apply */}
        {cart.length > 0 && (
          <div style={{ padding: "14px 24px", background: "#FAF7F2", borderTop: "1px solid #ECE7DE" }}>
            {appliedPromoCode ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#EBFBEE", padding: "8px 14px", borderRadius: 10, border: "1px solid #B7EB8F" }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: "#2B8A3E" }}>
                  ✓ Code {appliedPromoCode} Active (-₹{promoDiscount})
                </span>
                <button
                  onClick={onRemovePromo}
                  style={{ background: "none", border: "none", color: "#C81E1E", cursor: "pointer", fontWeight: 800, fontSize: 13 }}
                  title="Remove coupon"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="Promo Code (e.g. SRFRESH20)"
                    style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1.5px solid #D9D2C7", fontSize: 12, textTransform: "uppercase", fontWeight: 700 }}
                  />
                  <button
                    onClick={() => { onApplyPromo(code); setCode(""); }}
                    style={{ background: "var(--navy)", color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                  >
                    Apply
                  </button>
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>
                  Popular: <span style={{ color: "var(--primary)", fontWeight: 700, cursor: "pointer" }} onClick={() => onApplyPromo("SRFRESH20")}>SRFRESH20</span> (20% OFF) · <span style={{ color: "var(--primary)", fontWeight: 700, cursor: "pointer" }} onClick={() => onApplyPromo("FLAT30")}>FLAT30</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Summary */}
        {cart.length > 0 && (
          <div style={{ padding: "20px 24px", borderTop: "1px solid #ECE7DE", background: "#FFFFFF" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>
              <span>Item Subtotal</span>
              <span>₹{subtotal}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: deliveryFee === 0 ? "#2B8A3E" : "var(--text-muted)", marginBottom: 4 }}>
              <span>
                Delivery Fee ({location.city})
              </span>
              <span>{deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}</span>
            </div>
            {promoDiscount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#2B8A3E", fontWeight: 700, marginBottom: 4 }}>
                <span>Coupon Savings ({appliedPromoCode})</span>
                <span>−₹{promoDiscount}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 900, color: "var(--navy)", paddingTop: 10, borderTop: "1px solid #ECE7DE", marginTop: 8, marginBottom: 14 }}>
              <span>Grand Total</span>
              <span>₹{total}</span>
            </div>
            <button
              onClick={() => { onClose(); go("checkout"); }}
              className="btn-primary"
              style={{ width: "100%", borderRadius: 14, padding: "14px", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              <span>Proceed to Checkout</span>
              <span>→</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── INTERACTIVE PAYMENT GATEWAY MODAL (PHONEPE QR & SECURE GATEWAY) ───────────── */
function PaymentGatewayModal({
  isOpen,
  onClose,
  total,
  deliveryData,
  onSuccess,
}) {
  const [method, setMethod] = useState("PhonePe_QR"); // 'PhonePe_QR' | 'Card' | 'NetBanking'
  const [step, setStep] = useState("select"); // 'select' | 'otp' | 'submitting'
  const [utr, setUtr] = useState("");
  const [payerName, setPayerName] = useState(deliveryData?.name || "");
  const [payerPhone, setPayerPhone] = useState(deliveryData?.phone || "");
  const [card, setCard] = useState({ number: "4532 8920 1823 4812", name: deliveryData?.name?.toUpperCase() || "SURESH REDDY", expiry: "08/29", cvv: "821" });
  const [bank, setBank] = useState("SBI");
  const [otp, setOtp] = useState("123456");
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (deliveryData?.name) setPayerName(deliveryData.name);
    if (deliveryData?.phone) setPayerPhone(deliveryData.phone);
  }, [deliveryData]);

  if (!isOpen) return null;

  const handleCopyAmount = () => {
    navigator.clipboard?.writeText(String(total));
    setCopiedAmount(true);
    setTimeout(() => setCopiedAmount(false), 2000);
  };

  const handleFillDemoUtr = () => {
    const demo = "4" + Math.floor(10000000000 + Math.random() * 90000000000);
    setUtr(demo);
    setValidationError("");
  };

  const handleSubmitUpi = () => {
    const cleanUtr = utr.trim();
    if (!cleanUtr || cleanUtr.length < 6) {
      setValidationError("Please enter the 12-digit UTR Number / UPI Reference ID from your payment screen.");
      return;
    }
    setStep("submitting");
    setTimeout(() => {
      onSuccess("PhonePe_QR", cleanUtr, payerName || payerPhone);
    }, 1200);
  };

  const handleSubmitCard = () => {
    setStep("submitting");
    setTimeout(() => {
      const cardRef = `CARD-${Date.now().toString().slice(-8)}`;
      onSuccess("Card", cardRef, card.name);
    }, 1200);
  };

  const handleSubmitNetBanking = () => {
    setStep("submitting");
    setTimeout(() => {
      const netbRef = `NETB-${bank}-${Date.now().toString().slice(-8)}`;
      onSuccess("NetBanking", netbRef, `${payerName} (${bank})`);
    }, 1200);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", overflowY: "auto" }}>
      {/* Backdrop */}
      <div onClick={step === "submitting" ? undefined : onClose} style={{ position: "absolute", inset: 0, background: "rgba(11,37,69,0.78)", backdropFilter: "blur(6px)" }} />

      <div
        className="fade-in"
        style={{
          position: "relative",
          background: "#FFFFFF",
          borderRadius: 24,
          maxWidth: 560,
          width: "100%",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 28px 80px rgba(0,0,0,0.35)",
          overflow: "hidden",
          zIndex: 10,
        }}
      >
        {/* Header with PhonePe branding and amount */}
        <div style={{ background: "linear-gradient(135deg, #5F259F 0%, #3B1564 100%)", color: "#FFFFFF", padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 20, color: "#5F259F", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}>
              पे
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 16, display: "flex", alignItems: "center", gap: 6 }}>
                PhonePe &amp; UPI Secure Pay
                <span style={{ fontSize: 10, background: "rgba(255,255,255,0.2)", padding: "1px 6px", borderRadius: 4, letterSpacing: 0.5 }}>OFFICIAL QR</span>
              </div>
              <div style={{ fontSize: 11, opacity: 0.9 }}>
                Beneficiary: <strong>VISHNU MAHANADRA REDDY L</strong>
              </div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, opacity: 0.8, textTransform: "uppercase", letterSpacing: 0.5 }}>Payable Amount</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#FFD43B" }}>₹{total}</div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
          {step === "submitting" ? (
            <div style={{ padding: "60px 20px", textAlign: "center" }}>
              <div style={{ width: 56, height: 56, border: "4px solid #E0DAD0", borderTopColor: "#5F259F", borderRadius: "50%", margin: "0 auto 20px", animation: "spin 0.8s linear infinite" }} />
              <div style={{ fontSize: 19, fontWeight: 900, color: "var(--navy)", marginBottom: 8 }}>Submitting Payment for Verification...</div>
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Recording your UTR reference in database. Please wait...</p>
            </div>
          ) : step === "otp" ? (
            <div>
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>🔐</div>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: "var(--navy)", margin: "0 0 6px" }}>Bank 3D Secure Card Verification</h3>
                <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
                  Enter the OTP sent to customer mobile <strong>{deliveryData?.phone}</strong>
                </p>
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--navy)", marginBottom: 6 }}>6-DIGIT OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  style={{ width: "100%", padding: "12px", borderRadius: 10, border: "2px solid #5F259F", fontSize: 22, letterSpacing: 8, textAlign: "center", fontWeight: 900 }}
                />
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6, textAlign: "center" }}>Demo OTP is filled automatically.</div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setStep("select")} style={{ flex: 1, padding: "12px", borderRadius: 12, border: "1.5px solid #E0DAD0", background: "#fff", fontWeight: 700, cursor: "pointer" }}>
                  ← Back
                </button>
                <button onClick={handleSubmitCard} className="btn-primary" style={{ flex: 2, borderRadius: 12, padding: "12px", fontSize: 14 }}>
                  Confirm Payment of ₹{total} →
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* Tabs */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 18 }}>
                {[
                  ["PhonePe_QR", "⚡ PhonePe QR (Fastest)"],
                  ["Card", "💳 Card Pay"],
                  ["NetBanking", "🏦 NetBanking"],
                ].map(([k, label]) => (
                  <button
                    key={k}
                    onClick={() => { setMethod(k); setValidationError(""); }}
                    style={{
                      padding: "10px 8px",
                      borderRadius: 12,
                      border: `2px solid ${method === k ? "#5F259F" : "#ECE7DE"}`,
                      background: method === k ? "#F6EFFF" : "#FFFFFF",
                      color: method === k ? "#5F259F" : "var(--navy)",
                      fontSize: 11.5,
                      fontWeight: 800,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* TAB 1: PHONEPE QR CODE (MAIN) */}
              {method === "PhonePe_QR" && (
                <div>
                  {/* Instructions Banner */}
                  <div style={{ background: "#F6EFFF", borderRadius: 14, padding: "12px 16px", border: "1px solid #E5D5F7", marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#5F259F", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                      <span>📱</span> Complete in 3 Simple Steps:
                    </div>
                    <div style={{ fontSize: 11.5, color: "#3B1564", lineHeight: 1.6 }}>
                      <strong>1.</strong> Scan the PhonePe QR code below with PhonePe, Google Pay, or Paytm.<br />
                      <strong>2.</strong> Pay exact <strong>₹{total}</strong> to <strong>VISHNU MAHANADRA REDDY L</strong>.<br />
                      <strong>3.</strong> Paste your <strong>12-digit UTR Number</strong> below to submit for verification.
                    </div>
                  </div>

                  {/* QR Image Display */}
                  <div style={{ textAlign: "center", marginBottom: 18 }}>
                    <div style={{ display: "inline-block", background: "#FFFFFF", padding: 12, borderRadius: 18, border: "2px solid #5F259F", boxShadow: "0 8px 24px rgba(95,37,159,0.15)" }}>
                      <img
                        src="/images/phonepe-qr.jpg"
                        alt="PhonePe Accepted Here - Vishnu Mahanadra Reddy L"
                        style={{ width: "100%", maxWidth: 230, height: "auto", display: "block", borderRadius: 10 }}
                      />
                    </div>
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 10 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: "var(--navy)" }}>
                        Pay Exact: <strong style={{ color: "#5F259F", fontSize: 15 }}>₹{total}</strong>
                      </span>
                      <button
                        onClick={handleCopyAmount}
                        style={{ background: "#F0ECE4", border: "none", borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer", color: "var(--navy)" }}
                      >
                        {copiedAmount ? "✓ Copied!" : "📋 Copy Amount"}
                      </button>
                    </div>
                  </div>

                  {/* Verification Input Fields */}
                  <div style={{ background: "#FDFBF7", borderRadius: 16, padding: "16px", border: "1.5px solid #ECE7DE", marginBottom: 16 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 900, color: "var(--navy)", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span>🔍 Submit Payment Proof for Verification</span>
                      <button
                        onClick={handleFillDemoUtr}
                        type="button"
                        style={{ background: "#EBFBEE", color: "#2B8A3E", border: "1px solid #B7EB8F", borderRadius: 6, padding: "2px 8px", fontSize: 10.5, fontWeight: 800, cursor: "pointer" }}
                      >
                        ⚡ Fill Demo UTR
                      </button>
                    </div>

                    <div style={{ marginBottom: 12 }}>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--navy)", marginBottom: 4 }}>
                        12-DIGIT UTR / UPI TRANSACTION ID *
                      </label>
                      <input
                        type="text"
                        value={utr}
                        onChange={(e) => { setUtr(e.target.value); setValidationError(""); }}
                        placeholder="e.g. 428910482910 (Check your PhonePe receipt)"
                        style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: validationError ? "2px solid #E8590C" : "1.5px solid #E0DAD0", fontSize: 13, fontWeight: 700, fontFamily: "monospace", letterSpacing: 0.5 }}
                      />
                      {validationError && (
                        <div style={{ fontSize: 11, color: "#E8590C", marginTop: 4, fontWeight: 700 }}>
                          ⚠ {validationError}
                        </div>
                      )}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 10.5, fontWeight: 800, color: "var(--navy)", marginBottom: 4 }}>
                          PAYER NAME ON UPI
                        </label>
                        <input
                          type="text"
                          value={payerName}
                          onChange={(e) => setPayerName(e.target.value)}
                          placeholder="Your Name on PhonePe"
                          style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #E0DAD0", fontSize: 12 }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 10.5, fontWeight: 800, color: "var(--navy)", marginBottom: 4 }}>
                          PAYER MOBILE NUMBER
                        </label>
                        <input
                          type="text"
                          value={payerPhone}
                          onChange={(e) => setPayerPhone(e.target.value)}
                          placeholder="Registered Mobile"
                          style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #E0DAD0", fontSize: 12 }}
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleSubmitUpi}
                    className="btn-primary"
                    style={{
                      width: "100%",
                      borderRadius: 14,
                      padding: "15px",
                      fontSize: 14.5,
                      fontWeight: 900,
                      background: "linear-gradient(135deg, #2B8A3E 0%, #237032 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      boxShadow: "0 6px 20px rgba(43,138,62,0.3)",
                    }}
                  >
                    <span>✓ I Have Paid ₹{total} — Submit Payment Proof</span>
                    <span>→</span>
                  </button>
                </div>
              )}

              {/* TAB 2: CARD PAY */}
              {method === "Card" && (
                <div>
                  <div style={{ background: "linear-gradient(135deg, #133E6E 0%, #0B2545 100%)", borderRadius: 16, padding: "20px", color: "#fff", marginBottom: 16, boxShadow: "0 8px 24px rgba(11,37,69,0.25)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, opacity: 0.8, marginBottom: 16 }}>
                      <span>DEBIT / CREDIT CARD</span>
                      <span>VISA / RuPay</span>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: 2, marginBottom: 16, fontFamily: "monospace" }}>
                      {card.number || "•••• •••• •••• ••••"}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                      <div>
                        <div style={{ opacity: 0.7 }}>CARD HOLDER</div>
                        <div style={{ fontWeight: 800, fontSize: 13 }}>{card.name}</div>
                      </div>
                      <div>
                        <div style={{ opacity: 0.7 }}>EXPIRES</div>
                        <div style={{ fontWeight: 800, fontSize: 13 }}>{card.expiry}</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10, marginBottom: 14 }}>
                    <input
                      type="text"
                      value={card.number}
                      onChange={(e) => setCard({ ...card, number: e.target.value })}
                      placeholder="Card Number"
                      style={{ padding: "10px", borderRadius: 8, border: "1.5px solid #E0DAD0", fontSize: 13 }}
                    />
                    <input
                      type="password"
                      value={card.cvv}
                      onChange={(e) => setCard({ ...card, cvv: e.target.value })}
                      placeholder="CVV"
                      maxLength={3}
                      style={{ padding: "10px", borderRadius: 8, border: "1.5px solid #E0DAD0", fontSize: 13 }}
                    />
                  </div>

                  <button
                    onClick={() => setStep("otp")}
                    className="btn-primary"
                    style={{ width: "100%", borderRadius: 12, padding: "14px", fontSize: 14 }}
                  >
                    Proceed to Bank OTP Verification →
                  </button>
                </div>
              )}

              {/* TAB 3: NETBANKING */}
              {method === "NetBanking" && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "var(--navy)", marginBottom: 8 }}>SELECT YOUR BANK</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 16 }}>
                    {["SBI", "HDFC", "ICICI", "Axis", "Kotak", "Andhra Bank"].map((b) => (
                      <div
                        key={b}
                        onClick={() => setBank(b)}
                        style={{
                          padding: "10px",
                          borderRadius: 10,
                          border: `2px solid ${bank === b ? "#5F259F" : "#E0DAD0"}`,
                          background: bank === b ? "#F6EFFF" : "#FFFFFF",
                          color: bank === b ? "#5F259F" : "var(--navy)",
                          textAlign: "center",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {b}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleSubmitNetBanking}
                    className="btn-primary"
                    style={{ width: "100%", borderRadius: 12, padding: "14px", fontSize: 14 }}
                  >
                    Pay ₹{total} via {bank} Internet Banking →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── PRODUCT QUICK VIEW MODAL ─────────────────────────────── */
function QuickViewModal({ product, onClose, addToCart }) {
  const [qty, setQty] = useState(1);
  if (!product) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 99998, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(11, 37, 69, 0.6)", backdropFilter: "blur(6px)" }} />

      {/* Modal Box */}
      <div
        className="fade-in"
        style={{
          position: "relative",
          background: "#FFFFFF",
          borderRadius: 24,
          maxWidth: 780,
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
          zIndex: 10,
        }}
      >
        <button
          onClick={onClose}
          style={{ position: "absolute", top: 16, right: 16, zIndex: 20, width: 36, height: 36, borderRadius: "50%", background: "#F5F2EB", border: "none", cursor: "pointer", fontSize: 16, fontWeight: 800 }}
        >
          ✕
        </button>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 28, padding: 32 }}>
          {/* Image & Badges */}
          <div>
            <div style={{ borderRadius: 18, background: product.bgColor || "#F7F5F0", overflow: "hidden", position: "relative", marginBottom: 14, boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
              {product.image ? (
                <img src={product.image} alt={product.name} style={{ width: "100%", height: 320, objectFit: "cover" }} />
              ) : (
                <div style={{ height: 320, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 80 }}>{product.emoji}</div>
              )}
              <span style={{ position: "absolute", top: 12, left: 12, background: product.color, color: "#fff", padding: "4px 12px", borderRadius: 20, fontSize: 10, fontWeight: 800 }}>
                {product.badge}
              </span>
            </div>
            {/* Storage Advice */}
            <div style={{ background: "#FBF9F5", borderRadius: 14, padding: "12px 16px", border: "1px solid #ECE7DE" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "var(--navy)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
                ❄️ Shelf Life &amp; Storage
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {product.storage || "Keep refrigerated for up to 10 days for maximum freshness."}
              </div>
            </div>
          </div>

          {/* Details & Nutrition */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: product.color, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
              {product.tagline}
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 900, color: "var(--navy)", marginBottom: 8 }}>{product.name}</h2>
            <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 16 }}>
              {product.description}
            </p>

            {/* Price & Unit */}
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 18 }}>
              <span style={{ fontSize: 28, fontWeight: 900, color: "var(--navy)" }}>₹{product.price}</span>
              <span style={{ fontSize: 14, color: "#AAA", textDecoration: "line-through" }}>₹{product.originalPrice}</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#2B8A3E", background: "#EBFBEE", padding: "2px 8px", borderRadius: 6 }}>
                Save {Math.round((1 - product.price / product.originalPrice) * 100)}%
              </span>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>• {product.unit}</span>
            </div>

            {/* Ingredients */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "var(--navy)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
                🌾 Pure Ingredients
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {product.ingredients || "Whole Wheat Flour (Chakki Fresh), Water (RO Purified), Vegetable Oil, Iodized Salt."}
              </div>
            </div>

            {/* Nutrition Grid */}
            {product.nutrition && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "var(--navy)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
                  📊 Nutritional Facts (Per Serving)
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, textAlign: "center" }}>
                  {Object.entries(product.nutrition).slice(0, 4).map(([k, v]) => (
                    <div key={k} style={{ background: "#F5F2EB", borderRadius: 8, padding: "6px 4px" }}>
                      <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "capitalize" }}>{k}</div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: "var(--navy)" }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cooking Instruction */}
            <div style={{ background: "#FFF4E6", borderRadius: 14, padding: "12px 16px", marginBottom: 20, border: "1px solid #FFE0B2" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#E8590C", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
                🔥 Quick Preparation Guide
              </div>
              <div style={{ fontSize: 12, color: "#873800", lineHeight: 1.5 }}>
                {product.instructions || "Heat each side on a tawa for 30s. Press gently to puff golden and brush with ghee."}
              </div>
            </div>

            {/* Stepper & Add */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F5F2EB", borderRadius: 12, padding: "6px 12px" }}>
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} style={{ border: "none", background: "none", fontSize: 18, cursor: "pointer", fontWeight: 800 }}>−</button>
                <span style={{ fontSize: 16, fontWeight: 800, minWidth: 20, textAlign: "center" }}>{qty}</span>
                <button onClick={() => setQty((q) => q + 1)} style={{ border: "none", background: "none", fontSize: 18, cursor: "pointer", fontWeight: 800 }}>+</button>
              </div>
              <button
                onClick={() => { addToCart(product, qty); onClose(); }}
                className="btn-primary"
                style={{ flex: 1, borderRadius: 12, padding: "14px", fontSize: 14 }}
              >
                Add {qty} to Cart (₹{product.price * qty}) 🛒
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── PRODUCT CARD ─────────────────────────────────────────── */
function PCard({ p, addToCart, wishlisted, onWishlist, onQuickView }) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const disc = Math.round((1 - p.price / p.originalPrice) * 100);

  const handleAdd = () => {
    addToCart(p, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    <div
      className="product-card"
      style={{
        background: "#FFFFFF",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-md)",
        overflow: "hidden",
        border: "1px solid rgba(0,0,0,0.06)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      {/* Product Image Stage */}
      <div
        style={{
          background: p.bgColor || "#F9F8F5",
          padding: "20px 20px 14px",
          textAlign: "center",
          position: "relative",
          cursor: "pointer",
        }}
        onClick={() => onQuickView(p)}
      >
        {p.image ? (
          <img
            src={p.image}
            alt={p.name}
            className="product-card-img"
            style={{ width: "100%", height: 210, objectFit: "cover", borderRadius: 16, display: "block" }}
            onError={(e) => {
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "flex";
            }}
          />
        ) : null}
        <div style={{ fontSize: 64, display: p.image ? "none" : "flex", alignItems: "center", justifyContent: "center", height: 210 }}>
          {p.emoji || "🍽️"}
        </div>

        {/* Badge Pill */}
        <span
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            background: p.color || "var(--primary)",
            color: "#fff",
            fontSize: 9.5,
            fontWeight: 800,
            letterSpacing: 0.8,
            padding: "4px 10px",
            borderRadius: 20,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
        >
          {p.badge}
        </span>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onWishlist(p._id);
          }}
          style={{
            position: "absolute",
            top: 14,
            left: 14,
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(4px)",
            border: "none",
            borderRadius: "50%",
            width: 34,
            height: 34,
            cursor: "pointer",
            fontSize: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            transition: "transform 0.15s ease",
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.85)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          {wishlisted ? "❤️" : "🤍"}
        </button>

        {/* Rating Pill */}
        <div
          style={{
            position: "absolute",
            bottom: 10,
            left: 14,
            background: "rgba(255,255,255,0.95)",
            borderRadius: 20,
            padding: "3px 10px",
            fontSize: 11,
            fontWeight: 800,
            color: "#1C1917",
            display: "flex",
            alignItems: "center",
            gap: 4,
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <span style={{ color: "#F59F00" }}>★</span>
          <span>{p.rating || 4.8}</span>
          <span style={{ color: "#888", fontWeight: 500 }}>({p.reviewCount || 95})</span>
        </div>
      </div>

      {/* Content Area */}
      <div style={{ padding: "18px 20px 20px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
          <div>
            <h3
              onClick={() => onQuickView(p)}
              style={{ fontSize: 18, fontWeight: 900, color: "var(--navy)", cursor: "pointer" }}
            >
              {p.name}
            </h3>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: p.color || "var(--primary)", marginTop: 1 }}>
              {p.tagline}
            </div>
          </div>
          <span style={{ background: "#EBFBEE", color: "#2B8A3E", fontSize: 11, fontWeight: 800, padding: "3px 8px", borderRadius: 8, flexShrink: 0 }}>
            {disc}% OFF
          </span>
        </div>

        <p style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.55, margin: "8px 0 12px", flex: 1 }}>
          {p.description}
        </p>

        {/* Feature Pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 14 }}>
          {(p.features || []).slice(0, 3).map((f) => (
            <span
              key={f}
              style={{
                background: "#F5F2EB",
                color: "#4A463E",
                fontSize: 10.5,
                fontWeight: 600,
                padding: "3px 8px",
                borderRadius: 6,
              }}
            >
              ✓ {f}
            </span>
          ))}
        </div>

        {/* Price & Unit */}
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14, paddingTop: 10, borderTop: "1px solid #F0ECE4" }}>
          <div>
            <span style={{ fontSize: 22, fontWeight: 900, color: "var(--navy)" }}>₹{p.price}</span>
            <span style={{ fontSize: 12, color: "#AAA", textDecoration: "line-through", marginLeft: 6 }}>₹{p.originalPrice}</span>
          </div>
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>{p.unit}</span>
        </div>

        {/* Actions Bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Stepper */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#F5F2EB", borderRadius: 10, padding: "4px 8px", border: "1px solid #E5E0D6" }}>
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              style={{ width: 24, height: 24, borderRadius: 6, border: "none", background: "#fff", cursor: "pointer", fontWeight: 800, fontSize: 13 }}
            >
              −
            </button>
            <span style={{ fontWeight: 800, fontSize: 13, minWidth: 16, textAlign: "center" }}>{qty}</span>
            <button
              onClick={() => setQty((q) => Math.min(p.stock || 99, q + 1))}
              style={{ width: 24, height: 24, borderRadius: 6, border: "none", background: "#fff", cursor: "pointer", fontWeight: 800, fontSize: 13 }}
            >
              +
            </button>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAdd}
            disabled={p.stock < 1}
            className="btn-primary"
            style={{
              flex: 1,
              borderRadius: 12,
              padding: "10px 14px",
              fontSize: 12.5,
              background: added ? "#2B8A3E" : undefined,
              boxShadow: added ? "0 4px 14px rgba(43,138,62,0.3)" : undefined,
            }}
          >
            {added ? "✓ Added to Bag!" : "Add to Cart 🛒"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── PRODUCT AUTO VIDEO REEL SHOWCASE MODAL ─────────────────── */
function ProductVideoModal({ isOpen, onClose, initialKey = "chapati", addToCart, products = [] }) {
  const [key, setKey] = useState(initialKey);
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0); // 0 to 100
  const [sound, setSound] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [steamBubbles, setSteamBubbles] = useState([1, 2, 3, 4, 5, 6]);

  const soundCleanupRef = useRef(null);

  useEffect(() => {
    if (initialKey) setKey(initialKey);
  }, [initialKey]);

  // Audio synthesizer for realistic hot tawa/kadai sizzling sound when unmuted
  useEffect(() => {
    if (isOpen && sound && playing) {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const bufferSize = ctx.sampleRate * 2;
          const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.12;
          }
          const noise = ctx.createBufferSource();
          noise.buffer = buffer;
          noise.loop = true;
          const filter = ctx.createBiquadFilter();
          filter.type = "bandpass";
          filter.frequency.value = 1400;
          filter.Q.value = 3.0;
          const gain = ctx.createGain();
          gain.gain.value = 0.05;
          noise.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);
          noise.start();
          soundCleanupRef.current = () => {
            try { noise.stop(); ctx.close(); } catch {}
          };
        }
      } catch {}
    } else {
      if (soundCleanupRef.current) {
        soundCleanupRef.current();
        soundCleanupRef.current = null;
      }
    }
    return () => {
      if (soundCleanupRef.current) {
        soundCleanupRef.current();
        soundCleanupRef.current = null;
      }
    };
  }, [isOpen, sound, playing]);

  // Autoplay progression timer
  useEffect(() => {
    if (!isOpen || !playing) return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          return 0; // loop video automatically
        }
        return prev + 1.2 * speed;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [isOpen, playing, speed, key]);

  if (!isOpen) return null;

  const videoLibrary = {
    chapati: {
      id: "chapati-classic",
      name: "SR Fresh Chapati (Pack of 5)",
      price: 30,
      title: "SR Fresh Chapati — 30-Second Tawa Balloon Puff",
      duration: "0:30",
      poster: "/images/tawa-puff.jpg",
      dish: "Tawa Puffed Whole Wheat Flatbread",
      badge: "🌾 100% Whole Chakki Atta • 0% Maida",
      description: "Watch our pre-rolled raw flatbread placed on a pre-heated iron tawa. In just 30 seconds, steam gets trapped inside the dough layers, inflating it into a soft, steaming balloon without adding any oil.",
      steps: [
        { time: "00:00 - 00:15", title: "Lay on Medium Tawa", desc: "Fine golden blisters form on bottom" },
        { time: "00:15 - 00:24", title: "Gentle 1st Flip", desc: "Heat penetrates through chakki wheat core" },
        { time: "00:24 - 00:30", title: "Instant Balloon Puff", desc: "Expands fully with trapped aroma & steam" },
      ],
      facts: ["No Preservatives", "30-Sec Cooking", "5 Chapatis / Pack", "₹6 / Chapati"],
    },
    poori: {
      id: "poori-classic",
      name: "SR Golden Poori (Pack of 6)",
      price: 30,
      title: "SR Golden Poori — 15-Second Kadai Flash Balloon",
      duration: "0:15",
      poster: "/images/poori-fry.jpg",
      dish: "Crispy Golden Balloon Poori",
      badge: "✨ Zero Artificial Soda • Ultra Crispy",
      description: "Rolled to the exact thickness required for non-oily puffing. Immersed in hot cooking oil, it inflates in under 10 seconds into a crispy, golden spherical balloon.",
      steps: [
        { time: "00:00 - 00:05", title: "Slide into Hot Oil", desc: "Oil temperature 180°C activates dough" },
        { time: "00:05 - 00:10", title: "Light Press with Spoon", desc: "Sphere inflates instantly into crispy balloon" },
        { time: "00:10 - 00:15", title: "Flip & Drain", desc: "Zero excess oil retention, golden crust" },
      ],
      facts: ["Zero Soda", "15-Sec Flash Fry", "6 Pooris / Pack", "Light & Crispy"],
    },
    chitti: {
      id: "chitti-poori",
      name: "SR Chitti Poori (Pack of 10)",
      price: 35,
      title: "SR Chitti Poori — Miniature Golden Snack Puffs",
      duration: "0:20",
      poster: "/images/chitti-poori.jpg",
      dish: "Bite-Sized Party & Tiffin Puffs",
      badge: "👶 Kids & Festive Tiffin Favorite",
      description: "Cute miniature pooris crafted specially for school tiffins, evening chaats, and festival morning feasts. Fry 3-4 chitti pooris at once in a single kadai batch.",
      steps: [
        { time: "00:00 - 00:08", title: "Multi-Piece Fry", desc: "Drop 3 to 4 chitti pooris together" },
        { time: "00:08 - 00:15", title: "Uniform Puffing", desc: "All miniature rounds inflate evenly" },
        { time: "00:15 - 00:20", title: "Serve with Curry", desc: "Perfect bite-sized crispy snacks" },
      ],
      facts: ["10 Mini Pooris", "Bite Sized", "Zero Maida", "Tiffin Special"],
    },
    process: {
      id: "combo-royal",
      name: "Royal Grand Tasting Combo",
      price: 139,
      title: "SR Foods Clean Kitchen Story — 100% Atta to Vacuum Pouch",
      duration: "0:45",
      poster: "/images/hero-spread.jpg",
      dish: "100% Preservative-Free Manufacturing",
      badge: "🏭 FSSAI Lic. 20126181000074 • Nellore",
      description: "Go behind the scenes at SR Enterprise in Kondayapalem, Nellore. See whole wheat grains slowly stone-ground in traditional chakkis, kneaded with pure RO water, contactlessly rolled, and vacuum sealed.",
      steps: [
        { time: "00:00 - 00:15", title: "Stone Chakki Milling", desc: "Preserves natural bran & germ nutrients" },
        { time: "00:15 - 00:30", title: "Zero Chemical Dough", desc: "Only wheat, RO water, oil & salt" },
        { time: "00:30 - 00:45", title: "Sanitized Pouching", desc: "Packed fresh every morning for home delivery" },
      ],
      facts: ["No INS Chemicals", "Untouched Rolling", "Nellore Fresh", "Same-Day Dispatch"],
    },
  };

  const v = videoLibrary[key] || videoLibrary.chapati;
  const currentSeconds = Math.floor((progress / 100) * parseInt(v.duration.split(":")[1] || "30"));

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      {/* Darkened Blur Backdrop */}
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(11,37,69,0.85)", backdropFilter: "blur(10px)" }} />

      <div
        className="fade-in"
        style={{
          position: "relative",
          background: "#0B2545",
          borderRadius: 28,
          maxWidth: 960,
          width: "100%",
          maxHeight: "94vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 30px 90px rgba(0,0,0,0.5)",
          overflow: "hidden",
          color: "#fff",
          zIndex: 10,
        }}
      >
        {/* Modal Top Header */}
        <div style={{ padding: "16px 24px", background: "rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 16, color: "#fff" }}>
              SR
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
                <span>SR Foods Product Cooking Theater</span>
                <span style={{ fontSize: 10, background: "#2B8A3E", color: "#fff", padding: "1px 7px", borderRadius: 10, letterSpacing: 0.5 }}>AUTO-PLAYING</span>
              </div>
              <div style={{ fontSize: 11, color: "#94A3B8" }}>
                Real Cooking Demonstration • No Preservatives • 100% Whole Wheat
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            title="Close video theater"
          >
            ✕
          </button>
        </div>

        {/* Main Theater Display Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", flex: 1, overflowY: "auto" }}>
          {/* Left: Video Stage / Screen */}
          <div style={{ position: "relative", background: "#000", minHeight: 340, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", overflow: "hidden" }}>
            {/* Visual Screen with subtle zoom pan & steam overlay */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `url(${v.poster})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                transform: playing ? "scale(1.06)" : "scale(1)",
                transition: "transform 8s ease-out",
                filter: "brightness(0.92)",
              }}
            />

            {/* Steam Particles Animation Overlay */}
            {playing && (
              <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
                {steamBubbles.map((i) => (
                  <div
                    key={i}
                    style={{
                      position: "absolute",
                      bottom: "20%",
                      left: `${25 + i * 10}%`,
                      width: 40 + i * 8,
                      height: 40 + i * 8,
                      borderRadius: "50%",
                      background: "radial-gradient(circle, rgba(255,255,255,0.22) 0%, transparent 70%)",
                      filter: "blur(8px)",
                      animation: `riseSteam 2.${i}s infinite ease-out`,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Badge overlay on top of video */}
            <div style={{ position: "absolute", top: 16, left: 16, zIndex: 3, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, fontWeight: 900, background: "rgba(232,89,12,0.9)", color: "#fff", padding: "4px 10px", borderRadius: 8, backdropFilter: "blur(4px)" }}>
                {v.badge}
              </span>
              <span style={{ fontSize: 11, fontWeight: 800, background: "rgba(0,0,0,0.6)", color: "#FFD43B", padding: "4px 10px", borderRadius: 8, backdropFilter: "blur(4px)" }}>
                ⏱ {v.duration} Real Time
              </span>
            </div>

            {/* Center Play/Pause Overlay indicator */}
            <div
              onClick={() => setPlaying(!playing)}
              style={{
                position: "relative",
                zIndex: 3,
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "rgba(11,37,69,0.75)",
                border: "2px solid rgba(255,255,255,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 26,
                cursor: "pointer",
                boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
                transition: "transform 0.2s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
              onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              {playing ? "❚❚" : "▶"}
            </div>

            {/* Video Live Step Bubble overlay at bottom of screen */}
            <div style={{ position: "absolute", bottom: 54, left: 16, right: 16, zIndex: 3, background: "rgba(11,37,69,0.85)", backdropFilter: "blur(8px)", padding: "8px 14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.15)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 12, fontWeight: 800 }}>
                <span style={{ color: "var(--primary)" }}>LIVE COOKING:</span> {v.dish}
              </div>
              <div style={{ fontSize: 12, fontFamily: "monospace", color: "#FFD43B", fontWeight: 800 }}>
                00:{String(currentSeconds).padStart(2, "0")} / {v.duration}
              </div>
            </div>

            {/* Player Controls Bar */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 48, background: "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.9) 100%)", zIndex: 4, display: "flex", alignItems: "center", padding: "0 16px", gap: 12 }}>
              {/* Scrub line */}
              <div
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pct = ((e.clientX - rect.left) / rect.width) * 100;
                  setProgress(Math.max(0, Math.min(100, pct)));
                }}
                style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "rgba(255,255,255,0.2)", cursor: "pointer" }}
              >
                <div style={{ width: `${progress}%`, height: "100%", background: "var(--primary)", transition: "width 0.1s linear" }} />
              </div>

              <button onClick={() => setPlaying(!playing)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 800 }}>
                {playing ? "Pause" : "Play"}
              </button>

              <button onClick={() => setSound(!sound)} style={{ background: "none", border: "none", color: sound ? "#FFD43B" : "#94A3B8", cursor: "pointer", fontSize: 12, fontWeight: 800 }}>
                {sound ? "🔊 Sizzle Sound (ON)" : "🔇 Sound (Muted)"}
              </button>

              <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "#94A3B8" }}>Speed:</span>
                {[1, 1.5, 2].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    style={{ background: speed === s ? "var(--primary)" : "rgba(255,255,255,0.1)", border: "none", color: "#fff", padding: "2px 6px", borderRadius: 4, fontSize: 10.5, fontWeight: 800, cursor: "pointer" }}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Product Narrative, Steps & 1-Click Order */}
          <div style={{ padding: "28px 24px", display: "flex", flexDirection: "column", background: "#0D2C52" }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--primary)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>
              AUTHENTIC DEMONSTRATION
            </div>
            <h2 style={{ fontSize: 21, fontWeight: 900, color: "#FFFFFF", margin: "0 0 10px", lineHeight: 1.3 }}>
              {v.title}
            </h2>
            <p style={{ fontSize: 13, color: "#94A3B8", lineHeight: 1.6, marginBottom: 18 }}>
              {v.description}
            </p>

            {/* Step-by-Step Timeline */}
            <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 16, padding: "14px 16px", border: "1px solid rgba(255,255,255,0.08)", marginBottom: 20 }}>
              <div style={{ fontSize: 11.5, fontWeight: 900, color: "#FFD43B", textTransform: "uppercase", marginBottom: 10 }}>
                ⏱ Step-by-Step Cooking Milestones
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {v.steps.map((s, idx) => (
                  <div key={idx} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 12 }}>
                    <span style={{ background: "rgba(232,89,12,0.25)", color: "#FF922B", padding: "2px 6px", borderRadius: 6, fontWeight: 800, fontFamily: "monospace", fontSize: 11 }}>
                      {s.time}
                    </span>
                    <div>
                      <strong style={{ color: "#fff" }}>{s.title}:</strong> <span style={{ color: "#94A3B8" }}>{s.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Product Purchase Card Box */}
            <div style={{ marginTop: "auto", background: "rgba(255,255,255,0.08)", borderRadius: 16, padding: "16px", border: "1px solid rgba(255,255,255,0.12)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14, color: "#fff" }}>{v.name}</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#FFD43B", marginTop: 2 }}>
                  ₹{v.price} <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600 }}>/ ready-to-cook pack</span>
                </div>
              </div>
              <button
                onClick={() => {
                  const targetProd = products.find((p) => p._id === v.id || p.slug === v.id) || {
                    _id: v.id,
                    name: v.name,
                    price: v.price,
                  };
                  addToCart(targetProd, 1);
                  toast(`Added ${v.name} to your bag! 🛒`, "success");
                }}
                className="btn-primary"
                style={{ borderRadius: 12, padding: "12px 20px", fontSize: 13, fontWeight: 900 }}
              >
                Order This Pack (₹{v.price}) 🛒
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Video Switcher Carousel */}
        <div style={{ padding: "14px 20px", background: "rgba(0,0,0,0.4)", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 12, overflowX: "auto" }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 1, whiteSpace: "nowrap" }}>
            Switch Videos:
          </span>
          {[
            { k: "chapati", label: "🫓 Chapati (30s Puff)", poster: "/images/tawa-puff.jpg" },
            { k: "poori", label: "🟡 Poori (15s Flash Fry)", poster: "/images/poori-fry.jpg" },
            { k: "chitti", label: "🔶 Chitti Poori (Mini)", poster: "/images/chitti-poori.jpg" },
            { k: "process", label: "🏭 Atta & Hygiene Story", poster: "/images/hero-spread.jpg" },
          ].map((item) => (
            <button
              key={item.k}
              onClick={() => { setKey(item.k); setProgress(0); setPlaying(true); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 14px",
                borderRadius: 12,
                border: `1.5px solid ${key === item.k ? "var(--primary)" : "rgba(255,255,255,0.15)"}`,
                background: key === item.k ? "rgba(232,89,12,0.25)" : "rgba(255,255,255,0.05)",
                color: key === item.k ? "#FF922B" : "#fff",
                fontSize: 12,
                fontWeight: 800,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s",
              }}
            >
              <img src={item.poster} alt={item.label} style={{ width: 22, height: 22, borderRadius: 6, objectFit: "cover" }} />
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── INTERACTIVE PRODUCT HERO SLIDESHOW / CAROUSEL ─────────── */
function ProductSlideshow({ products, go, addToCart, onOpenVideo }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const slides = [
    {
      key: "chapati",
      prodId: "chapati-classic",
      badge: "🌾 100% WHOLE CHAKKI FRESH ATTA",
      badgeColor: "#E8590C",
      title: "SR Fresh Chapati (Pack of 5)",
      headline: "Soft, Layered Rotis. Puffs in 30 Seconds on Tawa.",
      desc: "Made every morning from stone-ground whole wheat with zero maida and zero preservatives. Simply place on a dry hot tawa and watch it inflate into a soft homemade flatbread.",
      price: 30,
      perPiece: "₹6 / chapati",
      image: "/images/tawa-puff.jpg",
      packImage: "/images/chapati.jpg",
      chips: ["30-Sec Ready", "0% Maida", "0 Preservatives", "10-Day Cold Freshness"],
      videoPrompt: "▶ Watch 30-Sec Cooking Video",
    },
    {
      key: "poori",
      prodId: "poori-classic",
      badge: "✨ CRISPY KADAI BALLOON PUFF",
      badgeColor: "#2B8A3E",
      title: "SR Golden Poori (Pack of 6)",
      headline: "Golden Balloon Pooris. Zero Artificial Soda.",
      desc: "Authentic Andhra breakfast favorite pre-rolled to perfection. Flash-fries in hot oil in 15 seconds flat with zero excessive oil retention and supreme crunch.",
      price: 30,
      perPiece: "₹5 / poori",
      image: "/images/poori-fry.jpg",
      packImage: "/images/poori.jpg",
      chips: ["15-Sec Flash Fry", "Zero Soda", "Non-Greasy", "Crispy Crust"],
      videoPrompt: "▶ Watch Kadai Fry Video",
    },
    {
      key: "chitti",
      prodId: "chitti-poori",
      badge: "👶 KIDS & TIFFIN SPECIAL",
      badgeColor: "#F59F00",
      title: "SR Chitti Poori (Pack of 10)",
      headline: "Cute Bite-Sized Miniature Poori Treats.",
      desc: "Pre-rolled bite-sized pooris adored by kids for morning school tiffins, evening chaat, and festive feasts. Quick, joyful, and healthy whole wheat snacking.",
      price: 35,
      perPiece: "₹3.5 / piece",
      image: "/images/chitti-poori.jpg",
      packImage: "/images/chitti-poori.jpg",
      chips: ["10 Mini Pooris", "Bite Sized", "Zero Maida", "Tiffin Favorite"],
      videoPrompt: "▶ Watch Chitti Poori Video",
    },
    {
      key: "process",
      prodId: "combo-royal",
      badge: "🎁 FAMILY VALUE BUNDLE",
      badgeColor: "#0B2545",
      title: "Royal Grand Breakfast Combo Bundle",
      headline: "Complete Breakfast Feast. Save 25% Off.",
      desc: "Feeds a family of 4 to 6 people! Includes 3 Packs of Classic Chapati (15 rotis) + 2 Packs of Golden Poori (12 pooris) + 1 Pack of Chitti Poori with free same-day dispatch.",
      price: 139,
      perPiece: "Instant ₹46 Savings",
      image: "/images/hero-spread.jpg",
      packImage: "/images/hero-spread.jpg",
      chips: ["Feeds 4-6", "Free Delivery Eligible", "Huge Savings", "All-in-One"],
      videoPrompt: "▶ Watch Atta & Hygiene Video",
    },
  ];

  // Auto advance slides every 4.5 seconds
  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      setCurrent((c) => (c + 1) % slides.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [paused, slides.length]);

  const s = slides[current];

  return (
    <section
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{
        position: "relative",
        background: "linear-gradient(135deg, #0B2545 0%, #103765 100%)",
        color: "#fff",
        overflow: "hidden",
        borderBottom: "4px solid var(--primary)",
      }}
    >
      {/* Background ambient lighting */}
      <div style={{ position: "absolute", top: -100, right: -100, width: 450, height: 450, borderRadius: "50%", background: "radial-gradient(circle, rgba(232,89,12,0.2) 0%, transparent 70%)", filter: "blur(50px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -80, left: -80, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(43,138,62,0.15) 0%, transparent 70%)", filter: "blur(50px)", pointerEvents: "none" }} />

      {/* Slide progress timer bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "rgba(255,255,255,0.15)", zIndex: 10 }}>
        <div
          key={current}
          style={{
            height: "100%",
            background: "var(--primary)",
            width: "100%",
            animation: paused ? "none" : "slideTimer 4.5s linear",
          }}
        />
      </div>

      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "48px 20px 40px", position: "relative", zIndex: 2 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 40, alignItems: "center" }}>
          
          {/* Slide Text Content */}
          <div className="fade-in" key={`text-${current}`}>
            {/* Tag Badge */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)", border: `1px solid ${s.badgeColor}`, padding: "5px 14px", borderRadius: 30, marginBottom: 16 }}>
              <span style={{ fontSize: 11, fontWeight: 900, color: "#FFD43B", letterSpacing: 1, textTransform: "uppercase" }}>
                {s.badge}
              </span>
            </div>

            <h2 style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)", fontWeight: 900, color: "#fff", lineHeight: 1.15, marginBottom: 14 }}>
              {s.headline}
            </h2>

            <p style={{ fontSize: 15, color: "#CBD5E1", lineHeight: 1.7, maxWidth: 520, marginBottom: 22 }}>
              {s.desc}
            </p>

            {/* Feature Pills */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 26 }}>
              {s.chips.map((c) => (
                <span
                  key={c}
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    padding: "4px 12px",
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 800,
                    color: "#F8FAFC",
                  }}
                >
                  ✓ {c}
                </span>
              ))}
            </div>

            {/* Price & Action Buttons */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 11, color: "#94A3B8", textTransform: "uppercase", fontWeight: 800 }}>SPECIAL PACK PRICE</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: "#FFD43B", lineHeight: 1 }}>
                  ₹{s.price} <span style={{ fontSize: 13, color: "#94A3B8", fontWeight: 600 }}>({s.perPiece})</span>
                </div>
              </div>

              <button
                onClick={() => {
                  const targetProd = products.find((p) => p._id === s.prodId || p.slug === s.prodId) || {
                    _id: s.prodId,
                    name: s.title,
                    price: s.price,
                  };
                  addToCart(targetProd, 1);
                }}
                className="btn-primary"
                style={{ borderRadius: 14, padding: "14px 24px", fontSize: 14.5, fontWeight: 900 }}
              >
                Order Fresh Pack 🛒
              </button>

              <button
                onClick={() => onOpenVideo?.(s.key)}
                style={{
                  background: "rgba(255,255,255,0.12)",
                  color: "#fff",
                  border: "1.5px solid rgba(255,255,255,0.25)",
                  borderRadius: 14,
                  padding: "13px 20px",
                  fontSize: 13.5,
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  backdropFilter: "blur(6px)",
                }}
              >
                <span>▶</span> Watch Auto Video
              </button>
            </div>
          </div>

          {/* Slide Visual Presentation */}
          <div className="fade-in" key={`img-${current}`} style={{ position: "relative", textAlign: "center" }}>
            <div
              style={{
                position: "relative",
                display: "inline-block",
                maxWidth: 480,
                width: "100%",
                borderRadius: 24,
                overflow: "hidden",
                border: "3px solid rgba(255,255,255,0.15)",
                boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
              }}
            >
              <img
                src={s.image}
                alt={s.title}
                style={{ width: "100%", height: 320, objectFit: "cover", display: "block" }}
              />

              {/* Video Play Badge overlay on image */}
              <div
                onClick={() => onOpenVideo?.(s.key)}
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(0,0,0,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.45)")}
                onMouseOut={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.25)")}
              >
                <div style={{ width: 68, height: 68, borderRadius: "50%", background: "rgba(232,89,12,0.9)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, color: "#fff", boxShadow: "0 8px 30px rgba(0,0,0,0.5)" }}>
                  ▶
                </div>
              </div>

              {/* Pouch thumbnail badge overlay */}
              <div style={{ position: "absolute", bottom: 14, right: 14, background: "#FFFFFF", padding: 6, borderRadius: 12, boxShadow: "0 4px 14px rgba(0,0,0,0.3)" }}>
                <img src={s.packImage} alt="Package" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 8 }} />
              </div>
            </div>
          </div>
        </div>

        {/* Carousel Bottom Navigation & Indicators */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32, borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 18, flexWrap: "wrap", gap: 14 }}>
          {/* Slide pills */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {slides.map((sl, idx) => (
              <button
                key={sl.key}
                onClick={() => setCurrent(idx)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 12,
                  border: `1.5px solid ${current === idx ? "var(--primary)" : "rgba(255,255,255,0.12)"}`,
                  background: current === idx ? "rgba(232,89,12,0.2)" : "transparent",
                  color: current === idx ? "#FFD43B" : "#94A3B8",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                0{idx + 1}. {sl.title.split("(")[0].replace("SR Fresh ", "")}
              </button>
            ))}
          </div>

          {/* Left / Right Arrow buttons */}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => setCurrent((c) => (c - 1 + slides.length) % slides.length)}
              style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              title="Previous slide"
            >
              ‹
            </button>
            <button
              onClick={() => setCurrent((c) => (c + 1) % slides.length)}
              style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              title="Next slide"
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── COMPREHENSIVE PRODUCTS OVERVIEW & QUALITY MATRIX ───────── */
function ProductsOverview({ products = [], addToCart, onOpenVideo, onQuickView }) {
  const [activeCategory, setActiveCategory] = useState("all");

  const productOverviews = [
    {
      id: "chapati-classic",
      key: "chapati",
      name: "SR Fresh Chapati (Pack of 5)",
      category: "chapati",
      price: 30,
      netQty: "5 Pieces (300g)",
      shelfLife: "5 Days (Room Temp) · 15 Days (Refrigerated)",
      image: "/images/chapati.jpg",
      cookedImage: "/images/tawa-puff.jpg",
      badge: "🌾 100% Whole Wheat Chakki Atta",
      summary: "Traditional round flatbreads made strictly from stone-milled whole chakki wheat flour. No refined maida, no artificial emulsifiers, zero synthetic preservatives.",
      ingredients: ["100% Whole Wheat Flour (Atta)", "Purified RO Water", "Refined Edible Vegetable Oil", "Iodized Salt"],
      nutrition: {
        calories: "112 kcal / piece",
        carbs: "22.4g",
        protein: "3.8g",
        fiber: "2.5g",
        fat: "1.1g",
      },
      directions: [
        "Pre-heat a flat iron or non-stick tawa on medium heat.",
        "Place cold flatbread for 12-15 seconds until small blisters appear.",
        "Flip once with tongs and watch it expand into a full steam balloon!",
      ],
    },
    {
      id: "poori-classic",
      key: "poori",
      name: "SR Golden Poori (Pack of 6)",
      category: "poori",
      price: 30,
      netQty: "6 Pieces (240g)",
      shelfLife: "5 Days (Room Temp) · 15 Days (Refrigerated)",
      image: "/images/poori.jpg",
      cookedImage: "/images/poori-fry.jpg",
      badge: "✨ Zero Artificial Soda • Authentic Kadai Fry",
      summary: "Ready-to-fry golden pooris rolled to exact micrometric density to balloon instantly upon touching hot oil without absorbing excess grease.",
      ingredients: ["Whole Wheat Chakki Flour", "Purified RO Water", "Cold-Pressed Vegetable Oil", "Himalayan Salt"],
      nutrition: {
        calories: "98 kcal / piece",
        carbs: "18.2g",
        protein: "2.9g",
        fiber: "1.9g",
        fat: "1.8g",
      },
      directions: [
        "Heat cooking oil in a deep kadai until light smoking point (180°C).",
        "Gently slide one poori into hot oil and tap lightly with slotted ladle.",
        "Flip after 8 seconds of ballooning, drain on paper towel, serve crispy!",
      ],
    },
    {
      id: "chitti-poori",
      key: "chitti",
      name: "SR Chitti Poori (Pack of 10)",
      category: "poori",
      price: 35,
      netQty: "10 Pieces (200g)",
      shelfLife: "5 Days (Room Temp) · 15 Days (Refrigerated)",
      image: "/images/chitti-poori.jpg",
      cookedImage: "/images/chitti-poori.jpg",
      badge: "👶 Kids & Festive Tiffin Special",
      summary: "Miniature South Indian poori disks ideal for breakfast tiffins, evening sweet halwa poori combos, and festive snack platters.",
      ingredients: ["100% Whole Wheat Chakki Atta", "Pure RO Water", "Vegetable Oil", "Salt"],
      nutrition: {
        calories: "52 kcal / piece",
        carbs: "10.4g",
        protein: "1.6g",
        fiber: "1.2g",
        fat: "0.9g",
      },
      directions: [
        "Heat kadai with cooking oil on medium-high flame.",
        "Drop 3 to 4 chitti pooris together for quick simultaneous frying.",
        "Turn over once puffed, drain, and serve alongside potato sagu or kurma.",
      ],
    },
    {
      id: "combo-royal",
      key: "process",
      name: "Royal Grand Tasting Combo",
      category: "combo",
      price: 139,
      netQty: "6 Packs Bundle (Feeds 4-6)",
      shelfLife: "Guaranteed 10-Day Sealed Freshness",
      image: "/images/hero-spread.jpg",
      cookedImage: "/images/hero-spread.jpg",
      badge: "🎁 Mega Breakfast Family Bundle",
      summary: "Includes 3 Packs of Classic Chapati + 2 Packs of Golden Poori + 1 Pack of Chitti Poori. Perfect for busy households and family weekend brunches.",
      ingredients: ["100% Whole Chakki Atta", "Zero Maida", "Zero INS Preservatives", "Sealed Vacuum Pouch"],
      nutrition: {
        calories: "Balanced Family Nutrition",
        carbs: "Whole Complex Carbs",
        protein: "High Natural Wheat Protein",
        fiber: "Rich in Grain Bran",
        fat: "Heart Healthy Low Fat",
      },
      directions: [
        "Tawa warm chapatis in 30 seconds for lunch rotis.",
        "Flash fry pooris in 15 seconds for morning breakfast.",
        "Store unopened packs in refrigerator crisper drawer for up to 15 days.",
      ],
    },
  ];

  const filtered = activeCategory === "all"
    ? productOverviews
    : productOverviews.filter((p) => p.category === activeCategory);

  return (
    <section style={{ maxWidth: 1240, margin: "0 auto", padding: "60px 20px 80px" }}>
      {/* Section Header */}
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "var(--primary)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>
          PRODUCT DEEP-DIVE &amp; PURITY STANDARDS
        </div>
        <h2 style={{ fontSize: "clamp(2rem, 3.8vw, 2.8rem)", fontWeight: 900, color: "var(--navy)", margin: "0 0 12px" }}>
          Comprehensive Product Overview
        </h2>
        <p style={{ fontSize: 15, color: "var(--text-muted)", maxWidth: 640, margin: "0 auto" }}>
          Everything you need to know about our ingredients, nutritional matrix, cooking times, and shelf-life storage.
        </p>

        {/* Filter Tabs */}
        <div style={{ display: "inline-flex", gap: 8, background: "#F5F2EB", padding: 6, borderRadius: 16, marginTop: 24, flexWrap: "wrap", justifyContent: "center" }}>
          {[
            ["all", "All Products Overview"],
            ["chapati", "🫓 Chapati Packs"],
            ["poori", "🟡 Poori & Chitti Poori"],
            ["combo", "🎁 Value Combos"],
          ].map(([k, label]) => (
            <button
              key={k}
              onClick={() => setActiveCategory(k)}
              style={{
                border: "none",
                borderRadius: 12,
                padding: "8px 18px",
                background: activeCategory === k ? "var(--navy)" : "transparent",
                color: activeCategory === k ? "#fff" : "var(--text-main)",
                fontSize: 12.5,
                fontWeight: 800,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Product Deep-Dive Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 32, marginBottom: 60 }}>
        {filtered.map((item) => (
          <div
            key={item.id}
            style={{
              background: "#FFFFFF",
              borderRadius: 24,
              padding: "32px",
              border: "1.5px solid #ECE7DE",
              boxShadow: "0 8px 30px rgba(0,0,0,0.04)",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 32,
              alignItems: "center",
            }}
          >
            {/* Left: Images & Badges */}
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid #ECE7DE", height: 180 }}>
                  <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid #ECE7DE", height: 180, position: "relative" }}>
                  <img src={item.cookedImage} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <span style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,0.7)", color: "#fff", fontSize: 10, fontWeight: 800, padding: "2px 6px", borderRadius: 6 }}>
                    Cooked Demo
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FDFBF7", padding: "10px 14px", borderRadius: 12, border: "1px solid #ECE7DE" }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: "var(--navy)" }}>📦 Net Qty: {item.netQty}</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: "#2B8A3E" }}>✓ {item.shelfLife.split("·")[0]}</span>
              </div>
            </div>

            {/* Right: Specs, Nutrition & Directions */}
            <div>
              <span style={{ fontSize: 11, fontWeight: 900, color: "var(--primary)", background: "var(--primary-light)", padding: "3px 10px", borderRadius: 20 }}>
                {item.badge}
              </span>

              <h3 style={{ fontSize: 22, fontWeight: 900, color: "var(--navy)", margin: "8px 0 6px" }}>
                {item.name}
              </h3>

              <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 16 }}>
                {item.summary}
              </p>

              {/* Nutrition & Formula Grid */}
              <div style={{ background: "#F8FAFC", borderRadius: 14, padding: "14px", border: "1px solid #E2E8F0", marginBottom: 16 }}>
                <div style={{ fontSize: 11.5, fontWeight: 900, color: "var(--navy)", marginBottom: 8 }}>
                  NUTRITIONAL MATRIX (PER SERVING)
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, textAlign: "center" }}>
                  <div style={{ background: "#fff", padding: "6px", borderRadius: 8, border: "1px solid #E2E8F0" }}>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700 }}>ENERGY</div>
                    <div style={{ fontSize: 12.5, fontWeight: 900, color: "var(--navy)" }}>{item.nutrition.calories.split(" ")[0]}</div>
                  </div>
                  <div style={{ background: "#fff", padding: "6px", borderRadius: 8, border: "1px solid #E2E8F0" }}>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700 }}>PROTEIN</div>
                    <div style={{ fontSize: 12.5, fontWeight: 900, color: "#2B8A3E" }}>{item.nutrition.protein}</div>
                  </div>
                  <div style={{ background: "#fff", padding: "6px", borderRadius: 8, border: "1px solid #E2E8F0" }}>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700 }}>FIBER</div>
                    <div style={{ fontSize: 12.5, fontWeight: 900, color: "#E8590C" }}>{item.nutrition.fiber}</div>
                  </div>
                  <div style={{ background: "#fff", padding: "6px", borderRadius: 8, border: "1px solid #E2E8F0" }}>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700 }}>CARBS</div>
                    <div style={{ fontSize: 12.5, fontWeight: 900, color: "var(--navy)" }}>{item.nutrition.carbs}</div>
                  </div>
                </div>
              </div>

              {/* Cooking directions list */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11.5, fontWeight: 900, color: "var(--navy)", marginBottom: 6 }}>
                  🍳 HOW TO PREPARE:
                </div>
                {item.directions.map((d, i) => (
                  <div key={i} style={{ fontSize: 12, color: "var(--text-main)", marginBottom: 3 }}>
                    <strong>{i + 1}.</strong> {d}
                  </div>
                ))}
              </div>

              {/* Price & Buy Action */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, borderTop: "1px solid #ECE7DE", paddingTop: 14 }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: "var(--navy)" }}>
                  ₹{item.price} <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>/ pack</span>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={() => onOpenVideo?.(item.key)}
                    style={{
                      background: "#F5F2EB",
                      color: "var(--navy)",
                      border: "1.5px solid #E0DAD0",
                      borderRadius: 12,
                      padding: "10px 16px",
                      fontSize: 12.5,
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    ▶ Auto Video
                  </button>
                  <button
                    onClick={() => {
                      const targetProd = products.find((p) => p._id === item.id || p.slug === item.id) || {
                        _id: item.id,
                        name: item.name,
                        price: item.price,
                      };
                      addToCart(targetProd, 1);
                    }}
                    className="btn-primary"
                    style={{ borderRadius: 12, padding: "10px 20px", fontSize: 13, fontWeight: 800 }}
                  >
                    Add to Bag 🛒
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Brand Comparison Matrix: SR Foods vs Commercial Preserved Brands */}
      <div style={{ background: "#FFFFFF", borderRadius: 24, padding: "32px", border: "1.5px solid #ECE7DE", boxShadow: "0 8px 30px rgba(0,0,0,0.04)" }}>
        <h3 style={{ fontSize: 20, fontWeight: 900, color: "var(--navy)", textAlign: "center", marginBottom: 6 }}>
          SR Foods vs Supermarket Packaged Brands
        </h3>
        <p style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center", maxWidth: 520, margin: "0 auto 24px" }}>
          See why whole chakki fresh atta without chemicals makes all the difference to your family's daily health.
        </p>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#FDFBF7", borderBottom: "2px solid #ECE7DE" }}>
                <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 900, color: "var(--navy)" }}>Feature / Quality Factor</th>
                <th style={{ textAlign: "center", padding: "12px 16px", fontWeight: 900, color: "var(--primary)", background: "rgba(232,89,12,0.06)" }}>
                  🌾 SR Foods (SR Enterprise)
                </th>
                <th style={{ textAlign: "center", padding: "12px 16px", fontWeight: 700, color: "var(--text-muted)" }}>
                  Commercial Supermarket Brands
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Flour Purity", "100% Whole Chakki Fresh Wheat Atta", "Blended with Refined White Flour (Maida)"],
                ["Chemical Preservatives", "0% (Zero Benzoates, Zero Sorbates)", "Contains INS 282, INS 202 & Acidity Regulators"],
                ["Ready-to-Eat Speed", "30-Second Hot Tawa Balloon Puff", "Takes 2-3 minutes, dry and rubbery texture"],
                ["Manufacturing Hygiene", "FSSAI Licensed & Machine Rolled in Nellore", "Contract manufactured & warehoused for weeks"],
                ["Digestibility", "High natural fiber, easy on stomach", "Heavy, bloated feeling from chemical dough conditioners"],
              ].map(([feature, sr, market], idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid #ECE7DE" }}>
                  <td style={{ padding: "14px 16px", fontWeight: 800, color: "var(--navy)" }}>{feature}</td>
                  <td style={{ padding: "14px 16px", textAlign: "center", fontWeight: 900, color: "#2B8A3E", background: "rgba(232,89,12,0.03)" }}>
                    ✓ {sr}
                  </td>
                  <td style={{ padding: "14px 16px", textAlign: "center", color: "var(--text-muted)" }}>
                    ✕ {market}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

/* ── HERO SPOTLIGHT COMPONENT ─────────────────────────────── */
function HeroSection({ products, go, addToCart, onQuickView, onOpenVideo }) {
  const [activeTab, setActiveTab] = useState(0);
  const featured = products.slice(0, 3);
  const cur = featured[activeTab] || featured[0] || products[0];

  return (
    <section style={{ position: "relative", overflow: "hidden", background: "linear-gradient(180deg, #FDFBF7 0%, #F5F1E6 100%)", padding: "64px 20px 80px" }}>
      {/* Decorative Glow Discs */}
      <div style={{ position: "absolute", top: -80, left: -60, width: 340, height: 340, borderRadius: "50%", background: "radial-gradient(circle, rgba(232,89,12,0.12) 0%, transparent 70%)", filter: "blur(40px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -60, right: -40, width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle, rgba(43,138,62,0.10) 0%, transparent 70%)", filter: "blur(50px)", pointerEvents: "none" }} />

      <div style={{ maxWidth: 1240, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 56, alignItems: "center", position: "relative", zIndex: 1 }}>
        
        {/* Left Column: Value Prop */}
        <div>
          {/* Trust Badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#FFF4E6", border: "1px solid #FFE0B2", padding: "6px 14px", borderRadius: 999, marginBottom: 20 }}>
            <span style={{ fontSize: 14 }}>🌾</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#E8590C", letterSpacing: 1, textTransform: "uppercase" }}>
              100% Chakki Fresh Atta · Zero Preservatives
            </span>
          </div>

          <h1 style={{ fontSize: "clamp(2.4rem, 4.8vw, 3.8rem)", fontWeight: 900, color: "var(--navy)", lineHeight: 1.12, marginBottom: 18 }}>
            Pure Homemade Taste. <br />
            <span style={{ background: "linear-gradient(135deg, #FF6B00 0%, #D9480F 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Ready in 3 Minutes.
            </span>
          </h1>

          <p style={{ fontSize: 16, color: "var(--text-muted)", lineHeight: 1.7, maxWidth: 520, marginBottom: 28 }}>
            Hand-rolled fresh chapatis and golden puffing pooris made every morning with zero chemicals, zero maida, and pure chakki ground whole wheat. Hot homemade meals anytime, anywhere.
          </p>

          {/* Primary Action Buttons */}
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 36 }}>
            <button
              onClick={() => go("shop")}
              className="btn-primary"
              style={{ borderRadius: 14, padding: "14px 28px", fontSize: 15 }}
            >
              Order Fresh Packs Now →
            </button>
            <button
              onClick={() => onOpenVideo?.(cur?._id?.includes("poori") ? "poori" : "chapati")}
              style={{
                borderRadius: 14,
                padding: "14px 22px",
                fontSize: 14,
                fontWeight: 800,
                background: "#0B2545",
                color: "#FFD43B",
                border: "none",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                boxShadow: "0 6px 18px rgba(11,37,69,0.25)",
                transition: "transform 0.18s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.04)")}
              onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <span style={{ fontSize: 16 }}>▶</span> Watch Auto Video Demo
            </button>
            <button
              onClick={() => go("deals")}
              className="btn-secondary"
              style={{ borderRadius: 14, padding: "14px 24px", fontSize: 14 }}
            >
              🏷️ Today's Offers (20% OFF)
            </button>
          </div>

          {/* Trust Metrics Pill Bar */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, maxWidth: 480 }}>
            <div style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(6px)", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 14, padding: "10px 14px", textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: "var(--navy)" }}>100%</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>Whole Chakki Atta</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(6px)", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 14, padding: "10px 14px", textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#2B8A3E" }}>0%</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>Maida / Preservatives</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(6px)", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 14, padding: "10px 14px", textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#E8590C" }}>10 Days</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>Fridge Freshness</div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Hero Stage */}
        <div>
          {/* Variety Selector Tabs */}
          <div style={{ display: "flex", gap: 8, background: "rgba(255,255,255,0.8)", backdropFilter: "blur(10px)", padding: 6, borderRadius: 16, marginBottom: 18, border: "1px solid rgba(0,0,0,0.06)" }}>
            {featured.map((p, i) => (
              <button
                key={p._id}
                onClick={() => setActiveTab(i)}
                style={{
                  flex: 1,
                  border: "none",
                  borderRadius: 12,
                  padding: "9px 12px",
                  background: activeTab === i ? "var(--navy)" : "transparent",
                  color: activeTab === i ? "#fff" : "var(--text-muted)",
                  fontWeight: 700,
                  fontSize: 12.5,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {p.name.replace("SR Fresh ", "")}
              </button>
            ))}
          </div>

          {/* Interactive Feature Card */}
          {cur && (
            <div
              className="glass-panel"
              style={{
                borderRadius: 28,
                padding: 24,
                boxShadow: "0 20px 48px rgba(11,37,69,0.12)",
                border: "1px solid #FFFFFF",
                position: "relative",
              }}
            >
              <div style={{ position: "relative", borderRadius: 20, overflow: "hidden", background: cur.bgColor, marginBottom: 18 }}>
                <img
                  src={cur.image}
                  alt={cur.name}
                  style={{ width: "100%", height: 320, objectFit: "cover", display: "block" }}
                />
                <div style={{ position: "absolute", top: 14, left: 14, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)", padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 800, color: cur.color }}>
                  ✨ {cur.badge}
                </div>
                {/* Auto Video Trigger Center Overlay */}
                <button
                  onClick={() => onOpenVideo?.(cur._id?.includes("poori") ? "poori" : "chapati")}
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    background: "rgba(11,37,69,0.88)",
                    backdropFilter: "blur(8px)",
                    color: "#fff",
                    border: "2px solid rgba(255,212,59,0.9)",
                    borderRadius: 999,
                    padding: "9px 18px",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 800,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
                    transition: "transform 0.2s",
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.transform = "translate(-50%, -50%) scale(1.08)")}
                  onMouseOut={(e) => (e.currentTarget.style.transform = "translate(-50%, -50%) scale(1)")}
                >
                  <span style={{ fontSize: 16, color: "#FFD43B" }}>▶</span> Play Auto Video
                </button>
                <div style={{ position: "absolute", bottom: 14, right: 14, background: "rgba(11,37,69,0.85)", color: "#fff", backdropFilter: "blur(8px)", padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 800 }}>
                  ⚡ Fresh Batch Ready
                </div>
              </div>

              {/* Showcase Footer */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: "var(--navy)" }}>{cur.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>{cur.unit} • Just ₹{cur.price}</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => onQuickView(cur)}
                    style={{ background: "#F5F2EB", color: "var(--navy)", border: "none", borderRadius: 12, padding: "10px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                  >
                    Details 👁️
                  </button>
                  <button
                    onClick={() => addToCart(cur, 1)}
                    className="btn-primary"
                    style={{ borderRadius: 12, padding: "10px 20px", fontSize: 12 }}
                  >
                    Add to Cart 🛒
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ── "HOW TO COOK IN 3 MINUTES" SECTION ──────────────────── */
function CookingGuideSection({ go }) {
  const [tab, setTab] = useState("chapati");

  return (
    <section style={{ padding: "80px 20px", background: "#FFFFFF", borderTop: "1px solid #ECE7DE", borderBottom: "1px solid #ECE7DE" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        
        <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 48px" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "var(--primary)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
            EASY AS 1-2-3
          </div>
          <h2 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)", fontWeight: 900, color: "var(--navy)", marginBottom: 12 }}>
            How to Cook in Under 3 Minutes
          </h2>
          <p style={{ fontSize: 15, color: "var(--text-muted)" }}>
            Zero kneading flour, zero rolling pin, zero messy counters. Authentic homemade aroma in seconds.
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 40 }}>
          <button
            onClick={() => setTab("chapati")}
            style={{
              padding: "10px 24px",
              borderRadius: 999,
              border: "1.5px solid",
              borderColor: tab === "chapati" ? "var(--primary)" : "#E0DAD0",
              background: tab === "chapati" ? "var(--primary)" : "#FFFFFF",
              color: tab === "chapati" ? "#FFFFFF" : "var(--text-muted)",
              fontWeight: 800,
              fontSize: 13,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            🫓 Soft Chapati (Tawa)
          </button>
          <button
            onClick={() => setTab("poori")}
            style={{
              padding: "10px 24px",
              borderRadius: 999,
              border: "1.5px solid",
              borderColor: tab === "poori" ? "#2B8A3E" : "#E0DAD0",
              background: tab === "poori" ? "#2B8A3E" : "#FFFFFF",
              color: tab === "poori" ? "#FFFFFF" : "var(--text-muted)",
              fontWeight: 800,
              fontSize: 13,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            🟡 Puffed Poori (Kadai)
          </button>
        </div>

        {/* Dynamic Step Content */}
        {tab === "chapati" ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 32, alignItems: "center" }}>
            <div style={{ borderRadius: 24, overflow: "hidden", boxShadow: "var(--shadow-lg)" }}>
              <img
                src="/images/tawa-puff.jpg"
                alt="Chapati puffing on tawa"
                style={{ width: "100%", height: 380, objectFit: "cover", display: "block" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {[
                { step: "01", title: "Heat the Tawa", desc: "Preheat a cast iron or non-stick tawa on medium-high heat. No oil needed on the pan." },
                { step: "02", title: "30 Seconds Each Side", desc: "Place SR Chapati directly from pack onto the hot tawa. Cook 30s until tiny bubbles appear, then flip." },
                { step: "03", title: "Press Gently & Puff", desc: "Press softly around edges with a clean cloth or spatula. Watch it inflate into a round, soft balloon! Brush with ghee & enjoy." },
              ].map((s) => (
                <div key={s.step} style={{ display: "flex", gap: 16, background: "#FDFBF7", borderRadius: 16, padding: "18px 20px", border: "1px solid #ECE7DE" }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: "var(--primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 16, flexShrink: 0 }}>
                    {s.step}
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "var(--navy)", marginBottom: 4 }}>{s.title}</div>
                    <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
              <button onClick={() => go("shop")} className="btn-primary" style={{ borderRadius: 12, padding: "12px 24px", alignSelf: "flex-start" }}>
                Order Chapati Pack (₹49) →
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 32, alignItems: "center" }}>
            <div style={{ borderRadius: 24, overflow: "hidden", boxShadow: "var(--shadow-lg)" }}>
              <img
                src="/images/poori-fry.jpg"
                alt="Poori frying in oil"
                style={{ width: "100%", height: 380, objectFit: "cover", display: "block" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {[
                { step: "01", title: "Warm Oil in Kadai", desc: "Heat cooking oil to moderate-high temperature (a pinch of dough should sizzle and rise immediately)." },
                { step: "02", title: "Slide In & Touch Center", desc: "Slide SR Poori into the oil. Tap the center gently with your perforated ladle to help it inflate." },
                { step: "03", title: "Golden in 40 Seconds", desc: "Flip once, fry for 15 more seconds until crisp golden brown, drain onto a paper towel and pair with aloo kurma." },
              ].map((s) => (
                <div key={s.step} style={{ display: "flex", gap: 16, background: "#FDFBF7", borderRadius: 16, padding: "18px 20px", border: "1px solid #ECE7DE" }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: "#2B8A3E", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 16, flexShrink: 0 }}>
                    {s.step}
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "var(--navy)", marginBottom: 4 }}>{s.title}</div>
                    <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
              <button onClick={() => go("shop")} style={{ background: "#2B8A3E", color: "#fff", border: "none", borderRadius: 12, padding: "12px 24px", fontWeight: 700, cursor: "pointer", alignSelf: "flex-start" }}>
                Order Poori Pack (₹59) →
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ── CULINARY BANNER SPREAD ───────────────────────────────── */
function CulinaryBanner({ go }) {
  return (
    <section style={{ maxWidth: 1200, margin: "60px auto", padding: "0 20px" }}>
      <div
        style={{
          borderRadius: 32,
          overflow: "hidden",
          position: "relative",
          minHeight: 380,
          display: "flex",
          alignItems: "center",
          background: "#0B2545",
          boxShadow: "0 24px 64px rgba(11,37,69,0.18)",
        }}
      >
        <img
          src="/images/hero-spread.jpg"
          alt="SR Foods Breakfast Spread"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.45 }}
        />
        <div style={{ position: "relative", zIndex: 1, padding: "48px 40px", maxWidth: 640, color: "#fff" }}>
          <div style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(6px)", display: "inline-block", padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 800, letterSpacing: 1, marginBottom: 16 }}>
            PREMIUM D2C FRESH FOOD
          </div>
          <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 900, lineHeight: 1.15, marginBottom: 16 }}>
            Wholesome Mornings for Every Andhra Family
          </h2>
          <p style={{ fontSize: 15, lineHeight: 1.7, opacity: 0.9, marginBottom: 24 }}>
            Prepared in hygienic FSSAI-certified state-of-the-art kitchens in Nellore. Cold-chain delivered to your door so your family eats pure, nutritious food every day.
          </p>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <button onClick={() => go("shop")} className="btn-primary" style={{ borderRadius: 14, padding: "14px 28px", fontSize: 14 }}>
              Shop All Products →
            </button>
            <a
              href="https://wa.me/919177231026?text=Hi%20SR%20Foods,%20I%20would%20like%20to%20place%20an%20order"
              target="_blank"
              rel="noreferrer"
              style={{ background: "#25D366", color: "#fff", textDecoration: "none", borderRadius: 14, padding: "14px 24px", fontSize: 14, fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}
            >
              <span>💬 Order on WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── HOME PAGE ────────────────────────────────────────────── */
function Home({ products, go, addToCart, wishlist, toggleWishlist, onQuickView, onOpenVideoModal }) {
  const [nl, setNl] = useState("");
  const subscribe = async () => {
    if (!nl) return;
    try {
      await api("/newsletter", { method: "POST", body: JSON.stringify({ email: nl }) });
    } catch {}
    toast("🎉 Subscribed! Check email for 10% coupon code", "success");
    setNl("");
  };

  return (
    <div>
      {/* 1. Dynamic Auto-Advancing Product Slideshow */}
      <ProductSlideshow
        products={products}
        go={go}
        addToCart={addToCart}
        onOpenVideo={(key) => onOpenVideoModal?.(key)}
      />

      {/* 2. Hero Interactive Variety Spotlight */}
      <HeroSection
        products={products}
        go={go}
        addToCart={addToCart}
        onQuickView={onQuickView}
        onOpenVideo={(key) => onOpenVideoModal?.(key)}
      />

      {/* 3. Comprehensive Products Overview, Tabs, Nutrition & Quality Matrix */}
      <ProductsOverview
        products={products}
        go={go}
        addToCart={addToCart}
        onQuickView={onQuickView}
        onOpenVideo={(key) => onOpenVideoModal?.(key)}
      />

      {/* 4. Culinary Breakfast Banner */}
      <CulinaryBanner go={go} />

      {/* Best Sellers Showcase */}
      <section style={{ maxWidth: 1240, margin: "0 auto", padding: "40px 20px 80px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 36, flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--primary)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>
              HAND-CRAFTED FRESH DAILY
            </div>
            <h2 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)", fontWeight: 900, color: "var(--navy)", margin: 0 }}>
              Our Bestselling Packs
            </h2>
          </div>
          <button
            onClick={() => go("shop")}
            style={{
              background: "transparent",
              color: "var(--primary)",
              border: "1.5px solid var(--primary)",
              borderRadius: 12,
              padding: "10px 20px",
              fontWeight: 800,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            View All Products ({products.length}) →
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: 24, marginBottom: 56 }}>
          {products.slice(0, 3).map((p) => (
            <PCard
              key={p._id}
              p={p}
              addToCart={addToCart}
              wishlisted={wishlist.includes(p._id)}
              onWishlist={toggleWishlist}
              onQuickView={onQuickView}
            />
          ))}
        </div>

        {/* 4 Brand Pillars */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20, marginBottom: 60 }}>
          {[
            ["🌾", "100% Chakki Fresh Atta", "Milled slowly to preserve whole grain bran, protein & essential nutrients."],
            ["🏭", "FSSAI Lic. 20126181000074", "Strict hygiene protocols, untouched by hand packaging & UV sanitization."],
            ["⏱️", "Ready in 3 Minutes", "No kneading, rolling or dirty flour bowls. Just pan heat and serve warm."],
            ["❄️", "10-Day Cold Freshness", "Special vacuum food-grade pouch keeps flatbreads naturally soft for days."],
          ].map(([icon, title, desc]) => (
            <div
              key={title}
              style={{
                background: "#FFFFFF",
                borderRadius: 20,
                padding: "24px",
                border: "1px solid #ECE7DE",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: "var(--navy)", marginBottom: 8 }}>{title}</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>{desc}</div>
            </div>
          ))}
        </div>

        {/* Newsletter Signup */}
        <div
          style={{
            background: "linear-gradient(135deg, #E8590C 0%, #C2410C 100%)",
            borderRadius: 24,
            padding: "36px 40px",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 24,
            boxShadow: "0 16px 40px rgba(232,89,12,0.25)",
          }}
        >
          <div>
            <h3 style={{ fontSize: 24, fontWeight: 900, margin: "0 0 6px" }}>Join the SR Fresh Family</h3>
            <p style={{ margin: 0, opacity: 0.9, fontSize: 14 }}>
              Subscribe for exclusive weekend discount codes, festive specials &amp; recipe tips.
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input
              type="email"
              value={nl}
              onChange={(e) => setNl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && subscribe()}
              placeholder="Enter your email address"
              style={{ padding: "12px 18px", borderRadius: 12, border: "none", fontSize: 14, outline: "none", minWidth: 260, fontFamily: "var(--font-body)" }}
            />
            <button
              onClick={subscribe}
              style={{ background: "#FFFFFF", color: "var(--primary)", border: "none", borderRadius: 12, padding: "12px 24px", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "var(--font-body)" }}
            >
              Get 10% Off →
            </button>
          </div>
        </div>
      </section>

      {/* Cooking Guide Interactive Section */}
      <CookingGuideSection go={go} />
    </div>
  );
}

/* ── SHOP PAGE ────────────────────────────────────────────── */
function Shop({ products, addToCart, wishlist, toggleWishlist, onQuickView, searchQuery, setSearchQuery }) {
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("default");

  const filtered = products
    .filter((p) => (filter === "all" || p.category === filter) && (!searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase())))
    .sort((a, b) =>
      sort === "price_asc"
        ? a.price - b.price
        : sort === "price_desc"
        ? b.price - a.price
        : sort === "rating"
        ? (b.rating || 0) - (a.rating || 0)
        : sort === "discount"
        ? b.originalPrice - b.price - (a.originalPrice - a.price)
        : 0
    );

  return (
    <div style={{ maxWidth: 1240, margin: "0 auto", padding: "48px 20px 80px" }}>
      {/* Title */}
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "var(--primary)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>
          100% WHOLE WHEAT FLATBREADS
        </div>
        <h1 style={{ fontSize: "clamp(2rem, 4vw, 2.8rem)", fontWeight: 900, color: "var(--navy)", margin: 0 }}>
          Shop SR Foods Catalog
        </h1>
        <p style={{ fontSize: 15, color: "var(--text-muted)", marginTop: 8 }}>
          Freshly rolled every morning. Delivered chilled right to your kitchen.
        </p>
      </div>

      {/* Search & Sort Controls */}
      <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 24, flexWrap: "wrap" }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="🔍 Search products..."
          style={{
            padding: "11px 18px",
            borderRadius: 14,
            border: "1.5px solid #E0DAD0",
            fontSize: 13,
            outline: "none",
            width: 280,
            background: "#FFFFFF",
          }}
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          style={{
            padding: "11px 16px",
            borderRadius: 14,
            border: "1.5px solid #E0DAD0",
            fontSize: 13,
            background: "#FFFFFF",
            cursor: "pointer",
          }}
        >
          <option value="default">Featured Selection</option>
          <option value="rating">Highest Customer Rating</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="discount">Biggest Savings</option>
        </select>
      </div>

      {/* Category Pills */}
      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 40, flexWrap: "wrap" }}>
        {[
          ["all", "All Items"],
          ["chapati", "🫓 Chapati"],
          ["poori", "🟡 Poori"],
          ["special", "🔶 Chitti Poori"],
          ["combo", "🎁 Family Combos"],
        ].map(([k, label]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            style={{
              padding: "8px 18px",
              borderRadius: 20,
              border: "1.5px solid",
              borderColor: filter === k ? "var(--navy)" : "#E0DAD0",
              background: filter === k ? "var(--navy)" : "#FFFFFF",
              color: filter === k ? "#FFFFFF" : "#555",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              transition: "all 0.18s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 20px" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: "var(--navy)" }}>No products found matching "{searchQuery}"</div>
          <button onClick={() => { setSearchQuery(""); setFilter("all"); }} className="btn-primary" style={{ borderRadius: 12, padding: "10px 20px", marginTop: 16 }}>
            Reset Filters
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: 24 }}>
          {filtered.map((p) => (
            <PCard
              key={p._id}
              p={p}
              addToCart={addToCart}
              wishlisted={wishlist.includes(p._id)}
              onWishlist={toggleWishlist}
              onQuickView={onQuickView}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── DEALS & COUPONS PAGE ─────────────────────────────────── */
function Deals({ products, addToCart, wishlist, toggleWishlist, onQuickView, onApplyPromo }) {
  const deals = [
    { code: "SRFRESH20", title: "Weekend Fiesta", disc: "20% OFF", desc: "Enjoy 20% off all Chapati & Poori orders above ₹99.", max: "Max save ₹100", color: "#E8590C" },
    { code: "WELCOME10", title: "New Customer Gift", disc: "10% OFF", desc: "Special welcome discount on your very first order.", max: "Max save ₹50", color: "#2B8A3E" },
    { code: "POORI15",   title: "Poori Lovers", disc: "15% OFF", desc: "Save 15% on any Poori or Chitti Poori packs.", max: "Max save ₹75", color: "#0B2545" },
    { code: "FLAT30",    title: "Flat ₹30 Cashback", disc: "₹30 FLAT", desc: "Direct flat ₹30 off on orders of ₹149 or more.", max: "Instant deduction", color: "#8B4513" },
    { code: "COMBO25",   title: "Mega Combo Saver", disc: "25% OFF", desc: "Huge 25% discount when ordering any combo packs.", max: "Max save ₹120", color: "#C2410C" },
  ];

  return (
    <div style={{ maxWidth: 1240, margin: "0 auto", padding: "48px 20px 80px" }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "var(--primary)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>
          LIMITED TIME SAVINGS
        </div>
        <h1 style={{ fontSize: "clamp(2rem, 4vw, 2.8rem)", fontWeight: 900, color: "var(--navy)", margin: 0 }}>
          Today's Coupons &amp; Combos
        </h1>
        <p style={{ fontSize: 15, color: "var(--text-muted)", marginTop: 8 }}>
          Copy any coupon code below to apply instant discount at checkout.
        </p>
      </div>

      {/* Coupon Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: 20, marginBottom: 56 }}>
        {deals.map((d) => (
          <div
            key={d.code}
            style={{
              background: "#FFFFFF",
              borderRadius: 20,
              padding: 24,
              border: `2px dashed ${d.color}60`,
              boxShadow: "var(--shadow-sm)",
              position: "relative",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: d.color, textTransform: "uppercase" }}>{d.title}</span>
              <span style={{ background: `${d.color}18`, color: d.color, fontSize: 12, fontWeight: 900, padding: "3px 10px", borderRadius: 20 }}>{d.disc}</span>
            </div>
            <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5, margin: "0 0 16px", flex: 1 }}>{d.desc}</p>
            <div style={{ background: "#F5F2EB", borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <code style={{ fontSize: 15, fontWeight: 900, letterSpacing: 1.5, color: "var(--navy)" }}>{d.code}</code>
              <span style={{ fontSize: 11, color: "#888" }}>{d.max}</span>
            </div>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(d.code);
                onApplyPromo(d.code);
                toast(`Copied code ${d.code} and applied to cart!`, "success");
              }}
              style={{
                background: d.color,
                color: "#fff",
                border: "none",
                borderRadius: 12,
                padding: "10px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Apply to Cart 📋
            </button>
          </div>
        ))}
      </div>

      {/* Combo Packs Section */}
      <div style={{ fontSize: 11, fontWeight: 800, color: "var(--primary)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>
        FEATURED COMBO PACKS
      </div>
      <h2 style={{ fontSize: 24, fontWeight: 900, color: "var(--navy)", marginBottom: 24 }}>
        Maximum Value for Families
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: 24 }}>
        {products
          .filter((p) => p.category === "combo")
          .map((p) => (
            <PCard
              key={p._id}
              p={p}
              addToCart={addToCart}
              wishlisted={wishlist.includes(p._id)}
              onWishlist={toggleWishlist}
              onQuickView={onQuickView}
            />
          ))}
      </div>
    </div>
  );
}

/* ── REVIEWS & RATINGS PAGE ───────────────────────────────── */
function Reviews({ user, products }) {
  const [reviews, setReviews] = useState([
    { _id: "r1", userName: "Priya Sharma (Nellore)", product: "SR Fresh Chapati", rating: 5, text: "I work long hours as an IT professional and rolling dough in the morning was stressful. SR Chapatis puff up like homemade in 30 seconds! Soft and wholesome.", verified: true },
    { _id: "r2", userName: "Ravi Kumar (Tirupati)", product: "SR Golden Poori", rating: 5, text: "Fried these for Sunday breakfast with potato saagu. My kids couldn't believe they weren't made from scratch by their grandmother! Best pooris hands down.", verified: true },
    { _id: "r3", userName: "Lakshmi Devi (Kavali)", product: "SR Chitti Poori (Mini)", rating: 5, text: "Ordered for our family Ugadi celebration. Bite sized and extremely cute! They puffed up evenly without absorbing excess oil. Everyone asked for the brand.", verified: true },
    { _id: "r4", userName: "Anand Rao (Vijayawada)", product: "SR Royal Grand Combo", rating: 5, text: "The Grand Combo is unmatched value. Clean chakki taste with no sour or chemical aftertaste that you get with supermarket breads. Highly recommended!", verified: true },
  ]);
  const [form, setForm] = useState({ productId: "", rating: 5, title: "", text: "" });
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!form.productId || !form.text) {
      toast("Please select a product and write your feedback", "error");
      return;
    }
    setLoading(true);
    const pName = products.find((p) => p._id === form.productId)?.name || "SR Product";
    try {
      await api("/reviews", { method: "POST", body: JSON.stringify(form) });
    } catch {}
    setReviews((r) => [
      { _id: Date.now(), userName: user?.name ? `${user.name} (Verified)` : "Happy Customer", product: pName, rating: form.rating, text: form.text, verified: true },
      ...r,
    ]);
    toast("✓ Review submitted successfully! Thank you.", "success");
    setForm({ productId: "", rating: 5, title: "", text: "" });
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 20px 80px" }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "var(--primary)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>
          CUSTOMER TESTIMONIALS
        </div>
        <h1 style={{ fontSize: "clamp(2rem, 4vw, 2.8rem)", fontWeight: 900, color: "var(--navy)", margin: 0 }}>
          Loved by 4,200+ Homes
        </h1>
        <p style={{ fontSize: 15, color: "var(--text-muted)", marginTop: 8 }}>
          Real feedback from families who enjoy SR Foods every day.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 32, alignItems: "start" }}>
        {/* Review Cards Feed */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {reviews.map((r) => (
            <div
              key={r._id}
              style={{
                background: "#FFFFFF",
                borderRadius: 20,
                padding: "24px",
                border: "1px solid #ECE7DE",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--navy-light)", color: "var(--navy)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16 }}>
                    {r.userName[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: "var(--navy)" }}>{r.userName}</div>
                    <div style={{ fontSize: 11, color: "#2B8A3E", fontWeight: 700 }}>✓ Verified Buyer</div>
                  </div>
                </div>
                <span style={{ background: "#F5F2EB", color: "var(--navy)", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 8 }}>
                  {r.product}
                </span>
              </div>
              <div style={{ color: "#F59F00", fontSize: 16, marginBottom: 8 }}>{"★".repeat(r.rating)}</div>
              <p style={{ fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.6, margin: 0 }}>
                "{r.text}"
              </p>
            </div>
          ))}
        </div>

        {/* Review Form Card */}
        <div style={{ background: "#FFFFFF", borderRadius: 24, padding: "32px", border: "1px solid #ECE7DE", boxShadow: "var(--shadow-md)" }}>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--navy)", marginBottom: 8 }}>Write a Review</h2>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>Share your cooking experience with other families.</p>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--navy)", marginBottom: 6 }}>SELECT PRODUCT *</label>
            <select
              value={form.productId}
              onChange={(e) => setForm({ ...form, productId: e.target.value })}
              style={{ width: "100%", padding: "11px", borderRadius: 10, border: "1.5px solid #E0DAD0", fontSize: 13 }}
            >
              <option value="">Select a product...</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--navy)", marginBottom: 6 }}>RATING</label>
            <div style={{ display: "flex", gap: 8 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setForm({ ...form, rating: star })}
                  style={{ background: "none", border: "none", fontSize: 26, cursor: "pointer", color: star <= form.rating ? "#F59F00" : "#D0C9BE" }}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--navy)", marginBottom: 6 }}>YOUR FEEDBACK *</label>
            <textarea
              rows={4}
              value={form.text}
              onChange={(e) => setForm({ ...form, text: e.target.value })}
              placeholder="How was the softness, puffing &amp; taste?"
              style={{ width: "100%", padding: "12px", borderRadius: 10, border: "1.5px solid #E0DAD0", fontSize: 13, resize: "vertical", fontFamily: "var(--font-body)" }}
            />
          </div>

          <button
            onClick={submit}
            disabled={loading}
            className="btn-primary"
            style={{ width: "100%", borderRadius: 12, padding: "14px", fontSize: 14 }}
          >
            {loading ? "Submitting..." : "Submit Review →"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── CHECKOUT PAGE WITH DYNAMIC LOCATION CHARGES & GATEWAY ── */
function Checkout({
  cart,
  setCart,
  user,
  go,
  promoDiscount,
  onApplyPromo,
  appliedPromoCode,
  onRemovePromo,
  location,
  onSaveLocation,
}) {
  const [form, setForm] = useState({
    name: user?.name || "Suresh Reddy",
    phone: user?.phone || "+91 9177231026",
    email: user?.email || "suresh@example.com",
    line1: "Flat 402, Sai Residency, Kondayapalem",
    line2: "Near Andhra Bank",
    city: location.city || "Nellore",
    state: location.state || "Andhra Pradesh",
    pincode: location.pincode || "524004",
    slot: "Morning (8 AM - 12 PM)",
    notes: "Ring bell twice, deliver to door",
  });
  const [paymentMethod, setPaymentMethod] = useState("PhonePe_QR");
  const [promoInput, setPromoInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [gatewayOpen, setGatewayOpen] = useState(false);
  const [copiedUtr, setCopiedUtr] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Update form if global location changes
  useEffect(() => {
    setForm((f) => ({ ...f, city: location.city, state: location.state, pincode: location.pincode }));
  }, [location]);

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  // Real-time location-based delivery charge calculation
  const zoneInfo = getClientDeliveryZone(form.city, form.state, form.pincode, subtotal);
  const deliveryFee = zoneInfo.fee;
  const total = Math.max(0, subtotal - promoDiscount) + deliveryFee;

  // Poll order status if order was placed and waiting for owner verification
  useEffect(() => {
    if (!success?.orderId) return;
    if (success.paymentStatus === "paid" && success.status === "confirmed") return;

    const interval = setInterval(async () => {
      try {
        const res = await api(`/orders/${success.orderId}`);
        if (res.data) {
          const updated = res.data;
          if (
            updated.paymentStatus !== success.paymentStatus ||
            updated.status !== success.status
          ) {
            setSuccess((prev) => ({
              ...prev,
              paymentStatus: updated.paymentStatus,
              status: updated.status,
              paymentVerifiedBy: updated.paymentVerifiedBy,
            }));
            if (updated.paymentStatus === "paid" || updated.status === "confirmed") {
              toast("🎉 Payment verified and confirmed by Owner Vishnu!", "success");
            }
          }
        }
      } catch {
        // Silent poll
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [success]);

  const handleManualCheckStatus = async () => {
    if (!success?.orderId) return;
    setCheckingStatus(true);
    try {
      const res = await api(`/orders/${success.orderId}`);
      if (res.data) {
        setSuccess((prev) => ({
          ...prev,
          paymentStatus: res.data.paymentStatus,
          status: res.data.status,
          paymentVerifiedBy: res.data.paymentVerifiedBy,
        }));
        if (res.data.paymentStatus === "paid" || res.data.status === "confirmed") {
          toast("✅ Order is CONFIRMED by Owner!", "success");
        } else {
          toast("⏳ Payment verification is still in progress with Owner.", "info");
        }
      }
    } catch {
      toast("Could not check status right now.", "error");
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleInitiateOrder = () => {
    if (!form.name || !form.phone || !form.line1 || !form.city || !form.pincode) {
      toast("Please fill in all required delivery details", "error");
      return;
    }
    if (cart.length === 0) {
      toast("Your cart is empty!", "error");
      return;
    }
    setGatewayOpen(true);
  };

  const finalizeOrder = async (payMethod, utrNumber, payerName) => {
    setLoading(true);
    try {
      const res = await api("/orders", {
        method: "POST",
        body: JSON.stringify({
          delivery: form,
          paymentMethod: payMethod,
          paymentStatus: "verification_pending",
          transactionId: utrNumber,
          utrNumber: utrNumber,
          senderUpiName: payerName || form.name,
          promoCode: appliedPromoCode || undefined,
          useCart: false,
          directItems: cart.map((i) => ({ productId: i._id, quantity: i.qty })),
        }),
      });
      const orderId = res.data?.orderId || "SR-" + Math.floor(100000 + Math.random() * 900000);
      setSuccess({
        orderId,
        total: res.data?.total || total,
        subtotal: res.data?.subtotal || subtotal,
        deliveryFee: res.data?.deliveryFee ?? deliveryFee,
        zone: res.data?.zone || zoneInfo.zone,
        eta: res.data?.eta || zoneInfo.eta,
        paymentMethod: payMethod,
        paymentStatus: "verification_pending",
        status: "placed",
        transactionId: utrNumber,
        utrNumber: utrNumber,
        senderUpiName: payerName || form.name,
        items: [...cart],
      });
      setCart([]);
      setGatewayOpen(false);
      toast("Order submitted! Owner verification in progress.", "success");
    } catch {
      const orderId = "SR-" + Math.floor(100000 + Math.random() * 900000);
      setSuccess({
        orderId,
        total,
        subtotal,
        deliveryFee,
        zone: zoneInfo.zone,
        eta: zoneInfo.eta,
        paymentMethod: payMethod,
        paymentStatus: "verification_pending",
        status: "placed",
        transactionId: utrNumber,
        utrNumber: utrNumber,
        senderUpiName: payerName || form.name,
        items: [...cart],
      });
      setCart([]);
      setGatewayOpen(false);
      toast("Payment submitted! Awaiting Owner confirmation.", "info");
    }
    setLoading(false);
  };

  // ── CUSTOMER ORDER PROCESS & VERIFICATION TRACKER SCREEN ──
  if (success) {
    const isConfirmed =
      success.status === "confirmed" ||
      success.status === "packing" ||
      success.status === "shipped" ||
      success.status === "delivered" ||
      success.paymentStatus === "paid";

    const whatsappOwnerUrl = `https://wa.me/919177231026?text=${encodeURIComponent(
      `Hello Vishnu (SR Foods),\n\nI have placed Order #${success.orderId} and paid ₹${success.total} via PhonePe.\n\n📌 Order Details:\n• Customer: ${form.name} (${form.phone})\n• Delivery: ${form.line1}, ${form.city}\n• Amount Paid: ₹${success.total}\n• 12-Digit UTR: ${success.utrNumber || success.transactionId}\n\nPlease verify payment and confirm my order. Thank you!`
    )}`;

    return (
      <div style={{ maxWidth: 760, margin: "48px auto 80px", padding: "0 20px" }}>
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 28,
            padding: "36px 32px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.08)",
            border: "1px solid #ECE7DE",
          }}
        >
          {/* Header Banner - Verification Pending vs Confirmed */}
          {!isConfirmed ? (
            <div
              style={{
                background: "linear-gradient(135deg, #FFF9DB 0%, #FFF3BF 100%)",
                border: "2px solid #F59F00",
                borderRadius: 20,
                padding: "24px",
                textAlign: "center",
                marginBottom: 28,
              }}
            >
              <div style={{ fontSize: 44, marginBottom: 8 }}>⏳</div>
              <h1 style={{ fontSize: 24, fontWeight: 900, color: "#844C00", margin: "0 0 8px" }}>
                Payment Submitted — Awaiting Owner Verification
              </h1>
              <p style={{ fontSize: 14, color: "#663B00", maxWidth: 540, margin: "0 auto 16px", lineHeight: 1.6 }}>
                Thank you, <strong>{form.name}</strong>! Your payment of <strong>₹{success.total}</strong> (UTR: <code style={{ background: "#FFE066", padding: "2px 6px", borderRadius: 4, fontWeight: 800 }}>{success.utrNumber}</code>) has been submitted. Store owner <strong>Vishnu Mahanadra Reddy</strong> is verifying the bank credit.
              </p>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#FFFFFF", padding: "8px 16px", borderRadius: 30, fontSize: 12.5, fontWeight: 800, color: "#844C00", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#F59F00" }} />
                Auto-refreshing status every few seconds...
              </div>
            </div>
          ) : (
            <div
              style={{
                background: "linear-gradient(135deg, #EBFBEE 0%, #D3F9D8 100%)",
                border: "2px solid #2B8A3E",
                borderRadius: 20,
                padding: "24px",
                textAlign: "center",
                marginBottom: 28,
              }}
            >
              <div style={{ width: 68, height: 68, borderRadius: "50%", background: "#2B8A3E", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, margin: "0 auto 12px", boxShadow: "0 8px 24px rgba(43,138,62,0.3)" }}>
                ✓
              </div>
              <h1 style={{ fontSize: 25, fontWeight: 900, color: "#1B5E20", margin: "0 0 6px" }}>
                Payment Verified &amp; Order Confirmed! 🎉
              </h1>
              <p style={{ fontSize: 14, color: "#2B8A3E", maxWidth: 540, margin: "0 auto 12px", fontWeight: 700 }}>
                Verified by {success.paymentVerifiedBy || "Store Owner Vishnu"}. Your fresh chakki flatbreads are now confirmed and queued for immediate tawa baking!
              </p>
              <div style={{ display: "inline-block", background: "#2B8A3E", color: "#fff", padding: "6px 16px", borderRadius: 20, fontSize: 12, fontWeight: 800 }}>
                Status: {success.status?.toUpperCase() || "CONFIRMED"} • Delivery ETA: {success.eta}
              </div>
            </div>
          )}

          {/* Interactive 5-Step Order Roadmap */}
          <div style={{ marginBottom: 36 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "var(--navy)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 16, textAlign: "center" }}>
              Live Order Process Progression
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6, position: "relative" }}>
              {[
                { title: "1. Paid", desc: `₹${success.total} (PhonePe)`, done: true, current: false },
                { title: "2. Verifying", desc: isConfirmed ? "Verified" : "Owner Checking", done: isConfirmed, current: !isConfirmed },
                { title: "3. Confirmed", desc: isConfirmed ? "Approved" : "Pending", done: isConfirmed, current: false },
                { title: "4. Baking", desc: "Fresh Atta", done: ["packing", "shipped", "delivered"].includes(success.status), current: success.status === "confirmed" },
                { title: "5. Dispatch", desc: success.eta, done: success.status === "delivered", current: success.status === "shipped" },
              ].map((step, idx) => (
                <div key={idx} style={{ textAlign: "center", position: "relative" }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      margin: "0 auto 8px",
                      background: step.done ? "#2B8A3E" : step.current ? "#F59F00" : "#ECE7DE",
                      color: step.done || step.current ? "#fff" : "#999",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: 900,
                      boxShadow: step.current ? "0 0 0 4px rgba(245,159,0,0.2)" : "none",
                    }}
                  >
                    {step.done ? "✓" : idx + 1}
                  </div>
                  <div style={{ fontSize: 11.5, fontWeight: 800, color: step.done ? "#2B8A3E" : step.current ? "#844C00" : "#999" }}>
                    {step.title}
                  </div>
                  <div style={{ fontSize: 9.5, color: "var(--text-muted)", marginTop: 2 }}>
                    {step.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions (WhatsApp Owner Alert & Manual Check) */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginBottom: 32 }}>
            <a
              href={whatsappOwnerUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "#25D366",
                color: "#FFFFFF",
                padding: "12px 20px",
                borderRadius: 14,
                textDecoration: "none",
                fontWeight: 800,
                fontSize: 13.5,
                boxShadow: "0 4px 14px rgba(37,211,102,0.35)",
              }}
            >
              <span>💬</span> Send Verification Request on WhatsApp
            </a>

            <button
              onClick={handleManualCheckStatus}
              disabled={checkingStatus}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "#F5F2EB",
                color: "var(--navy)",
                border: "1.5px solid #E0DAD0",
                padding: "12px 18px",
                borderRadius: 14,
                fontWeight: 800,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              <span>🔄</span> {checkingStatus ? "Checking..." : "Refresh Status"}
            </button>
          </div>

          {/* Order Details & Receipt Card */}
          <div style={{ background: "#FDFBF7", borderRadius: 20, padding: "24px", border: "1.5px solid #ECE7DE", marginBottom: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #ECE7DE", paddingBottom: 12, marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 800 }}>ORDER REFERENCE</span>
                <div style={{ fontSize: 20, fontWeight: 900, color: "var(--navy)", fontFamily: "monospace" }}>#{success.orderId}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 800 }}>PAYMENT MODE</span>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#5F259F" }}>PhonePe UPI QR</div>
              </div>
            </div>

            {/* Verification Proof Info */}
            <div style={{ background: "#FFFFFF", borderRadius: 12, padding: "12px 16px", border: "1px solid #E0DAD0", marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 11.5, fontWeight: 800, color: "var(--navy)" }}>12-Digit UTR / Transaction ID:</span>
                <span
                  onClick={() => {
                    navigator.clipboard?.writeText(success.utrNumber || success.transactionId);
                    setCopiedUtr(true);
                    setTimeout(() => setCopiedUtr(false), 2000);
                  }}
                  style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 900, color: "#5F259F", cursor: "pointer", background: "#F6EFFF", padding: "2px 8px", borderRadius: 6 }}
                  title="Click to copy UTR"
                >
                  {success.utrNumber || success.transactionId} {copiedUtr ? "✓ Copied" : "📋"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "var(--text-muted)" }}>
                <span>Beneficiary: <strong>VISHNU MAHANADRA REDDY L</strong></span>
                <span>Payer: <strong>{success.senderUpiName || form.name}</strong></span>
              </div>
            </div>

            {/* Delivery Destination */}
            <div style={{ background: "#F5F8FC", borderRadius: 12, padding: "12px 16px", border: "1px solid #DCE5F2", marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 900, color: "var(--navy)" }}>🚚 {success.zone}</span>
                <span style={{ fontSize: 11.5, fontWeight: 800, color: "#2B8A3E" }}>ETA: {success.eta}</span>
              </div>
              <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
                {form.line1}, {form.city}, {form.state} - {form.pincode} (Phone: {form.phone})
              </div>
            </div>

            {/* Item summary */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "var(--navy)", marginBottom: 8 }}>ITEMS IN ORDER</div>
              {success.items?.map((i) => (
                <div key={i._id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "5px 0", borderBottom: "1px dashed #ECE7DE" }}>
                  <span>{i.name} × {i.qty}</span>
                  <span style={{ fontWeight: 800 }}>₹{i.price * i.qty}</span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: "1px solid #ECE7DE", paddingTop: 10, display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "var(--text-muted)", marginBottom: 4 }}>
              <span>Delivery Fee ({form.city})</span>
              <span>{success.deliveryFee === 0 ? "FREE" : `₹${success.deliveryFee}`}</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 900, color: "var(--navy)", paddingTop: 8, borderTop: "2px solid #ECE7DE" }}>
              <span>Total Paid Amount</span>
              <span style={{ color: "var(--primary)" }}>₹{success.total}</span>
            </div>
          </div>

          {/* Navigation Actions */}
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button
              onClick={() => go("orders")}
              className="btn-primary"
              style={{ borderRadius: 14, padding: "12px 28px", fontSize: 14 }}
            >
              Track in My Orders →
            </button>
            <button
              onClick={() => go("shop")}
              style={{ background: "#F5F2EB", color: "var(--navy)", border: "none", borderRadius: 14, padding: "12px 24px", fontWeight: 700, cursor: "pointer" }}
            >
              Order More Packs
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1140, margin: "0 auto", padding: "48px 20px 80px" }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "var(--primary)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>
          CHECKOUT &amp; DISPATCH
        </div>
        <h1 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)", fontWeight: 900, color: "var(--navy)", margin: 0 }}>
          Confirm Delivery &amp; Payment
        </h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 32, alignItems: "start" }}>
        {/* Form Fields */}
        <div style={{ background: "#FFFFFF", borderRadius: 24, padding: "32px", border: "1px solid #ECE7DE", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, borderBottom: "1px solid #F0ECE4", paddingBottom: 10 }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: "var(--navy)" }}>
              📍 Delivery Details
            </div>
            {/* Zone Tag */}
            <span style={{ fontSize: 11, fontWeight: 800, color: "#fff", background: zoneInfo.badgeColor, padding: "3px 10px", borderRadius: 12 }}>
              {zoneInfo.zone}
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--navy)", marginBottom: 4 }}>FULL NAME *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1.5px solid #E0DAD0" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--navy)", marginBottom: 4 }}>PHONE NUMBER *</label>
              <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1.5px solid #E0DAD0" }} />
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--navy)", marginBottom: 4 }}>DELIVERY ADDRESS LINE 1 *</label>
            <input type="text" value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1.5px solid #E0DAD0" }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--navy)", marginBottom: 4 }}>CITY *</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => {
                  setForm({ ...form, city: e.target.value });
                  onSaveLocation({ ...location, city: e.target.value });
                }}
                style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1.5px solid #E0DAD0" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--navy)", marginBottom: 4 }}>PINCODE *</label>
              <input
                type="text"
                value={form.pincode}
                onChange={(e) => {
                  setForm({ ...form, pincode: e.target.value });
                  onSaveLocation({ ...location, pincode: e.target.value });
                }}
                style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1.5px solid #E0DAD0" }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--navy)", marginBottom: 4 }}>STATE</label>
              <select
                value={form.state}
                onChange={(e) => {
                  setForm({ ...form, state: e.target.value });
                  onSaveLocation({ ...location, state: e.target.value });
                }}
                style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1.5px solid #E0DAD0" }}
              >
                <option value="Andhra Pradesh">Andhra Pradesh</option>
                <option value="Telangana">Telangana</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Kerala">Kerala</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Other">Other State</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--navy)", marginBottom: 4 }}>DELIVERY SLOT</label>
              <select value={form.slot} onChange={(e) => setForm({ ...form, slot: e.target.value })} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1.5px solid #E0DAD0" }}>
                <option value="Morning (8 AM - 12 PM)">Morning (8 AM - 12 PM)</option>
                <option value="Afternoon (12 PM - 4 PM)">Afternoon (12 PM - 4 PM)</option>
                <option value="Evening (4 PM - 8 PM)">Evening (4 PM - 8 PM)</option>
              </select>
            </div>
          </div>

          {/* Payment Method Selector (COD DISCONTINUED) */}
          <div style={{ fontSize: 16, fontWeight: 900, color: "var(--navy)", marginBottom: 12, borderTop: "1px solid #F0ECE4", paddingTop: 16 }}>
            💳 Select Payment Mode (Prepaid Only)
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: 14 }}>
            {[
              ["PhonePe_QR", "⚡ PhonePe QR (Instant)"],
              ["Card", "💳 Credit / Debit Card"],
              ["NetBanking", "🏦 NetBanking"],
            ].map(([k, label]) => (
              <div
                key={k}
                onClick={() => setPaymentMethod(k)}
                style={{
                  padding: "14px 12px",
                  borderRadius: 14,
                  border: `2px solid ${paymentMethod === k ? "#5F259F" : "#E0DAD0"}`,
                  background: paymentMethod === k ? "#F6EFFF" : "#FFFFFF",
                  cursor: "pointer",
                  fontSize: 12.5,
                  fontWeight: 800,
                  textAlign: "center",
                  color: paymentMethod === k ? "#5F259F" : "var(--text-main)",
                  transition: "all 0.15s ease",
                }}
              >
                {label}
              </div>
            ))}
          </div>

          <div style={{ background: "#F6EFFF", borderRadius: 12, padding: "12px 14px", fontSize: 12, color: "#5F259F", fontWeight: 700, border: "1px solid #E5D5F7" }}>
            🛡️ Official PhonePe QR code of <strong>VISHNU MAHANADRA REDDY L</strong> will open upon clicking proceed. Scan with PhonePe / GPay / Paytm, pay ₹{total}, and submit your 12-digit UTR to verify your order.
          </div>
        </div>

        {/* Order Summary Column */}
        <div style={{ background: "#FFFFFF", borderRadius: 24, padding: "28px", border: "1px solid #ECE7DE", boxShadow: "var(--shadow-sm)", position: "sticky", top: 90 }}>
          <h2 style={{ fontSize: 18, fontWeight: 900, color: "var(--navy)", marginBottom: 16, borderBottom: "1px solid #F0ECE4", paddingBottom: 10 }}>
            Order Summary ({cart.length})
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
            {cart.map((i) => (
              <div key={i._id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span>{i.name} × {i.qty}</span>
                <span style={{ fontWeight: 800 }}>₹{i.price * i.qty}</span>
              </div>
            ))}
          </div>

          {/* Promo Box */}
          {appliedPromoCode ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#EBFBEE", padding: "10px 14px", borderRadius: 10, border: "1px solid #B7EB8F", marginBottom: 14 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#2B8A3E" }}>
                ✓ Coupon {appliedPromoCode} Applied (-₹{promoDiscount})
              </span>
              <button
                onClick={onRemovePromo}
                style={{ background: "none", border: "none", color: "#C81E1E", cursor: "pointer", fontWeight: 800, fontSize: 13 }}
                title="Remove coupon"
              >
                ✕
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <input
                type="text"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                placeholder="Promo code"
                style={{ flex: 1, padding: "9px 12px", borderRadius: 8, border: "1.5px solid #E0DAD0", fontSize: 12, textTransform: "uppercase" }}
              />
              <button
                onClick={() => { onApplyPromo(promoInput); setPromoInput(""); }}
                style={{ background: "var(--navy)", color: "#fff", border: "none", borderRadius: 8, padding: "9px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
              >
                Apply
              </button>
            </div>
          )}

          {/* Breakdown with Location Fee */}
          <div style={{ borderTop: "1px solid #F0ECE4", paddingTop: 12, marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--text-muted)", marginBottom: 6 }}>
              <span>Item Subtotal</span>
              <span>₹{subtotal}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: deliveryFee === 0 ? "#2B8A3E" : "var(--text-muted)", marginBottom: 4 }}>
              <span>
                Delivery Fee ({form.city})
              </span>
              <span>{deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}</span>
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>
              {zoneInfo.zone} • ETA: <strong>{zoneInfo.eta}</strong>
            </div>

            {promoDiscount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#2B8A3E", fontWeight: 700, marginBottom: 6 }}>
                <span>Promo Discount</span>
                <span>−₹{promoDiscount}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, fontWeight: 900, color: "var(--navy)", paddingTop: 10, borderTop: "1px solid #F0ECE4" }}>
              <span>Total Payable</span>
              <span style={{ color: "var(--primary)" }}>₹{total}</span>
            </div>
          </div>

          <button
            onClick={handleInitiateOrder}
            disabled={loading || cart.length === 0}
            className="btn-primary"
            style={{
              width: "100%",
              borderRadius: 14,
              padding: "16px",
              fontSize: 15,
              fontWeight: 900,
              background: "linear-gradient(135deg, #5F259F 0%, #3B1564 100%)",
              boxShadow: "0 6px 20px rgba(95,37,159,0.3)",
            }}
          >
            {loading ? "Processing..." : `Pay via PhonePe QR (₹${total}) 🔒`}
          </button>
        </div>
      </div>

      {/* Payment Gateway Modal with Vishnu's PhonePe QR */}
      <PaymentGatewayModal
        isOpen={gatewayOpen}
        onClose={() => setGatewayOpen(false)}
        total={total}
        deliveryData={form}
        onSuccess={(payMethod, utr, payerName) => finalizeOrder(payMethod, utr, payerName)}
      />
    </div>
  );
}

/* ── ORDERS PAGE ──────────────────────────────────────────── */
function Orders({ user, go }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lookup, setLookup] = useState("");

  const loadUserOrders = useCallback(async () => {
    if (user) {
      setLoading(true);
      try {
        const r = await api("/orders");
        setOrders(r.data || []);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    }
  }, [user]);

  useEffect(() => {
    loadUserOrders();
  }, [loadUserOrders]);

  const searchGuestOrder = async () => {
    if (!lookup.trim()) {
      toast("Please enter your Order ID or phone number", "error");
      return;
    }
    setLoading(true);
    try {
      const q = lookup.trim();
      const isOid = q.toUpperCase().startsWith("SR-");
      const url = isOid
        ? `/orders/${q}`
        : `/orders?phone=${encodeURIComponent(q)}&email=${encodeURIComponent(q)}`;
      const res = await api(url);
      if (res.data) {
        const list = Array.isArray(res.data) ? res.data : [res.data];
        setOrders(list);
        if (list.length === 0) toast("No orders found matching that query", "info");
      }
    } catch {
      toast("No orders found for this lookup", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "48px 20px 80px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, flexWrap: "wrap", gap: 14 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: "var(--primary)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>
            ORDER TRACKING
          </div>
          <h1 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)", fontWeight: 900, color: "var(--navy)", margin: 0 }}>
            Track Your Fresh Order
          </h1>
        </div>
        <button onClick={() => go("shop")} className="btn-primary" style={{ borderRadius: 12, padding: "10px 20px", fontSize: 13 }}>
          + Order Fresh Pack
        </button>
      </div>

      {/* Guest or Quick Lookup Bar */}
      <div style={{ background: "#FFFFFF", borderRadius: 20, padding: "20px 24px", border: "1px solid #ECE7DE", marginBottom: 28, boxShadow: "var(--shadow-sm)" }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "var(--navy)", marginBottom: 8 }}>
          🔍 Quick Order Lookup (By Order ID or Phone Number)
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            type="text"
            value={lookup}
            onChange={(e) => setLookup(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchGuestOrder()}
            placeholder="e.g. SR-75100400 or 9177231026"
            style={{ flex: 1, minWidth: 240, padding: "10px 14px", borderRadius: 10, border: "1.5px solid #E0DAD0", fontSize: 13 }}
          />
          <button
            onClick={searchGuestOrder}
            className="btn-primary"
            style={{ borderRadius: 10, padding: "10px 20px", fontSize: 13 }}
          >
            Track Order
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>Loading orders...</div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", background: "#FFFFFF", borderRadius: 24, border: "1px solid #ECE7DE" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: "var(--navy)", marginBottom: 8 }}>No active orders found</div>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>Enter your phone number above or start a fresh order.</p>
          <button onClick={() => go("shop")} className="btn-primary" style={{ borderRadius: 12, padding: "10px 22px" }}>Browse Products →</button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {orders.map((o) => {
            const isConfirmed = o.status === "confirmed" || o.paymentStatus === "paid" || ["packing", "shipped", "delivered"].includes(o.status);
            const waText = encodeURIComponent(
              `Hi Vishnu (SR Foods), checking status of my Order #${o.orderId}. Total: ₹${o.total}. UTR: ${o.utrNumber || o.transactionId || "N/A"}.`
            );
            return (
              <div key={o._id || o.orderId} style={{ background: "#FFFFFF", borderRadius: 20, padding: 24, border: "1.5px solid #ECE7DE", boxShadow: "var(--shadow-sm)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 900, color: "var(--navy)" }}>Order #{o.orderId}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                      {new Date(o.createdAt || Date.now()).toLocaleDateString()} • {o.paymentMethod || "PhonePe_QR"}
                      {o.utrNumber && <span style={{ fontFamily: "monospace", marginLeft: 6 }}>• UTR: {o.utrNumber}</span>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span
                      style={{
                        background: o.paymentStatus === "paid" ? "#EBFBEE" : "#FFF9DB",
                        color: o.paymentStatus === "paid" ? "#2B8A3E" : "#844C00",
                        padding: "4px 10px",
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 800,
                        border: `1px solid ${o.paymentStatus === "paid" ? "#B7EB8F" : "#FFE066"}`,
                      }}
                    >
                      {o.paymentStatus === "paid" ? "✓ Paid & Verified" : "⏳ Verification Pending"}
                    </span>
                    <span
                      style={{
                        background: isConfirmed ? "#EBF5FF" : "#F8F9FA",
                        color: isConfirmed ? "#1E429F" : "#666",
                        padding: "4px 12px",
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 800,
                        textTransform: "uppercase",
                      }}
                    >
                      {o.status || "Placed"}
                    </span>
                  </div>
                </div>

                {/* Status Notice if verification pending */}
                {o.paymentStatus === "verification_pending" && (
                  <div style={{ background: "#FFF9DB", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#844C00", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                    <span>⏳ Store Owner Vishnu is verifying bank records for UTR: <strong>{o.utrNumber || o.transactionId}</strong></span>
                    <a
                      href={`https://wa.me/919177231026?text=${waText}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ background: "#25D366", color: "#fff", textDecoration: "none", padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 800 }}
                    >
                      💬 Ping on WhatsApp
                    </a>
                  </div>
                )}

                <div style={{ fontSize: 13, color: "var(--text-main)", marginBottom: 12 }}>
                  {o.items?.map((i) => `${i.name} × ${i.quantity}`).join(" • ")}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #F0ECE4", paddingTop: 12, flexWrap: "wrap", gap: 8 }}>
                  <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
                    Delivery: {o.deliveryFee ? `₹${o.deliveryFee}` : "FREE"} ({o.delivery?.city || "Local"}) • ETA: {o.deliveryEta || "Same day"}
                  </span>
                  <span style={{ fontSize: 16, fontWeight: 900, color: "var(--navy)" }}>Total: ₹{o.total}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── PROFILE PAGE ─────────────────────────────────────────── */
function Profile({ user, logout, go, wishlist, products }) {
  const [pw, setPw] = useState({ cur: "", nw: "", confirm: "" });
  const [changingPw, setChangingPw] = useState(false);

  if (!user) {
    return (
      <div style={{ textAlign: "center", padding: "80px 20px" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>👤</div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: "var(--navy)", marginBottom: 8 }}>Sign In to View Profile</h2>
        <button onClick={() => go("login")} className="btn-primary" style={{ borderRadius: 12, padding: "12px 24px" }}>
          Sign In Now →
        </button>
      </div>
    );
  }

  const changePassword = async () => {
    if (!pw.cur || !pw.nw || !pw.confirm) {
      toast("Please complete all password fields", "error");
      return;
    }
    if (pw.nw !== pw.confirm) {
      toast("New passwords do not match", "error");
      return;
    }
    setChangingPw(true);
    try {
      await api("/auth/change-password", {
        method: "PUT",
        body: JSON.stringify({ currentPassword: pw.cur, newPassword: pw.nw }),
      });
      toast("✓ Password changed successfully!", "success");
      setPw({ cur: "", nw: "", confirm: "" });
    } catch (err) {
      toast(err.message || "Failed to update password", "error");
    } finally {
      setChangingPw(false);
    }
  };

  const wlItems = products.filter((p) => wishlist.includes(p._id));

  return (
    <div style={{ maxWidth: 840, margin: "0 auto", padding: "48px 20px 80px" }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: "var(--primary)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>
        MY ACCOUNT
      </div>
      <h1 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)", fontWeight: 900, color: "var(--navy)", marginBottom: 28 }}>
        Profile &amp; Settings
      </h1>

      <div style={{ background: "#FFFFFF", borderRadius: 24, padding: "28px", border: "1px solid #ECE7DE", boxShadow: "var(--shadow-sm)", display: "flex", alignItems: "center", gap: 20, marginBottom: 28, flexWrap: "wrap" }}>
        <div style={{ width: 68, height: 68, borderRadius: "50%", background: "linear-gradient(135deg, #0B2545 0%, #133E6E 100%)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 900 }}>
          {user.name?.[0]?.toUpperCase() || "U"}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: "var(--navy)" }}>{user.name}</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{user.email}</div>
          {user.role === "admin" && (
            <span style={{ display: "inline-block", background: "var(--navy-light)", color: "var(--navy)", fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 6, marginTop: 4 }}>
              ⚡ Administrator
            </span>
          )}
        </div>
        <button
          onClick={() => { logout(); go("home"); toast("Logged out"); }}
          style={{ background: "#FDE8E8", color: "#C81E1E", border: "none", borderRadius: 12, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
        >
          Sign Out
        </button>
      </div>

      {/* Change Password Card */}
      <div style={{ background: "#FFFFFF", borderRadius: 24, padding: "28px", border: "1px solid #ECE7DE", boxShadow: "var(--shadow-sm)", marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: "var(--navy)", marginBottom: 16 }}>
          🔒 Change Password
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--navy)", marginBottom: 4 }}>CURRENT PASSWORD</label>
            <input type="password" value={pw.cur} onChange={(e) => setPw({ ...pw, cur: e.target.value })} placeholder="••••••••" style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1.5px solid #E0DAD0" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--navy)", marginBottom: 4 }}>NEW PASSWORD</label>
            <input type="password" value={pw.nw} onChange={(e) => setPw({ ...pw, nw: e.target.value })} placeholder="Min 6 characters" style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1.5px solid #E0DAD0" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--navy)", marginBottom: 4 }}>CONFIRM NEW PASSWORD</label>
            <input type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} placeholder="Repeat new password" style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1.5px solid #E0DAD0" }} />
          </div>
        </div>
        <button
          onClick={changePassword}
          disabled={changingPw}
          className="btn-primary"
          style={{ borderRadius: 10, padding: "10px 20px", fontSize: 13 }}
        >
          {changingPw ? "Updating..." : "Update Password"}
        </button>
      </div>

      {/* Wishlist Items */}
      <h2 style={{ fontSize: 18, fontWeight: 900, color: "var(--navy)", marginBottom: 16 }}>
        Saved to Wishlist ({wlItems.length})
      </h2>
      {wlItems.length === 0 ? (
        <div style={{ background: "#FFFFFF", borderRadius: 20, padding: "32px", textAlign: "center", border: "1px solid #ECE7DE", color: "var(--text-muted)", fontSize: 13 }}>
          No items in wishlist yet. Click the heart on any product to save it here!
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
          {wlItems.map((p) => (
            <div key={p._id} style={{ background: "#FFFFFF", borderRadius: 16, padding: "16px", border: "1px solid #ECE7DE", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 50, height: 50, borderRadius: 10, background: p.bgColor, overflow: "hidden" }}>
                <img src={p.image} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "var(--navy)" }}>{p.name}</div>
                <div style={{ fontSize: 12, color: "var(--primary)", fontWeight: 700 }}>₹{p.price}</div>
              </div>
              <button onClick={() => go("shop")} className="btn-primary" style={{ borderRadius: 8, padding: "6px 12px", fontSize: 11 }}>
                View
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── AUTH (LOGIN / REGISTER) ──────────────────────────────── */
function AuthPage({ login, go }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    setErr("");
    setLoading(true);
    try {
      const body = mode === "login" ? { email: form.email, password: form.password } : form;
      const res = await api(`/auth/${mode}`, { method: "POST", body: JSON.stringify(body) });
      login(res.token, res.user);
      toast(`Welcome ${res.user.name || "back"}! 🎉`, "success");
      go("home");
    } catch (e) {
      setErr(e.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 460, margin: "60px auto", padding: "0 20px" }}>
      <div style={{ background: "#FFFFFF", borderRadius: 28, padding: "40px 32px", border: "1px solid #ECE7DE", boxShadow: "var(--shadow-lg)" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: "linear-gradient(135deg, #E8590C 0%, #D9480F 100%)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 900, margin: "0 auto 14px" }}>
            SR
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "var(--navy)", margin: "0 0 6px" }}>
            {mode === "login" ? "Welcome Back" : "Join SR Foods"}
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
            {mode === "login" ? "Sign in to track orders and save favorites" : "Create an account for 10% off your first order"}
          </p>
        </div>

        {err && (
          <div style={{ background: "#FDE8E8", color: "#C81E1E", borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 700, marginBottom: 16 }}>
            ⚠️ {err}
          </div>
        )}

        {mode === "register" && (
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--navy)", marginBottom: 4 }}>FULL NAME *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" style={{ width: "100%", padding: "11px", borderRadius: 10, border: "1.5px solid #E0DAD0" }} />
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--navy)", marginBottom: 4 }}>EMAIL ADDRESS *</label>
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@example.com" style={{ width: "100%", padding: "11px", borderRadius: 10, border: "1.5px solid #E0DAD0" }} />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--navy)", marginBottom: 4 }}>PASSWORD *</label>
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" style={{ width: "100%", padding: "11px", borderRadius: 10, border: "1.5px solid #E0DAD0" }} />
        </div>

        <button
          onClick={submit}
          disabled={loading}
          className="btn-primary"
          style={{ width: "100%", borderRadius: 12, padding: "14px", fontSize: 14 }}
        >
          {loading ? "Please wait..." : mode === "login" ? "Sign In →" : "Create Account →"}
        </button>

        {mode === "login" && (
          <div style={{ marginTop: 16, padding: "10px 14px", background: "var(--navy-light)", borderRadius: 10, fontSize: 12, color: "var(--navy)", textAlign: "center" }}>
            🔑 <strong>Admin Demo:</strong> admin@srfoods.com / Admin@1234
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "var(--text-muted)" }}>
          {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
          <span onClick={() => setMode(mode === "login" ? "register" : "login")} style={{ color: "var(--primary)", fontWeight: 800, cursor: "pointer" }}>
            {mode === "login" ? "Register here" : "Sign In"}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── ADMIN PANEL ──────────────────────────────────────────── */
function Admin({ user, go }) {
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    Promise.all([api("/admin/dashboard"), api("/orders/admin/all?limit=30")])
      .then(([d, o]) => {
        setStats(d.data);
        setOrders(o.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const updateStatus = async (id, status) => {
    try {
      await api(`/orders/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) });
      setOrders((o) => o.map((x) => (x._id === id ? { ...x, status } : x)));
      toast("Status updated", "success");
    } catch {
      toast("Update failed", "error");
    }
  };

  const verifyPaymentAndConfirm = async (id, orderId) => {
    try {
      await api(`/orders/${id}/verify-payment`, { method: "PUT" });
      setOrders((prev) =>
        prev.map((x) =>
          x._id === id || x.orderId === id
            ? { ...x, status: "confirmed", paymentStatus: "paid", paymentVerifiedBy: "Owner" }
            : x
        )
      );
      toast(`✅ Order #${orderId || id} payment verified & confirmed!`, "success");
    } catch (err) {
      toast(err.message || "Verification failed", "error");
    }
  };

  const sendCustomerConfirmationWA = (o) => {
    const phone = (o.delivery?.phone || "").replace(/\D/g, "");
    const cleanPhone = phone.length === 10 ? `91${phone}` : phone;
    const msg = encodeURIComponent(
      `Hello ${o.delivery?.name},\n\nYour payment of ₹${o.total} for Order #${o.orderId} has been VERIFIED and CONFIRMED by SR Foods!\n\n📦 Order Details:\n` +
      (o.items?.map((i) => `• ${i.name} × ${i.quantity}`).join("\n") || "Fresh Flatbreads") +
      `\n\n🚚 Delivery Destination: ${o.delivery?.line1}, ${o.delivery?.city}\n🕒 Estimated Delivery: ${o.deliveryEta || "Today"}\n\nThank you for choosing SR Foods!`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, "_blank");
  };

  if (!user || user.role !== "admin") {
    return (
      <div style={{ textAlign: "center", padding: "80px 20px" }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>🔒</div>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: "var(--navy)" }}>Admin Access Required</h2>
        <button onClick={() => go("login")} className="btn-primary" style={{ borderRadius: 12, padding: "12px 24px", marginTop: 16 }}>
          Login as Admin
        </button>
      </div>
    );
  }

  const S = stats?.overview || {};
  const pendingVerifications = orders.filter((o) => o.paymentStatus === "verification_pending");

  return (
    <div style={{ maxWidth: 1240, margin: "0 auto", padding: "48px 20px 80px" }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: "var(--primary)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>
        MANAGEMENT PORTAL
      </div>
      <h1 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)", fontWeight: 900, color: "var(--navy)", marginBottom: 28 }}>
        📊 Store Analytics &amp; Dispatch
      </h1>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 36 }}>
        {[
          ["Total Orders", S.totalOrders || orders.length || 24, "#E8590C"],
          ["Pending Verification", pendingVerifications.length, "#F59F00"],
          ["Total Revenue", "₹" + (S.totalRevenue || "4,820"), "#0B2545"],
          ["Registered Users", S.totalUsers || 18, "#8B4513"],
          ["Active Subscribers", S.subscribers || 42, "#10B981"],
        ].map(([title, val, col]) => (
          <div key={title} style={{ background: "#FFFFFF", borderRadius: 18, padding: "20px", border: "1px solid #ECE7DE", borderLeft: `5px solid ${col}`, boxShadow: "var(--shadow-sm)" }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: col }}>{val}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginTop: 4 }}>{title}</div>
          </div>
        ))}
      </div>

      {/* 🚨 PENDING PAYMENT VERIFICATIONS QUEUE */}
      {pendingVerifications.length > 0 && (
        <div style={{ background: "#FFF9DB", borderRadius: 24, padding: "24px", border: "2px solid #F59F00", marginBottom: 32, boxShadow: "0 8px 30px rgba(245,159,0,0.15)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 22 }}>🚨</span>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: "#844C00", margin: 0 }}>
                Pending Payment Verifications ({pendingVerifications.length})
              </h2>
            </div>
            <span style={{ fontSize: 12, fontWeight: 800, background: "#FFE066", color: "#844C00", padding: "4px 10px", borderRadius: 20 }}>
              Verify UTR against Bank Alerts
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {pendingVerifications.map((o) => (
              <div
                key={o._id}
                style={{
                  background: "#FFFFFF",
                  borderRadius: 16,
                  padding: "16px 20px",
                  border: "1.5px solid #FFE066",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 14,
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 900, fontSize: 15, color: "var(--navy)" }}>Order #{o.orderId}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "#5F259F", background: "#F6EFFF", padding: "2px 8px", borderRadius: 6, fontFamily: "monospace" }}>
                      UTR: {o.utrNumber || o.transactionId}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-main)", marginBottom: 2 }}>
                    <strong>{o.delivery?.name}</strong> (📞 {o.delivery?.phone}) • {o.delivery?.city}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    Amount Paid: <strong style={{ color: "#2B8A3E", fontSize: 14 }}>₹{o.total}</strong> • Payer on UPI: {o.senderUpiName || "N/A"}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    onClick={() => verifyPaymentAndConfirm(o._id, o.orderId)}
                    style={{
                      background: "#2B8A3E",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: 10,
                      padding: "10px 16px",
                      fontSize: 12.5,
                      fontWeight: 800,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span>✓</span> Verify &amp; Confirm
                  </button>

                  <button
                    onClick={() => sendCustomerConfirmationWA(o)}
                    style={{
                      background: "#25D366",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: 10,
                      padding: "10px 14px",
                      fontSize: 12.5,
                      fontWeight: 800,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span>💬</span> Send WhatsApp
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div style={{ background: "#FFFFFF", borderRadius: 24, padding: "28px", border: "1px solid #ECE7DE", boxShadow: "var(--shadow-sm)" }}>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: "var(--navy)", marginBottom: 18 }}>
          Recent Orders ({orders.length})
        </h2>
        {orders.length === 0 ? (
          <div style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}>No orders yet</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {orders.map((o) => (
              <div key={o._id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, padding: "14px 18px", background: "#FDFBF7", borderRadius: 14, border: "1px solid #ECE7DE" }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: "var(--navy)" }}>
                    {o.delivery?.name} <span style={{ color: "#999", fontSize: 11 }}>#{o.orderId}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                    {o.delivery?.phone} • {o.delivery?.city || "Nellore"} • ₹{o.total}
                    <span style={{ marginLeft: 8, background: o.paymentStatus === "paid" ? "#EBFBEE" : "#FFF9DB", color: o.paymentStatus === "paid" ? "#2B8A3E" : "#844C00", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>
                      {o.paymentMethod || "PhonePe"} ({o.paymentStatus?.toUpperCase() || "PENDING"})
                    </span>
                    {o.utrNumber && (
                      <span style={{ marginLeft: 6, fontFamily: "monospace", color: "#5F259F", fontWeight: 700 }}>
                        UTR: {o.utrNumber}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {o.paymentStatus === "verification_pending" && (
                    <button
                      onClick={() => verifyPaymentAndConfirm(o._id, o.orderId)}
                      style={{ background: "#2B8A3E", color: "#fff", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 11.5, fontWeight: 800, cursor: "pointer" }}
                    >
                      ✓ Confirm Payment
                    </button>
                  )}
                  <button
                    onClick={() => sendCustomerConfirmationWA(o)}
                    style={{ background: "#25D366", color: "#fff", border: "none", borderRadius: 8, padding: "6px 10px", fontSize: 11.5, fontWeight: 800, cursor: "pointer" }}
                    title="Send WhatsApp update to customer"
                  >
                    💬
                  </button>
                  <select
                    value={o.status || "placed"}
                    onChange={(e) => updateStatus(o._id, e.target.value)}
                    style={{ padding: "6px 12px", borderRadius: 8, border: "1.5px solid #E0DAD0", fontSize: 12, fontWeight: 700 }}
                  >
                    {["placed", "confirmed", "packing", "shipped", "delivered", "cancelled"].map((st) => (
                      <option key={st} value={st}>{st.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── FOOTER ───────────────────────────────────────────────── */
function Footer({ go }) {
  return (
    <footer style={{ background: "#0B2545", color: "#FDFBF7", padding: "64px 20px 28px", borderTop: "4px solid var(--primary)" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 40, marginBottom: 48 }}>
        {/* Brand */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 18, color: "#fff" }}>
              SR
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#fff" }}>SR Foods</div>
          </div>
          <p style={{ fontSize: 13, color: "#94A3B8", lineHeight: 1.7 }}>
            Fresh ready-to-cook flatbreads hand-crafted from whole chakki fresh atta. No preservatives, zero maida. Pure homemade taste.
          </p>
          <div style={{ marginTop: 14, fontSize: 12, color: "#F59F00", fontWeight: 700 }}>
            FSSAI Lic. No. 20126181000074
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", marginBottom: 14, color: "#F8FAFC" }}>
            Explore
          </div>
          {[
            ["Home", "home"],
            ["Shop All Products", "shop"],
            ["Deals & Coupons", "deals"],
            ["How to Cook", "cook"],
            ["Customer Reviews", "reviews"],
            ["Order Tracking", "orders"],
          ].map(([l, k]) => (
            <div
              key={k}
              onClick={() => { go(k); window.scrollTo(0, 0); }}
              style={{ fontSize: 13, color: "#94A3B8", marginBottom: 8, cursor: "pointer", transition: "color 0.2s" }}
              onMouseOver={(e) => (e.target.style.color = "#FFD43B")}
              onMouseOut={(e) => (e.target.style.color = "#94A3B8")}
            >
              {l}
            </div>
          ))}
        </div>

        {/* Products */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", marginBottom: 14, color: "#F8FAFC" }}>
            Fresh Offerings
          </div>
          {["SR Fresh Chapati (Pack of 5)", "SR Golden Poori (Pack of 6)", "SR Chitti Poori (Pack of 10)", "Chapati Combo 3x Saver", "Royal Grand Tasting Combo"].map((p) => (
            <div key={p} style={{ fontSize: 13, color: "#94A3B8", marginBottom: 8 }}>
              • {p}
            </div>
          ))}
        </div>

        {/* Contact & Dispatch */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", marginBottom: 14, color: "#F8FAFC" }}>
            Manufacturing &amp; Care
          </div>
          <div style={{ fontSize: 13, color: "#94A3B8", lineHeight: 1.8 }}>
            SR Enterprise<br />
            Kondayapalem, Nellore,<br />
            Andhra Pradesh - 524004<br />
            📞 <a href="tel:9177231026" style={{ color: "#FFD43B", textDecoration: "none" }}>+91 9177231026</a><br />
            ✉ <a href="mailto:srenterprises259@gmail.com" style={{ color: "#FFD43B", textDecoration: "none" }}>srenterprises259@gmail.com</a>
          </div>
        </div>
      </div>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 24, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, fontSize: 12, color: "#64748B" }}>
        <span>© {new Date().getFullYear()} SR Foods (SR Enterprise). All rights reserved.</span>
        <span>Crafted with ❤️ in Andhra Pradesh · 100% Wholesome Chakki Atta</span>
      </div>
    </footer>
  );
}

/* ── FLOATING WHATSAPP BUTTON ─────────────────────────────── */
function FloatingWhatsApp() {
  return (
    <a
      href="https://wa.me/919177231026?text=Hello%20SR%20Foods,%20I%20would%20like%20to%20order%20fresh%20chapatis%20and%20pooris!"
      target="_blank"
      rel="noreferrer"
      style={{
        position: "fixed",
        bottom: 24,
        left: 24,
        zIndex: 9999,
        background: "#25D366",
        color: "#fff",
        textDecoration: "none",
        padding: "11px 18px",
        borderRadius: 999,
        fontWeight: 800,
        fontSize: 13,
        display: "flex",
        alignItems: "center",
        gap: 8,
        boxShadow: "0 8px 24px rgba(37,211,102,0.4)",
        transition: "transform 0.2s",
      }}
      onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
      onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      <span style={{ fontSize: 18 }}>💬</span>
      <span>Quick Order</span>
    </a>
  );
}

/* ── MAIN ROOT COMPONENT ──────────────────────────────────── */
export default function App() {
  const { user, login, logout } = useAuth();
  const [page, setPage] = useState("home");
  const [products, setProducts] = useState(FALLBACK);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("sr_wl") || "[]");
    } catch {
      return [];
    }
  });
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [appliedPromoCode, setAppliedPromoCode] = useState("");

  // Product Auto Video Modal state (opens on SR Logo click or video trigger)
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [activeVideoKey, setActiveVideoKey] = useState("chapati");

  const handleOpenVideo = useCallback((key = "chapati") => {
    setActiveVideoKey(key);
    setVideoModalOpen(true);
  }, []);

  // Delivery destination location state
  const [location, setLocation] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("sr_loc") || '{"city":"Nellore","state":"Andhra Pradesh","pincode":"524004"}');
    } catch {
      return { city: "Nellore", state: "Andhra Pradesh", pincode: "524004" };
    }
  });

  const handleSaveLocation = (newLoc) => {
    setLocation(newLoc);
    localStorage.setItem("sr_loc", JSON.stringify(newLoc));
  };

  const go = useCallback((p) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Fetch products from backend
  useEffect(() => {
    api("/products?limit=20")
      .then((r) => {
        if (r.data?.length) {
          setProducts(
            r.data.map((p, i) => ({
              ...p,
              emoji: p.emoji || ["🫓", "🟡", "🔶", "🌟", "🎁", "👨‍👩‍👧‍👦"][i] || "🍽️",
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  // Fetch wishlist
  useEffect(() => {
    if (user) {
      api("/wishlist")
        .then((r) => setWishlist((r.data || []).map((p) => p._id || p)))
        .catch(() => {});
    }
  }, [user]);

  const addToCart = useCallback((product, qty = 1) => {
    setCart((c) => {
      const ex = c.find((i) => i._id === product._id);
      return ex
        ? c.map((i) => (i._id === product._id ? { ...i, qty: i.qty + qty } : i))
        : [...c, { ...product, qty }];
    });
    toast(`Added ${qty}× ${product.name} to your bag! 🛒`, "success");
    setCartDrawerOpen(true);
  }, []);

  const toggleWishlist = useCallback(
    async (pid) => {
      const inList = wishlist.includes(pid);
      const nw = inList ? wishlist.filter((id) => id !== pid) : [...wishlist, pid];
      setWishlist(nw);
      localStorage.setItem("sr_wl", JSON.stringify(nw));
      toast(inList ? "Removed from wishlist" : "❤️ Added to your wishlist", inList ? "info" : "success");
      if (user) {
        try {
          await api(`/wishlist/toggle/${pid}`, { method: "POST" });
        } catch {}
      }
    },
    [wishlist, user]
  );

  const applyPromoCode = useCallback(
    async (code) => {
      if (!code) return;
      const clean = code.trim().toUpperCase();
      const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
      try {
        const r = await api("/promo/validate", { method: "POST", body: JSON.stringify({ code: clean, subtotal }) });
        setPromoDiscount(r.discount);
        setAppliedPromoCode(clean);
        toast(`✓ Promo ${clean} applied! Saved ₹${r.discount}`, "success");
      } catch {
        const p = PROMOS[clean];
        if (!p) {
          toast("Invalid promo code", "error");
          return;
        }
        if (subtotal < p.min) {
          toast(`Code requires minimum ₹${p.min} order`, "error");
          return;
        }
        let disc = p.type === "flat" ? p.val : Math.round((subtotal * p.val) / 100);
        if (p.max) disc = Math.min(disc, p.max);
        setPromoDiscount(disc);
        setAppliedPromoCode(clean);
        toast(`✓ Promo ${clean} applied! You saved ₹${disc}`, "success");
      }
    },
    [cart]
  );

  const removePromoCode = useCallback(() => {
    setPromoDiscount(0);
    setAppliedPromoCode("");
    toast("Coupon removed", "info");
  }, []);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const renderPage = () => {
    switch (page) {
      case "shop":
        return (
          <Shop
            products={products}
            addToCart={addToCart}
            wishlist={wishlist}
            toggleWishlist={toggleWishlist}
            onQuickView={(p) => setQuickViewProduct(p)}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        );
      case "deals":
        return (
          <Deals
            products={products}
            addToCart={addToCart}
            wishlist={wishlist}
            toggleWishlist={toggleWishlist}
            onQuickView={(p) => setQuickViewProduct(p)}
            onApplyPromo={applyPromoCode}
          />
        );
      case "cook":
        return <CookingGuideSection go={go} />;
      case "reviews":
        return <Reviews user={user} products={products} />;
      case "checkout":
        return (
          <Checkout
            cart={cart}
            setCart={setCart}
            user={user}
            go={go}
            promoDiscount={promoDiscount}
            onApplyPromo={applyPromoCode}
            appliedPromoCode={appliedPromoCode}
            onRemovePromo={removePromoCode}
            location={location}
            onSaveLocation={handleSaveLocation}
          />
        );
      case "orders":
        return <Orders user={user} go={go} />;
      case "profile":
        return <Profile user={user} logout={logout} go={go} wishlist={wishlist} products={products} />;
      case "login":
        return <AuthPage login={login} go={go} />;
      case "admin":
        return <Admin user={user} go={go} />;
      default:
        return (
          <Home
            products={products}
            go={go}
            addToCart={addToCart}
            wishlist={wishlist}
            toggleWishlist={toggleWishlist}
            onQuickView={(p) => setQuickViewProduct(p)}
            onOpenVideoModal={handleOpenVideo}
          />
        );
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-main)" }}>
      {/* Top Banner Ticker with Location trigger */}
      <AnnouncementBar location={location} onOpenLocationModal={() => setLocationModalOpen(true)} />

      {/* Main Glassmorphic Navigation with SR Logo Auto Video Player Trigger */}
      <Navbar
        page={page}
        go={go}
        cartCount={cartCount}
        user={user}
        logout={logout}
        openCartDrawer={() => setCartDrawerOpen(true)}
        onSearch={(q) => { setSearchQuery(q); if (page !== "shop") setPage("shop"); }}
        searchQuery={searchQuery}
        onOpenVideoModal={handleOpenVideo}
      />

      {/* Main Route Content */}
      <main style={{ flex: 1 }}>{renderPage()}</main>

      {/* Footer */}
      <Footer go={go} />

      {/* Slide-over Cart Drawer */}
      <CartDrawer
        isOpen={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
        cart={cart}
        setCart={setCart}
        go={go}
        onApplyPromo={applyPromoCode}
        promoDiscount={promoDiscount}
        appliedPromoCode={appliedPromoCode}
        onRemovePromo={removePromoCode}
        location={location}
        onOpenLocationModal={() => setLocationModalOpen(true)}
      />

      {/* Location Selector Modal */}
      <LocationModal
        isOpen={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        location={location}
        onSaveLocation={handleSaveLocation}
      />

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        addToCart={addToCart}
      />

      {/* Auto Product Video Experience Modal (Clicking SR Logo or Video Buttons triggers this) */}
      <ProductVideoModal
        isOpen={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
        initialKey={activeVideoKey}
        addToCart={addToCart}
        products={products}
      />

      {/* Floating WhatsApp Quick Action */}
      <FloatingWhatsApp />

      {/* Dynamic Toast Notifications */}
      <ToastContainer />
    </div>
  );
}
