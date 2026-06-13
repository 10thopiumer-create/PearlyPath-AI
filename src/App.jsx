import React, { useState, useRef, useEffect } from "react";

// ─── SOUND UTILITY (Web Audio API — zero files, zero KB) ──────────────────────
const playSound = (type) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const g = ctx.createGain();
    g.connect(ctx.destination);
    if (type === "click") {
      const o = ctx.createOscillator();
      o.connect(g); o.type = "sine"; o.frequency.value = 600;
      g.gain.setValueAtTime(0.08, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      o.start(); o.stop(ctx.currentTime + 0.08);
    } else if (type === "chime") {
      [0, 0.18].forEach((delay, i) => {
        const o = ctx.createOscillator();
        o.connect(g); o.type = "sine";
        o.frequency.value = i === 0 ? 523 : 784;
        g.gain.setValueAtTime(0.12, ctx.currentTime + delay);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.5);
        o.start(ctx.currentTime + delay);
        o.stop(ctx.currentTime + delay + 0.5);
      });
    } else if (type === "nav") {
      const o = ctx.createOscillator();
      o.connect(g); o.type = "sine";
      o.frequency.setValueAtTime(300, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.12);
      g.gain.setValueAtTime(0.06, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      o.start(); o.stop(ctx.currentTime + 0.12);
    }
  } catch (_) { /* silently fail if audio not supported */ }
};

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @keyframes fadeSlideIn {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .pp-screen { animation: fadeSlideIn 0.25s ease-out; }
  .pp-card-hover {
    transition: transform 0.18s ease, box-shadow 0.18s ease;
  }
  .pp-card-hover:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.35);
  }
  .pp-btn-press {
    transition: transform 0.1s ease, opacity 0.1s ease;
  }
  .pp-btn-press:active {
    transform: scale(0.96);
    opacity: 0.85;
  }
`;

// ─── THEME ────────────────────────────────────────────────────────────────────
const T = {
  bg:       "#08090F",
  surface:  "#111219",
  surface2: "#191B25",
  border:   "#252636",
  borderHi: "#353750",
  gold:     "#C9A84C",
  goldDim:  "#8A6E2F",
  goldBg:   "rgba(201,168,76,0.10)",
  navy:     "#2B5AA8",
  navyBg:   "rgba(43,90,168,0.12)",
  navyLight:"#4A80D4",
  text:     "#F4F1EA",
  muted:    "#6B6D85",
  sub:      "#9A9CB5",
  green:    "#2ED573",
  red:      "#FF4757",
  warn:     "#FF9F43",
};

// ─── DEMO MODE ────────────────────────────────────────────────────────────────
// Set to false once you have an API key and your /api/chat route is working
const DEMO_MODE = true;

const DEMO_ITINERARY_META = {
  summary: "An immersive journey through Bahrain's ancient pearling heritage, vibrant souks, and hidden coastal gems — perfectly balanced for a curious explorer.",
  total_budget_estimate: "BD 25–40 per day",
  crowd_warning: "Visit Bab Al Bahrain and the souk before 10 AM — afternoons get very busy, especially on weekends.",
  best_time: "October to March for cooler weather and outdoor exploration.",
};

const DEMO_DAYS = [
  { day: 1, theme: "Pearls · Forts · Souks",
    morning:   { time: "9:00 AM",  place: "Bahrain Fort",         activity: "Explore the UNESCO fortress and walk the archaeological site with sweeping Gulf views.", duration: "2 hrs", cost: "BD 2" },
    afternoon: { time: "1:00 PM",  place: "Muharraq Pearling",    activity: "Stroll the UNESCO pearl merchant trail through historic Muharraq houses.", duration: "2 hrs", cost: "Free" },
    evening:   { time: "7:00 PM",  place: "Bab Al Bahrain",       activity: "Wander the old souk at golden hour — buy spices, gold, and fresh dates.", duration: "2 hrs", cost: "BD 5–20" },
    food_tip: "Try machboos (spiced rice with fish) at a local Muharraq restaurant for under BD 3.",
    transport_tip: "Grab a taxi between Riffa and Manama — expect BD 4–6. Parking near Bab Al Bahrain can be tricky.",
    hidden_gem: "Ask any local to point you toward Bu Maher Fort at the tip of Muharraq — almost no tourists find it." },
  { day: 2, theme: "Mosques · Museums · Malls",
    morning:   { time: "9:00 AM",  place: "Al Fateh Grand Mosque", activity: "Join a free guided tour of one of the world's largest mosques — abayas available at entrance.", duration: "1.5 hrs", cost: "Free" },
    afternoon: { time: "12:00 PM", place: "Bahrain Museum",        activity: "Explore 6,000 years of civilisation — the Dilmun gallery is unmissable.", duration: "2 hrs", cost: "BD 1" },
    evening:   { time: "6:00 PM",  place: "City Centre",           activity: "Waterfront mall for dinner and a walk along the Seef seafront promenade.", duration: "2 hrs", cost: "BD 8–15" },
    food_tip: "The food court at City Centre has excellent Bahraini and Lebanese options from BD 3.",
    transport_tip: "Al Fateh Mosque and the Museum are a short taxi ride apart — BD 2–3.",
    hidden_gem: "The Bahrain Museum garden facing the sea is quiet and beautiful — perfect for a sunset break." },
  { day: 3, theme: "Desert · Nature · Adrenaline",
    morning:   { time: "8:00 AM",  place: "Tree of Life",          activity: "Drive to the desert and see the mysterious 400-year-old tree — best early before the heat.", duration: "2 hrs", cost: "Free" },
    afternoon: { time: "1:00 PM",  place: "Gravity",               activity: "Try indoor skydiving at Bahrain's only wind tunnel — no experience needed.", duration: "1.5 hrs", cost: "BD 18" },
    evening:   { time: "6:30 PM",  place: "Manama Corniche",       activity: "Sunset walk along the waterfront — watch the Financial Harbour towers light up.", duration: "1.5 hrs", cost: "Free" },
    food_tip: "Stop at Rashid's Cafeteria in Muharraq for legendary karak chai on your way back — BD 0.5.",
    transport_tip: "Tree of Life is 45 mins south — rent a car for the day (from BD 15) or hire a taxi for BD 20 return.",
    hidden_gem: "The Tubli Bay mangroves are a 10-minute detour from the highway — Bahrain's only wild mangrove forest." },
];

const DEMO_CHAT_REPLIES = [
  { triggers: ["hotel","stay","sleep","accommodation","where to stay"],
    reply: "For stays in Bahrain:\n\n💰 Budget — Gulf Pearl Hotel (BD 18–28/night) near Bab Al Bahrain souk\n\n🏨 Mid-range — Novotel Al Dana Resort (BD 45–70/night) with a private beach and sea views\n\n⭐ Luxury — Four Seasons Bahrain Bay (BD 180–350/night) — the infinity pool over the Bay is unforgettable" },
  { triggers: ["food","eat","restaurant","hungry","karak","machboos"],
    reply: "Bahrain's must-eats:\n\n🍚 Machboos — spiced rice with meat or fish, the national dish\n☕ Karak chai — cardamom-spiced tea, a Bahraini institution\n🍯 Bahraini halwa — dense, rosewater sweet sold in heritage shops\n🐟 Fresh hammour — local Gulf fish, best grilled\n\nBest local spots: Monet Cafe in Adliya for coffee and atmosphere, Halwa House in Manama for traditional sweets." },
  { triggers: ["transport","get around","taxi","car","drive","uber"],
    reply: "Getting around Bahrain:\n\n🚕 Taxis — readily available, BD 2–6 within Manama. Use the Careem app for fixed prices.\n🚗 Rental car — recommended for Tree of Life and BIC. From BD 15/day.\n🚌 Buses — cheap (200 fils) but slow and limited routes.\n\nMost major attractions are within 30 minutes of Manama." },
  { triggers: ["mosque","religious","al fateh","islam","prayer"],
    reply: "Al Fateh Grand Mosque is a must-visit — one of the world's largest mosques and open to non-Muslim visitors.\n\n✅ Visit 9 AM–12 PM or 2–4 PM (closed during prayers)\n✅ Free guided tours available\n✅ Abayas available to borrow at entrance\n✅ Remove shoes before entering\n\nThe Sheikh Isa bin Ali House in Muharraq is also worth visiting — a beautifully restored traditional home." },
  { triggers: ["budget","cheap","cost","money","afford","price"],
    reply: "Bahrain can be very affordable:\n\n🍽️ Street food & cafés: BD 1–4/meal\n🍴 Mid-range restaurant: BD 8–20/person\n🚕 Taxis within Manama: BD 2–6\n🏛️ Most museums: BD 1–3\n🆓 Free: Bahrain Fort, Pearling Path, Al Fateh Mosque, Corniche, Financial Harbour\n\nComfortable daily budget: BD 25–40 excluding hotel." },
];
const DEMO_DEFAULT_REPLY = "Great question! Bahrain blends ancient heritage with modern luxury in a way few places do. The contrast between the UNESCO pearl trail in Muharraq and the glass towers of the Financial Harbour is really striking.\n\nIs there something specific I can help with — accommodation, sightseeing, food recommendations, or cultural tips?";

const getMockChatReply = (input) => {
  const lower = input.toLowerCase();
  for (const r of DEMO_CHAT_REPLIES) {
    if (r.triggers.some(t => lower.includes(t))) return r.reply;
  }
  return DEMO_DEFAULT_REPLY;
};

// ─── DATA ─────────────────────────────────────────────────────────────────────
const CATEGORY_STYLE = {
  Heritage:  { gradient: "linear-gradient(160deg,#3B2608,#7A5420)", icon: "🏰" },
  Religious: { gradient: "linear-gradient(160deg,#0B2045,#2B5AA8)", icon: "🕌" },
  Culture:   { gradient: "linear-gradient(160deg,#1E0B45,#4A3090)", icon: "🏛️" },
  Modern:    { gradient: "linear-gradient(160deg,#0B1E3D,#2B5AA8)", icon: "🏙️" },
  Shopping:  { gradient: "linear-gradient(160deg,#3D0B0B,#A83030)", icon: "🛍️" },
  Nature:    { gradient: "linear-gradient(160deg,#0B2E14,#1E8040)", icon: "🌿" },
  Family:    { gradient: "linear-gradient(160deg,#2E1A0B,#A86020)", icon: "👨‍👩‍👧" },
  Luxury:    { gradient: "linear-gradient(160deg,#1A0B3D,#6040B0)", icon: "💎" },
  Leisure:   { gradient: "linear-gradient(160deg,#0B2430,#2B5AA8)", icon: "🚶" },
  Adventure: { gradient: "linear-gradient(160deg,#1A2E0B,#5A9020)", icon: "🪂" },
  default:   { gradient: "linear-gradient(160deg,#0B1520,#1E3A5A)", icon: "📍" },
};

const BAHRAIN_ATTRACTIONS = [
  { name: "Adhari Park",              category: "Family",    crowd: "high",   image: "/adhari-park.jpg",        lat: 26.1906, lng: 50.4886, desc: "Popular amusement park with rides, games and entertainment" },
  { name: "Al Areen Wildlife Park",   category: "Nature",    crowd: "low",    image: "/al-areen.jpg",           lat: 26.0175, lng: 50.5081, desc: "Arabian wildlife sanctuary — home to oryx and exotic species" },
  { name: "Al Fateh Grand Mosque",    category: "Religious", crowd: "medium", image: "/al-fateh-mosque.jpg",    lat: 26.2141, lng: 50.5998, desc: "One of the world's largest mosques, open to visitors" },
  { name: "Amwaj Islands",            category: "Luxury",    crowd: "low",    image: "/amwaj-islands.jpg",      lat: 26.2706, lng: 50.6428, desc: "Upscale artificial islands with marina, dining & beach clubs" },
  { name: "Arad Fort",                category: "Heritage",  crowd: "low",    image: "/arad-fort.jpg",          lat: 26.2445, lng: 50.6571, desc: "15th-century Portuguese-era fort overlooking the sea in Muharraq" },
  { name: "Bab Al Bahrain",           category: "Heritage",  crowd: "high",   image: "/bab-al-bah.jpg",         lat: 26.2233, lng: 50.5842, desc: "Historic gateway to Manama's old souk — gold, spices & pearls" },
  { name: "Bahrain Fort",             category: "Heritage",  crowd: "low",    image: "/bahrain-fort.jpg",       lat: 26.2348, lng: 50.5106, desc: "UNESCO World Heritage Site — ancient fortress spanning 6,000 years" },
  { name: "Bahrain Museum",           category: "Culture",   crowd: "low",    image: "/bahrain-museum.jpg",     lat: 26.2285, lng: 50.6089, desc: "National museum tracing 6,000 years of Bahraini civilisation" },
  { name: "Bahrain WTC",              category: "Modern",    crowd: "medium", image: "/bahrain-wtc.jpg",        lat: 26.2154, lng: 50.5944, desc: "Iconic twin towers connected by three wind turbines" },
  { name: "BIC",                      category: "Modern",    crowd: "varies", image: "/bic.jpg",                lat: 26.0321, lng: 50.5108, desc: "Bahrain International Circuit — home of Formula 1 racing" },
  { name: "City Centre",              category: "Shopping",  crowd: "high",   image: "/city-centre.jpg",        lat: 26.2352, lng: 50.5558, desc: "Premium waterfront mall in Manama with 300+ stores" },
  { name: "Dilmunia Mall",            category: "Shopping",  crowd: "medium", image: "/dilmunia-mall.jpg",      lat: 26.2711, lng: 50.5633, desc: "Modern island mall with sea views and family entertainment" },
  { name: "Dragon City",              category: "Shopping",  crowd: "medium", image: "/dragon-city.jpg",        lat: 26.1539, lng: 50.4956, desc: "Massive Chinese wholesale market and entertainment complex" },
  { name: "Financial Harbour",        category: "Modern",    crowd: "low",    image: "/financial-harbour.jpg", lat: 26.2354, lng: 50.5867, desc: "Stunning waterfront towers — Bahrain's business heartbeat" },
  { name: "Gravity",                  category: "Adventure", crowd: "medium", image: "/gravity.jpg",            lat: 26.2167, lng: 50.5500, desc: "Bahrain's only indoor skydiving wind tunnel experience" },
  { name: "Lost Paradise",            category: "Family",    crowd: "high",   image: "/lost-paradise.jpg",      lat: 26.2003, lng: 50.4939, desc: "Bahrain's largest water park with thrilling rides for all ages" },
  { name: "Manama Corniche",          category: "Leisure",   crowd: "medium", image: "/manama-corniche.jpg",    lat: 26.2285, lng: 50.5932, desc: "Beautiful waterfront promenade perfect for walks and sunsets" },
  { name: "Muharraq Pearling",        category: "Heritage",  crowd: "low",    image: "/muharraq-pearling.jpg",  lat: 26.2627, lng: 50.6200, desc: "UNESCO pearl merchant trail through historic Muharraq houses" },
  { name: "Riffa Fort",               category: "Heritage",  crowd: "low",    image: "/riffa-fort.jpg",         lat: 26.1208, lng: 50.5551, desc: "19th-century hilltop fort with panoramic views over Riffa Valley" },
  { name: "The Avenues",              category: "Shopping",  crowd: "high",   image: "/the-avenues.jpg",        lat: 26.2044, lng: 50.5257, desc: "Bahrain's largest mall — 500+ stores, dining & entertainment" },
  { name: "Tree of Life",             category: "Nature",    crowd: "low",    image: "/tree-of-life.jpg",       lat: 25.9942, lng: 50.5826, desc: "400-year-old mesquite tree in the desert with no water source" },
  { name: "Juffair Square",           category: "Leisure",   crowd: "high",   image: "/juffair-square.jpg",     lat: 26.2044, lng: 50.6068, desc: "Vibrant dining and nightlife district popular with expats" },
  { name: "Al Dar Islands",           category: "Nature",    crowd: "low",    image: "/al-dar-islands.jpg",     lat: 25.8703, lng: 50.5503, desc: "Pristine private islands with snorkelling and beach clubs" },
];

const MOODS = [
  { id: "adventure",   label: "Adventure",  icon: "🏔️", desc: "Thrills & exploration" },
  { id: "relaxation",  label: "Relaxation", icon: "🌅", desc: "Peaceful & serene" },
  { id: "culture",     label: "Culture",    icon: "🏛️", desc: "History & heritage" },
  { id: "luxury",      label: "Luxury",     icon: "💎", desc: "Premium experiences" },
  { id: "family",      label: "Family",     icon: "👨‍👩‍👧", desc: "Fun for everyone" },
  { id: "hungry",      label: "Foodie",     icon: "🍽️", desc: "Culinary adventure" },
];

const BUDGETS = [
  { id: "budget",  label: "Budget",    range: "Under BD 20/day" },
  { id: "mid",     label: "Mid-Range", range: "BD 20–60/day" },
  { id: "premium", label: "Premium",   range: "BD 60–150/day" },
  { id: "luxury",  label: "Luxury",    range: "BD 150+/day" },
];

const TRANSLATIONS = {
  "Hello":        "مرحباً (Marhaba)",
  "Thank you":    "شكراً (Shukran)",
  "Where is...?": "أين...؟ (Ayn...?)",
  "How much?":    "بكم؟ (Bikam?)",
  "Good morning": "صباح الخير (Sabah al-khayr)",
  "Please":       "من فضلك (Min fadlik)",
  "Excuse me":    "عفواً (Afwan)",
  "Halal food":   "طعام حلال (Ta'am halal)",
  "Airport":      "المطار (Al-matar)",
  "Hotel":        "فندق (Funduq)",
  "Mosque":       "مسجد (Masjid)",
  "Museum":       "متحف (Mathaf)",
};

const CULTURAL_TIPS = [
  { icon: "👗", title: "Dress Code",       tip: "Dress modestly in public. Cover shoulders and knees, especially in mosques or souks." },
  { icon: "🙏", title: "Greeting",         tip: "Say 'As-salamu alaykum' (Peace be upon you). Reply with 'Wa alaykum as-salam'." },
  { icon: "🍴", title: "Dining Etiquette", tip: "Eat with your right hand. Accept food when offered. Pork is unavailable at most venues." },
  { icon: "📷", title: "Photography",      tip: "Ask permission before photographing people. Avoid government buildings." },
  { icon: "🕌", title: "Prayer Times",     tip: "Shops close briefly for daily prayers. Be respectful near mosques." },
  { icon: "🤝", title: "Business Culture", tip: "Tea comes before business. Build relationships first — punctuality is respected." },
  { icon: "🌙", title: "Ramadan",          tip: "Avoid eating or drinking in public during daylight hours as a sign of respect." },
  { icon: "💬", title: "Language",         tip: "Arabic is official but English is widely spoken. A few Arabic words go a long way." },
];

const HIDDEN_GEMS = [
  { name: "Monet Cafe",               category: "☕ Café",            area: "Adliya",          image: "/monet-cafe.jpg",       desc: "A charming artsy café in the heart of Adliya, known for its cosy atmosphere, specialty coffee and creative menu that changes with the seasons.", why: "One of Bahrain's most beloved independent cafés — the kind of place locals keep to themselves.", bestTime: "Morning or late afternoon for the best ambience", vibe: "🎨 Local favourite" },
  { name: "Al Jasra Handicraft",      category: "🛍️ Shop",            area: "Al Jasra",        image: "/al-jasra.jpg",         desc: "Living heritage workshop where artisans weave baskets, pottery and dhow models — buy direct from makers.", why: "One of the few places where traditional crafts are still practiced authentically.", bestTime: "Weekday mornings", vibe: "🎨 Authentic craft" },
  { name: "Dar Kulaib Beach",         category: "🏖️ Beach",           area: "North Bahrain",   image: "/dar-kulaib.jpg",       desc: "Quiet, uncrowded beach away from resort crowds. Crystal clear water and stunning Gulf sunsets.", why: "While tourists go to resort beaches, locals come here. Practically deserted on weekdays.", bestTime: "Late afternoon — best sunset in Bahrain", vibe: "🌅 Sunset paradise" },
  { name: "Bu Maher Fort",            category: "🏰 Hidden Heritage", area: "Muharraq",        image: "/bu-maher.jpg",         desc: "Rarely-visited Ottoman-era fort at the tip of Muharraq island — sea on three sides.", why: "No gift shop, no crowds, just raw history and panoramic Gulf views.", bestTime: "Sunset — light on old stone is extraordinary", vibe: "🗺️ Explorer's find" },
  { name: "Adliya Art District",      category: "☕ Café",            area: "Adliya",          image: "/adliya-art.jpg",       desc: "Independent coffee shops and galleries in converted Bahraini houses. Specialty coffee, local art.", why: "Bahrain's creative heartbeat — beloved by the local arts scene.", bestTime: "Evenings when galleries open", vibe: "🎭 Creative hub" },
  { name: "Tubli Bay Mangroves",      category: "🌿 Nature",          area: "Tubli",           image: "/tubli-bay.jpg",        desc: "Bahrain's only mangrove forest — kayak through a quiet ecological wonder home to migratory birds.", why: "Almost no tourists know it exists. Wild nature minutes from the capital.", bestTime: "Early morning for birds and calm water", vibe: "🦅 Ecological secret" },
  { name: "Friday Market",            category: "🛍️ Shop",            area: "Sitra",           image: "/friday-market.jpg",   desc: "Weekly market where Bahrainis sell antiques, plants, spices and treasures. Totally unpolished and real.", why: "Where Bahrainis actually shop — not the tourist souk. Bargaining expected.", bestTime: "Friday 6–10 AM before the heat", vibe: "🏺 Raw & real" },
  { name: "Old Textile Souk",         category: "🛍️ Shop",            area: "Old Manama",      image: "/textile-souk.jpg",     desc: "Hidden behind Bab Al Bahrain — fabrics, abayas, thobes and overnight tailoring at fraction of mall prices.", why: "Disappearing fast. Tailors here can make a custom thobe overnight — a dying skill.", bestTime: "Morning, avoid Fridays", vibe: "⏳ Vanishing tradition" },
  { name: "Janabiya Farm Trail",      category: "🌿 Nature",          area: "Janabiya",        image: "/janabiya.jpg",         desc: "Peaceful walking trail through date palm groves and traditional Bahraini farms. The air smells of earth and greenery.", why: "Most visitors never leave the capital. This 30-minute drive reveals Bahrain's agricultural soul.", bestTime: "Early morning in cooler months (Nov–Mar)", vibe: "🌴 Off the beaten path" },
  { name: "Arad Bay Waterfront",      category: "🚶 Leisure",         area: "Muharraq",        image: "/arad-waterfront.jpg",  desc: "Breezy seaside promenade lined with palm trees facing Arad Fort. Far less crowded than Manama Corniche with better views.", why: "Locals' favourite evening walk — families, joggers, fishermen, but almost no tourists.", bestTime: "After 6 PM when the heat breaks and the fort lights up", vibe: "🌊 Local favourite" },
  { name: "Al Bandar Beach",          category: "🏖️ Beach",           area: "Sakhir",          image: "/al-bandar.jpg",        desc: "Calm, shallow beach popular with Bahraini families. Incredibly warm and clear water with a long sandy shore.", why: "Families bring their kids here — the shallow water extends far out, safe and ideal for a genuine local beach day.", bestTime: "Weekday mornings for a quiet visit", vibe: "👨‍👩‍👧 Family favourite" },
  { name: "Halwa House",              category: "☕ Café",            area: "Manama",          image: "/halwa-gahwa.jpg",      desc: "Heritage sweet shop serving traditional Bahraini halwa — dense, fragrant and made fresh daily using age-old recipes.", why: "Halwa is Bahrain's most iconic sweet and this is where locals buy it for weddings and celebrations.", bestTime: "Any time — always fresh, always perfect", vibe: "🍯 Taste of history" },
];

const HOTELS = {
  budget:  [
    { name: "Gulf Pearl Hotel",       area: "Manama Centre",  price: "BD 18–28/night", stars: 3, highlight: "Walking distance to Bab Al Bahrain souk", icon: "🏨" },
    { name: "Al Hayat Hotel",         area: "Muharraq",       price: "BD 15–25/night", stars: 3, highlight: "Near Muharraq Pearling Path, great local cafés", icon: "🏨" },
    { name: "City Centre Hotel",      area: "Juffair",        price: "BD 20–30/night", stars: 3, highlight: "Easy access to dining and nightlife strip", icon: "🏨" },
  ],
  mid:     [
    { name: "Novotel Al Dana Resort", area: "Manama Seafront", price: "BD 45–70/night", stars: 4, highlight: "Private beach, sea views, excellent breakfast", icon: "🏩" },
    { name: "Mercure Grand Seef",     area: "Seef District",  price: "BD 40–65/night", stars: 4, highlight: "Close to City Centre Mall, rooftop pool", icon: "🏩" },
    { name: "Ramada Manama",          area: "Manama",         price: "BD 35–55/night", stars: 4, highlight: "Central location, reliable mid-range comfort", icon: "🏩" },
  ],
  premium: [
    { name: "Gulf Hotel Bahrain",     area: "Adliya",         price: "BD 80–130/night", stars: 5, highlight: "Bahrain's most iconic hotel, 12 restaurants, stunning pool", icon: "🏰" },
    { name: "Sofitel Zallaq",         area: "Zallaq Beach",   price: "BD 90–140/night", stars: 5, highlight: "Private beach, French-inspired luxury, thalasso spa", icon: "🏰" },
    { name: "Radisson Blu",           area: "Diplomatic Area",price: "BD 75–120/night", stars: 5, highlight: "Stunning harbour views, large pool", icon: "🏰" },
  ],
  luxury:  [
    { name: "Four Seasons Bahrain Bay",         area: "Bahrain Bay",     price: "BD 180–350/night", stars: 5, highlight: "Iconic twin-island resort, infinity pool, world-class spa", icon: "👑" },
    { name: "The Ritz-Carlton Bahrain",         area: "Manama Seafront", price: "BD 200–400/night", stars: 5, highlight: "Private beach, butler service, legendary afternoon tea", icon: "👑" },
    { name: "Jumeirah Gulf of Bahrain Resort",  area: "Zallaq",          price: "BD 160–320/night", stars: 5, highlight: "Overwater villas, pristine beach, exceptional Arabic dining", icon: "👑" },
  ],
};

// ─── HOTEL COMPONENT ──────────────────────────────────────────────────────────
function HotelRecommendations({ budget }) {
  const key = ["luxury","premium","mid"].includes(budget) ? budget : "budget";
  const hotels = HOTELS[key];
  const label = { budget:"Budget Stays", mid:"Mid-Range Hotels", premium:"Premium Hotels", luxury:"Luxury Resorts" }[key];
  const col   = { budget: T.navyLight, mid: T.green, premium: T.gold, luxury: T.warn }[key];
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 13, color: col, fontFamily: "sans-serif", fontWeight: "bold", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
        🛏️ {label} <span style={{ fontSize: 11, color: T.muted, fontWeight: "normal" }}>matched to your budget</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
        {hotels.map((h, i) => (
          <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <div style={{ fontSize: 13, fontWeight: "bold", color: T.text, fontFamily: "sans-serif", flex: 1 }}>{h.icon} {h.name}</div>
              <div style={{ fontSize: 11, color: T.gold }}>{Array(Math.min(h.stars,5)).fill("⭐").join("")}</div>
            </div>
            <div style={{ fontSize: 11, color: T.muted, fontFamily: "sans-serif", marginBottom: 4 }}>📍 {h.area}</div>
            <div style={{ fontSize: 12, color: col, fontFamily: "sans-serif", fontWeight: "bold", marginBottom: 6 }}>{h.price}</div>
            <div style={{ fontSize: 11, color: T.sub, fontFamily: "sans-serif", lineHeight: 1.5 }}>✦ {h.highlight}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── GEMS COMPONENT ───────────────────────────────────────────────────────────
const GEM_GRADIENTS = {
  "☕ Café":            "linear-gradient(160deg,#2E0E06,#8B3A22)",
  "🏖️ Beach":          "linear-gradient(160deg,#062030,#1E7050)",
  "🌿 Nature":         "linear-gradient(160deg,#061E0E,#0E5835)",
  "🛍️ Shop":           "linear-gradient(160deg,#1E062E,#5A2880)",
  "🏰 Hidden Heritage":"linear-gradient(160deg,#2E1E06,#7A5420)",
  "🚶 Leisure":        "linear-gradient(160deg,#061424,#2B5AA8)",
  default:             "linear-gradient(160deg,#0B0F1E,#1E2B4A)",
};
const GEM_ICONS = { "☕ Café":"☕","🏖️ Beach":"🏖️","🌿 Nature":"🌿","🛍️ Shop":"🛍️","🏰 Hidden Heritage":"🏰","🚶 Leisure":"🚶", default:"💎" };

function GemsList() {
  const [filterCat, setFilterCat] = useState("All");
  useEffect(() => {
    const handler = () => setFilterCat(window._gemCat || "All");
    document.addEventListener("gemfilter", handler);
    return () => document.removeEventListener("gemfilter", handler);
  }, []);
  const filtered = filterCat === "All" ? HIDDEN_GEMS : HIDDEN_GEMS.filter(g => g.category === filterCat);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
      {filtered.map((gem, i) => {
        const grad = GEM_GRADIENTS[gem.category] || GEM_GRADIENTS.default;
        const ic   = GEM_ICONS[gem.category]    || GEM_ICONS.default;
        return (
          <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden" }}>
            <div style={{ height: 130, background: grad, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
              {gem.image && <img src={gem.image} alt={gem.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} />}
              <div style={{ fontSize: 50, filter: "drop-shadow(0 2px 10px rgba(0,0,0,0.5))", position: "relative", zIndex: 1 }}>{ic}</div>
              <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(8,9,15,0.8)", borderRadius: 20, padding: "4px 10px", fontSize: 11, color: T.gold, fontFamily: "sans-serif", zIndex: 2 }}>{gem.category}</div>
              <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(8,9,15,0.8)", borderRadius: 20, padding: "4px 10px", fontSize: 11, color: T.sub, fontFamily: "sans-serif", zIndex: 2 }}>📍 {gem.area}</div>
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ fontSize: 15, fontWeight: "bold", color: T.text, fontFamily: "sans-serif", marginBottom: 6 }}>{gem.name}</div>
              <div style={{ fontSize: 12, color: T.sub, fontFamily: "sans-serif", lineHeight: 1.6, marginBottom: 10 }}>{gem.desc}</div>
              <div style={{ background: T.goldBg, border: `1px solid rgba(201,168,76,0.2)`, borderRadius: 8, padding: "8px 12px", marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: T.gold, fontFamily: "sans-serif", letterSpacing: 1, marginBottom: 3 }}>✨ WHY IT'S SPECIAL</div>
                <div style={{ fontSize: 12, color: T.text, fontFamily: "sans-serif", lineHeight: 1.5 }}>{gem.why}</div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 10, background: T.navyBg, color: T.navyLight, fontFamily: "sans-serif" }}>🕐 {gem.bestTime}</span>
                <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 10, background: "rgba(255,255,255,0.05)", color: T.muted, fontFamily: "sans-serif" }}>{gem.vibe}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function PearlyPathAI() {
  const [screen, setScreen]           = useState("home");
  const [mood, setMood]               = useState(null);
  const [budget, setBudget]           = useState(null);
  const [duration, setDuration]       = useState(1);
  const [interests, setInterests]     = useState([]);
  const [itinerary, setItinerary]     = useState(null);
  const [loading, setLoading]         = useState(false);
  const [activeTab, setActiveTab]     = useState("itinerary");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput]     = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [transInput, setTransInput]   = useState("");
  const [transResult, setTransResult] = useState("");
  const [transLoading, setTransLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Inject global CSS once
  useEffect(() => {
    if (!document.getElementById("pp-global-css")) {
      const el = document.createElement("style");
      el.id = "pp-global-css";
      el.textContent = GLOBAL_CSS;
      document.head.appendChild(el);
    }
  }, []);

  // Screen transition helper — plays nav sound then switches screen
  const navigateTo = (newScreen) => {
    playSound("nav");
    setScreen(newScreen);
  };

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  const interestOptions = ["History","Food","Shopping","Nature","Architecture","Sports","Nightlife","Art","Pearl Heritage","Water Activities"];
  const toggleInterest = (i) => setInterests(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);

  const extractAIText = (data) => {
    if (!data) return "";
    if (typeof data === "string") return data;
    if (Array.isArray(data)) return data.map(extractAIText).join("");
    if (typeof data.content === "string") return data.content;
    if (Array.isArray(data.content)) return data.content.map(item => {
      if (!item) return "";
      if (typeof item === "string") return item;
      if (typeof item.text === "string") return item.text;
      if (typeof item.content === "string") return item.content;
      return "";
    }).join("");
    if (Array.isArray(data.choices)) return data.choices.map(c => c?.message?.content || c?.text || "").join("");
    if (typeof data.text === "string") return data.text;
    return "";
  };

  const generateItinerary = async () => {
    if (!mood || !budget) return;
    setLoading(true); setItinerary(null);

    if (DEMO_MODE) {
      // Simulate a realistic loading delay, then return mock data
      await new Promise(r => setTimeout(r, 1200));
      const days = DEMO_DAYS.slice(0, duration).map((d, i) => ({ ...d, day: i + 1 }));
      // Pad extra days by cycling through demo days
      while (days.length < duration) {
        const src = DEMO_DAYS[days.length % DEMO_DAYS.length];
        days.push({ ...src, day: days.length + 1 });
      }
      setItinerary({ ...DEMO_ITINERARY_META, days, partial: false });
      playSound("chime");
      navigateTo("results");
      setLoading(false);
      return;
    }

    const names = BAHRAIN_ATTRACTIONS.map(a => a.name).join(",");
    const interestStr = interests.length > 0 ? interests.join(",") : "general";
    const moodExtra = mood === "hungry" ? "Focus on restaurants,food markets,local eateries,halwa shops,karak cafes." :
                      mood === "adventure" ? "Include Gravity,Al Dar Islands,active outdoor spots." :
                      mood === "relaxation" ? "Prioritise beaches,spas,quiet nature spots,waterfront walks." :
                      mood === "culture" ? "Prioritise heritage sites,museums,pearling path,mosques,souks." :
                      mood === "luxury" ? "Prioritise Four Seasons,Ritz-Carlton,Amwaj Islands,fine dining." :
                      mood === "family" ? "Prioritise Lost Paradise,Adhari Park,Al Areen Wildlife." : "";
    const callAPI = async (prompt) => {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 600, messages: [{ role: "user", content: prompt }] }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || res.statusText || "API error");
      const text = extractAIText(data).trim();
      if (!text) throw new Error("Empty API response");
      return text;
    };
    const parseJSON = (text) => {
      const clean = text.replace(/```json|```/g, "").trim();
      const match = clean.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
      if (!match) throw new Error("No JSON in response");
      return JSON.parse(match[0]);
    };
    try {
      const metaText = await callAPI(`Bahrain trip: ${duration} days, mood:${mood}, budget:${budget}, interests:${interestStr}. ${moodExtra}
Return ONLY raw JSON: {"summary":"1 engaging sentence","total_budget_estimate":"BDX-Y per day","crowd_warning":"one practical tip","best_time":"short advice"}`);
      const meta = parseJSON(metaText);
      const days = [];
      for (let d = 1; d <= duration; d++) {
        const used = days.flatMap(day => [day.morning?.place, day.afternoon?.place, day.evening?.place].filter(Boolean));
        const dayText = await callAPI(`Bahrain Day ${d} of ${duration}. Mood:${mood} Budget:${budget} Interests:${interestStr}. ${moodExtra} ${used.length ? `Avoid: ${used.join(",")}.` : ""}
Pick from: ${names}
Return ONLY raw JSON: {"day":${d},"theme":"3 vivid words","morning":{"time":"9:00 AM","place":"exact name","activity":"what to do","duration":"2 hrs","cost":"BD X"},"afternoon":{"time":"1:00 PM","place":"exact name","activity":"what to do","duration":"2 hrs","cost":"BD X"},"evening":{"time":"7:00 PM","place":"exact name","activity":"what to do","duration":"2 hrs","cost":"BD X"},"food_tip":"specific dish or restaurant","transport_tip":"how to get around","hidden_gem":"one off-the-beaten-path tip"}`);
        const dayData = parseJSON(dayText);
        days.push(dayData);
        setItinerary({ ...meta, days: [...days], partial: d < duration });
        if (d === 1) navigateTo("results");
      }
      setItinerary({ ...meta, days, partial: false });
      playSound("chime");
    } catch (e) {
      setItinerary(prev => prev?.days?.length > 0 ? { ...prev, partial: false } : { error: `Generation failed: ${e.message}. Please try again.` });
      navigateTo("results");
    }
    setLoading(false);
  };

  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = chatInput.trim(); setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setChatLoading(true);

    if (DEMO_MODE) {
      await new Promise(r => setTimeout(r, 900));
      setChatMessages(prev => [...prev, { role: "assistant", content: getMockChatReply(userMsg) }]);
      setChatLoading(false);
      return;
    }

    const history = [...chatMessages, { role: "user", content: userMsg }];
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 800,
          system: `PearlyPath AI Bahrain guide. Answer tourism questions in 2-3 sentences max. Be specific and practical. Mood:${mood||"?"} Budget:${budget||"?"}.`,
          messages: history.slice(-10) }) });
      const data = await res.json();
      setChatMessages(prev => [...prev, { role: "assistant", content: data.content.map(b => b.text || "").join("") }]);
    } catch { setChatMessages(prev => [...prev, { role: "assistant", content: "Sorry, couldn't connect. Please try again." }]); }
    setChatLoading(false);
  };

  const translateText = async () => {
    if (!transInput.trim()) return;
    setTransLoading(true); setTransResult("");
    const preset = TRANSLATIONS[transInput.trim()];
    if (preset) { setTransResult(preset); setTransLoading(false); return; }

    if (DEMO_MODE) {
      await new Promise(r => setTimeout(r, 700));
      setTransResult(`Arabic: (translation unavailable in demo mode)\n\nTip: This phrase would be translated using the Anthropic API when you add your API key and set DEMO_MODE = false.`);
      setTransLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 300,
          messages: [{ role: "user", content: `Translate this to Arabic for a tourist in Bahrain. Provide the Arabic script, transliteration, and a usage tip. 3 lines max: "${transInput}"` }] }) });
      const data = await res.json();
      setTransResult(data.content.map(b => b.text || "").join(""));
    } catch { setTransResult("Translation unavailable. Please try again."); }
    setTransLoading(false);
  };

  // ─── STYLES ───────────────────────────────────────────────────────────────
  const s = {
    app:        { fontFamily: "'Georgia', serif", background: T.bg, minHeight: "100vh", color: T.text },
    header:     { background: "rgba(8,9,15,0.96)", borderBottom: `1px solid ${T.border}`, padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 },
    logo:       { display: "flex", alignItems: "center", gap: 10 },
    logoText:   { fontSize: 18, fontWeight: "bold", color: T.gold, letterSpacing: 1 },
    logoSub:    { fontSize: 10, color: T.muted, fontFamily: "sans-serif", letterSpacing: 2 },
    navBtn:     { background: "none", border: `1px solid ${T.border}`, color: T.sub, padding: "6px 14px", borderRadius: 20, cursor: "pointer", fontSize: 13, fontFamily: "sans-serif" },
    hero:       { textAlign: "center", padding: "60px 20px 40px", background: `linear-gradient(180deg, ${T.bg} 0%, #0B0F1E 100%)` },
    heroTitle:  { fontSize: "clamp(26px, 6vw, 50px)", color: T.gold, letterSpacing: 3, marginBottom: 12 },
    heroSub:    { fontSize: 15, color: T.navyLight, fontFamily: "sans-serif", marginBottom: 8, letterSpacing: 1 },
    heroDesc:   { fontSize: 14, color: T.sub, fontFamily: "sans-serif", maxWidth: 500, margin: "0 auto 32px", lineHeight: 1.7 },
    primaryBtn: { background: `linear-gradient(135deg, ${T.gold}, ${T.goldDim})`, color: T.bg, border: "none", padding: "14px 36px", borderRadius: 30, fontSize: 16, fontWeight: "bold", cursor: "pointer", letterSpacing: 1, fontFamily: "sans-serif" },
    card:       { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: "20px", marginBottom: 14 },
    section:    { padding: "20px 16px" },
    sectionTitle:{ fontSize: 20, color: T.gold, marginBottom: 4, letterSpacing: 1 },
    sectionSub: { fontSize: 13, color: T.sub, fontFamily: "sans-serif", marginBottom: 20 },
    moodGrid:   { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10 },
    moodCard:   (sel) => ({ background: sel ? T.goldBg : T.surface, border: `1px solid ${sel ? T.gold : T.border}`, borderRadius: 12, padding: "14px 10px", textAlign: "center", cursor: "pointer" }),
    moodEmoji:  { fontSize: 26, marginBottom: 6 },
    moodLabel:  { fontSize: 13, fontWeight: "bold", color: T.text, fontFamily: "sans-serif" },
    moodDesc:   { fontSize: 11, color: T.muted, fontFamily: "sans-serif", marginTop: 4 },
    budgetGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
    budgetCard: (sel) => ({ background: sel ? T.navyBg : T.surface, border: `1px solid ${sel ? T.navy : T.border}`, borderRadius: 12, padding: "14px", cursor: "pointer" }),
    budgetLabel:{ fontSize: 14, fontWeight: "bold", color: T.text, fontFamily: "sans-serif" },
    budgetRange:{ fontSize: 12, color: T.muted, fontFamily: "sans-serif", marginTop: 4 },
    durationRow:{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" },
    durationBtn:(active) => ({ width: 40, height: 40, borderRadius: "50%", border: `1px solid ${active ? T.gold : T.border}`, background: active ? T.goldBg : T.surface, color: T.text, cursor: "pointer", fontSize: 14, fontFamily: "sans-serif" }),
    interestChip:(sel) => ({ display: "inline-block", padding: "7px 16px", margin: "4px 6px 4px 0", borderRadius: 20, border: `1px solid ${sel ? T.gold : T.border}`, background: sel ? T.goldBg : T.surface, cursor: "pointer", fontSize: 13, color: sel ? T.gold : T.sub, fontFamily: "sans-serif" }),
    genBtn:     (active) => ({ width: "100%", padding: "16px", borderRadius: 30, border: "none", background: active ? `linear-gradient(135deg, ${T.gold}, ${T.goldDim})` : T.surface2, color: active ? T.bg : T.muted, fontSize: 16, fontWeight: "bold", cursor: active ? "pointer" : "not-allowed", fontFamily: "sans-serif", letterSpacing: 1 }),
    tabs:       { display: "flex", borderBottom: `1px solid ${T.border}`, overflowX: "auto", background: T.surface },
    tab:        (active) => ({ padding: "12px 16px", background: "none", border: "none", borderBottom: `2px solid ${active ? T.gold : "transparent"}`, color: active ? T.gold : T.muted, cursor: "pointer", fontSize: 13, fontFamily: "sans-serif", whiteSpace: "nowrap", letterSpacing: 0.5 }),
    dayCard:    { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, marginBottom: 18, overflow: "hidden" },
    dayHeader:  { background: T.navyBg, padding: "14px 20px", borderBottom: `1px solid ${T.borderHi}`, display: "flex", alignItems: "center", justifyContent: "space-between" },
    dayTitle:   { fontSize: 16, color: T.navyLight, fontWeight: "bold", fontFamily: "sans-serif" },
    dayTheme:   { fontSize: 12, color: T.muted, fontFamily: "sans-serif" },
    timeSlot:   { padding: "14px 20px", borderBottom: `1px solid ${T.border}` },
    timeLabel:  { fontSize: 11, color: T.gold, fontFamily: "sans-serif", letterSpacing: 1, marginBottom: 4 },
    placeName:  { fontSize: 15, color: T.text, fontWeight: "bold", fontFamily: "sans-serif" },
    activityText:{ fontSize: 13, color: T.sub, fontFamily: "sans-serif", marginTop: 4, lineHeight: 1.5 },
    infoRow:    { display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" },
    badge:      (r,g,b) => ({ fontSize: 11, padding: "3px 10px", borderRadius: 10, background: `rgba(${r},${g},${b},0.12)`, color: `rgb(${r},${g},${b})`, fontFamily: "sans-serif" }),
    gemBox:     { background: T.goldBg, border: `1px solid rgba(201,168,76,0.25)`, borderRadius: 8, padding: "10px 14px", margin: "12px 20px", fontSize: 12, color: T.gold, fontFamily: "sans-serif" },
    tipBox:     { padding: "12px 20px", background: T.navyBg },
    tipText:    { fontSize: 12, color: T.sub, fontFamily: "sans-serif", lineHeight: 1.6 },
    summaryCard:{ background: T.goldBg, border: `1px solid rgba(201,168,76,0.25)`, borderRadius: 12, padding: "16px 20px", marginBottom: 18 },
    summaryText:{ fontSize: 14, color: T.text, fontFamily: "sans-serif", lineHeight: 1.7 },
    chatContainer:{ display: "flex", flexDirection: "column", height: "60vh", minHeight: 400 },
    chatMessages:{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 12 },
    userMsg:    { alignSelf: "flex-end", background: T.goldBg, border: `1px solid rgba(201,168,76,0.25)`, borderRadius: "16px 16px 4px 16px", padding: "10px 14px", maxWidth: "80%", fontSize: 13, fontFamily: "sans-serif", color: T.text, lineHeight: 1.5 },
    botMsg:     { alignSelf: "flex-start", background: T.navyBg, border: `1px solid rgba(43,90,168,0.3)`, borderRadius: "16px 16px 16px 4px", padding: "10px 14px", maxWidth: "85%", fontSize: 13, fontFamily: "sans-serif", color: T.text, lineHeight: 1.5 },
    chatInput:  { display: "flex", gap: 8, padding: "12px 16px", borderTop: `1px solid ${T.border}` },
    textInput:  { flex: 1, background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 24, padding: "10px 16px", color: T.text, fontSize: 14, fontFamily: "sans-serif", outline: "none" },
    sendBtn:    { background: `linear-gradient(135deg, ${T.gold}, ${T.goldDim})`, border: "none", borderRadius: 24, padding: "10px 20px", color: T.bg, fontWeight: "bold", cursor: "pointer", fontSize: 13, fontFamily: "sans-serif" },
    attractionGrid:{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 },
    attractionCard:(crowd) => ({ background: T.surface, border: `1px solid rgba(${crowd === "low" ? "46,213,115" : crowd === "high" ? "255,71,87" : "43,90,168"},0.25)`, borderRadius: 14, padding: 14, cursor: "pointer" }),
    crowdDot:   (crowd) => ({ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: crowd === "low" ? T.green : crowd === "high" ? T.red : T.navyLight, marginRight: 6 }),
    transBox:   { background: T.navyBg, border: `1px solid rgba(43,90,168,0.3)`, borderRadius: 12, padding: "20px", marginTop: 20 },
    phraseChip: { display: "inline-block", padding: "6px 14px", margin: "4px", borderRadius: 20, background: T.surface, border: `1px solid ${T.border}`, color: T.sub, fontSize: 12, cursor: "pointer", fontFamily: "sans-serif" },
    culturalGrid:{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 },
    culturalCard:{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "16px" },
  };

  // ─── HOME SCREEN ────────────────────────────────────────────────────────────
  if (screen === "home") return (
    <div className="pp-screen" style={s.app}>
      <div style={s.header}>
        <div style={s.logo}>
          <img src="/logo.jpg" alt="PearlyPath logo" style={{ width: 42, height: 42, borderRadius: 10, objectFit: "cover", border: `1px solid ${T.navy}` }} />
          <div>
            <div style={s.logoText}>PearlyPath AI</div>
            <div style={s.logoSub}>YOUR AI GUIDE TO BAHRAIN</div>
          </div>
        </div>
      </div>
      <div style={s.hero}>
        <style>{`@keyframes pulse{0%,100%{box-shadow:0 0 12px rgba(43,90,168,0.5)}50%{box-shadow:0 0 32px rgba(43,90,168,0.9),0 0 60px rgba(201,168,76,0.4)}}`}</style>
        <div style={{ width: 140, height: 140, margin: "0 auto 24px", animation: "pulse 2.5s ease-in-out infinite", borderRadius: 24, overflow: "hidden", border: `1px solid ${T.border}`, background: T.surface }}>
          <img src="/logo.jpg" alt="PearlyPath" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
        <div style={s.heroTitle}>PEARLYPATH AI</div>
        <div style={s.heroSub}>BAHRAIN'S INTELLIGENT TOURISM COMPANION</div>
        <div style={s.heroDesc}>Personalized, AI-powered tourism for a smarter Bahrain. Discover hidden gems, beat the crowds, and explore like a local.</div>
        <button className="pp-btn-press" style={s.primaryBtn} onClick={() => { playSound("click"); navigateTo("planner"); }}>Plan My Journey ✦</button>
      </div>
      <div style={{ padding: "30px 16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, maxWidth: 700, margin: "0 auto" }}>
          {[["🗺️","Smart Itinerary","AI plans your perfect day"],["🎭","Mood-Based","Match trips to your vibe"],["💎","Hidden Gems","Discover secret Bahrain"],["👥","Crowd Watch","Beat the tourist rush"],["🌐","Translator","Arabic–English help"],["🕌","Cultural Guide","Etiquette & heritage"]].map(([icon,title,desc]) => (
            <div key={title} className="pp-card-hover" style={s.card}>
              <div style={{ fontSize: 26, marginBottom: 8 }}>{icon}</div>
              <div style={{ fontSize: 14, fontWeight: "bold", color: T.gold, fontFamily: "sans-serif", marginBottom: 4 }}>{title}</div>
              <div style={{ fontSize: 12, color: T.sub, fontFamily: "sans-serif", lineHeight: 1.5 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ─── PLANNER SCREEN ─────────────────────────────────────────────────────────
  if (screen === "planner") return (
    <div className="pp-screen" style={s.app}>
      <div style={s.header}>
        <div style={s.logo}>
          <img src="/logo.jpg" alt="PearlyPath logo" style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover" }} />
          <div style={s.logoText}>PearlyPath AI</div>
        </div>
        <button className="pp-btn-press" style={s.navBtn} onClick={() => { playSound("click"); navigateTo("home"); }}>← Home</button>
      </div>
      <div style={s.section}>
        <div style={s.sectionTitle}>Plan Your Journey</div>
        <div style={s.sectionSub}>Tell us about your ideal Bahrain experience</div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 14, color: T.gold, marginBottom: 12, fontFamily: "sans-serif" }}>What's your travel mood?</div>
          <div style={s.moodGrid}>
            {MOODS.map(m => (
              <div key={m.id} style={s.moodCard(mood === m.id)} onClick={() => setMood(m.id)}>
                <div style={s.moodEmoji}>{m.icon}</div>
                <div style={s.moodLabel}>{m.label}</div>
                <div style={s.moodDesc}>{m.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 14, color: T.gold, marginBottom: 12, fontFamily: "sans-serif" }}>What's your daily budget?</div>
          <div style={s.budgetGrid}>
            {BUDGETS.map(b => (
              <div key={b.id} style={s.budgetCard(budget === b.id)} onClick={() => setBudget(b.id)}>
                <div style={s.budgetLabel}>{b.label}</div>
                <div style={s.budgetRange}>{b.range}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 14, color: T.gold, marginBottom: 12, fontFamily: "sans-serif" }}>How many days?</div>
          <div style={s.durationRow}>
            {[1,2,3,4,5,6,7].map(d => (
              <button key={d} style={s.durationBtn(duration === d)} onClick={() => setDuration(d)}>{d}</button>
            ))}
            <span style={{ fontSize: 13, color: T.sub, fontFamily: "sans-serif" }}>day{duration > 1 ? "s" : ""}</span>
          </div>
        </div>

        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 14, color: T.gold, marginBottom: 12, fontFamily: "sans-serif" }}>Interests (optional)</div>
          <div>{interestOptions.map(i => <span key={i} style={s.interestChip(interests.includes(i))} onClick={() => toggleInterest(i)}>{i}</span>)}</div>
        </div>

        <button className="pp-btn-press" style={s.genBtn(!!mood && !!budget)} disabled={!mood || !budget || loading} onClick={() => { playSound("click"); generateItinerary(); }}>
          {loading ? "✦ Building your itinerary — usually 10–20 seconds..." : "✦ Generate My Itinerary"}
        </button>
        {loading && (
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}`}</style>
            <div style={{ display: "inline-flex", gap: 6 }}>
              {["🗺️","🏛️","💎"].map((e, i) => <span key={i} style={{ fontSize: 22, animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}>{e}</span>)}
            </div>
            <div style={{ fontSize: 12, color: T.sub, fontFamily: "sans-serif", marginTop: 8 }}>Building your Bahrain adventure day by day...</div>
          </div>
        )}
        {(!mood || !budget) && <div style={{ textAlign: "center", fontSize: 12, color: T.muted, marginTop: 10, fontFamily: "sans-serif" }}>Select a mood and budget to continue</div>}
      </div>
    </div>
  );

  // ─── RESULTS SCREEN ──────────────────────────────────────────────────────────
  if (screen === "results") return (
    <div className="pp-screen" style={s.app}>
      <div style={s.header}>
        <div style={s.logo}>
          <img src="/logo.jpg" alt="PearlyPath logo" style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover" }} />
          <div style={s.logoText}>PearlyPath AI</div>
        </div>
        <button className="pp-btn-press" style={s.navBtn} onClick={() => { playSound("click"); navigateTo("planner"); setItinerary(null); }}>← Replan</button>
      </div>

      <div style={s.tabs}>
        {[["itinerary","🗺️ Itinerary"],["explore","🏛️ Explore"],["gems","💎 Gems"],["assistant","💬 Ask AI"],["translate","🌐 Translate"],["culture","🕌 Culture"]].map(([id,label]) => (
          <button key={id} className="pp-btn-press" style={s.tab(activeTab === id)} onClick={() => { playSound("click"); setActiveTab(id); }}>{label}</button>
        ))}
      </div>

      <div style={s.section}>

        {/* ── ITINERARY ── */}
        {activeTab === "itinerary" && (
          itinerary?.error ? (
            <div style={s.card}>
              <div style={{ color: T.red, fontFamily: "sans-serif", marginBottom: 12 }}>⚠️ {itinerary.error}</div>
              <button style={s.navBtn} onClick={() => { setScreen("planner"); setItinerary(null); }}>← Try Again</button>
            </div>
          ) : itinerary ? (
            <>
              <div style={s.summaryCard}>
                <div style={{ fontSize: 11, color: T.gold, fontFamily: "sans-serif", letterSpacing: 1, marginBottom: 8 }}>
                  YOUR PERSONALIZED ITINERARY
                  {itinerary.partial && <span style={{ marginLeft: 10, color: T.navyLight }}>✦ Generating days...</span>}
                </div>
                <div style={s.summaryText}>{itinerary.summary}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                  {itinerary.total_budget_estimate && <span style={s.badge(201,168,76)}>💰 {itinerary.total_budget_estimate}</span>}
                  {itinerary.best_time && <span style={s.badge(43,90,168)}>🕐 {itinerary.best_time}</span>}
                </div>
                {itinerary.crowd_warning && <div style={{ fontSize: 12, color: T.warn, fontFamily: "sans-serif", marginTop: 10, padding: "8px 12px", background: "rgba(255,159,67,0.08)", borderRadius: 8, border: "1px solid rgba(255,159,67,0.25)" }}>⚠️ {itinerary.crowd_warning}</div>}
              </div>

              <HotelRecommendations budget={budget} />

              {itinerary.days?.map((day, i) => (
                <div key={i} style={s.dayCard}>
                  <div style={s.dayHeader}>
                    <div style={s.dayTitle}>Day {day.day}</div>
                    <div style={s.dayTheme}>{day.theme}</div>
                  </div>
                  {["morning","afternoon","evening"].map(slot => day[slot] && (
                    <div key={slot} style={s.timeSlot}>
                      <div style={s.timeLabel}>{slot.toUpperCase()} · {day[slot].time}</div>
                      <div style={s.placeName}>{day[slot].place}</div>
                      <div style={s.activityText}>{day[slot].activity}</div>
                      <div style={s.infoRow}>
                        {day[slot].duration && <span style={s.badge(43,90,168)}>⏱ {day[slot].duration}</span>}
                        {day[slot].cost     && <span style={s.badge(201,168,76)}>💰 {day[slot].cost}</span>}
                      </div>
                    </div>
                  ))}
                  {day.hidden_gem && <div style={s.gemBox}>💎 Hidden Gem: {day.hidden_gem}</div>}
                  <div style={s.tipBox}>
                    {day.food_tip      && <div style={s.tipText}>🍽️ {day.food_tip}</div>}
                    {day.transport_tip && <div style={{ ...s.tipText, marginTop: 6 }}>🚗 {day.transport_tip}</div>}
                  </div>
                </div>
              ))}
            </>
          ) : <div style={{ textAlign: "center", padding: 40, color: T.sub, fontFamily: "sans-serif" }}>Loading your itinerary...</div>
        )}

        {/* ── EXPLORE ── */}
        {activeTab === "explore" && (
          <>
            <div style={s.sectionTitle}>Discover Bahrain</div>
            <div style={s.sectionSub}>All major attractions with live crowd indicators</div>
            <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
              {[["2ed573","low","Quiet now"],["43,90,168","medium","Moderate"],["ff4757","high","Busy now"]].map(([c,k,l]) => (
                <div key={k} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontFamily: "sans-serif", color: T.sub }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: c.includes(",") ? `rgb(${c})` : `#${c}` }} />{l}
                </div>
              ))}
            </div>
            <div style={s.attractionGrid}>
              {BAHRAIN_ATTRACTIONS.map(a => {
                const cs = CATEGORY_STYLE[a.category] || CATEGORY_STYLE.default;
                const crowdColor = a.crowd === "low" ? T.green : a.crowd === "high" ? T.red : T.navyLight;
                const crowdLabel = a.crowd === "low" ? "Quiet" : a.crowd === "high" ? "Crowded" : "Moderate";
                return (
                  <div key={a.name} className="pp-card-hover" style={s.attractionCard(a.crowd)}>
                    <div style={{ height: 120, borderRadius: 10, marginBottom: 12, overflow: "hidden", position: "relative" }}>
                      {a.image
                        ? <img src={a.image} alt={a.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} onError={e => { e.target.style.display="none"; e.target.nextSibling.style.display="flex"; }} />
                        : null}
                      <div style={{ display: a.image ? "none" : "flex", position: "absolute", inset: 0, background: cs.gradient, flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ fontSize: 44, filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.5))" }}>{cs.icon}</div>
                      </div>
                      <div style={{ position: "absolute", bottom: 7, right: 9, fontSize: 10, color: "rgba(255,255,255,0.7)", fontFamily: "sans-serif", letterSpacing: 1, textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>{a.category.toUpperCase()}</div>
                    </div>
                    <div style={{ fontSize: 11, color: T.gold, fontFamily: "sans-serif", marginBottom: 3 }}>{a.category}</div>
                    <div style={{ fontSize: 14, fontWeight: "bold", color: T.text, fontFamily: "sans-serif", marginBottom: 5 }}>{a.name}</div>
                    <div style={{ fontSize: 12, color: T.sub, fontFamily: "sans-serif", lineHeight: 1.5, marginBottom: 8 }}>{a.desc}</div>
                    <div style={{ fontSize: 11, fontFamily: "sans-serif" }}>
                      <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: crowdColor, marginRight: 6 }} />
                      <span style={{ color: crowdColor }}>{crowdLabel} traffic</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── ASK AI ── */}
        {activeTab === "assistant" && (
          <>
            <div style={s.sectionTitle}>AI Travel Assistant</div>
            <div style={s.sectionSub}>Ask anything about Bahrain — culture, food, transport, tips</div>
            <div style={s.chatContainer}>
              <div style={s.chatMessages}>
                {chatMessages.length === 0 && (
                  <div style={{ ...s.botMsg, alignSelf: "flex-start" }}>
                    Marhaba! 👋 I'm your PearlyPath AI guide. Ask me anything about Bahrain — best restaurants, transport, cultural tips, hidden spots, or activities for your interests!
                  </div>
                )}
                {chatMessages.map((m, i) => (
                  <div key={i} style={m.role === "user" ? s.userMsg : s.botMsg}>{m.content}</div>
                ))}
                {chatLoading && <div style={s.botMsg}>✦ Thinking...</div>}
                <div ref={chatEndRef} />
              </div>
              <div style={s.chatInput}>
                <input style={s.textInput} value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendChat()} placeholder="Ask about Bahrain..." />
                <button className="pp-btn-press" style={s.sendBtn} onClick={() => { playSound("click"); sendChat(); }}>Send</button>
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12, color: T.muted, fontFamily: "sans-serif", marginBottom: 8 }}>Quick questions:</div>
              {["Best local food to try?","How to get around Bahrain?","What to wear?","Best time to visit souks?"].map(q => (
                <span key={q} style={s.phraseChip} onClick={() => setChatInput(q)}>{q}</span>
              ))}
            </div>
          </>
        )}

        {/* ── TRANSLATE ── */}
        {activeTab === "translate" && (
          <>
            <div style={s.sectionTitle}>Arabic–English Translator</div>
            <div style={s.sectionSub}>Communicate better during your visit</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              <input style={{ ...s.textInput, flex: 1 }} value={transInput} onChange={e => setTransInput(e.target.value)} onKeyDown={e => e.key === "Enter" && translateText()} placeholder="Type a word or phrase..." />
              <button className="pp-btn-press" style={s.sendBtn} onClick={() => { playSound("click"); translateText(); }} disabled={transLoading}>{transLoading ? "..." : "Translate"}</button>
            </div>
            {transResult && (
              <div style={s.transBox}>
                <div style={{ fontSize: 11, color: T.navyLight, fontFamily: "sans-serif", letterSpacing: 1, marginBottom: 8 }}>TRANSLATION</div>
                <div style={{ fontSize: 16, color: T.text, fontFamily: "sans-serif", lineHeight: 1.8, whiteSpace: "pre-line" }}>{transResult}</div>
              </div>
            )}
            <div style={{ marginTop: 24 }}>
              <div style={{ fontSize: 13, color: T.gold, fontFamily: "sans-serif", marginBottom: 12 }}>Essential Tourist Phrases</div>
              <div>
                {Object.entries(TRANSLATIONS).map(([en, ar]) => (
                  <div key={en} style={{ ...s.card, padding: "12px 16px", cursor: "pointer" }} onClick={() => { setTransInput(en); setTransResult(ar); }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 14, color: T.text, fontFamily: "sans-serif" }}>{en}</span>
                      <span style={{ fontSize: 13, color: T.sub, fontFamily: "sans-serif", direction: "rtl" }}>{ar.split(" (")[0]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── GEMS ── */}
        {activeTab === "gems" && (
          <>
            <div style={s.sectionTitle}>💎 Hidden Gems</div>
            <div style={s.sectionSub}>Local spots that deserve far more recognition</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
              {["All","☕ Café","🏖️ Beach","🌿 Nature","🛍️ Shop","🏰 Hidden Heritage","🚶 Leisure"].map(cat => {
                const active = (window._gemCat || "All") === cat;
                return (
                  <span key={cat}
                    onClick={() => { window._gemCat = cat; const e = document.createEvent("Event"); e.initEvent("gemfilter",true,true); document.dispatchEvent(e); }}
                    style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${active ? T.gold : T.border}`, background: active ? T.goldBg : T.surface, color: active ? T.gold : T.sub, fontSize: 12, cursor: "pointer", fontFamily: "sans-serif" }}>
                    {cat}
                  </span>
                );
              })}
            </div>
            <GemsList />
          </>
        )}

        {/* ── CULTURE ── */}
        {activeTab === "culture" && (
          <>
            <div style={s.sectionTitle}>Cultural Guide</div>
            <div style={s.sectionSub}>Etiquette, traditions, and heritage tips for Bahrain</div>
            <div style={s.culturalGrid}>
              {CULTURAL_TIPS.map((tip, i) => (
                <div key={i} style={s.culturalCard}>
                  <div style={{ fontSize: 26, marginBottom: 10 }}>{tip.icon}</div>
                  <div style={{ fontSize: 14, fontWeight: "bold", color: T.gold, fontFamily: "sans-serif", marginBottom: 8 }}>{tip.title}</div>
                  <div style={{ fontSize: 13, color: T.sub, fontFamily: "sans-serif", lineHeight: 1.6 }}>{tip.tip}</div>
                </div>
              ))}
            </div>
            <div style={{ ...s.card, marginTop: 20, background: T.goldBg, border: `1px solid rgba(201,168,76,0.25)` }}>
              <div style={{ fontSize: 14, color: T.gold, fontFamily: "sans-serif", fontWeight: "bold", marginBottom: 8 }}>🌟 Bahrain Fun Facts</div>
              {["Bahrain means 'Two Seas' in Arabic, referring to its freshwater springs among saltwater.",
                "The pearl industry made Bahrain famous for centuries — still celebrated today.",
                "Bahrain is one of the most tolerant and cosmopolitan countries in the Gulf.",
                "The Tree of Life is 400 years old with no nearby water source — a true mystery.",
                "Bahrain was the first Gulf country to discover oil, in 1932."].map((fact, i, arr) => (
                <div key={i} style={{ fontSize: 13, color: T.sub, fontFamily: "sans-serif", padding: "6px 0", borderBottom: i < arr.length-1 ? `1px solid ${T.border}` : "none", lineHeight: 1.5 }}>• {fact}</div>
              ))}
            </div>
          </>
        )}

      </div>
    </div>
  );

  return null;
}