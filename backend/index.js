const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const http = require('http');
const https = require('https');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const Player = require('./models/Player');

const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const playerRoutes = require('./routes/players');
const setupSocket = require('./socket');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // For dev, allow all
    methods: ['GET', 'POST']
  }
});

// Setup Socket.IO logic in a separate file
setupSocket(io);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/players', playerRoutes);

// ── IMAGE PROXY: Bypasses browser CORS for IPL headshot images ──
// Usage: /api/player-image/:iplId  →  fetches documents.iplt20.com/ipl/IPLHeadshot2026/{id}.png
app.get('/api/player-image/:iplId', (req, res) => {
  const { iplId } = req.params;
  const imageUrl = `https://documents.iplt20.com/ipl/IPLHeadshot2026/${iplId}.png`;
  https.get(imageUrl, { headers: { 'Referer': 'https://www.iplt20.com/', 'User-Agent': 'Mozilla/5.0' } }, (imgRes) => {
    if (imgRes.statusCode === 200) {
      res.setHeader('Content-Type', imgRes.headers['content-type'] || 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      imgRes.pipe(res);
    } else {
      res.status(404).json({ error: 'Image not found', status: imgRes.statusCode });
    }
  }).on('error', (e) => {
    console.error('Image proxy error:', e.message);
    res.status(500).json({ error: 'Proxy error' });
  });
});

// Generic proxy: /api/proxy-image?url=https://...
app.get('/api/proxy-image', (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url param' });
  try {
    const parsed = new URL(url);
    const protocol = parsed.protocol === 'https:' ? https : require('http');
    protocol.get(url, { headers: { 'Referer': parsed.origin, 'User-Agent': 'Mozilla/5.0' } }, (imgRes) => {
      if (imgRes.statusCode === 200) {
        res.setHeader('Content-Type', imgRes.headers['content-type'] || 'image/png');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        imgRes.pipe(res);
      } else {
        res.status(404).json({ error: 'Image not found' });
      }
    }).on('error', () => res.status(500).json({ error: 'Proxy error' }));
  } catch (e) {
    res.status(400).json({ error: 'Invalid URL' });
  }
});

const PLAYER_ESPN_IDS = {
  // MARQUEE SET
  "Rishabh Pant":         272450,
  "Shreyas Iyer":         642519,
  "Venkatesh Iyer":       1125927,
  "KL Rahul":             422108,
  "Jos Buttler":          308967,
  "Mitchell Starc":       311592,
  "Jofra Archer":         669855,
  "Josh Hazlewood":       565048,
  "Mohammed Shami":       311581,
  "Ishan Kishan":         536967,  // ← CORRECT ID (previous was wrong)
  "Liam Livingstone":     676219,
  "Marco Jansen":         1175427,

  // RETAINED PLAYERS
  "Virat Kohli":          253802,
  "Jasprit Bumrah":       625371,
  "Rohit Sharma":         34102,
  "Suryakumar Yadav":     475281,
  "Hardik Pandya":        625383,
  "Rashid Khan":          793463,
  "Shubman Gill":         1151274,
  "Ruturaj Gaikwad":      1127647,
  "Ravindra Jadeja":      234675,
  "Sanju Samson":         311274,   // ← corrected
  "Yashasvi Jaiswal":     1175423,
  "Heinrich Klaasen":     550215,
  "Pat Cummins":          498791,
  "Travis Head":          588428,
  "Abhishek Sharma":      1151273,
  "Nicholas Pooran":      663600,
  "Axar Patel":           559235,
  "Kuldeep Yadav":        559236,
  "Rinku Singh":          1175484,
  "Varun Chakravarthy":   1175481,
  "Sunil Narine":         229008,
  "Andre Russell":        234935,
  "Arshdeep Singh":       1151252,
  "Matheesha Pathirana":  1303427,
  "Riyan Parag":          1151271,
  "Dhruv Jurel":          1175489,
  "Nitish Kumar Reddy":   1303432,
  "Tilak Varma":          1175486,
  "Rajat Patidar":        1127649,
  "Sai Sudharsan":        1303421,
  "MS Dhoni":             28081,
  "Shimron Hetmyer":      470577,
  "Tristan Stubbs":       1303426,

  // BOWLERS
  "Bhuvneshwar Kumar":    236779,
  "Khaleel Ahmed":        972175,
  "Avesh Khan":           1151272,
  "T Natarajan":          669702,
  "Kagiso Rabada":        598141,
  "Anrich Nortje":        1151260,
  "Noor Ahmad":           1303429,
  "Wanindu Hasaranga":    1175430,
  "Maheesh Theekshana":   1303424,
  "Ravichandran Ashwin":  26421,
  "Prasidh Krishna":      1151270,
  "Trent Boult":          345142,
  "Harshal Patel":        477021,
  "Yash Dayal":           1151275,
  "Deepak Chahar":        536953,
  "Akash Deep":           1303420,
  "Mukesh Kumar":         1303423,
  "Sandeep Sharma":       559245,

  // ALL-ROUNDERS
  "Sam Curran":           972181,
  "Will Jacks":           1175426,
  "Krunal Pandya":        559242,
  "Washington Sundar":    990264,
  "Mitchell Marsh":       272620,
  "Marcus Stoinis":       480077,
  "Glenn Phillips":       1151268,
  "Azmatullah Omarzai":   1303430,
  "Abdul Samad":          1175488,
  "Rachin Ravindra":      1303419,
  "Shivam Dube":          669716,
  "Ramandeep Singh":      1175490,
  "Harshit Rana":         1175485,
  "Rahul Tewatia":        481745,

  // WK BATTERS
  "Quinton de Kock":      480684,
  "Jitesh Sharma":        1151269,
  "Phil Salt":            1151267,
  "Ryan Rickelton":       1303433,
  "Abishek Porel":        1303422,
  "Prabhsimran Singh":    1151255,

  // BATTERS
  "Faf du Plessis":       44828,
  "Devon Conway":         1151256,
  "Harry Brook":          1175421,
  "Jake Fraser-McGurk":   1303418,
  "David Miller":         311599,
  "Devdutt Padikkal":     1151253,
  "Priyansh Arya":        1303431,
  "Vaibhav Suryavanshi":  1390036,
  "Rahul Tripathi":       481744,
  "Aiden Markram":        559244,
};

// ── IPL JERSEY PHOTO NAME MAP ────────────────────────────────────────────────
// Maps player display names → exact camelCase filename used by scores.iplt20.com
// Verified against: https://scores.iplt20.com/ipl/playerimages/{name}.png
const IPL_PHOTO_NAMES = {
  // MARQUEE
  "Rishabh Pant":         "RishabhPant",
  "Shreyas Iyer":         "ShreyasIyer",
  "Venkatesh Iyer":       "VenkateshIyer",
  "KL Rahul":             "KLRahul",
  "Jos Buttler":          "JosButtler",
  "Mitchell Starc":       "MitchellStarc",
  "Jofra Archer":         "JofraArcher",
  "Josh Hazlewood":       "JoshHazlewood",
  "Mohammed Shami":       "MohammedShami",
  "Ishan Kishan":         "IshanKishan",
  "Liam Livingstone":     "LiamLivingstone",
  "Marco Jansen":         "MarcoJansen",

  // RETAINED STARS
  "Virat Kohli":          "ViratKohli",
  "Jasprit Bumrah":       "JaspritBumrah",
  "Rohit Sharma":         "RohitSharma",
  "Suryakumar Yadav":     "SuryakumarYadav",
  "Hardik Pandya":        "HardikPandya",
  "Rashid Khan":          "RashidKhan",
  "Shubman Gill":         "ShubmanGill",
  "Ruturaj Gaikwad":      "RuturajGaikwad",
  "Ravindra Jadeja":      "RavindraJadeja",
  "MS Dhoni":             "MSDhoni",
  "Sanju Samson":         "SanjuSamson",
  "Yashasvi Jaiswal":     "YashasviJaiswal",
  "Heinrich Klaasen":     "HeinrichKlaasen",
  "Pat Cummins":          "PatCummins",
  "Travis Head":          "TravisHead",
  "Abhishek Sharma":      "AbhishekSharma",
  "Nicholas Pooran":      "NicholasPooran",
  "Axar Patel":           "AxarPatel",
  "Kuldeep Yadav":        "KuldeepYadav",
  "Rinku Singh":          "RinkuSingh",
  "Varun Chakravarthy":   "VarunChakravarthy",
  "Sunil Narine":         "SunilNarine",
  "Andre Russell":        "AndreRussell",
  "Arshdeep Singh":       "ArshdeepSingh",
  "Matheesha Pathirana":  "MatheeshaPathirana",
  "Riyan Parag":          "RiyanParag",
  "Dhruv Jurel":          "DhruvJurel",
  "Nitish Kumar Reddy":   "NitishKumarReddy",
  "Tilak Varma":          "TilakVarma",
  "Rajat Patidar":        "RajatPatidar",
  "Sai Sudharsan":        "SaiSudharsan",
  "Shimron Hetmyer":      "ShimronHetmyer",
  "Tristan Stubbs":       "TristanStubbs",

  // BOWLERS
  "Bhuvneshwar Kumar":    "BhuvneshwarKumar",
  "Khaleel Ahmed":        "KhaleelAhmed",
  "Avesh Khan":           "AveshKhan",
  "T Natarajan":          "TNatarajan",
  "Kagiso Rabada":        "KagisoRabada",
  "Anrich Nortje":        "AnrichNortje",
  "Noor Ahmad":           "NoorAhmad",
  "Wanindu Hasaranga":    "WaninduHasaranga",
  "Maheesh Theekshana":   "MaheeshTheekshana",
  "Ravichandran Ashwin":  "RavichandranAshwin",
  "Prasidh Krishna":      "PrasidhKrishna",
  "Trent Boult":          "TrentBoult",
  "Harshal Patel":        "HarshalPatel",
  "Yash Dayal":           "YashDayal",
  "Deepak Chahar":        "DeepakChahar",
  "Akash Deep":           "AkashDeep",
  "Mukesh Kumar":         "MukeshKumar",
  "Sandeep Sharma":       "SandeepSharma",
  "Adam Zampa":           "AdamZampa",

  // ALL-ROUNDERS
  "Sam Curran":           "SamCurran",
  "Will Jacks":           "WillJacks",
  "Krunal Pandya":        "KrunalPandya",
  "Washington Sundar":    "WashingtonSundar",
  "Mitchell Marsh":       "MitchellMarsh",
  "Marcus Stoinis":       "MarcusStoinis",
  "Glenn Phillips":       "GlennPhillips",
  "Azmatullah Omarzai":   "AzmatullahOmarzai",
  "Abdul Samad":          "AbdulSamad",
  "Rachin Ravindra":      "RachinRavindra",
  "Shivam Dube":          "ShivamDube",
  "Rahul Tewatia":        "RahulTewatia",
  "Harshit Rana":         "HarshitRana",
  "Ramandeep Singh":      "RamandeepSingh",

  // WK-BATTERS
  "Quinton de Kock":      "QuintondéKock",
  "Jitesh Sharma":        "JiteshSharma",
  "Phil Salt":            "PhilSalt",
  "Ryan Rickelton":       "RyanRickelton",
  "Abishek Porel":        "AbishekPorel",
  "Prabhsimran Singh":    "PrabhsimranSingh",
  "Robin Minz":           "RobinMinz",

  // BATTERS
  "Faf du Plessis":       "FafduPlessis",
  "Devon Conway":         "DevonConway",
  "Harry Brook":          "HarryBrook",
  "Jake Fraser-McGurk":   "JakeFraser-McGurk",
  "David Miller":         "DavidMiller",
  "Devdutt Padikkal":     "DevduttPadikkal",
  "Priyansh Arya":        "PriyanshArya",
  "Vaibhav Suryavanshi":  "VaibhavSuryavanshi",
  "Rahul Tripathi":       "RahulTripathi",
  "Aiden Markram":        "AidenMarkram",
  "Angkrish Raghuvanshi": "AngkrishRaghuvanshi",
};

// Returns the IPL Scores URL for a player's jersey photo
function getIPLPhotoUrl(playerName) {
  const formatted = IPL_PHOTO_NAMES[playerName] || playerName.replace(/\s+/g, '');
  return `https://scores.iplt20.com/ipl/playerimages/${formatted}.png`;
}

// ── PLAYER PHOTO PROXY ───────────────────────────────────────────────────────
// Priority: scores.iplt20.com (jersey shoots) → iplt20.com assets → ESPN Cricinfo
app.get(['/api/player-photo', '/api/player-photo/:playerName'], async (req, res) => {
  const playerName = decodeURIComponent(req.params.playerName || req.query.name || '');
  if (!playerName) return res.status(400).json({ error: 'Missing name' });

  const espnId = PLAYER_ESPN_IDS[playerName];

  const sources = [
    // SOURCE 1 — IPL Scores Server (official jersey photoshoot, white background)
    getIPLPhotoUrl(playerName),

    // SOURCE 2 — IPL Official Website assets (by ESPN ID)
    ...(espnId ? [
      `https://www.iplt20.com/assets/images/players-thumb/${espnId}.png`,
      `https://www.iplt20.com/assets/images/players/${espnId}.png`,
    ] : []),

    // SOURCE 3 — ESPN Cricinfo official headshots
    ...(espnId ? [
      `https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/${espnId}.jpg`,
      `https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_160,q_50/lsci/db/PICTURES/CMS/${espnId}.jpg`,
    ] : []),
  ];

  for (const url of sources) {
    try {
      const isIPL = url.includes('iplt20.com') || url.includes('scores.iplt20.com');
      const isESPN = url.includes('hscicdn.com');
      const referer = isIPL ? 'https://www.iplt20.com/' : isESPN ? 'https://www.espncricinfo.com/' : 'https://www.iplt20.com/';

      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': referer,
          'Origin': 'https://www.iplt20.com',
          'Accept': 'image/png,image/webp,image/apng,image/*,*/*;q=0.8',
        },
        timeout: 4000,
      });

      if (response.status !== 200) continue;

      const contentType = response.headers['content-type'] || '';
      if (contentType.includes('text/html')) continue; // error page served as 200

      const buffer = response.data;
      const imageSizeKB = buffer.byteLength / 1024;
      if (imageSizeKB < 8) {
        console.log(`[Photo] Skipped tiny image (${imageSizeKB.toFixed(1)}KB) from: ${url}`);
        continue;
      }

      res.setHeader('Content-Type', contentType || 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=604800'); // 7 days
      res.setHeader('X-Photo-Source', url);
      return res.send(Buffer.from(buffer));
    } catch {
      continue;
    }
  }

  return res.status(404).json({ error: 'No jersey photo found', player: playerName });
});

// ── VISUAL PHOTO TEST PAGE ───────────────────────────────────────────────────
// Visit http://localhost:5000/test-photos to verify all jersey photos at a glance
app.get('/test-photos', (req, res) => {
  const players = Object.keys(IPL_PHOTO_NAMES);
  const cards = players.map(name => `
    <div style="display:inline-block;margin:10px;text-align:center;vertical-align:top;width:110px">
      <img
        src="/api/player-photo/${encodeURIComponent(name)}?v=3"
        width="90" height="90"
        style="border-radius:50%;object-fit:cover;object-position:50% 10%;border:3px solid #333"
        onerror="this.style.border='3px solid #e74c3c';this.alt='✗'"
        onload="this.style.border='3px solid #2ecc71'"
        title="${name}"
        loading="lazy"
      />
      <p style="font-size:10px;color:#ccc;margin:4px 0 0;word-break:break-word;line-height:1.3">${name}</p>
    </div>
  `).join('');

  res.send(`<!DOCTYPE html>
<html><head><title>IPL Jersey Photo Test</title></head>
<body style="background:#0d0d0d;font-family:sans-serif;padding:20px">
  <h2 style="color:gold;margin-bottom:4px">🏏 IPL Jersey Photo Test</h2>
  <p style="color:#888;font-size:12px;margin-bottom:20px">
    🟢 Green border = loaded ✅ &nbsp; 🔴 Red border = failed ❌ &nbsp;
    Source: <code style="color:#FF6B00">scores.iplt20.com → iplt20.com → ESPN</code>
  </p>
  ${cards}
</body></html>`);
});

// ── JSON VERIFY ENDPOINT ─────────────────────────────────────────────────────
app.get('/api/verify-photos', async (req, res) => {
  const results = {};
  for (const playerName of Object.keys(IPL_PHOTO_NAMES)) {
    const url = getIPLPhotoUrl(playerName);
    try {
      const response = await axios.get(url, {
        headers: {
          'Referer': 'https://www.iplt20.com/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Origin': 'https://www.iplt20.com',
        },
        timeout: 3000,
        responseType: 'arraybuffer',
      });
      const ct = response.headers['content-type'] || '';
      const ok = response.status === 200 && !ct.includes('text/html') && response.data.byteLength >= 8192;
      results[playerName] = { url, ok, sizeKB: (response.data.byteLength / 1024).toFixed(1) };
    } catch (e) {
      results[playerName] = { url, ok: false, error: e.message };
    }
  }
  res.json(results);
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('GLOBAL ERROR:', err);
  res.status(500).json({ error: 'Server error', details: err.stack || err.message });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
