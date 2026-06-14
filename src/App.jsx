import React, { useState, useRef, useEffect } from "react";

// ─── MARKDOWN RENDERER ────────────────────────────────────────────────────────
// Converts **bold**, *italic* and newlines from AI responses into proper JSX
const renderMarkdown = (text) => {
  if (!text) return null;
  return text.split('\n').map((line, li, arr) => {
    const parts = [];
    const regex = /\*\*(.+?)\*\*|\*(.+?)\*/g;
    let last = 0, match;
    while ((match = regex.exec(line)) !== null) {
      if (match.index > last) parts.push(line.slice(last, match.index));
      if (match[1]) parts.push(<strong key={match.index} style={{ fontWeight: "bold" }}>{match[1]}</strong>);
      else if (match[2]) parts.push(<em key={match.index}>{match[2]}</em>);
      last = match.index + match[0].length;
    }
    if (last < line.length) parts.push(line.slice(last));
    return <span key={li}>{parts}{li < arr.length - 1 && <br />}</span>;
  });
};

const CATEGORY_STYLE = {
  Heritage:  { gradient: "linear-gradient(135deg,#6b4c11,#C9A84C)", icon: "🏰" },
  Religious: { gradient: "linear-gradient(135deg,#0d3b6e,#00B4D8)", icon: "🕌" },
  Culture:   { gradient: "linear-gradient(135deg,#3b1a6e,#9b59b6)", icon: "🏛️" },
  Modern:    { gradient: "linear-gradient(135deg,#0d2b4e,#2980b9)", icon: "🏙️" },
  Shopping:  { gradient: "linear-gradient(135deg,#5a1a0d,#e74c3c)", icon: "🛍️" },
  Nature:    { gradient: "linear-gradient(135deg,#0d3b1a,#27ae60)", icon: "🌿" },
  Family:    { gradient: "linear-gradient(135deg,#3b2a0d,#f39c12)", icon: "👨‍👩‍👧" },
  Luxury:    { gradient: "linear-gradient(135deg,#1a0d3b,#8e44ad)", icon: "💎" },
  Leisure:   { gradient: "linear-gradient(135deg,#0d2b2b,#16a085)", icon: "🚶" },
  Adventure:  { gradient: "linear-gradient(135deg,#1a3b0d,#e67e22)", icon: "🪂" },
  default:   { gradient: "linear-gradient(135deg,#0D1B2A,#1a3a5a)", icon: "📍" },
};

const BAHRAIN_ATTRACTIONS = [
  { name: "Bahrain Fort (Qal'at al-Bahrain)", category: "Heritage", crowd: "low", lat: 26.2348, lng: 50.5106, desc: "UNESCO World Heritage Site, ancient fortress" },
  { name: "Al Fateh Grand Mosque", category: "Religious", crowd: "medium", lat: 26.2141, lng: 50.5998, desc: "One of the largest mosques in the world" },
  { name: "Bahrain National Museum", category: "Culture", crowd: "low", lat: 26.2285, lng: 50.6089, desc: "Explores 6,000 years of Bahraini history" },
  { name: "Bahrain World Trade Center", category: "Modern", crowd: "medium", lat: 26.2154, lng: 50.5944, desc: "Iconic twin towers with wind turbines" },
  { name: "Bahrain Financial Harbour", category: "Modern", crowd: "low", lat: 26.2354, lng: 50.5867, desc: "Stunning waterfront towers" },
  { name: "Bab Al Bahrain Souk", category: "Shopping", crowd: "high", lat: 26.2233, lng: 50.5842, desc: "Traditional market with gold, spices, and pearls" },
  { name: "Tree of Life", category: "Nature", crowd: "low", lat: 25.9942, lng: 50.5826, desc: "400-year-old mesquite tree in the desert" },
  { name: "Lost Paradise of Dilmun Water Park", category: "Family", crowd: "high", lat: 26.2003, lng: 50.4939, desc: "Bahrain's largest water park" },
  { name: "Amwaj Islands", category: "Luxury", crowd: "low", lat: 26.2706, lng: 50.6428, desc: "Upscale artificial islands with marina" },
  { name: "Riffa Fort", category: "Heritage", crowd: "low", lat: 26.1208, lng: 50.5551, desc: "19th century hilltop fort" },
  { name: "Al Areen Wildlife Park", category: "Nature", crowd: "low", lat: 26.0175, lng: 50.5081, desc: "Arabian wildlife and oryx sanctuary" },
  { name: "Manama Corniche", category: "Leisure", crowd: "medium", lat: 26.2285, lng: 50.5932, desc: "Beautiful waterfront promenade" },
  { name: "Muharraq Pearling Path", category: "Heritage", crowd: "low", lat: 26.2627, lng: 50.6200, desc: "UNESCO-listed pearl merchant houses" },
  { name: "Adhari Park", category: "Family", crowd: "high", lat: 26.1906, lng: 50.4886, desc: "Amusement park with rides and games" },
  { name: "Bahrain International Circuit", category: "Modern", crowd: "varies", lat: 26.0321, lng: 50.5108, desc: "Formula 1 racing circuit with tours" },
  { name: "The Avenues Bahrain", category: "Shopping", crowd: "high", lat: 26.2044, lng: 50.5257, desc: "Bahrain's largest mall with 500+ stores and dining" },
  { name: "City Centre Bahrain", category: "Shopping", crowd: "high", lat: 26.2352, lng: 50.5558, desc: "Premium waterfront mall in Manama" },
  { name: "Arad Fort", category: "Heritage", crowd: "low", lat: 26.2445, lng: 50.6571, desc: "15th-century Portuguese-era fort in Muharraq" },
  { name: "Dragon City", category: "Shopping", crowd: "medium", lat: 26.1539, lng: 50.4956, desc: "Massive Chinese wholesale market and entertainment hub" },
  { name: "Mall of Dilmunia", category: "Shopping", crowd: "medium", lat: 26.2711, lng: 50.5633, desc: "Modern mall on Dilmunia Island with sea views" },
  { name: "Gravity Indoor Skydiving", category: "Adventure", crowd: "medium", lat: 26.2167, lng: 50.5500, desc: "Bahrain's only indoor skydiving wind tunnel experience" },
  { name: "Juffair Square", category: "Leisure", crowd: "high", lat: 26.2044, lng: 50.6068, desc: "Vibrant dining and nightlife district popular with expats" },
  { name: "Al Dar Islands", category: "Nature", crowd: "low", lat: 25.8703, lng: 50.5503, desc: "Pristine private islands with snorkelling and beach clubs" },
];

const MOODS = [
  { id: "adventure", label: "Adventure", icon: "🏔️", desc: "Thrills & exploration" },
  { id: "relaxation", label: "Relaxation", icon: "🌅", desc: "Peaceful & serene" },
  { id: "culture", label: "Culture", icon: "🏛️", desc: "History & heritage" },
  { id: "luxury", label: "Luxury", icon: "💎", desc: "Premium experiences" },
  { id: "family", label: "Family", icon: "👨‍👩‍👧", desc: "Fun for everyone" },
  { id: "hungry", label: "Foodie", icon: "🍽️", desc: "Culinary adventure" },
];

const BUDGETS = [
  { id: "budget", label: "Budget", range: "Under BD 20/day" },
  { id: "mid", label: "Mid-Range", range: "BD 20–60/day" },
  { id: "premium", label: "Premium", range: "BD 60–150/day" },
  { id: "luxury", label: "Luxury", range: "BD 150+/day" },
];

const TRANSLATIONS = {
  "Hello": "مرحباً (Marhaba)",
  "Thank you": "شكراً (Shukran)",
  "Where is...?": "أين...؟ (Ayn...?)",
  "How much?": "بكم؟ (Bikam?)",
  "Good morning": "صباح الخير (Sabah al-khayr)",
  "Please": "من فضلك (Min fadlik)",
  "Excuse me": "عفواً (Afwan)",
  "Halal food": "طعام حلال (Ta'am halal)",
  "Airport": "المطار (Al-matar)",
  "Hotel": "فندق (Funduq)",
  "Mosque": "مسجد (Masjid)",
  "Museum": "متحف (Mathaf)",
};

const CULTURAL_TIPS = [
  { icon: "👗", title: "Dress Code", tip: "Dress modestly in public places. Cover shoulders and knees, especially when visiting mosques or souks." },
  { icon: "🙏", title: "Greeting", tip: "A common greeting is 'As-salamu alaykum' (Peace be upon you). Reply with 'Wa alaykum as-salam'." },
  { icon: "🍴", title: "Dining Etiquette", tip: "Eat with your right hand. It's polite to accept food or drink when offered. Pork is not available at most restaurants." },
  { icon: "📷", title: "Photography", tip: "Always ask permission before photographing people, especially women. Avoid photographing government buildings." },
  { icon: "🕌", title: "Prayer Times", tip: "Shops may close briefly during the 5 daily prayers. Avoid loud behavior near mosques during prayer time." },
  { icon: "🤝", title: "Business Culture", tip: "Meetings often start with tea/coffee. Relationships are built before business. Punctuality is respected." },
  { icon: "🌙", title: "Ramadan", tip: "During Ramadan, avoid eating or drinking in public during daylight hours out of respect for those fasting." },
  { icon: "💬", title: "Language", tip: "Arabic is official but English is widely spoken. Even a few Arabic words will be warmly received." },
];

const HIDDEN_GEMS = [
  {
    name: "Rashid's Cafeteria",
    category: "☕ Café",
    area: "Muharraq",
    desc: "A no-frills neighbourhood spot beloved by locals for decades. Proper karak chai, fresh samboosa, and breakfast rolls that put hotel buffets to shame.",
    why: "The karak here has its own cult following — regulars say nowhere else in Bahrain gets the cardamom ratio right.",
    bestTime: "6–9 AM for fresh bread, or 4 PM tea rush",
    vibe: "🧡 Local legend"
  },
  {
    name: "Al Jasra Handicraft Centre",
    category: "🛍️ Shop",
    area: "Al Jasra",
    desc: "A living heritage workshop where you can watch artisans weave traditional Bahraini baskets, pottery, and dhow models — and buy directly from the makers.",
    why: "One of the few places left where traditional crafts are still practiced and sold authentically, not mass-produced.",
    bestTime: "Morning weekdays when artisans are most active",
    vibe: "🎨 Authentic craft"
  },
  {
    name: "Dar Kulaib Beach",
    category: "🏖️ Beach",
    area: "Northern Bahrain",
    desc: "A quiet, uncrowded stretch of sandy beach away from the resort crowds. Crystal clear water, zero vendors, and stunning sunset views across the Gulf.",
    why: "While tourists pile into resort beaches, locals come here. Practically deserted on weekdays.",
    bestTime: "Late afternoon for golden hour — best sunset in Bahrain",
    vibe: "🌅 Sunset paradise"
  },
  {
    name: "Janabiya Farm Trail",
    category: "🌿 Nature",
    area: "Janabiya",
    desc: "A peaceful walking trail through date palm groves and traditional Bahraini farms. The air smells of earth and greenery — a total contrast to the city.",
    why: "Most visitors never leave the capital. This 30-minute drive reveals Bahrain's agricultural soul, hidden in plain sight.",
    bestTime: "Early morning in cooler months (Nov–Mar)",
    vibe: "🌴 Off the beaten path"
  },
  {
    name: "Bu Maher Fort Waterfront",
    category: "🏰 Hidden Heritage",
    area: "Muharraq",
    desc: "A small, rarely-visited Ottoman-era fort at the very tip of Muharraq island, surrounded by sea on three sides. Almost no tourists ever find it.",
    why: "Genuinely overlooked — no gift shop, no crowds, just raw history and panoramic Gulf views.",
    bestTime: "Sunset — the light on the old stone is extraordinary",
    vibe: "🗺️ Explorer's find"
  },
  {
    name: "Adliya Art District Cafés",
    category: "☕ Café",
    area: "Adliya",
    desc: "A cluster of independent coffee shops and galleries in converted Bahraini houses. Think specialty coffee, local art on the walls, and genuine creative energy.",
    why: "Adliya is Bahrain's creative heartbeat — Instagrammable but not touristy, beloved by the local arts scene.",
    bestTime: "Evenings when the galleries open and the streets come alive",
    vibe: "🎭 Creative hub"
  },
  {
    name: "Arad Bay Waterfront Walk",
    category: "🚶 Leisure",
    area: "Muharraq",
    desc: "A breezy seaside promenade lined with palm trees, facing Arad Fort. Far less crowded than the Manama Corniche, with better views and fresher air.",
    why: "Locals' favourite evening walk — you'll see families, joggers, and fishermen, but almost no tourists.",
    bestTime: "After 6 PM when the heat breaks and the fort lights up",
    vibe: "🌊 Local favourite"
  },
  {
    name: "Friday Market (Souk Al Juma'a)",
    category: "🛍️ Shop",
    area: "Sitra",
    desc: "A sprawling weekly market where Bahrainis sell antiques, plants, birds, spices, and miscellaneous treasures. Totally unpolished and completely real.",
    why: "This is where Bahrainis actually shop — not the sanitised tourist souk. Bargaining is expected and everything is cheap.",
    bestTime: "Friday morning from 6–10 AM before it gets too hot",
    vibe: "🏺 Raw & real"
  },
  {
    name: "Al Bandar Beach",
    category: "🏖️ Beach",
    area: "Sakhir",
    desc: "A calm, shallow beach popular with Bahraini families. The water is incredibly warm and clear, with a long sandy shore and basic shaded seating.",
    why: "Families bring their kids here — the shallow water extends far out, making it safe and ideal for a genuine local beach day.",
    bestTime: "Weekday mornings for a quiet visit",
    vibe: "👨‍👩‍👧 Family favourite"
  },
  {
    name: "Old Manama Textile Souk",
    category: "🛍️ Shop",
    area: "Manama Old Town",
    desc: "Tucked behind Bab Al Bahrain, the old textile alleys sell fabrics, abayas, thobes, and tailoring services at a fraction of mall prices.",
    why: "Disappearing fast as the city modernises. The tailors here can make a custom thobe overnight — a dying skill.",
    bestTime: "Morning, avoid Fridays when many shops close for prayer",
    vibe: "⏳ Vanishing tradition"
  },
  {
    name: "Tubli Bay Mangroves",
    category: "🌿 Nature",
    area: "Tubli",
    desc: "Bahrain's only surviving mangrove forest — a quiet ecological wonder you can kayak or walk beside. Home to migratory birds and marine life.",
    why: "Almost no tourists know it exists. An unlikely pocket of wild nature minutes from the capital.",
    bestTime: "Early morning for birds and calm water",
    vibe: "🦅 Ecological secret"
  },
  {
    name: "Halwa House",
    category: "Heritage", // Matches CATEGORY_STYLE keys perfectly
    area: "Manama",
    desc: "A heritage sweet shop serving traditional Bahraini halwa...",
    why: "Halwa is Bahrain's most iconic sweet...",
    bestTime: "Any time — always fresh, always perfect",
    vibe: "🍯 Taste of history"
  },
];

const HOTELS = {
  budget: [
    { name: "Gulf Pearl Hotel", area: "Manama Centre", price: "BD 18–28/night", stars: 3, highlight: "Walking distance to Bab Al Bahrain souk", icon: "🏨" },
    { name: "Al Hayat Hotel", area: "Muharraq", price: "BD 15–25/night", stars: 3, highlight: "Near Muharraq Pearling Path, great local cafés nearby", icon: "🏨" },
    { name: "City Centre Hotel", area: "Juffair", price: "BD 20–30/night", stars: 3, highlight: "Budget-friendly with easy access to nightlife strip", icon: "🏨" },
  ],
  mid: [
    { name: "Novotel Bahrain Al Dana Resort", area: "Manama Seafront", price: "BD 45–70/night", stars: 4, highlight: "Private beach, sea views, excellent breakfast buffet", icon: "🏩" },
    { name: "Mercure Grand Hotel Seef", area: "Seef District", price: "BD 40–65/night", stars: 4, highlight: "Close to City Centre Mall, modern rooms, rooftop pool", icon: "🏩" },
    { name: "Ramada by Wyndham Manama", area: "Manama", price: "BD 35–55/night", stars: 4, highlight: "Central location, reliable mid-range comfort", icon: "🏩" },
  ],
  premium: [
    { name: "Gulf Hotel Bahrain", area: "Adliya", price: "BD 80–130/night", stars: 5, highlight: "Bahrain's most iconic hotel, 12 restaurants, stunning pool", icon: "🏰" },
    { name: "Sofitel Bahrain Zallaq Thalassa", area: "Zallaq Beach", price: "BD 90–140/night", stars: 5, highlight: "Private beach, French-inspired luxury, spa & thalasso centre", icon: "🏰" },
    { name: "Radisson Blu Hotel", area: "Diplomatic Area", price: "BD 75–120/night", stars: 5, highlight: "Stunning harbour views, large pool, great business location", icon: "🏰" },
  ],
  luxury: [
    { name: "Four Seasons Hotel Bahrain Bay", area: "Bahrain Bay", price: "BD 180–350/night", stars: 5, highlight: "Iconic twin-island resort, infinity pool over the Bay, world-class spa", icon: "👑" },
    { name: "The Ritz-Carlton Bahrain", area: "Manama Seafront", price: "BD 200–400/night", stars: 5, highlight: "Private beach, butler service, legendary afternoon tea", icon: "👑" },
    { name: "Jumeirah Gulf of Bahrain Resort", area: "Zallaq", price: "BD 160–320/night", stars: 5, highlight: "Overwater villas, pristine beach, exceptional Arabic dining", icon: "👑" },
  ],
};

function HotelRecommendations({ budget }) {
  const budgetKey = budget === "luxury" ? "luxury" : budget === "premium" ? "premium" : budget === "mid" ? "mid" : "budget";
  const hotels = HOTELS[budgetKey] || HOTELS.budget;
  const tierLabel = { budget: "Budget-Friendly Stays", mid: "Mid-Range Hotels", premium: "Premium Hotels", luxury: "Luxury Resorts" }[budgetKey];
  const tierColor = { budget: "0,180,216", mid: "46,213,115", premium: "201,168,76", luxury: "255,159,67" }[budgetKey];
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 14, color: `rgb(${tierColor})`, fontFamily: "sans-serif", fontWeight: "bold", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
        🛏️ {tierLabel} <span style={{ fontSize: 11, color: "#7db5cc", fontWeight: "normal" }}>— matched to your budget</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        {hotels.map((h, i) => (
          <div key={i} style={{ background: `rgba(${tierColor},0.06)`, border: `1px solid rgba(${tierColor},0.25)`, borderRadius: 12, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
              <div style={{ fontSize: 14, fontWeight: "bold", color: "#F0EDE6", fontFamily: "sans-serif", flex: 1 }}>{h.icon} {h.name}</div>
              <div style={{ fontSize: 12, color: "#C9A84C", fontFamily: "sans-serif", marginLeft: 8 }}>{"⭐".repeat(Math.min(h.stars,5))}</div>
            </div>
            <div style={{ fontSize: 11, color: "#7db5cc", fontFamily: "sans-serif", marginBottom: 6 }}>📍 {h.area}</div>
            <div style={{ fontSize: 12, color: `rgb(${tierColor})`, fontFamily: "sans-serif", fontWeight: "bold", marginBottom: 8 }}>{h.price}</div>
            <div style={{ fontSize: 11, color: "#a0b8c8", fontFamily: "sans-serif", lineHeight: 1.5 }}>✦ {h.highlight}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GemsList() {
  const [filterCat, setFilterCat] = React.useState("All");

  React.useEffect(() => {
    const handler = () => setFilterCat(window._gemCat || "All");
    document.addEventListener("gemfilter", handler);
    return () => document.removeEventListener("gemfilter", handler);
  }, []);

  const filtered = filterCat === "All" ? HIDDEN_GEMS : HIDDEN_GEMS.filter(g => g.category === filterCat);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
      {filtered.map((gem, i) => (
        <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 16, overflow: "hidden" }}>
          {(() => {
            const gemGradients = {
              "☕ Café": "linear-gradient(135deg,#3b1a0d,#c0392b)", "🏖️ Beach": "linear-gradient(135deg,#0d2b4e,#27ae60)",
              "🌿 Nature": "linear-gradient(135deg,#0d3b1a,#16a085)", "🛍️ Shop": "linear-gradient(135deg,#3b0d2b,#8e44ad)",
              "🏰 Hidden Heritage": "linear-gradient(135deg,#6b4c11,#C9A84C)", "🚶 Leisure": "linear-gradient(135deg,#0d2b3b,#2980b9)",
              "☕ Café & Sweet Shop": "linear-gradient(135deg,#3b2a0d,#e67e22)", default: "linear-gradient(135deg,#0D1B2A,#1a3a5a)",
            };
            const gemIcons = {
              "☕ Café":"☕","🏖️ Beach":"🏖️","🌿 Nature":"🌿","🛍️ Shop":"🛍️",
              "🏰 Hidden Heritage":"🏰","🚶 Leisure":"🚶","☕ Café & Sweet Shop":"🍯",default:"💎",
            };
            const g = gemGradients[gem.category] || gemGradients.default;
            const ic = gemIcons[gem.category] || gemIcons.default;
            return (
              <div style={{ height: 150, background: g, borderRadius: "12px 12px 0 0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" }}>
                <div style={{ fontSize: 52, filter: "drop-shadow(0 2px 10px rgba(0,0,0,0.5))" }}>{ic}</div>
                <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(13,27,42,0.8)", borderRadius: 20, padding: "4px 10px", fontSize: 11, color: "#C9A84C", fontFamily: "sans-serif" }}>{gem.category}</div>
                <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(13,27,42,0.8)", borderRadius: 20, padding: "4px 10px", fontSize: 11, color: "#7db5cc", fontFamily: "sans-serif" }}>📍 {gem.area}</div>
              </div>
            );
          })()}
          <div style={{ padding: 16 }}>
            <div style={{ fontSize: 15, fontWeight: "bold", color: "#F0EDE6", fontFamily: "sans-serif", marginBottom: 6 }}>{gem.name}</div>
            <div style={{ fontSize: 12, color: "#a0b8c8", fontFamily: "sans-serif", lineHeight: 1.6, marginBottom: 10 }}>{gem.desc}</div>
            <div style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 8, padding: "8px 12px", marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: "#C9A84C", fontFamily: "sans-serif", marginBottom: 3 }}>✨ WHY IT'S SPECIAL</div>
              <div style={{ fontSize: 12, color: "#F0EDE6", fontFamily: "sans-serif", lineHeight: 1.5 }}>{gem.why}</div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 10, background: "rgba(0,180,216,0.1)", color: "#00B4D8", fontFamily: "sans-serif" }}>
                🕐 {gem.bestTime}
              </span>
              <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 10, background: "rgba(255,255,255,0.06)", color: "#a0b8c8", fontFamily: "sans-serif" }}>
                {gem.vibe}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function PearlyPathAI() {
  const [screen, setScreen] = useState("home");
  const [mood, setMood] = useState(null);
  const [budget, setBudget] = useState(null);
  const [duration, setDuration] = useState(1);
  const [interests, setInterests] = useState([]);
  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("itinerary");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [transInput, setTransInput] = useState("");
  const [transResult, setTransResult] = useState("");
  const [transLoading, setTransLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const interestOptions = ["History", "Food", "Shopping", "Nature", "Architecture", "Sports", "Nightlife", "Art", "Pearl Heritage", "Water Activities"];

  const extractAIText = (data) => {
    if (!data) return "";
    if (typeof data === "string") return data;
    if (Array.isArray(data)) return data.map(extractAIText).join("");
    if (typeof data.content === "string") return data.content;
    if (Array.isArray(data.content)) {
      return data.content.map(item => {
        if (!item) return "";
        if (typeof item === "string") return item;
        if (typeof item.text === "string") return item.text;
        if (typeof item.content === "string") return item.content;
        if (typeof item.message?.content === "string") return item.message.content;
        return "";
      }).join("");
    }
    if (Array.isArray(data.choices)) {
      return data.choices.map(choice => {
        if (!choice) return "";
        if (typeof choice.text === "string") return choice.text;
        if (typeof choice.message?.content === "string") return choice.message.content;
        if (choice.delta) return extractAIText(choice.delta);
        return "";
      }).join("");
    }
    if (typeof data.text === "string") return data.text;
    if (typeof data.output_text === "string") return data.output_text;
    if (Array.isArray(data.output?.[0]?.content)) return extractAIText(data.output[0].content);
    if (typeof data.output?.[0]?.content === "string") return data.output[0].content;
    return "";
  };

  const toggleInterest = (i) => {
    setInterests(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  };

  const generateItinerary = async () => {
    if (!mood || !budget) return;
    setLoading(true);
    setItinerary(null);

    const names = BAHRAIN_ATTRACTIONS.map(a => a.name).join(",");
    const interestStr = interests.length > 0 ? interests.join(",") : "general";
    const moodExtra = mood === "hungry" ? "Focus on restaurants,food markets,local eateries,food tours,halwa shops,karak cafes." :
                      mood === "adventure" ? "Include Gravity Indoor Skydiving,Al Dar Islands,active outdoor spots,Adliya/Juffair evenings." :
                      mood === "relaxation" ? "Prioritise beaches,spas,quiet nature spots,calm waterfront walks." :
                      mood === "culture" ? "Prioritise heritage sites,museums,pearling path,mosques,traditional souks." :
                      mood === "luxury" ? "Prioritise Four Seasons,Ritz-Carlton,Amwaj Islands,fine dining,upscale experiences." :
                      mood === "family" ? "Prioritise Dilmun Water Park,Adhari Park,Al Areen Wildlife,family beaches." : "";

    const callAPI = async (prompt) => {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 600,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || data?.error || res.statusText || "API error");
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
      const metaPrompt = `Bahrain trip: ${duration} days, mood:${mood}, budget:${budget}, interests:${interestStr}. ${moodExtra}
Return ONLY raw JSON: {"summary":"1 engaging sentence about this trip","total_budget_estimate":"BDX-Y per day","crowd_warning":"one practical tip","best_time":"short advice"}`;
      const metaText = await callAPI(metaPrompt);
      const meta = parseJSON(metaText);

      const days = [];
      for (let d = 1; d <= duration; d++) {
        const usedPlaces = days.map(day =>
          [day.morning?.place, day.afternoon?.place, day.evening?.place].filter(Boolean)
        ).flat();
        const avoidStr = usedPlaces.length > 0 ? `Avoid repeating: ${usedPlaces.join(",")}.` : "";

        const dayPrompt = `Bahrain Day ${d} of ${duration}. Mood:${mood} Budget:${budget} Interests:${interestStr}. ${moodExtra} ${avoidStr}
Pick from: ${names}
Return ONLY raw JSON (no backticks): {"day":${d},"theme":"3 vivid words","morning":{"time":"9:00 AM","place":"exact name","activity":"what to do here","duration":"2 hrs","cost":"BD X"},"afternoon":{"time":"1:00 PM","place":"exact name","activity":"what to do here","duration":"2 hrs","cost":"BD X"},"evening":{"time":"7:00 PM","place":"exact name","activity":"what to do here","duration":"2 hrs","cost":"BD X"},"food_tip":"specific local dish or restaurant","transport_tip":"how to get around","hidden_gem":"one off-the-beaten-path tip"}`;

        const dayText = await callAPI(dayPrompt);
        const dayData = parseJSON(dayText);
        days.push(dayData);

        setItinerary({ ...meta, days: [...days], partial: d < duration });
        if (d === 1) setScreen("results");
      }

      setItinerary({ ...meta, days, partial: false });
    } catch (e) {
      setItinerary(prev => prev?.days?.length > 0
        ? { ...prev, partial: false, crowd_warning: prev.crowd_warning }
        : { error: `Generation failed: ${e.message}. Please try again.` }
      );
      setScreen("results");
    }
    setLoading(false);
  };

  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setChatLoading(true);

    const history = [...chatMessages, { role: "user", content: userMsg }];
    const systemCtx = `PearlyPath AI Bahrain guide. Answer tourism questions in 2-3 sentences max. Be specific and practical. Mood:${mood||"?"} Budget:${budget||"?"}.`;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 800,
          system: systemCtx,
          messages: history.slice(-10),
        }),
      });
      const data = await res.json();
      const reply = data.content.map(b => b.text || "").join("");
      setChatMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch (e) {
      setChatMessages(prev => [...prev, { role: "assistant", content: "Sorry, I couldn't connect. Please try again." }]);
    }
    setChatLoading(false);
  };

  const translateText = async () => {
    if (!transInput.trim()) return;
    setTransLoading(true);
    setTransResult("");

    const preset = TRANSLATIONS[transInput.trim()];
    if (preset) { setTransResult(preset); setTransLoading(false); return; }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 300,
          messages: [{ role: "user", content: `Translate this to Arabic for a tourist in Bahrain. Provide: the Arabic script, the transliteration, and a usage tip. Keep it brief (3 lines max): "${transInput}"` }],
        }),
      });
      const data = await res.json();
      setTransResult(data.content.map(b => b.text || "").join(""));
    } catch {
      setTransResult("Translation unavailable. Please try again.");
    }
    setTransLoading(false);
  };

  const s = {
    app: { fontFamily: "'Georgia', serif", background: "#0D1B2A", minHeight: "100vh", color: "#F0EDE6" },
    header: { background: "rgba(13,27,42,0.95)", borderBottom: "1px solid rgba(201,168,76,0.3)", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 },
    logo: { display: "flex", alignItems: "center", gap: 10 },
    logoText: { fontSize: 18, fontWeight: "bold", color: "#C9A84C", letterSpacing: 1 },
    logoSub: { fontSize: 11, color: "#7db5cc", fontFamily: "sans-serif", letterSpacing: 2 },
    navBtn: { background: "none", border: "1px solid rgba(201,168,76,0.4)", color: "#C9A84C", padding: "6px 14px", borderRadius: 20, cursor: "pointer", fontSize: 13, fontFamily: "sans-serif" },
    hero: { textAlign: "center", padding: "60px 20px 40px", background: "linear-gradient(180deg, #0D1B2A 0%, #0a2240 100%)" },
    heroTitle: { fontSize: "clamp(28px, 6vw, 52px)", color: "#C9A84C", letterSpacing: 3, marginBottom: 12, textShadow: "0 0 30px rgba(201,168,76,0.3)" },
    heroSub: { fontSize: 16, color: "#7db5cc", fontFamily: "sans-serif", marginBottom: 8, letterSpacing: 1 },
    heroDesc: { fontSize: 14, color: "#a0b8c8", fontFamily: "sans-serif", maxWidth: 500, margin: "0 auto 32px", lineHeight: 1.7 },
    primaryBtn: { background: "linear-gradient(135deg, #C9A84C, #a8892f)", color: "#0D1B2A", border: "none", padding: "14px 36px", borderRadius: 30, fontSize: 16, fontWeight: "bold", cursor: "pointer", letterSpacing: 1, fontFamily: "sans-serif" },
    card: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 16, padding: "20px", marginBottom: 16 },
    section: { padding: "20px 16px" },
    sectionTitle: { fontSize: 20, color: "#C9A84C", marginBottom: 4, letterSpacing: 1 },
    sectionSub: { fontSize: 13, color: "#7db5cc", fontFamily: "sans-serif", marginBottom: 20 },
    moodGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12 },
    moodCard: (selected) => ({ background: selected ? "rgba(201,168,76,0.2)" : "rgba(255,255,255,0.04)", border: `1px solid ${selected ? "#C9A84C" : "rgba(255,255,255,0.1)"}`, borderRadius: 12, padding: "14px 10px", textAlign: "center", cursor: "pointer", transition: "all 0.2s" }),
    moodEmoji: { fontSize: 26, marginBottom: 6 },
    moodLabel: { fontSize: 13, fontWeight: "bold", color: "#F0EDE6", fontFamily: "sans-serif" },
    moodDesc: { fontSize: 11, color: "#7db5cc", fontFamily: "sans-serif", marginTop: 4 },
    budgetGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
    budgetCard: (selected) => ({ background: selected ? "rgba(0,180,216,0.15)" : "rgba(255,255,255,0.04)", border: `1px solid ${selected ? "#00B4D8" : "rgba(255,255,255,0.1)"}`, borderRadius: 12, padding: "14px", cursor: "pointer", transition: "all 0.2s" }),
    budgetLabel: { fontSize: 14, fontWeight: "bold", color: "#F0EDE6", fontFamily: "sans-serif" },
    budgetRange: { fontSize: 12, color: "#7db5cc", fontFamily: "sans-serif", marginTop: 4 },
    durationRow: { display: "flex", alignItems: "center", gap: 16 },
    durationBtn: (active) => ({ width: 40, height: 40, borderRadius: "50%", border: `1px solid ${active ? "#C9A84C" : "rgba(255,255,255,0.2)"}`, background: active ? "rgba(201,168,76,0.2)" : "none", color: "#F0EDE6", cursor: "pointer", fontSize: 14, fontFamily: "sans-serif" }),
    interestChip: (sel) => ({ display: "inline-block", padding: "7px 16px", margin: "4px 6px 4px 0", borderRadius: 20, border: `1px solid ${sel ? "#C9A84C" : "rgba(255,255,255,0.2)"}`, background: sel ? "rgba(201,168,76,0.15)" : "rgba(255,255,255,0.04)", cursor: "pointer", fontSize: 13, color: sel ? "#C9A84C" : "#a0b8c8", fontFamily: "sans-serif", transition: "all 0.2s" }),
    genBtn: (active) => ({ width: "100%", padding: "16px", borderRadius: 30, border: "none", background: active ? "linear-gradient(135deg, #C9A84C, #a8892f)" : "#333", color: active ? "#0D1B2A" : "#666", fontSize: 16, fontWeight: "bold", cursor: active ? "pointer" : "not-allowed", fontFamily: "sans-serif", letterSpacing: 1 }),
    tabs: { display: "flex", borderBottom: "1px solid rgba(201,168,76,0.2)", overflowX: "auto" },
    tab: (active) => ({ padding: "12px 18px", background: "none", border: "none", borderBottom: active ? "2px solid #C9A84C" : "2px solid transparent", color: active ? "#C9A84C" : "#7db5cc", cursor: "pointer", fontSize: 13, fontFamily: "sans-serif", whiteSpace: "nowrap", letterSpacing: 0.5 }),
    dayCard: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(0,180,216,0.2)", borderRadius: 16, marginBottom: 20, overflow: "hidden" },
    dayHeader: { background: "rgba(0,180,216,0.1)", padding: "14px 20px", borderBottom: "1px solid rgba(0,180,216,0.15)", display: "flex", alignItems: "center", justifyContent: "space-between" },
    dayTitle: { fontSize: 16, color: "#00B4D8", fontWeight: "bold", fontFamily: "sans-serif" },
    dayTheme: { fontSize: 12, color: "#7db5cc", fontFamily: "sans-serif" },
    timeSlot: { padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)" },
    timeLabel: { fontSize: 11, color: "#C9A84C", fontFamily: "sans-serif", letterSpacing: 1, marginBottom: 4 },
    placeName: { fontSize: 15, color: "#F0EDE6", fontWeight: "bold", fontFamily: "sans-serif" },
    activityText: { fontSize: 13, color: "#a0b8c8", fontFamily: "sans-serif", marginTop: 4, lineHeight: 1.5 },
    infoRow: { display: "flex", gap: 12, marginTop: 8 },
    badge: (color) => ({ fontSize: 11, padding: "3px 10px", borderRadius: 10, background: `rgba(${color},0.15)`, color: `rgb(${color})`, fontFamily: "sans-serif" }),
    gemBox: { background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 8, padding: "10px 14px", margin: "12px 20px", fontSize: 12, color: "#C9A84C", fontFamily: "sans-serif" },
    tipBox: { padding: "12px 20px", background: "rgba(0,180,216,0.06)" },
    tipText: { fontSize: 12, color: "#7db5cc", fontFamily: "sans-serif", lineHeight: 1.6 },
    summaryCard: { background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 12, padding: "16px 20px", marginBottom: 20 },
    summaryText: { fontSize: 14, color: "#F0EDE6", fontFamily: "sans-serif", lineHeight: 1.7 },
    chatContainer: { display: "flex", flexDirection: "column", height: "60vh", minHeight: 400 },
    chatMessages: { flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 12 },
    userMsg: { alignSelf: "flex-end", background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: "16px 16px 4px 16px", padding: "10px 14px", maxWidth: "80%", fontSize: 13, fontFamily: "sans-serif", color: "#F0EDE6", lineHeight: 1.5 },
    botMsg: { alignSelf: "flex-start", background: "rgba(0,180,216,0.08)", border: "1px solid rgba(0,180,216,0.2)", borderRadius: "16px 16px 16px 4px", padding: "10px 14px", maxWidth: "85%", fontSize: 13, fontFamily: "sans-serif", color: "#F0EDE6", lineHeight: 1.5 },
    chatInput: { display: "flex", gap: 8, padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.1)" },
    textInput: { flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 24, padding: "10px 16px", color: "#F0EDE6", fontSize: 14, fontFamily: "sans-serif", outline: "none" },
    sendBtn: { background: "linear-gradient(135deg, #C9A84C, #a8892f)", border: "none", borderRadius: 24, padding: "10px 20px", color: "#0D1B2A", fontWeight: "bold", cursor: "pointer", fontSize: 13, fontFamily: "sans-serif" },
    attractionGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 },
    attractionCard: (crowd) => ({ background: "rgba(255,255,255,0.04)", border: `1px solid rgba(${crowd === "low" ? "46,213,115" : crowd === "high" ? "255,71,87" : "0,180,216"},0.25)`, borderRadius: 12, padding: 16, cursor: "pointer" }),
    crowdDot: (crowd) => ({ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: crowd === "low" ? "#2ed573" : crowd === "high" ? "#ff4757" : "#00B4D8", marginRight: 6 }),
    transBox: { background: "rgba(0,180,216,0.08)", border: "1px solid rgba(0,180,216,0.25)", borderRadius: 12, padding: "20px", marginTop: 20 },
    phraseChip: { display: "inline-block", padding: "6px 14px", margin: "4px", borderRadius: 20, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "#a0b8c8", fontSize: 12, cursor: "pointer", fontFamily: "sans-serif" },
    culturalGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 },
    culturalCard: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "16px" },
  };

  if (screen === "home") return (
    <div style={s.app}>
      <div style={s.header}>
        <div style={s.logo}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "radial-gradient(circle at 35% 35%, #fff 0%, #b8d4e8 40%, #6fa8c9 70%, #2d6a8a 100%)", boxShadow: "0 0 12px rgba(0,180,216,0.4)", border: "1px solid rgba(0,180,216,0.5)" }} />
          <div>
            <div style={s.logoText}>PearlyPath AI</div>
            <div style={s.logoSub}>YOUR AI GUIDE TO BAHRAIN</div>
          </div>
        </div>
      </div>
      <div style={s.hero}>
        <style>{`@keyframes pulse{0%,100%{box-shadow:0 0 12px rgba(0,180,216,0.5)}50%{box-shadow:0 0 32px rgba(0,180,216,0.9), 0 0 60px rgba(201,168,76,0.4)}}`}</style>
        <div style={{ width: 120, height: 120, margin: "0 auto 24px", display: "flex", alignItems: 'center', justifyContent: 'center', animation: "pulse 2.5s ease-in-out infinite", background: "white", borderRadius: "16px", padding: "8px", fontSize: '3.5rem' }}>🇧🇭</div>
        <div style={s.heroTitle}>PEARLYPATH AI</div>
        <div style={s.heroSub}>BAHRAIN'S MOST INTELLIGENT TOURISM COMPANION</div>
        <div style={s.heroDesc}>Personalized, AI-powered tourism for a smarter Bahrain. Discover hidden gems, beat the crowds, and explore like a local.</div>
        <button style={s.primaryBtn} onClick={() => setScreen("planner")}>Plan My Journey ✦</button>
      </div>
      <div style={{ padding: "30px 16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, maxWidth: 700, margin: "0 auto" }}>
          {[["🗺️","Smart Itinerary","AI plans your perfect day"],["🎭","Mood-Based","Match trips to your vibe"],["💎","Hidden Gems","Discover secret Bahrain"],["👥","Crowd Watch","Beat the tourist rush"],["🌐","Translator","Arabic-English help"],["🕌","Cultural Guide","Etiquette & heritage"]].map(([icon, title, desc]) => (
            <div key={title} style={s.card}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
              <div style={{ fontSize: 14, fontWeight: "bold", color: "#C9A84C", fontFamily: "sans-serif", marginBottom: 4 }}>{title}</div>
              <div style={{ fontSize: 12, color: "#7db5cc", fontFamily: "sans-serif", lineHeight: 1.5 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (screen === "planner") return (
    <div style={s.app}>
      <div style={s.header}>
        <div style={s.logo}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "radial-gradient(circle at 35% 35%, #fff 0%, #b8d4e8 40%, #6fa8c9 70%, #2d6a8a 100%)", padding: "3px" }} />
          <div style={s.logoText}>PearlyPath AI</div>
        </div>
        <button style={s.navBtn} onClick={() => setScreen("home")}>← Home</button>
      </div>
      <div style={s.section}>
        <div style={s.sectionTitle}>Plan Your Journey</div>
        <div style={s.sectionSub}>Tell us about your ideal Bahrain experience</div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 14, color: "#C9A84C", marginBottom: 12, fontFamily: "sans-serif" }}>What's your travel mood?</div>
          <div style={s.moodGrid}>
            {MOODS.map(m => (
              <div key={m.id} style={s.moodCard(mood === m.id)} onClick={() => setMood(m.id)}>
                <div style={s.moodEmoji}>{m.icon}</div>
                <div style={s.moodLabel}>{m.label}</div>
                <div style={s.moodCard(mood === m.id).color === "#C9A84C" ? {} : {}}>
                  <div style={s.moodLabel}>{m.label}</div>
                  <div style={s.moodDesc}>{m.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 14, color: "#C9A84C", marginBottom: 12, fontFamily: "sans-serif" }}>What's your daily budget?</div>
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
          <div style={{ fontSize: 14, color: "#C9A84C", marginBottom: 12, fontFamily: "sans-serif" }}>How many days?</div>
          <div style={s.durationRow}>
            {[1,2,3,4,5,6,7].map(d => (
              <button key={d} style={s.durationBtn(duration === d)} onClick={() => setDuration(d)}>{d}</button>
            ))}
            <span style={{ fontSize: 13, color: "#7db5cc", fontFamily: "sans-serif" }}>day{duration > 1 ? "s" : ""}</span>
          </div>
        </div>

        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 14, color: "#C9A84C", marginBottom: 12, fontFamily: "sans-serif" }}>Interests (optional)</div>
          <div>
            {interestOptions.map(i => (
              <span key={i} style={s.interestChip(interests.includes(i))} onClick={() => toggleInterest(i)}>{i}</span>
            ))}
          </div>
        </div>

        <button style={s.genBtn(!!mood && !!budget)} disabled={!mood || !budget || loading} onClick={generateItinerary}>
          {loading ? "✦ Building your itinerary — usually 10–20 seconds..." : "✦ Generate My Itinerary"}
        </button>
        {loading && (
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <div style={{ display: "inline-flex", gap: 6 }}>
              {["🗺️","🏛️","💎"].map((e, i) => (
                <span key={i} style={{ fontSize: 22, animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}>{e}</span>
              ))}
            </div>
            <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}`}</style>
            <div style={{ fontSize: 12, color: "#7db5cc", fontFamily: "sans-serif", marginTop: 8 }}>
              Building your Bahrain adventure day by day...
            </div>
          </div>
        )}
        {(!mood || !budget) && <div style={{ textAlign: "center", fontSize: 12, color: "#7db5cc", marginTop: 10, fontFamily: "sans-serif" }}>Select a mood and budget to continue</div>}
      </div>
    </div>
  );

  if (screen === "results") return (
    <div style={s.app}>
      <div style={s.header}>
        <div style={s.logo}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "radial-gradient(circle at 35% 35%, #fff 0%, #b8d4e8 40%, #6fa8c9 70%, #2d6a8a 100%)", padding: "3px" }} />
          <div style={s.logoText}>PearlyPath AI</div>
        </div>
        <button style={s.navBtn} onClick={() => { setScreen("planner"); setItinerary(null); }}>← Replan</button>
      </div>

      <div style={s.tabs}>
        {[["itinerary","🗺️ Itinerary"],["explore","🏛️ Explore"],["gems","💎 Hidden Gems"],["assistant","💬 Ask AI"],["translate","🌐 Translate"],["culture","🕌 Culture"]].map(([id, label]) => (
          <button key={id} style={s.tab(activeTab === id)} onClick={() => setActiveTab(id)}>{label}</button>
        ))}
      </div>

      <div style={s.section}>
        {activeTab === "itinerary" && (
          itinerary?.error ? (
            <div style={s.card}>
              <div style={{ color: "#ff4757", fontFamily: "sans-serif", marginBottom: 12 }}>⚠️ {itinerary.error}</div>
              <button style={{ ...s.navBtn, color: "#F0EDE6", borderColor: "rgba(255,255,255,0.3)" }} onClick={() => { setScreen("planner"); setItinerary(null); }}>← Try Again</button>
            </div>
          ) : itinerary ? (
            <>
              <div style={s.summaryCard}>
                <div style={{ fontSize: 12, color: "#C9A84C", fontFamily: "sans-serif", letterSpacing: 1, marginBottom: 8 }}>
                  YOUR PERSONALIZED ITINERARY
                  {itinerary.partial && <span style={{ marginLeft: 10, color: "#00B4D8" }}>✦ Generating days...</span>}
                </div>
                <div style={s.summaryText}>{itinerary.summary}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                  {itinerary.total_budget_estimate && <span style={s.badge("201,168,76")}>💰 {itinerary.total_budget_estimate}</span>}
                  {itinerary.best_time && <span style={s.badge("0,180,216")}>🕐 {itinerary.best_time}</span>}
                  {itinerary.best_time_to_visit && <span style={s.badge("0,180,216")}>🕐 {itinerary.best_time_to_visit}</span>}
                </div>
                {itinerary.crowd_warning && <div style={{ fontSize: 12, color: "#ff9f43", fontFamily: "sans-serif", marginTop: 10, padding: "8px 12px", background: "rgba(255,159,67,0.1)", borderRadius: 8, border: "1px solid rgba(255,159,67,0.3)" }}>⚠️ {itinerary.crowd_warning}</div>}
              </div>

              <HotelRecommendations budget="{budget}"/>

              {itinerary.days?.map((day, i) => (
                <div key={i} style={s.dayCard}>
                  <div style={s.dayHeader}>
                    <div style={s.dayTitle}>Day {day.day}</div>
                    <div style={s.dayTheme}>{day.theme}</div>
                  </div>
                  {["morning", "afternoon", "evening"].map(slot => day[slot] && (
                    <div key={slot} style={s.timeSlot}>
                      <div style={s.timeLabel}>{slot.toUpperCase()} · {day[slot].time}</div>
                      <div style={s.placeName}>{day[slot].place}</div>
                      <div style={s.activityText}>{day[slot].activity}</div>
                      <div style={s.infoRow}>
                        {day[slot].duration && <span style={s.badge("0,180,216")}>⏱ {day[slot].duration}</span>}
                        {day[slot].cost && <span style={s.badge("201,168,76")}>💰 {day[slot].cost}</span>}
                      </div>
                    </div>
                  ))}
                  {day.hidden_gem && <div style={s.gemBox}>💎 Hidden Gem: {day.hidden_gem}</div>}
                  <div style={s.tipBox}>
                    {day.food_tip && <div style={s.tipText}>🍽️ {day.food_tip}</div>}
                    {day.transport_tip && <div style={{ ...s.tipText, marginTop: 6 }}>🚗 {day.transport_tip}</div>}
                  </div>
                </div>
              ))}
            </>
          ) : <div style={{ textAlign: "center", padding: 40, color: "#7db5cc", fontFamily: "sans-serif" }}>Loading your itinerary...</div>
        )}

        {activeTab === "explore" && (
          <>
            <div style={s.sectionTitle}>Discover Bahrain</div>
            <div style={s.sectionSub}>All major attractions with live crowd indicators</div>
            <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
              {[["2ed573","low","Quiet now"],["0,180,216","medium","Moderate"],["ff4757","high","Busy now"]].map(([c,k,l]) => (
                <div key={k} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontFamily: "sans-serif", color: "#a0b8c8" }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: `#${c}` }} />{l}
                </div>
              ))}
            </div>
            <div style={s.attractionGrid}>
              {BAHRAIN_ATTRACTIONS.map(a => {
                const cs = CATEGORY_STYLE[a.category] || CATEGORY_STYLE.default;
                return (
                  <div key={a.name} style={s.attractionCard(a.crowd)}>
                    <div style={{ height: 130, borderRadius: 10, marginBottom: 12, background: cs.gradient, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
                      <div style={{ fontSize: 48, filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.4))" }}>{cs.icon}</div>
                      <div style={{ position: "absolute", bottom: 8, right: 10, fontSize: 10, color: "rgba(255,255,255,0.6)", fontFamily: "sans-serif", letterSpacing: 1 }}>{a.category.toUpperCase()}</div>
                    </div>
                    <div style={{ fontSize: 12, color: "#C9A84C", fontFamily: "sans-serif", marginBottom: 4 }}>{a.category}</div>
                    <div style={{ fontSize: 14, fontWeight: "bold", color: "#F0EDE6", fontFamily: "sans-serif", marginBottom: 6 }}>{a.name}</div>
                    <div style={{ fontSize: 12, color: "#a0b8c8", fontFamily: "sans-serif", lineHeight: 1.5, marginBottom: 8 }}>{a.desc}</div>
                    <div style={{ fontSize: 11, fontFamily: "sans-serif" }}>
                      <span style={s.crowdDot(a.crowd)} />
                      <span style={{ color: a.crowd === "low" ? "#2ed573" : a.crowd === "high" ? "#ff4757" : "#00B4D8" }}>
                        {a.crowd === "low" ? "Quiet" : a.crowd === "high" ? "Crowded" : "Moderate"} traffic
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

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
                  <div key={i} style={m.role === "user" ? s.userMsg : s.botMsg}>
                    {m.role === "user" ? m.content : renderMarkdown(m.content)}
                  </div>
                ))}
                {chatLoading && <div style={s.botMsg}>✦ Thinking...</div>}
                <div ref={chatEndRef} />
              </div>
              <div style={s.chatInput}>
                <input
                  style={s.textInput}
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendChat()}
                  placeholder="Ask about Bahrain..."
                />
                <button style={s.sendBtn} onClick={sendChat}>Send</button>
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12, color: "#7db5cc", fontFamily: "sans-serif", marginBottom: 8 }}>Quick questions:</div>
              {["Best local food to try?", "How to get around Bahrain?", "What to wear?", "Best time to visit souks?"].map(q => (
                <span key={q} style={s.phraseChip} onClick={() => { setChatInput(q); }}>
                  {q}
                </span>
              ))}
            </div>
          </>
        )}

        {activeTab === "translate" && (
          <>
            <div style={s.sectionTitle}>Arabic–English Translator</div>
            <div style={s.sectionSub}>Communicate better during your visit</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              <input
                style={{ ...s.textInput, flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, padding: "12px 16px", color: "#F0EDE6", fontFamily: "sans-serif", outline: "none" }}
                value={transInput}
                onChange={e => setTransInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && translateText()}
                placeholder="Type a word or phrase..."
              />
              <button style={s.sendBtn} onClick={translateText} disabled={transLoading}>
                {transLoading ? "..." : "Translate"}
              </button>
            </div>
            {transResult && (
              <div style={s.transBox}>
                <div style={{ fontSize: 12, color: "#00B4D8", fontFamily: "sans-serif", marginBottom: 8 }}>TRANSLATION</div>
                <div style={{ fontSize: 16, color: "#F0EDE6", fontFamily: "sans-serif", lineHeight: 1.8 }}>{renderMarkdown(transResult)}</div>
              </div>
            )}
            <div style={{ marginTop: 24 }}>
              <div style={{ fontSize: 13, color: "#C9A84C", fontFamily: "sans-serif", marginBottom: 12 }}>Essential Tourist Phrases</div>
              <div>
                {Object.entries(TRANSLATIONS).map(([en, ar]) => (
                  <div key={en} style={{ ...s.card, padding: "12px 16px", cursor: "pointer" }} onClick={() => { setTransInput(en); setTransResult(ar); }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 14, color: "#F0EDE6", fontFamily: "sans-serif" }}>{en}</span>
                      <span style={{ fontSize: 13, color: "#7db5cc", fontFamily: "sans-serif", direction: "rtl" }}>{ar.split(" (")[0]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === "gems" && (
          <>
            <div style={s.sectionTitle}>💎 Hidden Gems</div>
            <div style={s.sectionSub}>Local spots that deserve far more recognition — cafés, beaches, shops & nature</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
              {["All", "☕ Café", "🏖️ Beach", "🌿 Nature", "🛍️ Shop", "🏰 Hidden Heritage", "🚶 Leisure", "☕ Café & Sweet Shop"].map(cat => {
                const active = (window._gemCat || "All") === cat;
                return (
                  <span key={cat} onClick={() => { window._gemCat = cat; const e = document.createEvent("Event"); e.initEvent("gemfilter",true,true); document.dispatchEvent(e); }}
                    style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${active ? "#C9A84C" : "rgba(255,255,255,0.15)"}`, background: active ? "rgba(201,168,76,0.15)" : "rgba(255,255,255,0.04)", color: active ? "#C9A84C" : "#a0b8c8", fontSize: 12, cursor: "pointer", fontFamily: "sans-serif" }}>
                    {cat}
                  </span>
                );
              })}
            </div>
            <GemsList/>
          </>
        )}

        {activeTab === "culture" && (
          <>
            <div style={s.sectionTitle}>Cultural Guide</div>
            <div style={s.sectionSub}>Etiquette, traditions, and heritage tips for Bahrain</div>
            <div style={s.culturalGrid}>
              {CULTURAL_TIPS.map((tip, i) => (
                <div key={i} style={s.culturalCard}>
                  <div style={{ fontSize: 28, marginBottom: 10 }}>{tip.icon}</div>
                  <div style={{ fontSize: 14, fontWeight: "bold", color: "#C9A84C", fontFamily: "sans-serif", marginBottom: 8 }}>{tip.title}</div>
                  <div style={{ fontSize: 13, color: "#a0b8c8", fontFamily: "sans-serif", lineHeight: 1.6 }}>{tip.tip}</div>
                </div>
              ))}
            </div>
            <div style={{ ...s.card, marginTop: 20, background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.3)" }}>
              <div style={{ fontSize: 14, color: "#C9A84C", fontFamily: "sans-serif", fontWeight: "bold", marginBottom: 8 }}>🌟 Bahrain Fun Facts</div>
              {["Bahrain means 'Two Seas' in Arabic, referring to its freshwater springs among saltwater.", "The pearl industry made Bahrain famous for centuries — it's still celebrated today.", "Bahrain is one of the most tolerant and cosmopolitan countries in the Gulf region.", "The Tree of Life is 400 years old with no nearby water source — a true mystery.", "Bahrain was the first Gulf country to discover oil, in 1932."].map((fact, i) => (
                <div key={i} style={{ fontSize: 13, color: "#a0b8c8", fontFamily: "sans-serif", padding: "6px 0", borderBottom: i < 4 ? "1px solid rgba(255,255,255,0.05)" : "none", lineHeight: 1.5 }}>
                  • {fact}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );

  return null;
}