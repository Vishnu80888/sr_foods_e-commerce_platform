import { useState, useEffect, useRef, useCallback } from "react";

/* ── API ──────────────────────────────────────────────────── */
const BASE = "/api"; // proxied to http://localhost:5000
async function api(path, opts = {}) {
  const token = localStorage.getItem("sr_token");
  const res = await fetch(BASE + path, {
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...opts.headers },
    ...opts,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "API Error");
  return data;
}

/* ── Static fallback products ─────────────────────────────── */
const FALLBACK = [
  { _id:"p1", name:"Chapati",           tagline:"Soft & Healthy",       emoji:"🫓", image:"/images/chapati.jpg",      color:"#E8620A", bgColor:"#fff5eb", badge:"BESTSELLER", price:49,  originalPrice:60,  unit:"pack of 5",       category:"chapati", description:"Hand-rolled from whole chakki fresh atta. Perfectly soft, ready in minutes.", features:["No Preservatives","Whole Wheat","Heat & Eat"], stock:100, rating:4.8, reviewCount:124 },
  { _id:"p2", name:"Poori",             tagline:"Crispy & Delicious",    emoji:"🟡", image:"/images/poori.jpg",        color:"#2D6A2D", bgColor:"#eef7ee", badge:"POPULAR",    price:59,  originalPrice:70,  unit:"pack of 6",       category:"poori",   description:"Golden deep-fried pooris from whole chakki atta. Crispy & light.",              features:["No Preservatives","Premium Atta","Puffed"],    stock:100, rating:4.9, reviewCount:89  },
  { _id:"p3", name:"Chitti Poori",      tagline:"Festival Ready",        emoji:"🔶", image:"/images/chitti-poori.jpg", color:"#8B4513", bgColor:"#fff5ee", badge:"SPECIAL",    price:55,  originalPrice:65,  unit:"pack of 10",      category:"special", description:"Mini bite-sized pooris for festive meals, chaat & parties.",                   features:["Bite-Sized","No Preservatives","Crispy"],      stock:100, rating:4.7, reviewCount:56  },
  { _id:"p4", name:"Chapati Combo 3x",  tagline:"Family Value Pack",     emoji:"🌟", image:"/images/chapati.jpg",      color:"#1B3A6B", bgColor:"#e8f0fe", badge:"VALUE",      price:129, originalPrice:180, unit:"3 packs × 5",     category:"combo",   description:"3 packs of Chapati — 15 chapatis at the best price.",                          features:["Best Value","15 Chapatis","Free Delivery"],    stock:80,  rating:4.8, reviewCount:42  },
  { _id:"p5", name:"Mixed Combo",       tagline:"Best of All 3",         emoji:"🎁", image:"/images/chitti-poori.jpg", color:"#7B3B10", bgColor:"#fdf3e7", badge:"HOT",        price:149, originalPrice:220, unit:"3 packs combo",   category:"combo",   description:"1 pack each of Chapati, Poori & Chitti Poori.",                               features:["3 Products","Biggest Saving","Free Delivery"], stock:60,  rating:4.9, reviewCount:78  },
  { _id:"p6", name:"Poori Family Pack", tagline:"Party Ready",           emoji:"👨‍👩‍👧‍👦", image:"/images/poori.jpg",      color:"#2D6A2D", bgColor:"#eef7ee", badge:"FAMILY",  price:269, originalPrice:350, unit:"5 packs × 6",     category:"combo",   description:"30 pooris total — perfect for parties & family gatherings.",                   features:["30 Pooris","Party Ready","Free Delivery"],     stock:50,  rating:4.7, reviewCount:31  },
];

const PROMOS = { SRFRESH20:{type:"pct",val:20,max:100,min:99}, WELCOME10:{type:"pct",val:10,max:50,min:49}, POORI15:{type:"pct",val:15,max:75,min:59}, FLAT30:{type:"flat",val:30,min:149}, COMBO25:{type:"pct",val:25,max:120,min:129} };

/* ── Toast ────────────────────────────────────────────────── */
let _addToast=null;
function ToastContainer() {
  const [list,setList]=useState([]);
  _addToast=(msg,type="info")=>{const id=Date.now();setList(l=>[...l.slice(-2),{id,msg,type}]);setTimeout(()=>setList(l=>l.filter(t=>t.id!==id)),3000);};
  const bg={info:"#1a1a1a",success:"#1a5c2a",error:"#b71c1c"};
  return <div style={{position:"fixed",bottom:20,right:20,zIndex:9999,display:"flex",flexDirection:"column",gap:8}}>
    {list.map(t=><div key={t.id} style={{background:bg[t.type]||bg.info,color:"#fff",padding:"11px 18px",borderRadius:12,fontFamily:"sans-serif",fontSize:13,fontWeight:600,maxWidth:320,boxShadow:"0 4px 20px rgba(0,0,0,.25)"}}>{t.msg}</div>)}
  </div>;
}
const toast=(msg,type)=>_addToast?.(msg,type);

/* ── Auth hook ────────────────────────────────────────────── */
function useAuth(){
  const [user,setUser]=useState(()=>{try{return JSON.parse(localStorage.getItem("sr_user")||"null")}catch{return null}});
  const login=(token,u)=>{localStorage.setItem("sr_token",token);localStorage.setItem("sr_user",JSON.stringify(u));setUser(u);};
  const logout=()=>{localStorage.removeItem("sr_token");localStorage.removeItem("sr_user");setUser(null);};
  return{user,login,logout,isAdmin:user?.role==="admin"};
}

/* ── Shared UI ────────────────────────────────────────────── */
const s={
  card:(extra={})=>({background:"#fff",borderRadius:20,padding:24,boxShadow:"0 2px 16px rgba(0,0,0,.06)",...extra}),
  btn:(col="#E8620A")=>({background:col,color:"#fff",border:"none",borderRadius:12,padding:"11px 22px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"sans-serif",transition:"all .2s"}),
  outBtn:()=>({background:"transparent",color:"#1B3A6B",border:"2px solid #1B3A6B",borderRadius:12,padding:"11px 22px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"sans-serif"}),
  input:()=>({width:"100%",padding:"10px 13px",borderRadius:10,border:"1.5px solid #e0e0e0",fontFamily:"sans-serif",fontSize:13,outline:"none",boxSizing:"border-box"}),
  label:()=>({fontFamily:"sans-serif",fontSize:11,fontWeight:700,color:"#555",display:"block",marginBottom:5,letterSpacing:.5}),
};

function Inp({label,value,onChange,type="text",placeholder,required}){
  return <div style={{marginBottom:14}}>
    {label&&<label style={s.label()}>{label}{required&&" *"}</label>}
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={s.input()} onFocus={e=>e.target.style.borderColor="#1B3A6B"} onBlur={e=>e.target.style.borderColor="#e0e0e0"}/>
  </div>;
}
function Sel({label,value,onChange,options}){
  return <div style={{marginBottom:14}}>
    {label&&<label style={s.label()}>{label}</label>}
    <select value={value} onChange={onChange} style={{...s.input(),background:"#fff"}}>{options.map(o=><option key={o.value||o} value={o.value||o}>{o.label||o}</option>)}</select>
  </div>;
}

/* ── Navbar ───────────────────────────────────────────────── */
function Navbar({page,go,cartCount,user,logout}){
  const links=user?.role==="admin"
    ?[["Home","home"],["Products","shop"],["Admin","admin"]]
    :[["Home","home"],["Shop","shop"],["Deals","deals"],["Reviews","reviews"],["Orders","orders"],["Profile","profile"]];
  return <nav style={{position:"sticky",top:0,zIndex:200,background:"rgba(255,255,255,.97)",backdropFilter:"blur(12px)",borderBottom:"1px solid #e8e4dc",padding:"0 24px",display:"flex",alignItems:"center",justifyContent:"space-between",height:60}}>
    <div onClick={()=>go("home")} style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}>
      <div style={{width:38,height:38,borderRadius:"50%",background:"linear-gradient(135deg,#1B3A6B,#2563c4)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:14,fontFamily:"Georgia,serif"}}>SR</div>
      <div><div style={{fontWeight:800,fontSize:17,color:"#1B3A6B",fontFamily:"Georgia,serif"}}>SR Foods</div><div style={{fontSize:9,color:"#E8620A",fontWeight:700,letterSpacing:1,fontFamily:"sans-serif"}}>FRESH TASTE · ANYTIME · ANYWHERE</div></div>
    </div>
    <div style={{display:"flex",gap:2,flexWrap:"wrap"}}>
      {links.map(([l,k])=><button key={k} onClick={()=>go(k)} style={{background:page===k?"#1B3A6B":"transparent",color:page===k?"#fff":"#555",border:"none",borderRadius:8,padding:"6px 13px",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"sans-serif"}}>{l}</button>)}
      {!user&&<button onClick={()=>go("login")} style={{background:"transparent",color:"#1B3A6B",border:"1.5px solid #1B3A6B",borderRadius:8,padding:"6px 13px",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"sans-serif",marginLeft:4}}>Login</button>}
      {user&&<button onClick={()=>{logout();go("home");toast("Logged out");}} style={{background:"#fdecea",color:"#c0392b",border:"none",borderRadius:8,padding:"6px 13px",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"sans-serif",marginLeft:4}}>Logout</button>}
    </div>
    <button onClick={()=>go("checkout")} style={{background:"#E8620A",color:"#fff",border:"none",borderRadius:22,padding:"8px 18px",cursor:"pointer",fontFamily:"sans-serif",fontSize:12,fontWeight:700,display:"flex",alignItems:"center",gap:7}}>
      🛒 Cart <span style={{background:"#fff",color:"#E8620A",borderRadius:"50%",width:19,height:19,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800}}>{cartCount}</span>
    </button>
  </nav>;
}

/* ── Product Card ─────────────────────────────────────────── */
function PCard({p,addToCart,wishlisted,onWishlist}){
  const [qty,setQty]=useState(1);
  const [added,setAdded]=useState(false);
  const disc=Math.round((1-p.price/p.originalPrice)*100);
  const handleAdd=()=>{addToCart(p,qty);setAdded(true);setTimeout(()=>setAdded(false),1500);};
  return <div style={{background:"#fff",borderRadius:22,boxShadow:"0 2px 18px rgba(0,0,0,.07)",overflow:"hidden",transition:"all .25s",display:"flex",flexDirection:"column"}} onMouseOver={e=>{e.currentTarget.style.boxShadow="0 8px 36px rgba(0,0,0,.13)";e.currentTarget.style.transform="translateY(-2px)";}} onMouseOut={e=>{e.currentTarget.style.boxShadow="0 2px 18px rgba(0,0,0,.07)";e.currentTarget.style.transform="none";}}>
    <div style={{background:p.bgColor||"#f9f9f6",padding:"16px 20px 16px",textAlign:"center",position:"relative"}}>
      {p.image
        ? <img src={p.image} alt={p.name} style={{width:"100%",height:"100%",objectFit:"contain",borderRadius:14,display:"block"}} onError={e=>{e.target.style.display="none";e.target.nextSibling.style.display="flex";}} />
        : null}
      <div style={{fontSize:56,display:p.image?"none":"flex",alignItems:"center",justifyContent:"center",height:180}}>{p.emoji||"🍽️"}</div>
      <span style={{position:"absolute",top:12,right:12,background:p.color,color:"#fff",fontSize:9,fontWeight:800,letterSpacing:1,padding:"3px 10px",borderRadius:20,fontFamily:"sans-serif"}}>{p.badge}</span>
      <button onClick={()=>onWishlist(p._id)} style={{position:"absolute",top:10,left:10,background:"rgba(255,255,255,.9)",border:"none",borderRadius:"50%",width:32,height:32,cursor:"pointer",fontSize:17}}>{wishlisted?"❤️":"🤍"}</button>
      {p.rating>0&&<div style={{position:"absolute",bottom:8,left:12,background:"rgba(255,255,255,.9)",borderRadius:20,padding:"2px 8px",fontFamily:"sans-serif",fontSize:10,fontWeight:700,color:"#555"}}>{"★".repeat(Math.round(p.rating))} {p.rating} ({p.reviewCount})</div>}
    </div>
    <div style={{padding:"16px 18px 18px",flex:1,display:"flex",flexDirection:"column"}}>
      <div style={{fontSize:19,fontWeight:800,fontFamily:"Georgia,serif",color:"#1a1a1a",marginBottom:3}}>{p.name}</div>
      <div style={{fontSize:12,fontWeight:600,color:p.color,fontFamily:"sans-serif",marginBottom:8}}>{p.tagline}</div>
      <div style={{fontSize:13,color:"#666",fontFamily:"sans-serif",lineHeight:1.55,marginBottom:10,flex:1}}>{p.description}</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:12}}>{(p.features||[]).map(f=><span key={f} style={{background:`${p.color}18`,color:p.color,fontFamily:"sans-serif",fontSize:10,fontWeight:600,padding:"3px 8px",borderRadius:20}}>✓ {f}</span>)}</div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <div><div style={{fontSize:22,fontWeight:800,color:"#1B3A6B",fontFamily:"Georgia,serif"}}>₹{p.price}</div><div style={{fontFamily:"sans-serif",fontSize:11,color:"#aaa"}}><s>₹{p.originalPrice}</s> · {p.unit}</div></div>
        <span style={{background:"#e8f7e8",color:"#2D6A2D",fontFamily:"sans-serif",fontSize:12,fontWeight:800,padding:"4px 11px",borderRadius:20}}>{disc}% OFF</span>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
        <div style={{display:"flex",alignItems:"center",gap:6,background:"#f5f5f0",borderRadius:10,padding:"4px 8px"}}>
          <button onClick={()=>setQty(q=>Math.max(1,q-1))} style={{width:26,height:26,borderRadius:"50%",border:"none",background:"#fff",cursor:"pointer",fontWeight:800}}>−</button>
          <span style={{fontWeight:800,fontSize:15,minWidth:22,textAlign:"center"}}>{qty}</span>
          <button onClick={()=>setQty(q=>Math.min(p.stock||99,q+1))} style={{width:26,height:26,borderRadius:"50%",border:"none",background:"#fff",cursor:"pointer",fontWeight:800}}>+</button>
        </div>
        <span style={{fontFamily:"sans-serif",fontSize:11,color:p.stock>0?"#2D6A2D":"#c0392b",fontWeight:600}}>{p.stock>0?`⚡ ${p.stock} left`:"Out of Stock"}</span>
      </div>
      <button onClick={handleAdd} disabled={p.stock<1} style={{width:"100%",background:added?"#2D6A2D":p.color,color:"#fff",border:"none",borderRadius:12,padding:"11px",fontSize:13,fontWeight:700,cursor:p.stock<1?"not-allowed":"pointer",fontFamily:"sans-serif",transition:"background .3s",opacity:p.stock<1?.5:1}}>
        {added?"✓ Added to Cart!":p.stock<1?"Out of Stock":"Add to Cart 🛒"}
      </button>
    </div>
  </div>;
}

/* ── HOME ─────────────────────────────────────────────────── */
function Home({products,go,addToCart,wishlist,toggleWishlist}){
  const [nl,setNl]=useState("");
  const subscribe=async()=>{if(!nl)return;try{await api("/newsletter",{method:"POST",body:JSON.stringify({email:nl})})}catch{}toast("🎉 Subscribed!","success");setNl("");};
  return <div>
    {/* Hero */}
    <div style={{background:"linear-gradient(135deg,#fffbe8,#fff5eb 50%,#eef7ee)",padding:"68px 24px 52px"}}>
      <div style={{maxWidth:1100,margin:"0 auto",display:"grid",gridTemplateColumns:"1.1fr .9fr",gap:52,alignItems:"center"}}>
        <div>
          <div style={{display:"inline-block",background:"#1B3A6B",color:"#fff",fontFamily:"sans-serif",fontSize:10,fontWeight:700,letterSpacing:2,padding:"5px 14px",borderRadius:20,marginBottom:18}}>MADE FROM WHOLE CHAKKI FRESH ATTA</div>
          <h1 style={{fontSize:"clamp(2.1rem,4.5vw,3.6rem)",fontFamily:"Georgia,serif",fontWeight:800,lineHeight:1.08,margin:"0 0 16px"}}>
            <span style={{color:"#1B3A6B"}}>Fresh Taste.</span><br/>
            <span style={{color:"#E8620A"}}>Anytime.</span><br/>
            <span style={{color:"#2D6A2D"}}>Anywhere.</span>
          </h1>
          <p style={{fontFamily:"sans-serif",fontSize:15,color:"#666",lineHeight:1.75,maxWidth:460,marginBottom:26}}>Premium ready-to-cook Chapati & Poori — no preservatives, no artificial flavours. Homemade taste delivered to your door.</p>
          <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:32}}>
            <button onClick={()=>go("shop")} style={s.btn()}>Shop Now →</button>
            <button onClick={()=>go("deals")} style={s.outBtn()}>🏷️ View Deals</button>
          </div>
          <div style={{display:"flex",gap:18,flexWrap:"wrap"}}>
            {[["🌿","No Preservatives"],["✨","No Flavours"],["🚚","Free Delivery"],["🔒","Secure Pay"],["↩️","Easy Returns"]].map(([e,l])=><div key={l} style={{textAlign:"center"}}><div style={{width:38,height:38,borderRadius:10,background:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,margin:"0 auto 5px",boxShadow:"0 2px 10px rgba(0,0,0,.09)"}}>{e}</div><div style={{fontFamily:"sans-serif",fontSize:10,color:"#999",fontWeight:600}}>{l}</div></div>)}
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:13}}>
          {products.slice(0,3).map((p,i)=><div key={p._id} onClick={()=>go("shop")} style={{background:"#fff",borderRadius:16,padding:"13px 17px",display:"flex",alignItems:"center",gap:14,boxShadow:"0 4px 20px rgba(0,0,0,.08)",cursor:"pointer",border:`2px solid ${p.color}22`,transform:i===1?"translateX(18px)":"none",transition:"all .2s"}} onMouseOver={e=>{e.currentTarget.style.borderColor=p.color;}} onMouseOut={e=>{e.currentTarget.style.borderColor=`${p.color}22`;}}>
            <div style={{width:48,height:48,borderRadius:12,background:p.bgColor,overflow:"hidden",flexShrink:0}}>{p.image?<img src={p.image} alt={p.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{display:"flex",alignItems:"center",justifyContent:"center",width:"100%",height:"100%",fontSize:24}}>{p.emoji}</span>}</div>
            <div style={{flex:1}}><div style={{fontWeight:800,fontSize:15,fontFamily:"Georgia,serif"}}>{p.name}</div><div style={{fontFamily:"sans-serif",fontSize:12,fontWeight:600,color:p.color}}>{p.tagline}</div></div>
            <div style={{textAlign:"right"}}><div style={{fontWeight:800,fontSize:16,color:"#1B3A6B",fontFamily:"Georgia,serif"}}>₹{p.price}</div></div>
          </div>)}
        </div>
      </div>
    </div>
    {/* Products */}
    <div style={{maxWidth:1100,margin:"0 auto",padding:"52px 24px"}}>
      <div style={{textAlign:"center",marginBottom:36}}>
        <div style={{fontFamily:"sans-serif",fontSize:10,fontWeight:700,letterSpacing:3,color:"#E8620A",marginBottom:8}}>BEST SELLERS</div>
        <h2 style={{fontFamily:"Georgia,serif",fontSize:"clamp(1.7rem,3.5vw,2.5rem)",fontWeight:800,color:"#1a1a1a",margin:0}}>Our Products</h2>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(290px,1fr))",gap:22,marginBottom:52}}>
        {products.slice(0,3).map(p=><PCard key={p._id} p={p} addToCart={addToCart} wishlisted={wishlist.includes(p._id)} onWishlist={toggleWishlist}/>)}
      </div>
      {/* Why us */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:18,marginBottom:48}}>
        {[["🌾","100% Whole Wheat","Premium whole chakki fresh atta — nothing artificial."],["🏭","FSSAI Certified","Lic. 20126181000074. Strict quality standards."],["🔥","Heat & Eat","Ready in under 5 minutes anytime."],["🚚","Fresh Delivery","Cold chain maintained. Door delivery."]].map(([icon,title,desc])=><div key={title} style={s.card({textAlign:"center"})}><div style={{fontSize:34,marginBottom:10}}>{icon}</div><div style={{fontWeight:800,fontSize:15,fontFamily:"Georgia,serif",marginBottom:6}}>{title}</div><div style={{fontFamily:"sans-serif",fontSize:13,color:"#666",lineHeight:1.6}}>{desc}</div></div>)}
      </div>
      {/* Newsletter */}
      <div style={{background:"linear-gradient(135deg,#E8620A,#d4521a)",borderRadius:22,padding:"28px 32px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:18}}>
        <div><h3 style={{color:"#fff",fontSize:20,fontFamily:"Georgia,serif",margin:"0 0 5px"}}>Get Exclusive Offers</h3><p style={{color:"rgba(255,255,255,.85)",fontFamily:"sans-serif",fontSize:13,margin:0}}>Subscribe and get 10% off your first order</p></div>
        <div style={{display:"flex",gap:8}}><input value={nl} onChange={e=>setNl(e.target.value)} onKeyDown={e=>e.key==="Enter"&&subscribe()} placeholder="your@email.com" style={{padding:"11px 16px",borderRadius:10,border:"none",fontFamily:"sans-serif",fontSize:13,outline:"none",minWidth:210}}/><button onClick={subscribe} style={{background:"#fff",color:"#E8620A",border:"none",borderRadius:10,padding:"11px 18px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"sans-serif"}}>Subscribe →</button></div>
      </div>
    </div>
  </div>;
}

/* ── SHOP ─────────────────────────────────────────────────── */
function Shop({products,addToCart,wishlist,toggleWishlist}){
  const [filter,setFilter]=useState("all");
  const [search,setSearch]=useState("");
  const [sort,setSort]=useState("default");
  const filtered=products.filter(p=>(filter==="all"||p.category===filter)&&(!search||p.name.toLowerCase().includes(search.toLowerCase()))).sort((a,b)=>sort==="price_asc"?a.price-b.price:sort==="price_desc"?b.price-a.price:sort==="discount"?(b.originalPrice-b.price)-(a.originalPrice-a.price):0);
  return <div style={{maxWidth:1100,margin:"0 auto",padding:"40px 24px"}}>
    <div style={{textAlign:"center",marginBottom:32}}><div style={{fontFamily:"sans-serif",fontSize:10,fontWeight:700,letterSpacing:3,color:"#E8620A",marginBottom:8}}>ONLINE STORE</div><h2 style={{fontFamily:"Georgia,serif",fontSize:"clamp(1.7rem,3.5vw,2.5rem)",fontWeight:800,color:"#1a1a1a",margin:0}}>Shop SR Foods</h2></div>
    <div style={{display:"flex",gap:10,justifyContent:"center",marginBottom:18,flexWrap:"wrap"}}>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search products..." style={{padding:"10px 16px",borderRadius:12,border:"1.5px solid #e0e0e0",fontFamily:"sans-serif",fontSize:13,outline:"none",width:240}}/>
      <select value={sort} onChange={e=>setSort(e.target.value)} style={{padding:"10px 14px",borderRadius:12,border:"1.5px solid #e0e0e0",fontFamily:"sans-serif",fontSize:13,background:"#fff"}}>
        <option value="default">Sort: Default</option><option value="price_asc">Price: Low → High</option><option value="price_desc">Price: High → Low</option><option value="discount">Biggest Discount</option>
      </select>
    </div>
    <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:30,flexWrap:"wrap"}}>
      {[["all","All"],["chapati","Chapati"],["poori","Poori"],["special","Special"],["combo","Combos"]].map(([k,l])=><button key={k} onClick={()=>setFilter(k)} style={{fontFamily:"sans-serif",fontSize:12,fontWeight:600,padding:"7px 18px",borderRadius:20,border:"1.5px solid",borderColor:filter===k?"#1B3A6B":"#e0e0e0",background:filter===k?"#1B3A6B":"#fff",color:filter===k?"#fff":"#666",cursor:"pointer"}}>{l}</button>)}
    </div>
    {filtered.length===0?<div style={{textAlign:"center",padding:52,color:"#aaa",fontFamily:"sans-serif"}}>No products found</div>:
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(285px,1fr))",gap:22}}>
      {filtered.map(p=><PCard key={p._id} p={p} addToCart={addToCart} wishlisted={wishlist.includes(p._id)} onWishlist={toggleWishlist}/>)}
    </div>}
  </div>;
}

/* ── DEALS ────────────────────────────────────────────────── */
function Deals({products,addToCart,wishlist,toggleWishlist}){
  const deals=[
    {code:"SRFRESH20",title:"Weekend Special — 20% OFF",desc:"Valid on all products.",color:"#E8620A",badge:"20% OFF"},
    {code:"WELCOME10",title:"New Customer — 10% OFF",desc:"First order discount.",color:"#2D6A2D",badge:"10% OFF"},
    {code:"POORI15",title:"Poori Lovers — 15% OFF",desc:"On all Poori variants.",color:"#1B3A6B",badge:"15% OFF"},
    {code:"FLAT30",title:"Flat ₹30 Off",desc:"Orders above ₹149.",color:"#8B4513",badge:"₹30 OFF"},
    {code:"COMBO25",title:"Combo Saver — 25% OFF",desc:"On all combo packs.",color:"#7B3B10",badge:"25% OFF"},
  ];
  return <div style={{maxWidth:1100,margin:"0 auto",padding:"40px 24px"}}>
    <div style={{textAlign:"center",marginBottom:36}}><div style={{fontFamily:"sans-serif",fontSize:10,fontWeight:700,letterSpacing:3,color:"#E8620A",marginBottom:8}}>LIMITED TIME</div><h2 style={{fontFamily:"Georgia,serif",fontSize:"clamp(1.7rem,3.5vw,2.5rem)",fontWeight:800,color:"#1a1a1a",margin:0}}>Today's Deals</h2></div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(270px,1fr))",gap:16,marginBottom:44}}>
      {deals.map(d=><div key={d.code} style={{background:d.color,borderRadius:20,padding:24,color:"#fff"}}>
        <div style={{fontSize:18,fontWeight:800,fontFamily:"Georgia,serif",marginBottom:7}}>{d.title}</div>
        <p style={{fontFamily:"sans-serif",fontSize:13,opacity:.9,marginBottom:16,lineHeight:1.6}}>{d.desc}</p>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"rgba(255,255,255,.2)",borderRadius:10,padding:"10px 14px",marginBottom:10}}>
          <code style={{fontSize:15,fontWeight:800,letterSpacing:2}}>{d.code}</code>
          <span style={{fontFamily:"sans-serif",fontSize:18,fontWeight:800}}>{d.badge}</span>
        </div>
        <button onClick={()=>{navigator.clipboard?.writeText(d.code);toast(`Code ${d.code} copied!`,"success");}} style={{width:"100%",background:"rgba(255,255,255,.15)",color:"#fff",border:"1px solid rgba(255,255,255,.4)",borderRadius:8,padding:"7px",fontFamily:"sans-serif",fontSize:12,fontWeight:600,cursor:"pointer"}}>Copy Code 📋</button>
      </div>)}
    </div>
    <div style={{fontFamily:"sans-serif",fontSize:10,fontWeight:700,letterSpacing:3,color:"#E8620A",marginBottom:16}}>COMBO DEALS</div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(285px,1fr))",gap:22}}>
      {products.filter(p=>p.category==="combo").map(p=><PCard key={p._id} p={p} addToCart={addToCart} wishlisted={wishlist.includes(p._id)} onWishlist={toggleWishlist}/>)}
    </div>
  </div>;
}

/* ── REVIEWS ──────────────────────────────────────────────── */
function Reviews({user,products}){
  const [reviews,setReviews]=useState([
    {_id:"r1",userName:"Priya Sharma",product:"Chapati",rating:5,text:"Amazing quality! Tastes exactly like homemade. Perfect for busy mornings.",verified:true},
    {_id:"r2",userName:"Ravi Kumar",product:"Poori",rating:5,text:"Best pooris I've had outside a restaurant. My kids love them!",verified:true},
    {_id:"r3",userName:"Lakshmi Devi",product:"Chitti Poori",rating:4,text:"Great for festive occasions. Made them for Ugadi — everyone loved it!",verified:false},
    {_id:"r4",userName:"Anand Rao",product:"Mixed Combo",rating:5,text:"Excellent value combo. No artificial taste at all. Will order again.",verified:true},
  ]);
  const [form,setForm]=useState({productId:"",rating:0,title:"",text:""});
  const [stars,setStars]=useState(0);
  const [loading,setLoading]=useState(false);
  const f=k=>e=>setForm(v=>({...v,[k]:e.target.value}));
  const submit=async()=>{
    if(!form.productId||!stars||!form.text){toast("Please select product, rating and write a review","error");return;}
    setLoading(true);
    try{const r=await api("/reviews",{method:"POST",body:JSON.stringify({...form,rating:stars})});setReviews(rv=>[{_id:r.data._id,userName:user?.name||"You",product:products.find(p=>p._id===form.productId)?.name,rating:stars,text:form.text,verified:r.data.verified},...rv]);}
    catch{const pName=products.find(p=>p._id===form.productId)?.name||"Product";setReviews(rv=>[{_id:Date.now(),userName:user?.name||"You",product:pName,rating:stars,text:form.text,verified:false},...rv]);}
    toast("✓ Review submitted!","success");setForm({productId:"",rating:0,title:"",text:""});setStars(0);setLoading(false);
  };
  const ac=["#E8620A","#2D6A2D","#1B3A6B","#8B4513","#7B3B10"];
  return <div style={{maxWidth:1100,margin:"0 auto",padding:"40px 24px"}}>
    <div style={{textAlign:"center",marginBottom:36}}><div style={{fontFamily:"sans-serif",fontSize:10,fontWeight:700,letterSpacing:3,color:"#E8620A",marginBottom:8}}>CUSTOMER FEEDBACK</div><h2 style={{fontFamily:"Georgia,serif",fontSize:"clamp(1.7rem,3.5vw,2.5rem)",fontWeight:800,color:"#1a1a1a",margin:0}}>Reviews & Ratings</h2></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 400px",gap:28,alignItems:"start"}}>
      <div>{reviews.map((r,i)=><div key={r._id} style={{...s.card(),marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
          <div style={{width:40,height:40,borderRadius:"50%",background:ac[i%5],display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:15}}>{(r.userName||"U")[0].toUpperCase()}</div>
          <div style={{flex:1}}><div style={{fontWeight:700,fontSize:14,display:"flex",alignItems:"center",gap:8}}>{r.userName}{r.verified&&<span style={{background:"#eef7ee",color:"#2D6A2D",fontFamily:"sans-serif",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20}}>✓ Verified</span>}</div><div style={{color:"#f59e0b",fontSize:14}}>{"★".repeat(r.rating)}{"☆".repeat(5-r.rating)}</div></div>
          <span style={{background:"#e8f0fe",color:"#1B3A6B",fontFamily:"sans-serif",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20}}>{r.product}</span>
        </div>
        <p style={{fontFamily:"sans-serif",fontSize:13,color:"#555",lineHeight:1.6,margin:0}}>{r.text}</p>
      </div>)}</div>
      <div style={s.card()}>
        <div style={{fontWeight:800,fontSize:17,fontFamily:"Georgia,serif",marginBottom:18}}>Write a Review</div>
        {!user&&<div style={{background:"#fdecea",color:"#c0392b",borderRadius:10,padding:"10px 14px",fontFamily:"sans-serif",fontSize:13,fontWeight:600,marginBottom:16}}>Please login to submit a review</div>}
        <Sel label="PRODUCT" value={form.productId} onChange={f("productId")} options={[{value:"",label:"Select a product..."}, ...products.map(p=>({value:p._id,label:p.name}))]}/>
        <div style={{marginBottom:14}}><div style={s.label()}>RATING *</div><div style={{display:"flex",gap:4}}>{[1,2,3,4,5].map(n=><button key={n} onClick={()=>setStars(n)} style={{fontSize:28,cursor:"pointer",background:"none",border:"none",color:n<=stars?"#f59e0b":"#ddd"}}>★</button>)}</div></div>
        <Inp label="TITLE (optional)" value={form.title} onChange={f("title")} placeholder="Summarise your experience"/>
        <div style={{marginBottom:16}}><label style={s.label()}>YOUR REVIEW *</label><textarea value={form.text} onChange={f("text")} rows={4} placeholder="Share your experience..." style={{...s.input(),resize:"vertical"}}/></div>
        <button onClick={submit} disabled={!user||loading} style={{...s.btn(),width:"100%",borderRadius:12,padding:"12px",opacity:(!user||loading)?.6:1}}>{loading?"Submitting...":"Submit Review →"}</button>
      </div>
    </div>
  </div>;
}

/* ── CHECKOUT ─────────────────────────────────────────────── */
function Checkout({cart,setCart,user,go}){
  const [form,setForm]=useState({name:user?.name||"",phone:user?.phone||"",email:"",line1:"",line2:"",city:"",state:"Andhra Pradesh",pincode:"",slot:"Morning (8 AM - 12 PM)",notes:""});
  const [payment,setPayment]=useState("COD");
  const [promo,setPromo]=useState("");
  const [discount,setDiscount]=useState(0);
  const [promoMsg,setPromoMsg]=useState(null);
  const [loading,setLoading]=useState(false);
  const [success,setSuccess]=useState(null);
  const f=k=>e=>setForm(v=>({...v,[k]:e.target.value}));
  const subtotal=cart.reduce((s,i)=>s+i.price*i.qty,0);
  const total=Math.max(0,subtotal-discount);

  const applyPromo=async()=>{
    if(!promo)return;setPromoMsg(null);
    try{const r=await api("/promo/validate",{method:"POST",body:JSON.stringify({code:promo,subtotal})});setDiscount(r.discount);setPromoMsg({type:"success",text:`✓ ${r.description} — save ₹${r.discount}`});}
    catch{const c=PROMOS[promo.toUpperCase()];if(!c||subtotal<c.min){setPromoMsg({type:"error",text:c?`Min ₹${c.min} required`:"Invalid code"});return;}
      let d=c.type==="flat"?c.val:Math.round(subtotal*c.val/100);if(c.max)d=Math.min(d,c.max);setDiscount(d);setPromoMsg({type:"success",text:`✓ Applied — save ₹${d}`});}
  };

  const placeOrder=async()=>{
    if(!form.name||!form.phone||!form.email||!form.line1||!form.city||!form.state||!form.pincode){toast("Please fill all delivery fields","error");return;}
    if(!cart.length){toast("Cart is empty!","error");return;}
    setLoading(true);
    try{
      const directItems=cart.map(i=>({productId:i._id,quantity:i.qty}));
      const res=await api("/orders",{method:"POST",body:JSON.stringify({delivery:form,paymentMethod:payment,promoCode:promo||undefined,useCart:false,directItems})});
      setCart([]);setSuccess({orderId:res.data.orderId,total:res.data.total,items:[...cart]});
    }catch{const oid="SR-"+Date.now().toString().slice(-8);setCart([]);setSuccess({orderId:oid,total,items:[...cart]});}
    setLoading(false);
  };

  if(success)return <div style={{maxWidth:600,margin:"60px auto",padding:24,textAlign:"center"}}>
    <div style={{width:80,height:80,borderRadius:"50%",background:"linear-gradient(135deg,#2D6A2D,#4CAF50)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:36,margin:"0 auto 20px"}}>✓</div>
    <h2 style={{fontFamily:"Georgia,serif",fontSize:28,marginBottom:6}}>Order Placed! 🎉</h2>
    <p style={{fontFamily:"sans-serif",color:"#666",marginBottom:6}}>Thank you for shopping with SR Foods</p>
    <div style={{fontFamily:"sans-serif",fontSize:13,color:"#999",marginBottom:6}}>Order ID: <strong style={{color:"#1B3A6B"}}>{success.orderId}</strong></div>
    <div style={{fontFamily:"sans-serif",fontSize:13,color:"#2D6A2D",fontWeight:600,marginBottom:28}}>Estimated delivery: 2 business days</div>
    <div style={{display:"flex",justifyContent:"space-between",position:"relative",marginBottom:36}}>
      <div style={{position:"absolute",top:16,left:"10%",right:"10%",height:2,background:"#e0e0e0"}}/>
      {["Placed","Confirmed","Packed","Shipped","Delivered"].map((st,i)=><div key={st} style={{textAlign:"center",flex:1,position:"relative",zIndex:1}}>
        <div style={{width:33,height:33,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,margin:"0 auto 7px",background:i<2?"#E8620A":"#f0f0f0",color:i<2?"#fff":"#bbb",fontWeight:700}}>{i===0?"✓":i+1}</div>
        <div style={{fontFamily:"sans-serif",fontSize:10,fontWeight:600,color:i<2?"#E8620A":"#aaa"}}>{st}</div>
      </div>)}
    </div>
    <div style={{...s.card(),textAlign:"left",marginBottom:24}}>
      {success.items.map(i=><div key={i._id} style={{display:"flex",justifyContent:"space-between",fontFamily:"sans-serif",fontSize:13,padding:"6px 0",borderBottom:"1px solid #f5f5f0"}}><span>{i.emoji} {i.name} × {i.qty}</span><span>₹{i.price*i.qty}</span></div>)}
      <div style={{display:"flex",justifyContent:"space-between",fontWeight:800,fontSize:17,paddingTop:12,marginTop:4}}><span>Total</span><span>₹{success.total}</span></div>
    </div>
    <div style={{display:"flex",gap:12,justifyContent:"center"}}>
      <button onClick={()=>go("orders")} style={s.btn()}>Track Order</button>
      <button onClick={()=>go("shop")} style={s.outBtn()}>Continue Shopping</button>
    </div>
  </div>;

  return <div style={{maxWidth:1100,margin:"0 auto",padding:"40px 24px"}}>
    <div style={{marginBottom:28}}><div style={{fontFamily:"sans-serif",fontSize:10,fontWeight:700,letterSpacing:3,color:"#E8620A",marginBottom:6}}>SECURE CHECKOUT</div><h2 style={{fontFamily:"Georgia,serif",fontSize:"clamp(1.6rem,3.5vw,2.4rem)",fontWeight:800,color:"#1a1a1a",margin:0}}>Complete Your Order</h2></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 380px",gap:24,alignItems:"start"}}>
      <div>
        <div style={{...s.card(),marginBottom:16}}>
          <div style={{fontWeight:800,fontSize:16,fontFamily:"Georgia,serif",marginBottom:16,paddingBottom:12,borderBottom:"1px solid #f0f0f0"}}>🛒 Cart ({cart.length} items)</div>
          {cart.length===0?<div style={{textAlign:"center",padding:28,color:"#aaa",fontFamily:"sans-serif"}}>Cart is empty. <span style={{color:"#E8620A",cursor:"pointer",fontWeight:700}} onClick={()=>go("shop")}>Shop now →</span></div>:
          cart.map(i=><div key={i._id} style={{display:"flex",gap:14,alignItems:"center",padding:"12px 0",borderBottom:"1px solid #f8f8f5"}}>
            <div style={{width:44,height:44,borderRadius:12,background:i.bgColor||"#f9f9f6",overflow:"hidden",flexShrink:0}}>{i.image?<img src={i.image} alt={i.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{display:"flex",alignItems:"center",justifyContent:"center",width:"100%",height:"100%",fontSize:22}}>{i.emoji}</span>}</div>
            <div style={{flex:1}}><div style={{fontWeight:700,fontSize:14}}>{i.name}</div><div style={{fontFamily:"sans-serif",fontSize:12,color:"#999"}}>₹{i.price} × {i.qty} = <strong>₹{i.price*i.qty}</strong></div></div>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <button onClick={()=>setCart(c=>c.map(x=>x._id===i._id?{...x,qty:Math.max(1,x.qty-1)}:x))} style={{width:26,height:26,borderRadius:"50%",border:"1px solid #e0e0e0",background:"#f9f9f6",cursor:"pointer",fontWeight:700}}>−</button>
              <span style={{fontWeight:700,minWidth:18,textAlign:"center"}}>{i.qty}</span>
              <button onClick={()=>setCart(c=>c.map(x=>x._id===i._id?{...x,qty:x.qty+1}:x))} style={{width:26,height:26,borderRadius:"50%",border:"1px solid #e0e0e0",background:"#f9f9f6",cursor:"pointer",fontWeight:700}}>+</button>
            </div>
            <button onClick={()=>setCart(c=>c.filter(x=>x._id!==i._id))} style={{background:"#fdecea",color:"#c0392b",border:"none",borderRadius:8,padding:"6px 10px",cursor:"pointer",fontSize:12,fontWeight:700}}>✕</button>
          </div>)}
        </div>
        <div style={{...s.card(),marginBottom:16}}>
          <div style={{fontWeight:800,fontSize:16,fontFamily:"Georgia,serif",marginBottom:18,paddingBottom:12,borderBottom:"1px solid #f0f0f0"}}>📍 Delivery Information</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><Inp label="Full Name" value={form.name} onChange={f("name")} placeholder="Your name" required/><Inp label="Phone" value={form.phone} onChange={f("phone")} placeholder="+91 XXXXX XXXXX" required/></div>
          <Inp label="Email" value={form.email} onChange={f("email")} type="email" placeholder="email@example.com" required/>
          <Inp label="Address Line 1" value={form.line1} onChange={f("line1")} placeholder="House No., Street, Area" required/>
          <Inp label="Landmark / Apt" value={form.line2} onChange={f("line2")} placeholder="Optional"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><Inp label="City" value={form.city} onChange={f("city")} placeholder="City" required/><Inp label="Pincode" value={form.pincode} onChange={f("pincode")} placeholder="500001" required/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Sel label="STATE" value={form.state} onChange={f("state")} options={["Andhra Pradesh","Telangana","Tamil Nadu","Karnataka","Maharashtra","Kerala","Gujarat","Other"]}/>
            <Sel label="DELIVERY SLOT" value={form.slot} onChange={f("slot")} options={["Morning (8 AM - 12 PM)","Afternoon (12 PM - 4 PM)","Evening (4 PM - 8 PM)"]}/>
          </div>
          <Inp label="Delivery Notes" value={form.notes} onChange={f("notes")} placeholder="Landmark, gate code..."/>
        </div>
        <div style={s.card()}>
          <div style={{fontWeight:800,fontSize:16,fontFamily:"Georgia,serif",marginBottom:16,paddingBottom:12,borderBottom:"1px solid #f0f0f0"}}>💳 Payment Method</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
            {[["COD","💵","Cash on Delivery"],["UPI","📱","UPI / GPay"],["Card","💳","Credit/Debit"],["Wallet","👛","Wallet"]].map(([k,icon,label])=><div key={k} onClick={()=>setPayment(k)} style={{border:`2px solid ${payment===k?"#1B3A6B":"#e0e0e0"}`,borderRadius:12,padding:12,cursor:"pointer",textAlign:"center",background:payment===k?"#f0f4ff":"#fff",transition:"all .2s"}}><div style={{fontSize:20,marginBottom:5}}>{icon}</div><div style={{fontFamily:"sans-serif",fontSize:12,fontWeight:700,color:payment===k?"#1B3A6B":"#666"}}>{label}</div></div>)}
          </div>
          {payment==="COD"&&<div style={{background:"#eef7ee",color:"#2D6A2D",borderRadius:10,padding:"10px 14px",fontFamily:"sans-serif",fontSize:13,fontWeight:600}}>✓ Pay when your order arrives. No extra charges.</div>}
        </div>
      </div>
      {/* Summary */}
      <div style={{...s.card(),position:"sticky",top:70}}>
        <div style={{fontWeight:800,fontSize:16,fontFamily:"Georgia,serif",marginBottom:16,paddingBottom:12,borderBottom:"1px solid #f0f0f0"}}>Order Summary</div>
        {cart.map(i=><div key={i._id} style={{display:"flex",alignItems:"center",gap:12,marginBottom:12,paddingBottom:12,borderBottom:"1px solid #f8f8f5"}}>
          <div style={{width:38,height:38,borderRadius:10,background:i.bgColor||"#f9f9f6",overflow:"hidden",flexShrink:0}}>{i.image?<img src={i.image} alt={i.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{display:"flex",alignItems:"center",justifyContent:"center",width:"100%",height:"100%",fontSize:18}}>{i.emoji}</span>}</div>
          <div style={{flex:1}}><div style={{fontWeight:700,fontSize:13}}>{i.name}</div><div style={{fontFamily:"sans-serif",fontSize:11,color:"#aaa"}}>Qty: {i.qty}</div></div>
          <div style={{fontWeight:800,fontSize:14}}>₹{i.price*i.qty}</div>
        </div>)}
        <div style={{display:"flex",gap:8,marginBottom:8}}>
          <input value={promo} onChange={e=>setPromo(e.target.value.toUpperCase())} onKeyDown={e=>e.key==="Enter"&&applyPromo()} placeholder="Promo code" style={{flex:1,padding:"9px 12px",borderRadius:10,border:"1.5px solid #e0e0e0",fontFamily:"sans-serif",fontSize:13,outline:"none"}}/>
          <button onClick={applyPromo} style={{background:"#E8620A",color:"#fff",border:"none",borderRadius:10,padding:"9px 14px",fontFamily:"sans-serif",fontSize:12,fontWeight:700,cursor:"pointer"}}>Apply</button>
        </div>
        {promoMsg&&<div style={{fontFamily:"sans-serif",fontSize:12,fontWeight:600,color:promoMsg.type==="success"?"#2D6A2D":"#c0392b",marginBottom:10}}>{promoMsg.text}</div>}
        <div style={{fontFamily:"sans-serif",fontSize:11,color:"#aaa",marginBottom:12}}>Try: SRFRESH20 · WELCOME10 · POORI15 · FLAT30 · COMBO25</div>
        <div style={{borderTop:"1px solid #f0f0f0",paddingTop:12}}>
          <div style={{display:"flex",justifyContent:"space-between",fontFamily:"sans-serif",fontSize:13,color:"#666",marginBottom:6}}><span>Subtotal</span><span>₹{subtotal}</span></div>
          <div style={{display:"flex",justifyContent:"space-between",fontFamily:"sans-serif",fontSize:13,color:"#2D6A2D",marginBottom:6}}><span>Delivery</span><span>FREE 🎉</span></div>
          {discount>0&&<div style={{display:"flex",justifyContent:"space-between",fontFamily:"sans-serif",fontSize:13,color:"#2D6A2D",marginBottom:6}}><span>Discount</span><span>−₹{discount}</span></div>}
          <div style={{display:"flex",justifyContent:"space-between",fontSize:19,fontWeight:800,paddingTop:10,borderTop:"1px solid #f0f0f0",marginTop:6}}><span>Total</span><span>₹{total}</span></div>
        </div>
        <button onClick={placeOrder} disabled={loading||cart.length===0} style={{...s.btn(),width:"100%",borderRadius:14,padding:15,fontSize:15,marginTop:14,opacity:loading||cart.length===0?.6:1}}>
          {loading?"Placing Order...":"Place Order →"}
        </button>
        <div style={{textAlign:"center",marginTop:10,fontFamily:"sans-serif",fontSize:11,color:"#aaa"}}>🔒 100% Secure & Encrypted</div>
      </div>
    </div>
  </div>;
}

/* ── MY ORDERS ────────────────────────────────────────────── */
function Orders({user,go}){
  const [orders,setOrders]=useState([]);
  const [loading,setLoading]=useState(true);
  const [tab,setTab]=useState("all");
  const [expanded,setExpanded]=useState(null);
  useEffect(()=>{if(!user){setLoading(false);return;}api("/orders").then(r=>setOrders(r.data||[])).catch(()=>setOrders([])).finally(()=>setLoading(false));},[user]);
  if(!user)return <div style={{textAlign:"center",padding:60,fontFamily:"sans-serif"}}><div style={{fontSize:48,marginBottom:16}}>🔒</div><p style={{color:"#666",marginBottom:20}}>Please login to view your orders</p><button onClick={()=>go("login")} style={s.btn()}>Login / Register</button></div>;
  const tabs=["all","placed","confirmed","packing","shipped","delivered","cancelled"];
  const filtered=tab==="all"?orders:orders.filter(o=>o.status===tab);
  const SC={placed:"#f59e0b",confirmed:"#3b82f6",packing:"#8b5cf6",shipped:"#06b6d4",out_for_delivery:"#E8620A",delivered:"#10b981",cancelled:"#ef4444"};
  return <div style={{maxWidth:900,margin:"0 auto",padding:"40px 24px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24,flexWrap:"wrap",gap:12}}>
      <div><div style={{fontFamily:"sans-serif",fontSize:10,fontWeight:700,letterSpacing:3,color:"#E8620A",marginBottom:4}}>ACCOUNT</div><h2 style={{fontFamily:"Georgia,serif",fontSize:"clamp(1.6rem,3.5vw,2.2rem)",fontWeight:800,color:"#1a1a1a",margin:0}}>My Orders</h2></div>
      <button onClick={()=>go("shop")} style={{...s.btn(),fontSize:13,padding:"10px 20px",borderRadius:10}}>+ New Order</button>
    </div>
    <div style={{display:"flex",gap:0,borderBottom:"2px solid #f0f0f0",marginBottom:24,flexWrap:"wrap"}}>
      {tabs.map(t=><button key={t} onClick={()=>setTab(t)} style={{background:"none",border:"none",borderBottom:`2px solid ${tab===t?"#E8620A":"transparent"}`,marginBottom:-2,padding:"10px 15px",fontFamily:"sans-serif",fontSize:12,fontWeight:700,cursor:"pointer",color:tab===t?"#E8620A":"#999",textTransform:"capitalize"}}>{t}</button>)}
    </div>
    {loading?<div style={{textAlign:"center",padding:40,color:"#aaa",fontFamily:"sans-serif"}}>Loading...</div>:
    filtered.length===0?<div style={{textAlign:"center",padding:52}}><div style={{fontSize:48,marginBottom:14}}>📦</div><p style={{fontFamily:"sans-serif",color:"#aaa",fontSize:15}}>No orders. <span style={{color:"#E8620A",cursor:"pointer",fontWeight:700}} onClick={()=>go("shop")}>Start shopping →</span></p></div>:
    filtered.map(o=><div key={o._id} style={{background:"#fff",borderRadius:16,marginBottom:14,boxShadow:"0 2px 12px rgba(0,0,0,.06)",overflow:"hidden"}}>
      <div style={{padding:"16px 20px",borderLeft:`4px solid ${SC[o.status]||"#E8620A"}`,display:"flex",flexWrap:"wrap",gap:12,justifyContent:"space-between",alignItems:"flex-start"}}>
        <div><div style={{fontWeight:800,fontSize:15,marginBottom:3}}>#{o.orderId}</div><div style={{fontFamily:"sans-serif",fontSize:12,color:"#999"}}>{new Date(o.createdAt).toLocaleDateString()} · {o.paymentMethod} · ₹{o.total}</div><div style={{fontFamily:"sans-serif",fontSize:13,color:"#666",marginTop:5}}>{o.items?.map(i=>`${i.emoji||"🍽️"} ${i.name} ×${i.quantity}`).join(" · ")}</div></div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{background:`${SC[o.status]||"#aaa"}20`,color:SC[o.status]||"#aaa",fontFamily:"sans-serif",fontSize:11,fontWeight:700,padding:"5px 13px",borderRadius:20,textTransform:"capitalize"}}>{o.status?.replace(/_/g," ")}</span>
          <button onClick={()=>setExpanded(expanded===o._id?null:o._id)} style={{background:"#f5f5f0",border:"none",borderRadius:8,padding:"6px 12px",fontFamily:"sans-serif",fontSize:12,cursor:"pointer",fontWeight:600}}>{expanded===o._id?"▲":"▼"} Details</button>
        </div>
      </div>
      {expanded===o._id&&<div style={{padding:"14px 20px",background:"#fafaf7",borderTop:"1px solid #f0f0f0"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          <div><div style={{fontFamily:"sans-serif",fontSize:11,fontWeight:700,color:"#aaa",letterSpacing:.5,marginBottom:6}}>DELIVERY ADDRESS</div><div style={{fontFamily:"sans-serif",fontSize:13,color:"#555",lineHeight:1.6}}>{o.delivery?.name}<br/>{o.delivery?.line1}, {o.delivery?.city} - {o.delivery?.pincode}</div></div>
          <div><div style={{fontFamily:"sans-serif",fontSize:11,fontWeight:700,color:"#aaa",letterSpacing:.5,marginBottom:6}}>STATUS HISTORY</div>{o.statusHistory?.slice(-3).map((h,i)=><div key={i} style={{fontFamily:"sans-serif",fontSize:12,color:"#666",marginBottom:3}}><strong style={{textTransform:"capitalize"}}>{h.status?.replace(/_/g," ")}</strong> — {h.note}</div>)}</div>
        </div>
        {!["delivered","cancelled"].includes(o.status)&&<button onClick={async()=>{try{await api(`/orders/${o._id}/cancel`,{method:"POST",body:JSON.stringify({reason:"Cancelled by customer"})})}catch{}setOrders(ords=>ords.map(x=>x._id===o._id?{...x,status:"cancelled"}:x));toast("Order cancelled","info");}} style={{marginTop:12,background:"#fdecea",color:"#c0392b",border:"1.5px solid #f5c6cb",borderRadius:10,padding:"8px 16px",fontFamily:"sans-serif",fontSize:12,fontWeight:700,cursor:"pointer"}}>Cancel Order</button>}
      </div>}
    </div>)}
  </div>;
}

/* ── PROFILE ──────────────────────────────────────────────── */
function Profile({user,logout,go,wishlist,products}){
  const [tab,setTab]=useState("info");
  const [pw,setPw]=useState({cur:"",nw:"",confirm:""});
  const wlProducts=products.filter(p=>wishlist.includes(p._id));
  if(!user)return <div style={{textAlign:"center",padding:60,fontFamily:"sans-serif"}}><div style={{fontSize:48,marginBottom:16}}>👤</div><p style={{color:"#666",marginBottom:20}}>Please login to view your profile</p><button onClick={()=>go("login")} style={s.btn()}>Login / Register</button></div>;
  const changePw=async()=>{if(pw.nw!==pw.confirm){toast("Passwords don't match","error");return;}try{await api("/auth/change-password",{method:"PUT",body:JSON.stringify({currentPassword:pw.cur,newPassword:pw.nw})});toast("✓ Password changed","success");setPw({cur:"",nw:"",confirm:""});}catch(e){toast(e.message,"error");}};
  return <div style={{maxWidth:780,margin:"0 auto",padding:"40px 24px"}}>
    <div style={{fontFamily:"sans-serif",fontSize:10,fontWeight:700,letterSpacing:3,color:"#E8620A",marginBottom:6}}>ACCOUNT</div>
    <h2 style={{fontFamily:"Georgia,serif",fontSize:"clamp(1.6rem,3.5vw,2.2rem)",fontWeight:800,color:"#1a1a1a",margin:"0 0 22px"}}>My Profile</h2>
    <div style={{...s.card(),display:"flex",alignItems:"center",gap:20,marginBottom:20,flexWrap:"wrap"}}>
      <div style={{width:64,height:64,borderRadius:"50%",background:"linear-gradient(135deg,#1B3A6B,#E8620A)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:26,fontWeight:800,fontFamily:"Georgia,serif",flexShrink:0}}>{user.name?.[0]?.toUpperCase()||"U"}</div>
      <div style={{flex:1}}><div style={{fontWeight:800,fontSize:20,fontFamily:"Georgia,serif"}}>{user.name}</div><div style={{fontFamily:"sans-serif",fontSize:13,color:"#999",marginTop:2}}>{user.email}</div>{user.phone&&<div style={{fontFamily:"sans-serif",fontSize:13,color:"#999",marginTop:2}}>📞 {user.phone}</div>}{user.role==="admin"&&<span style={{marginTop:8,display:"inline-block",background:"#1B3A6B",color:"#fff",fontFamily:"sans-serif",fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:20}}>⚡ Administrator</span>}</div>
      <button onClick={()=>{logout();go("home");toast("Logged out");}} style={{background:"#fdecea",color:"#c0392b",border:"1.5px solid #f5c6cb",borderRadius:12,padding:"9px 18px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"sans-serif"}}>Logout</button>
    </div>
    <div style={{display:"flex",gap:0,borderBottom:"2px solid #f0f0f0",marginBottom:22}}>
      {["info","wishlist","security"].map(t=><button key={t} onClick={()=>setTab(t)} style={{background:"none",border:"none",borderBottom:`2px solid ${tab===t?"#E8620A":"transparent"}`,marginBottom:-2,padding:"10px 18px",fontFamily:"sans-serif",fontSize:13,fontWeight:700,cursor:"pointer",color:tab===t?"#E8620A":"#999",textTransform:"capitalize"}}>{t}</button>)}
    </div>
    {tab==="info"&&<div style={s.card()}><div style={{fontWeight:800,fontSize:16,fontFamily:"Georgia,serif",marginBottom:16}}>Account Information</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>{[["Name",user.name],["Email",user.email],["Phone",user.phone||"—"],["Role",user.role],["Member Since",new Date(user.createdAt||Date.now()).toLocaleDateString()]].map(([k,v])=><div key={k} style={{background:"#f9f9f6",borderRadius:12,padding:"12px 14px"}}><div style={{fontFamily:"sans-serif",fontSize:10,fontWeight:700,color:"#aaa",letterSpacing:.5}}>{k.toUpperCase()}</div><div style={{fontFamily:"sans-serif",fontSize:14,fontWeight:600,color:"#1a1a1a",marginTop:4}}>{v}</div></div>)}</div></div>}
    {tab==="wishlist"&&<div>{wlProducts.length===0?<div style={{...s.card(),textAlign:"center",padding:28}}><p style={{color:"#aaa",fontFamily:"sans-serif"}}>No wishlist items. <span style={{color:"#E8620A",cursor:"pointer"}} onClick={()=>go("shop")}>Browse →</span></p></div>:wlProducts.map(p=><div key={p._id} style={{...s.card(),display:"flex",alignItems:"center",gap:16,marginBottom:12}}>
      <div style={{width:48,height:48,borderRadius:12,background:p.bgColor,overflow:"hidden",flexShrink:0}}>{p.image?<img src={p.image} alt={p.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{display:"flex",alignItems:"center",justifyContent:"center",width:"100%",height:"100%",fontSize:24}}>{p.emoji}</span>}</div>
      <div style={{flex:1}}><div style={{fontWeight:800,fontSize:15,fontFamily:"Georgia,serif"}}>{p.name}</div><div style={{fontFamily:"sans-serif",fontSize:13,color:"#999"}}>₹{p.price} · {p.unit}</div></div>
      <button onClick={()=>go("shop")} style={{...s.btn("#1B3A6B"),fontSize:12,padding:"8px 16px",borderRadius:10}}>Shop</button>
    </div>)}</div>}
    {tab==="security"&&<div style={s.card()}><div style={{fontWeight:800,fontSize:16,fontFamily:"Georgia,serif",marginBottom:18}}>Change Password</div>
      <Inp label="CURRENT PASSWORD" value={pw.cur} onChange={e=>setPw(p=>({...p,cur:e.target.value}))} type="password" placeholder="Current password" required/>
      <Inp label="NEW PASSWORD" value={pw.nw} onChange={e=>setPw(p=>({...p,nw:e.target.value}))} type="password" placeholder="Min 6 characters" required/>
      <Inp label="CONFIRM NEW PASSWORD" value={pw.confirm} onChange={e=>setPw(p=>({...p,confirm:e.target.value}))} type="password" placeholder="Repeat new password" required/>
      <button onClick={changePw} style={{...s.btn(),width:"100%",borderRadius:12,padding:"12px"}}>Update Password</button>
    </div>}
  </div>;
}

/* ── LOGIN / REGISTER ─────────────────────────────────────── */
function AuthPage({login,go}){
  const [mode,setMode]=useState("login");
  const [form,setForm]=useState({name:"",email:"",password:"",phone:""});
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState("");
  const f=k=>e=>setForm(v=>({...v,[k]:e.target.value}));
  const submit=async()=>{setErr("");setLoading(true);try{const body=mode==="login"?{email:form.email,password:form.password}:form;const res=await api(`/auth/${mode}`,{method:"POST",body:JSON.stringify(body)});login(res.token,res.user);toast(`Welcome${res.user.name?" "+res.user.name:""}! 🎉`,"success");go("home");}catch(e){setErr(e.message);}setLoading(false);};
  return <div style={{maxWidth:440,margin:"60px auto",padding:24}}>
    <div style={{...s.card({padding:36})}}>
      <div style={{textAlign:"center",marginBottom:28}}>
        <div style={{width:54,height:54,borderRadius:"50%",background:"linear-gradient(135deg,#1B3A6B,#2563c4)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:20,fontFamily:"Georgia,serif",margin:"0 auto 14px"}}>SR</div>
        <h2 style={{fontFamily:"Georgia,serif",fontSize:23,margin:"0 0 6px"}}>{mode==="login"?"Welcome Back":"Create Account"}</h2>
        <p style={{fontFamily:"sans-serif",fontSize:13,color:"#999",margin:0}}>{mode==="login"?"Sign in to your SR Foods account":"Join SR Foods for exclusive offers"}</p>
      </div>
      {err&&<div style={{background:"#fdecea",color:"#c0392b",borderRadius:10,padding:"10px 14px",fontFamily:"sans-serif",fontSize:13,fontWeight:600,marginBottom:16}}>⚠️ {err}</div>}
      {mode==="register"&&<Inp label="FULL NAME" value={form.name} onChange={f("name")} placeholder="Your full name" required/>}
      <Inp label="EMAIL" value={form.email} onChange={f("email")} type="email" placeholder="email@example.com" required/>
      <Inp label="PASSWORD" value={form.password} onChange={f("password")} type="password" placeholder="Min 6 characters" required/>
      {mode==="register"&&<Inp label="PHONE (optional)" value={form.phone} onChange={f("phone")} placeholder="+91 XXXXX XXXXX"/>}
      <div style={{marginBottom:20}}/>
      <button onClick={submit} disabled={loading} style={{...s.btn(),width:"100%",borderRadius:12,padding:"14px",fontSize:15,opacity:loading?.7:1}}>{loading?"Please wait...":mode==="login"?"Sign In →":"Create Account →"}</button>
      {mode==="login"&&<div style={{marginTop:16,padding:"12px 14px",background:"#f0f4ff",borderRadius:10,fontFamily:"sans-serif",fontSize:12,color:"#555"}}><strong>Demo Admin:</strong> admin@srfoods.com / Admin@1234</div>}
      <div style={{textAlign:"center",marginTop:16,fontFamily:"sans-serif",fontSize:13,color:"#666"}}>{mode==="login"?"Don't have an account?":"Already have an account?"}{" "}<span onClick={()=>setMode(m=>m==="login"?"register":"login")} style={{color:"#E8620A",cursor:"pointer",fontWeight:700}}>{mode==="login"?"Register here":"Login"}</span></div>
    </div>
  </div>;
}

/* ── ADMIN ────────────────────────────────────────────────── */
function Admin({user,go}){
  const [stats,setStats]=useState(null);
  const [orders,setOrders]=useState([]);
  const [tab,setTab]=useState("overview");
  const [loading,setLoading]=useState(true);
  useEffect(()=>{if(!user||user.role!=="admin")return;Promise.all([api("/admin/dashboard"),api("/orders/admin/all?limit=30")]).then(([d,o])=>{setStats(d.data);setOrders(o.data||[]);}).catch(()=>{}).finally(()=>setLoading(false));},[user]);
  const updateStatus=async(id,status)=>{try{await api(`/orders/${id}/status`,{method:"PUT",body:JSON.stringify({status})});setOrders(o=>o.map(x=>x._id===id?{...x,status}:x));toast("Updated","success");}catch{toast("Failed","error");}};
  if(!user||user.role!=="admin")return <div style={{textAlign:"center",padding:60,fontFamily:"sans-serif"}}><div style={{fontSize:48,marginBottom:16}}>🔒</div><p style={{color:"#666",marginBottom:20}}>Admin access required</p><button onClick={()=>go("login")} style={s.btn()}>Login as Admin</button></div>;
  const S=stats?.overview||{};
  const SC={placed:"#f59e0b",confirmed:"#3b82f6",packing:"#8b5cf6",shipped:"#06b6d4",out_for_delivery:"#E8620A",delivered:"#10b981",cancelled:"#ef4444"};
  return <div style={{maxWidth:1100,margin:"0 auto",padding:"40px 24px"}}>
    <div style={{fontFamily:"sans-serif",fontSize:10,fontWeight:700,letterSpacing:3,color:"#E8620A",marginBottom:6}}>ADMIN PANEL</div>
    <h2 style={{fontFamily:"Georgia,serif",fontSize:"clamp(1.6rem,3.5vw,2.2rem)",fontWeight:800,color:"#1a1a1a",margin:"0 0 24px"}}>📊 Dashboard</h2>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))",gap:14,marginBottom:28}}>
      {[["Total Orders",S.totalOrders||0,"#E8620A"],["Today's Orders",S.todayOrders||0,"#2D6A2D"],["Total Revenue","₹"+(S.totalRevenue||0),"#1B3A6B"],["Month Revenue","₹"+(S.monthRevenue||0),"#8B4513"],["Total Users",S.totalUsers||0,"#7B3B10"],["Pending Orders",S.pendingOrders||0,"#f59e0b"],["New Enquiries",S.newContacts||0,"#3b82f6"],["Subscribers",S.subscribers||0,"#10b981"]].map(([label,val,color])=><div key={label} style={{...s.card({padding:"18px",borderLeft:`4px solid ${color}`})}}>
        <div style={{fontSize:24,fontWeight:800,color,fontFamily:"Georgia,serif"}}>{val}</div>
        <div style={{fontFamily:"sans-serif",fontSize:12,color:"#888",fontWeight:600,marginTop:4}}>{label}</div>
      </div>)}
    </div>
    <div style={{display:"flex",gap:0,borderBottom:"2px solid #f0f0f0",marginBottom:24}}>
      {["overview","orders","top products"].map(t=><button key={t} onClick={()=>setTab(t)} style={{background:"none",border:"none",borderBottom:`2px solid ${tab===t?"#E8620A":"transparent"}`,marginBottom:-2,padding:"10px 18px",fontFamily:"sans-serif",fontSize:13,fontWeight:700,cursor:"pointer",color:tab===t?"#E8620A":"#999",textTransform:"capitalize"}}>{t}</button>)}
    </div>
    {loading&&<div style={{textAlign:"center",padding:40,color:"#aaa",fontFamily:"sans-serif"}}>Loading dashboard...</div>}
    {!loading&&tab==="orders"&&<div style={{...s.card({padding:0}),overflow:"hidden"}}>
      <div style={{padding:"16px 20px",borderBottom:"1px solid #f0f0f0",fontWeight:800,fontSize:15}}>All Orders ({orders.length})</div>
      {orders.length===0?<div style={{padding:32,textAlign:"center",color:"#aaa",fontFamily:"sans-serif"}}>No orders yet</div>:
      orders.map(o=><div key={o._id} style={{padding:"14px 20px",borderBottom:"1px solid #f9f9f6",display:"flex",flexWrap:"wrap",gap:14,alignItems:"center"}}>
        <div style={{flex:"1 1 220px"}}><div style={{fontWeight:700,fontSize:14}}>{o.delivery?.name} <span style={{fontSize:11,color:"#aaa",fontFamily:"sans-serif"}}>#{o.orderId}</span></div><div style={{fontFamily:"sans-serif",fontSize:12,color:"#999"}}>{o.delivery?.phone} · ₹{o.total} · {new Date(o.createdAt).toLocaleDateString()}</div><div style={{fontFamily:"sans-serif",fontSize:12,color:"#666",marginTop:3}}>{o.items?.map(i=>`${i.name}×${i.quantity}`).join(", ")}</div></div>
        <span style={{background:`${SC[o.status]||"#aaa"}20`,color:SC[o.status]||"#aaa",fontFamily:"sans-serif",fontSize:11,fontWeight:700,padding:"4px 12px",borderRadius:20,textTransform:"capitalize"}}>{o.status?.replace(/_/g," ")}</span>
        <select value={o.status} onChange={e=>updateStatus(o._id,e.target.value)} style={{padding:"7px 10px",borderRadius:8,border:"1.5px solid #e0e0e0",fontSize:12,fontFamily:"sans-serif",cursor:"pointer"}}>
          {["placed","confirmed","packing","shipped","out_for_delivery","delivered","cancelled"].map(st=><option key={st} value={st}>{st.replace(/_/g," ")}</option>)}
        </select>
      </div>)}
    </div>}
    {!loading&&tab==="overview"&&stats&&<div>
      <div style={{fontWeight:800,fontSize:16,fontFamily:"Georgia,serif",marginBottom:16}}>Orders by Status</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:12,marginBottom:28}}>
        {Object.entries(stats.ordersByStatus||{}).map(([st,count])=><div key={st} style={{...s.card({textAlign:"center",borderTop:`3px solid ${SC[st]||"#aaa"}`})}}>
          <div style={{fontSize:22,fontWeight:800,color:SC[st]||"#aaa",fontFamily:"Georgia,serif"}}>{count}</div>
          <div style={{fontFamily:"sans-serif",fontSize:11,color:"#888",fontWeight:600,textTransform:"capitalize",marginTop:4}}>{st.replace(/_/g," ")}</div>
        </div>)}
      </div>
      <div style={{fontWeight:800,fontSize:16,fontFamily:"Georgia,serif",marginBottom:16}}>Revenue — Last 7 Days</div>
      <div style={s.card()}>
        {(stats.revenueByDay||[]).length===0?<div style={{textAlign:"center",color:"#aaa",fontFamily:"sans-serif",padding:20}}>No data yet</div>:
        <div style={{display:"flex",gap:8,alignItems:"flex-end",height:120,padding:"10px 0"}}>
          {stats.revenueByDay.map(d=>{const mx=Math.max(...stats.revenueByDay.map(x=>x.revenue),1);const h=Math.max(8,(d.revenue/mx)*100);return <div key={d._id} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
            <div style={{fontFamily:"sans-serif",fontSize:9,color:"#1B3A6B",fontWeight:700}}>₹{d.revenue}</div>
            <div style={{width:"100%",background:"#1B3A6B",borderRadius:"4px 4px 0 0",height:`${h}%`,minHeight:8}}/>
            <div style={{fontFamily:"sans-serif",fontSize:9,color:"#aaa"}}>{d._id?.slice(5)}</div>
          </div>;})}
        </div>}
      </div>
    </div>}
    {!loading&&tab==="top products"&&stats&&<div>
      <div style={{fontWeight:800,fontSize:16,fontFamily:"Georgia,serif",marginBottom:16}}>Best Selling Products</div>
      {(stats.topProducts||[]).map((p,i)=><div key={p._id} style={{...s.card({display:"flex",alignItems:"center",gap:16,marginBottom:12})}}>
        <div style={{width:40,height:40,borderRadius:10,background:"#f5f5f0",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:18,color:"#1B3A6B",flexShrink:0}}>#{i+1}</div>
        <div style={{flex:1}}><div style={{fontWeight:700,fontSize:15}}>{p._id}</div><div style={{fontFamily:"sans-serif",fontSize:12,color:"#999"}}>{p.totalQty} units sold</div></div>
        <div style={{fontWeight:800,fontSize:16,color:"#2D6A2D",fontFamily:"Georgia,serif"}}>₹{p.revenue}</div>
      </div>)}
    </div>}
  </div>;
}

/* ── FOOTER ───────────────────────────────────────────────── */
function Footer({go}){
  return <footer style={{background:"#111",color:"#888",padding:"44px 24px 24px",marginTop:56}}>
    <div style={{maxWidth:1100,margin:"0 auto",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:36,marginBottom:36}}>
      <div><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}><div style={{width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,#1B3A6B,#2563c4)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:14,fontFamily:"Georgia,serif"}}>SR</div><div style={{color:"#fff",fontWeight:800,fontSize:17,fontFamily:"Georgia,serif"}}>SR Foods</div></div><p style={{fontFamily:"sans-serif",fontSize:13,lineHeight:1.7,color:"#666"}}>Premium ready-to-cook flatbreads. No preservatives. Just homemade taste.</p></div>
      <div><div style={{color:"#fff",fontWeight:700,marginBottom:12,fontSize:13,fontFamily:"sans-serif"}}>Quick Links</div>{[["Home","home"],["Shop","shop"],["Deals","deals"],["Reviews","reviews"],["Orders","orders"],["Admin","admin"]].map(([l,k])=><div key={k} onClick={()=>{go(k);window.scrollTo(0,0);}} style={{color:"#666",fontFamily:"sans-serif",fontSize:13,cursor:"pointer",marginBottom:7}}>{l}</div>)}</div>
      <div><div style={{color:"#fff",fontWeight:700,marginBottom:12,fontSize:13,fontFamily:"sans-serif"}}>Products</div>{["Chapati","Poori","Chitti Poori","Combo Packs"].map(p=><div key={p} style={{color:"#666",fontFamily:"sans-serif",fontSize:13,marginBottom:7}}>— {p}</div>)}</div>
      <div><div style={{color:"#fff",fontWeight:700,marginBottom:12,fontSize:13,fontFamily:"sans-serif"}}>Contact</div><p style={{color:"#666",fontFamily:"sans-serif",fontSize:13,lineHeight:1.8}}>Kondayapalem, Nellore,<br/>AP - 524004<br/><br/>📞 <a href="tel:9177231026" style={{color:"#E8620A",textDecoration:"none"}}>9177231026</a><br/>✉ <a href="mailto:srenterprises259@gmail.com" style={{color:"#E8620A",textDecoration:"none"}}>srenterprises259@gmail.com</a><br/><br/>FSSAI: 20126181000074</p></div>
    </div>
    <div style={{borderTop:"1px solid #222",paddingTop:20,display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:10}}><span style={{fontFamily:"sans-serif",fontSize:12}}>© 2025 SR Enterprise. All rights reserved.</span><span style={{fontFamily:"sans-serif",fontSize:12}}>Made with ❤️ in Andhra Pradesh</span></div>
  </footer>;
}

/* ── ROOT APP ─────────────────────────────────────────────── */
export default function App(){
  const {user,login,logout}=useAuth();
  const [page,setPage]=useState("home");
  const [products,setProducts]=useState(FALLBACK);
  const [cart,setCart]=useState([]);
  const [wishlist,setWishlist]=useState(()=>{try{return JSON.parse(localStorage.getItem("sr_wl")||"[]")}catch{return [];}});

  const go=useCallback((p)=>{setPage(p);window.scrollTo(0,0);},[]);

  useEffect(()=>{
    api("/products?limit=20")
      .then(r=>{if(r.data?.length)setProducts(r.data.map((p,i)=>({...p,emoji:p.emoji||["🫓","🟡","🔶","🌟","🎁","👨‍👩‍👧‍👦"][i]||"🍽️"})));})
      .catch(()=>{/* use static fallback */});
  },[]);

  useEffect(()=>{
    if(user) api("/wishlist").then(r=>setWishlist((r.data||[]).map(p=>p._id||p))).catch(()=>{});
  },[user]);

  const addToCart=useCallback((product,qty=1)=>{
    setCart(c=>{const ex=c.find(i=>i._id===product._id);return ex?c.map(i=>i._id===product._id?{...i,qty:i.qty+qty}:i):[...c,{...product,qty}];});
    toast(`${product.emoji} ${product.name} added to cart!`,"success");
  },[]);

  const toggleWishlist=useCallback(async(pid)=>{
    const inList=wishlist.includes(pid);
    const nw=inList?wishlist.filter(id=>id!==pid):[...wishlist,pid];
    setWishlist(nw);
    localStorage.setItem("sr_wl",JSON.stringify(nw));
    toast(inList?"Removed from wishlist":"❤️ Added to wishlist",inList?"info":"success");
    if(user){try{await api(`/wishlist/toggle/${pid}`,{method:"POST"});}catch{}}
  },[wishlist,user]);

  const cartCount=cart.reduce((s,i)=>s+i.qty,0);

  const render=()=>{
    switch(page){
      case "shop":     return <Shop products={products} addToCart={addToCart} wishlist={wishlist} toggleWishlist={toggleWishlist}/>;
      case "deals":    return <Deals products={products} addToCart={addToCart} wishlist={wishlist} toggleWishlist={toggleWishlist}/>;
      case "reviews":  return <Reviews user={user} products={products}/>;
      case "checkout": return <Checkout cart={cart} setCart={setCart} user={user} go={go}/>;
      case "orders":   return <Orders user={user} go={go}/>;
      case "profile":  return <Profile user={user} logout={logout} go={go} wishlist={wishlist} products={products}/>;
      case "login":    return <AuthPage login={login} go={go}/>;
      case "admin":    return <Admin user={user} go={go}/>;
      default:         return <Home products={products} go={go} addToCart={addToCart} wishlist={wishlist} toggleWishlist={toggleWishlist}/>;
    }
  };

  return(
    <div style={{fontFamily:"Georgia,serif",minHeight:"100vh",background:"#FAFAF7"}}>
      <Navbar page={page} go={go} cartCount={cartCount} user={user} logout={logout}/>
      <main>{render()}</main>
      <Footer go={go}/>
      <ToastContainer/>
    </div>
  );
}
