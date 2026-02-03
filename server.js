import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import compression from 'compression';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(compression()); // Enable GZIP compression
app.use(cors());
app.use(express.json());
// Trust proxy is required if behind Nginx (like on aaPanel) to get real IPs
app.set('trust proxy', true);

// --- ACCESS CONTROL SYSTEM ---
let isSystemOpen = false; // Default: CLOSED (Privacy Mode)
let maxVotesPerIp = 3; // Default: Strict (Max 3 devices per IP)
const ADMIN_PIN = "45644779";

// Helper: Parse Cookies
const getCookie = (req, name) => {
  const header = req.headers.cookie;
  if (!header) return null;
  const match = header.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
};

// Middleware: Gatekeeper
app.use((req, res, next) => {
  // 1. Always allow API endpoints and the Admin Login page
  if (req.path.startsWith('/api/') || req.path === '/admin') {
    return next();
  }

  // 2. Check Admin Access
  const adminToken = getCookie(req, 'admin_session');
  const isAdmin = adminToken === 'authorized_45644779'; // Simple token check

  // 3. If System is Open OR User is Admin -> Proceed (Serve Frontend)
  if (isSystemOpen || isAdmin) {
    return next();
  }

  // 4. System Closed & Not Admin -> Block Access
  // If requesting HTML (main page), show Closed Page
  if (req.accepts('html') || req.path === '/') {
    return res.sendFile(join(__dirname, 'server-pages', 'closed.html'));
  }

  // Block bundles/assets to prevent scraping candidate data
  res.status(403).send('Access Denied: Voting is currently closed.');
});

// Serve Admin Login Page
app.get('/admin', (req, res) => {
  res.sendFile(join(__dirname, 'server-pages', 'login.html'));
});

// Serve Static Files (Frontend) with Caching Strategy
app.use(express.static(join(__dirname, 'dist'), {
  maxAge: '7d', // Cache images/assets for 7 days
  setHeaders: (res, path) => {
    // HTML files should not be cached (or short cache) to ensure updates are seen
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// Database Setup
const dbPath = join(__dirname, 'votes.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    
    db.serialize(() => {
      // PERFORMANCE OPTIMIZATION
      db.run('PRAGMA journal_mode = WAL');
      db.run('PRAGMA synchronous = NORMAL');
      
    // Create table if not exists
    db.run(`CREATE TABLE IF NOT EXISTS votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      candidateId TEXT NOT NULL,
      categoryId TEXT NOT NULL,
      ipAddress TEXT,
      fingerprint TEXT,
      voterId TEXT,
      hardwareId TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // INDEXING
    db.run(`CREATE INDEX IF NOT EXISTS idx_candidate ON votes(candidateId)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_ip_category ON votes(ipAddress, categoryId)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_fingerprint_category ON votes(fingerprint, categoryId)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_voterid_category ON votes(voterId, categoryId)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_hardware_ip ON votes(hardwareId, ipAddress)`);

      console.log('Database initialized successfully.');
      
      // Start server only after DB is ready
      app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
      });
    });
  }
});

// --- Simple Rate Limiter ---
const rateLimit = (limit, windowMs) => {
  const requests = new Map();
  
  // Cleanup interval: Remove entries older than windowMs
  setInterval(() => {
    const now = Date.now();
    for (const [ip, timestamps] of requests.entries()) {
      const validTimestamps = timestamps.filter(t => now - t < windowMs);
      if (validTimestamps.length === 0) {
        requests.delete(ip);
      } else {
        requests.set(ip, validTimestamps);
      }
    }
  }, windowMs); // Run cleanup every windowMs

  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!requests.has(ip)) {
      requests.set(ip, []);
    }
    
    const timestamps = requests.get(ip).filter(time => now - time < windowMs);
    if (timestamps.length >= limit) {
      return res.status(429).json({ error: 'Too many requests. Please slow down.' });
    }
    
    timestamps.push(now);
    requests.set(ip, timestamps);
    next();
  };
};

// --- API Endpoints ---

// 1. Get Stats
app.get('/api/stats', (req, res) => {
  const sql = `SELECT candidateId, COUNT(*) as count FROM votes GROUP BY candidateId`;
  
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    const voteState = {};
    rows.forEach((row) => {
      voteState[row.candidateId] = row.count;
    });
    
    res.json(voteState);
  });
});

// 2. Cast Vote
app.post('/api/vote', rateLimit(100, 60 * 1000), (req, res) => {
  if (!isSystemOpen) {
    return res.status(403).json({ error: 'Voting is currently closed.' });
  }

  const { candidateId, categoryId, fingerprint, voterId, hardwareId } = req.body;
  const ip = req.ip || req.connection.remoteAddress;

  if (!candidateId || !categoryId || !fingerprint || !voterId || !hardwareId) {
    return res.status(400).json({ error: 'Missing voting data' });
  }

  // 1. TRIPLE-CHECK LOGIC + HARDWARE BINDING
  const checkSql = `SELECT voterId, fingerprint, ipAddress, hardwareId FROM votes WHERE categoryId = ? AND (voterId = ? OR ipAddress = ?)`;
  
  db.all(checkSql, [categoryId, voterId, ip], (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB Error' });

    // A. Absolute Block: Persistent Voter ID match
    if (rows.some(r => r.voterId === voterId)) {
      return res.status(403).json({ error: 'You have already voted in this category.' });
    }

    // B. ANTI-SWITCHER LOGIC:
    // If the IP matches, we check the Hardware ID. 
    // If someone switches browsers on the same phone, the IP AND the Hardware will match.
    const sameHardwareSameIP = rows.find(r => r.ipAddress === ip && r.hardwareId === hardwareId);
    if (sameHardwareSameIP) {
      return res.status(403).json({ error: 'This device has already voted (Browser switching or other unethical activities detected).' });
    }

    // C. Network Limit: Dynamic check (Default 3)
    const ipVotes = rows.filter(r => r.ipAddress === ip).length;
    if (ipVotes >= maxVotesPerIp) {
      return res.status(403).json({ error: `Network limit reached (Max ${maxVotesPerIp} friends per hotspot).` });
    }

    // 2. All checks passed - Insert Vote
    const insertSql = `INSERT INTO votes (candidateId, categoryId, ipAddress, fingerprint, voterId, hardwareId) VALUES (?, ?, ?, ?, ?, ?)`;
    db.run(insertSql, [candidateId, categoryId, ip, fingerprint, voterId, hardwareId], function(err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to record vote' });
      }
      res.json({ success: true, id: this.lastID });
    });
  });
});

// 3. Reset Database (Admin)
app.post('/api/reset', (req, res) => {
  const adminToken = getCookie(req, 'admin_session');
  if (adminToken !== 'authorized_45644779') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  db.serialize(() => {
    db.run(`DELETE FROM votes`, [], (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to reset database' });
      }
      db.run('VACUUM', (err) => {
         if(err) console.error("Vacuum error:", err);
         res.json({ success: true });
      });
    });
  });
});

// 4. Admin Authentication
app.post('/api/admin-auth', (req, res) => {
  const { pin } = req.body;
  if (pin === ADMIN_PIN) {
    // Set a simple cookie (valid for 24 hours)
    res.cookie('admin_session', 'authorized_45644779', { 
      httpOnly: true, 
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'lax' // Allow top-level navigation
    });
    return res.json({ success: true });
  }
  res.status(401).json({ error: 'Invalid PIN' });
});

// 5. System Status (Get & Toggle)
app.get('/api/system-status', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=5');
  res.json({ isOpen: isSystemOpen, maxVotesPerIp });
});

app.post('/api/system-status', (req, res) => {
  const adminToken = getCookie(req, 'admin_session');
  if (adminToken !== 'authorized_45644779') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { isOpen, newMaxVotes } = req.body;

  // Update Open/Closed Status
  if (typeof isOpen === 'boolean') {
    isSystemOpen = isOpen;
    console.log(`[System] Voting status changed to: ${isSystemOpen ? 'OPEN' : 'CLOSED'}`);
  }

  // Update Dynamic IP Limit
  if (typeof newMaxVotes === 'number' && newMaxVotes > 0) {
    maxVotesPerIp = newMaxVotes;
    console.log(`[System] Max votes per IP changed to: ${maxVotesPerIp}`);
  }

  return res.json({ success: true, isOpen: isSystemOpen, maxVotesPerIp });
});

// SPA Fallback: Serve index.html for any unknown routes
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});
