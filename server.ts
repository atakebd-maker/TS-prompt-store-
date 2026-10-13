import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import multer from 'multer';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isVercel = process.env.VERCEL === '1';
const DATA_DIR = isVercel ? path.join('/tmp', 'data') : path.join(__dirname, 'data');
const UPLOADS_DIR = isVercel ? path.join('/tmp', 'uploads') : path.join(__dirname, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure directories exist
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
} catch {
  // Ignore in read-only environments
}

// Interfaces
export interface Category {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface PromptPost {
  id: string;
  title: string;
  slug: string;
  category_id: string;
  category_name: string;
  featured_image_url: string;
  prompt_text: string;
  description: string;
  search_keywords: string;
  status: 'published' | 'draft';
  is_sample?: boolean;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

interface AdminSession {
  token: string;
  adminId: string;
  expiresAt: number;
}

interface AdminUser {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  created_at: string;
}

interface DatabaseSchema {
  admin: AdminUser;
  sessions: AdminSession[];
  categories: Category[];
  posts: PromptPost[];
}

// Password hashing utility using PBKDF2
function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Slug generator
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

// Default initial data
function getInitialData(): DatabaseSchema {
  const initialSalt = generateSalt();
  const initialPassword = process.env.ADMIN_PASSWORD || 'AdminSecurePrompt2026!';
  const initialEmail = process.env.ADMIN_EMAIL || 'admin@tspromptstore.com';

  const defaultCategories: Category[] = [
    { id: 'cat-photo', name: 'AI Photo Prompts', slug: 'ai-photo-prompts', created_at: new Date().toISOString() },
    { id: 'cat-video', name: 'AI Video Prompts', slug: 'ai-video-prompts', created_at: new Date().toISOString() },
    { id: 'cat-portrait', name: 'Portrait Prompts', slug: 'portrait-prompts', created_at: new Date().toISOString() },
    { id: 'cat-anime', name: 'Anime Prompts', slug: 'anime-prompts', created_at: new Date().toISOString() },
    { id: 'cat-fantasy', name: 'Fantasy Prompts', slug: 'fantasy-prompts', created_at: new Date().toISOString() },
    { id: 'cat-cinematic', name: 'Cinematic Prompts', slug: 'cinematic-prompts', created_at: new Date().toISOString() },
    { id: 'cat-other', name: 'Other Prompts', slug: 'other-prompts', created_at: new Date().toISOString() }
  ];

  const now = new Date().toISOString();

  // Curated initial sample posts clearly tagged with is_sample: true (can be removed with 1-click in Admin)
  const defaultPosts: PromptPost[] = [
    {
      id: 'post-1',
      title: 'Cinematic Cyberpunk Ronin Under Tokyo Rain',
      slug: 'cinematic-cyberpunk-ronin-under-tokyo-rain',
      category_id: 'cat-cinematic',
      category_name: 'Cinematic Prompts',
      featured_image_url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80',
      prompt_text: 'A high-contrast cinematic portrait of a cybernetic samurai standing under heavy neon-lit rainfall in neo-Tokyo. Holographic kanji signs casting vibrant cyan and magenta reflections onto wet asphalt. Worn carbon fiber armor plates, glowing plasma katana strapped to hip, hyper-detailed water droplets, 35mm anamorphic lens, shallow depth of field, atmospheric steam, photorealistic 8k render --ar 16:9 --style raw',
      description: 'Ultra-detailed cinematic street scene with atmospheric lighting, neon reflections, and cyberpunk aesthetic.',
      search_keywords: 'cyberpunk, samurai, neon, tokyo, rain, cinematic, 8k, blade',
      status: 'published',
      is_sample: true,
      created_at: now,
      updated_at: now,
      published_at: now
    },
    {
      id: 'post-2',
      title: 'Studio Portrait of Nordic Model with Golden Hour Lighting',
      slug: 'studio-portrait-of-nordic-model-with-golden-hour-lighting',
      category_id: 'cat-portrait',
      category_name: 'Portrait Prompts',
      featured_image_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80',
      prompt_text: 'Intimate editorial fashion portrait of a Scandinavian woman with freckles, soft hazel eyes, and natural windblown auburn hair. Warm golden hour sunbeam glancing across cheekbones, subtle rim light, shot on Hasselblad H6D-100c, 85mm f/1.2 lens, pristine skin texture without oversaturation, soft neutral linen backdrop, Vogue editorial aesthetic.',
      description: 'Elegant high-fashion beauty portrait capturing authentic natural skin texture and soft ambient sunlight.',
      search_keywords: 'portrait, model, golden hour, studio, freckles, hasselblad, fashion, photorealistic',
      status: 'published',
      is_sample: true,
      created_at: now,
      updated_at: now,
      published_at: now
    },
    {
      id: 'post-3',
      title: 'Ethereal Forest Spirit Anime Illustration',
      slug: 'ethereal-forest-spirit-anime-illustration',
      category_id: 'cat-anime',
      category_name: 'Anime Prompts',
      featured_image_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
      prompt_text: 'Makoto Shinkai and Studio Ghibli inspired anime masterpiece: A graceful guardian spirit with translucent glowing antlers standing in an ancient bioluminescent moss forest. Tiny floating luminescent spores drifting through morning mist, majestic sun rays filtering through giant cedar trees, soft pastel palette with deep emerald greens and celestial azure hues, ultra fine linework, masterwork painting.',
      description: 'Lush anime art style featuring glowing flora, mythical creature, and sunbeams in an enchanted woodland.',
      search_keywords: 'anime, forest spirit, ghibli, makoto shinkai, bioluminescent, ethereal, fantasy',
      status: 'published',
      is_sample: true,
      created_at: now,
      updated_at: now,
      published_at: now
    },
    {
      id: 'post-4',
      title: 'Floating Island Crystal Citadel in Twilight Sky',
      slug: 'floating-island-crystal-citadel-in-twilight-sky',
      category_id: 'cat-fantasy',
      category_name: 'Fantasy Prompts',
      featured_image_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
      prompt_text: 'Epic high fantasy concept art of an airborne floating archipelago crowned by a towering crystalline fortress. Cascading waterfalls tumbling into the purple and rose cloudbank below, ancient flying airships with glowing solar sails docking at luminous marble harbors, dramatic twilight dusk sky with twin moons, grand scale matte painting, ArtStation trending.',
      description: 'Breathtaking fantasy worldbuilding illustration with crystalline castle on floating sky islands.',
      search_keywords: 'fantasy, floating island, crystal citadel, sky, clouds, airship, castle, epic',
      status: 'published',
      is_sample: true,
      created_at: now,
      updated_at: now,
      published_at: now
    },
    {
      id: 'post-5',
      title: 'Seamless Drone Hyperlapse of Futuristic Megacity',
      slug: 'seamless-drone-hyperlapse-of-futuristic-megacity',
      category_id: 'cat-video',
      category_name: 'AI Video Prompts',
      featured_image_url: 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&w=1200&q=80',
      prompt_text: 'Runway Gen-3 / Sora prompt: Continuous first-person FPV drone dive starting high in the stratospheric clouds, smoothly swooping down between gleaming glass skyscrapers of Singapore 2080 at sunset. Flying transit pods weaving on elevated maglev rails, vertical sky gardens bursting with lush tropical plants, ultra-smooth 60fps camera motion, realistic physics, anamorphic motion blur, golden hour illumination.',
      description: 'Dynamic camera movement prompt engineered for AI video generators like Sora, Runway Gen-3, and Luma Dream Machine.',
      search_keywords: 'video, drone, hyperlapse, sora, runway, futuristic, megacity, 60fps',
      status: 'published',
      is_sample: true,
      created_at: now,
      updated_at: now,
      published_at: now
    },
    {
      id: 'post-6',
      title: 'Macro Photography of Dew Drop on Iridescent Morpho Butterfly',
      slug: 'macro-photography-of-dew-drop-on-iridescent-morpho-butterfly',
      category_id: 'cat-photo',
      category_name: 'AI Photo Prompts',
      featured_image_url: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=1200&q=80',
      prompt_text: 'Extreme macro wildlife photography of an electric blue Morpho butterfly resting on a damp fern leaf. A single crystal-clear water droplet resting on its wing reflecting miniature rainforest canopy. Microscopic chitin scales visible with rainbow diffraction, Canon EF 100mm f/2.8L Macro IS USM, ring flash soft diffused light, focus stacked tack-sharp clarity, National Geographic publication quality.',
      description: 'Pin-sharp macro photography prompt demonstrating scale texture, lens selection, and studio quality lighting.',
      search_keywords: 'photo, macro, butterfly, dewdrop, insect, national geographic, nature, iridescent',
      status: 'published',
      is_sample: true,
      created_at: now,
      updated_at: now,
      published_at: now
    },
    {
      id: 'post-7',
      title: 'Vintage 1970s Polaroid of Classic American Muscle Car',
      slug: 'vintage-1970s-polaroid-of-classic-american-muscle-car',
      category_id: 'cat-photo',
      category_name: 'AI Photo Prompts',
      featured_image_url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80',
      prompt_text: 'Authentic 1970s expired Polaroid 600 color photograph of a cherry red 1969 Dodge Charger parked outside a dusty Mojave desert neon diner at sunset. Faded dyes, slight cyan tint in the shadows, warm sepia highlights, vintage film grain, light leak at the upper corner, nostalgic Kodachrome warmth, retro Americana lifestyle.',
      description: 'Photographic film simulation prompt with authentic vintage color shift and analog film aesthetics.',
      search_keywords: 'photo, muscle car, vintage, polaroid, 1970s, dodge charger, retro, diner',
      status: 'published',
      is_sample: true,
      created_at: now,
      updated_at: now,
      published_at: now
    },
    {
      id: 'post-8',
      title: 'Cozy Coffee Brewing Slow Motion Cinemagraph',
      slug: 'cozy-coffee-brewing-slow-motion-cinemagraph',
      category_id: 'cat-video',
      category_name: 'AI Video Prompts',
      featured_image_url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80',
      prompt_text: 'Video generation prompt: Slow-motion 120fps pour-over coffee extraction in a sunlit Scandinavian kitchen. Golden coffee swirling through glass dripper carafe, delicate swirling vapor steam rising against soft morning light, wooden kitchen counter, ceramic mug waiting nearby, shallow depth of field, gentle relaxing mood, fluid dynamics, cinematic commercial grade.',
      description: 'Paced slow-motion video prompt suited for food & beverage lifestyle video generations.',
      search_keywords: 'video, coffee, slow motion, steam, cinemagraph, cozy, kitchen',
      status: 'published',
      is_sample: true,
      created_at: now,
      updated_at: now,
      published_at: now
    }
  ];

  return {
    admin: {
      id: 'admin-1',
      email: initialEmail,
      passwordHash: hashPassword(initialPassword, initialSalt),
      salt: initialSalt,
      created_at: now
    },
    sessions: [],
    categories: defaultCategories,
    posts: defaultPosts
  };
}

// Database Read/Write with atomic file write
function readDb(): DatabaseSchema {
  if (!fs.existsSync(DB_FILE)) {
    const bundledDb = path.join(__dirname, 'data', 'db.json');
    if (fs.existsSync(bundledDb)) {
      try {
        const content = fs.readFileSync(bundledDb, 'utf-8');
        const data = JSON.parse(content) as DatabaseSchema;
        writeDb(data);
        return data;
      } catch {
        // continue
      }
    }
    const initial = getInitialData();
    writeDb(initial);
    return initial;
  }
  try {
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    const data = JSON.parse(content) as DatabaseSchema;
    // ensure required keys exist
    if (!data.categories) data.categories = [];
    if (!data.posts) data.posts = [];
    if (!data.sessions) data.sessions = [];
    return data;
  } catch (err) {
    console.error('Error reading db.json, reinitializing initial data:', err);
    const initial = getInitialData();
    writeDb(initial);
    return initial;
  }
}

function writeDb(data: DatabaseSchema): void {
  const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempFile, DB_FILE);
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    cb(null, `prompt-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, and WebP images are allowed.'));
    }
  }
});

// Admin Authentication Middleware
function authenticateAdmin(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    return;
  }

  const token = authHeader.substring(7).trim();
  const db = readDb();
  const now = Date.now();

  const sessionIndex = db.sessions.findIndex((s) => s.token === token);
  if (sessionIndex === -1) {
    res.status(401).json({ error: 'Unauthorized: Session not found' });
    return;
  }

  const session = db.sessions[sessionIndex];
  if (session.expiresAt < now) {
    // Session expired, clean it up
    db.sessions.splice(sessionIndex, 1);
    writeDb(db);
    res.status(401).json({ error: 'Unauthorized: Session expired' });
    return;
  }

  // Session valid
  (req as any).adminUser = db.admin;
  (req as any).sessionToken = token;
  next();
}

// Relevance search helper function
function computeRelevanceScore(post: PromptPost, query: string, queryTokens: string[]): number {
  const title = post.title.toLowerCase();
  const lowerQuery = query.toLowerCase();
  let score = 0;

  // 1. Exact title match
  if (title === lowerQuery) {
    score += 1000;
  }
  // 2. Title begins with query
  else if (title.startsWith(lowerQuery)) {
    score += 500;
  }
  // 3. Title contains full query string
  else if (title.includes(lowerQuery)) {
    score += 250;
  }

  // 4. Word by word title matches
  for (const token of queryTokens) {
    if (title.includes(token)) {
      score += 50;
    }
  }

  // 5. Keywords match
  const keywords = (post.search_keywords || '').toLowerCase();
  if (keywords.includes(lowerQuery)) {
    score += 100;
  }
  for (const token of queryTokens) {
    if (keywords.includes(token)) {
      score += 25;
    }
  }

  // 6. Category match
  const category = (post.category_name || '').toLowerCase();
  if (category.includes(lowerQuery)) {
    score += 80;
  }

  // 7. Prompt text & description match
  const prompt = (post.prompt_text || '').toLowerCase();
  const desc = (post.description || '').toLowerCase();
  for (const token of queryTokens) {
    if (prompt.includes(token)) score += 10;
    if (desc.includes(token)) score += 10;
  }

  return score;
}

// Initialize and export Express application
export const app = express();
app.use(express.json());

// Static uploads directory
app.use('/uploads', express.static(UPLOADS_DIR));

// Initialize DB on boot
readDb();

  // ----------------------------------------------------
  // PUBLIC API ENDPOINTS
  // ----------------------------------------------------

  // Public Categories
  app.get('/api/categories', (_req: Request, res: Response) => {
    try {
      const db = readDb();
      res.json(db.categories);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  });

  // Public Posts Feed (Only published posts!)
  app.get('/api/posts', (req: Request, res: Response) => {
    try {
      const db = readDb();
      const { category, search } = req.query;

      // Filter only published posts for public view
      let filtered = db.posts.filter((p) => p.status === 'published');

      // Filter by category slug or ID
      if (category && category !== 'all') {
        const cat = db.categories.find(
          (c) => c.slug === category || c.id === category
        );
        if (cat) {
          filtered = filtered.filter((p) => p.category_id === cat.id);
        } else {
          filtered = filtered.filter(
            (p) => p.category_id === category || p.category_name.toLowerCase() === String(category).toLowerCase()
          );
        }
      }

      // Relevance-based search
      if (search && typeof search === 'string' && search.trim() !== '') {
        const query = search.trim();
        const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);

        const scored = filtered.map((post) => ({
          post,
          score: computeRelevanceScore(post, query, tokens)
        }));

        // Filter out zero-score posts and sort by highest score first, then newest
        filtered = scored
          .filter((item) => item.score > 0)
          .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return new Date(b.post.published_at || b.post.created_at).getTime() -
                   new Date(a.post.published_at || a.post.created_at).getTime();
          })
          .map((item) => item.post);
      } else {
        // Default sort: newest published first
        filtered.sort((a, b) => {
          return new Date(b.published_at || b.created_at).getTime() -
                 new Date(a.published_at || a.created_at).getTime();
        });
      }

      res.json(filtered);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch posts' });
    }
  });

  // Public Individual Post Detail + Related Prompts
  app.get('/api/posts/:slug', (req: Request, res: Response) => {
    try {
      const db = readDb();
      const { slug } = req.params;

      const post = db.posts.find(
        (p) => (p.slug === slug || p.id === slug) && p.status === 'published'
      );

      if (!post) {
        res.status(404).json({ error: 'Post not found or unpublished' });
        return;
      }

      // Related prompts from the same category (excluding current post)
      const related = db.posts
        .filter(
          (p) =>
            p.status === 'published' &&
            p.id !== post.id &&
            p.category_id === post.category_id
        )
        .slice(0, 6);

      res.json({ post, related });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch post detail' });
    }
  });

  // Sitemap.xml Generation (SEO Requirement)
  app.get('/sitemap.xml', (req: Request, res: Response) => {
    try {
      const db = readDb();
      const host = req.get('host') || 'localhost:3000';
      const protocol = req.protocol || 'https';
      const baseUrl = `${protocol}://${host}`;

      const publishedPosts = db.posts.filter((p) => p.status === 'published');

      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
      xml += `  <url>\n    <loc>${baseUrl}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;

      for (const p of publishedPosts) {
        const lastMod = p.updated_at ? p.updated_at.split('T')[0] : new Date().toISOString().split('T')[0];
        xml += `  <url>\n`;
        xml += `    <loc>${baseUrl}/prompt/${p.slug}</loc>\n`;
        xml += `    <lastmod>${lastMod}</lastmod>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.8</priority>\n`;
        xml += `  </url>\n`;
      }

      xml += `</urlset>`;

      res.header('Content-Type', 'application/xml');
      res.send(xml);
    } catch (err) {
      res.status(500).send('Error generating sitemap');
    }
  });

  // Robots.txt Generation (SEO Requirement)
  app.get('/robots.txt', (req: Request, res: Response) => {
    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol || 'https';
    const baseUrl = `${protocol}://${host}`;

    let robots = `User-agent: *\n`;
    robots += `Allow: /\n`;
    robots += `Allow: /prompt/\n`;
    robots += `Disallow: /Admin-nexappo-tahsin-2013\n`;
    robots += `Disallow: /api/admin/\n\n`;
    robots += `Sitemap: ${baseUrl}/sitemap.xml\n`;

    res.header('Content-Type', 'text/plain');
    res.send(robots);
  });

  // ----------------------------------------------------
  // ADMIN AUTHENTICATION & DASHBOARD APIS (Hidden Route)
  // ----------------------------------------------------

  // Admin Login
  app.post('/api/admin/login', (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const db = readDb();
    const admin = db.admin;

    if (email.toLowerCase().trim() !== admin.email.toLowerCase().trim()) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const computedHash = hashPassword(password, admin.salt);
    if (computedHash !== admin.passwordHash) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Generate secure session token (24-hour expiration)
    const token = generateToken();
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

    db.sessions.push({
      token,
      adminId: admin.id,
      expiresAt
    });

    writeDb(db);

    res.json({
      success: true,
      token,
      expiresAt,
      admin: {
        id: admin.id,
        email: admin.email
      }
    });
  });

  // Admin Session Verify
  app.get('/api/admin/me', authenticateAdmin, (req: Request, res: Response) => {
    const adminUser = (req as any).adminUser;
    res.json({
      authenticated: true,
      admin: {
        id: adminUser.id,
        email: adminUser.email
      }
    });
  });

  // Admin Logout
  app.post('/api/admin/logout', authenticateAdmin, (req: Request, res: Response) => {
    const token = (req as any).sessionToken;
    const db = readDb();
    db.sessions = db.sessions.filter((s) => s.token !== token);
    writeDb(db);
    res.json({ success: true, message: 'Logged out successfully' });
  });

  // Admin Dashboard Statistics
  app.get('/api/admin/stats', authenticateAdmin, (_req: Request, res: Response) => {
    const db = readDb();
    const totalPosts = db.posts.length;
    const publishedPosts = db.posts.filter((p) => p.status === 'published').length;
    const draftPosts = db.posts.filter((p) => p.status === 'draft').length;
    const totalCategories = db.categories.length;
    const samplePosts = db.posts.filter((p) => p.is_sample).length;

    res.json({
      totalPosts,
      publishedPosts,
      draftPosts,
      totalCategories,
      samplePosts
    });
  });

  // Admin Image Upload
  app.post('/api/admin/upload', authenticateAdmin, (req: Request, res: Response) => {
    upload.single('image')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          res.status(400).json({ error: 'File size exceeds maximum limit of 10MB' });
          return;
        }
        res.status(400).json({ error: err.message });
        return;
      } else if (err) {
        res.status(400).json({ error: err.message });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: 'No image file uploaded' });
        return;
      }

      // Return public URL path
      const fileUrl = `/uploads/${req.file.filename}`;
      res.json({
        success: true,
        url: fileUrl,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype
      });
    });
  });

  // Admin Get All Posts (Includes drafts)
  app.get('/api/admin/posts', authenticateAdmin, (req: Request, res: Response) => {
    const db = readDb();
    const { status, category, search } = req.query;

    let posts = [...db.posts];

    if (status === 'published') {
      posts = posts.filter((p) => p.status === 'published');
    } else if (status === 'draft') {
      posts = posts.filter((p) => p.status === 'draft');
    }

    if (category) {
      posts = posts.filter((p) => p.category_id === category || p.category_name === category);
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      posts = posts.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.prompt_text.toLowerCase().includes(q) ||
          (p.search_keywords && p.search_keywords.toLowerCase().includes(q))
      );
    }

    // Sort newest updated/created first
    posts.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

    res.json(posts);
  });

  // Admin Create Post
  app.post('/api/admin/posts', authenticateAdmin, (req: Request, res: Response) => {
    const {
      title,
      category_id,
      featured_image_url,
      prompt_text,
      description,
      search_keywords,
      status
    } = req.body;

    if (!title || !title.trim()) {
      res.status(400).json({ error: 'Post title is required' });
      return;
    }
    if (!category_id) {
      res.status(400).json({ error: 'Category selection is required' });
      return;
    }
    if (!prompt_text || !prompt_text.trim()) {
      res.status(400).json({ error: 'English prompt is required' });
      return;
    }
    if (!featured_image_url || !featured_image_url.trim()) {
      res.status(400).json({ error: 'Featured image is required' });
      return;
    }

    const db = readDb();
    const category = db.categories.find((c) => c.id === category_id);
    const categoryName = category ? category.name : 'Other Prompts';

    const now = new Date().toISOString();
    let baseSlug = slugify(title);
    if (!baseSlug) baseSlug = `prompt-${Date.now()}`;

    // Ensure slug uniqueness
    let slug = baseSlug;
    let counter = 1;
    while (db.posts.some((p) => p.slug === slug)) {
      slug = `${baseSlug}-${counter++}`;
    }

    const postStatus: 'published' | 'draft' = status === 'draft' ? 'draft' : 'published';

    const newPost: PromptPost = {
      id: `post-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      title: title.trim(),
      slug,
      category_id,
      category_name: categoryName,
      featured_image_url: featured_image_url.trim(),
      prompt_text: prompt_text.trim(),
      description: description ? description.trim() : '',
      search_keywords: search_keywords ? search_keywords.trim() : '',
      status: postStatus,
      is_sample: false,
      created_at: now,
      updated_at: now,
      published_at: postStatus === 'published' ? now : null
    };

    db.posts.unshift(newPost);
    writeDb(db);

    res.status(201).json({ success: true, post: newPost });
  });

  // Admin Update Post
  app.put('/api/admin/posts/:id', authenticateAdmin, (req: Request, res: Response) => {
    const { id } = req.params;
    const {
      title,
      category_id,
      featured_image_url,
      prompt_text,
      description,
      search_keywords,
      status
    } = req.body;

    const db = readDb();
    const index = db.posts.findIndex((p) => p.id === id);

    if (index === -1) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    const existing = db.posts[index];
    const category = db.categories.find((c) => c.id === category_id) || { name: existing.category_name };

    const now = new Date().toISOString();
    const postStatus: 'published' | 'draft' = status === 'draft' ? 'draft' : 'published';

    let slug = existing.slug;
    if (title && title.trim() !== existing.title) {
      let baseSlug = slugify(title);
      slug = baseSlug;
      let counter = 1;
      while (db.posts.some((p) => p.slug === slug && p.id !== id)) {
        slug = `${baseSlug}-${counter++}`;
      }
    }

    const updatedPost: PromptPost = {
      ...existing,
      title: title !== undefined ? title.trim() : existing.title,
      slug,
      category_id: category_id || existing.category_id,
      category_name: category ? category.name : existing.category_name,
      featured_image_url: featured_image_url || existing.featured_image_url,
      prompt_text: prompt_text !== undefined ? prompt_text.trim() : existing.prompt_text,
      description: description !== undefined ? description.trim() : existing.description,
      search_keywords: search_keywords !== undefined ? search_keywords.trim() : existing.search_keywords,
      status: postStatus,
      updated_at: now,
      published_at: postStatus === 'published' ? (existing.published_at || now) : null
    };

    db.posts[index] = updatedPost;
    writeDb(db);

    res.json({ success: true, post: updatedPost });
  });

  // Admin Delete Post
  app.delete('/api/admin/posts/:id', authenticateAdmin, (req: Request, res: Response) => {
    const { id } = req.params;
    const db = readDb();
    const index = db.posts.findIndex((p) => p.id === id);

    if (index === -1) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    const removedPost = db.posts[index];
    db.posts.splice(index, 1);
    writeDb(db);

    // If the image was locally uploaded and not used by any other post, safely remove it
    if (removedPost.featured_image_url.startsWith('/uploads/')) {
      const filename = path.basename(removedPost.featured_image_url);
      const isShared = db.posts.some((p) => p.featured_image_url.includes(filename));
      if (!isShared) {
        const filePath = path.join(UPLOADS_DIR, filename);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (e) {
            console.error('Failed to unlink deleted post image:', e);
          }
        }
      }
    }

    res.json({ success: true, message: 'Post deleted successfully' });
  });

  // Admin Delete All Sample Posts
  app.post('/api/admin/clear-samples', authenticateAdmin, (_req: Request, res: Response) => {
    const db = readDb();
    const initialCount = db.posts.length;
    db.posts = db.posts.filter((p) => !p.is_sample);
    const removedCount = initialCount - db.posts.length;
    writeDb(db);
    res.json({ success: true, removedCount, remaining: db.posts.length });
  });

  // Admin Categories Management
  app.get('/api/admin/categories', authenticateAdmin, (_req: Request, res: Response) => {
    const db = readDb();
    res.json(db.categories);
  });

  app.post('/api/admin/categories', authenticateAdmin, (req: Request, res: Response) => {
    const { name } = req.body;
    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Category name is required' });
      return;
    }

    const db = readDb();
    const slug = slugify(name);

    if (db.categories.some((c) => c.slug === slug)) {
      res.status(400).json({ error: 'A category with this name already exists' });
      return;
    }

    const newCategory: Category = {
      id: `cat-${Date.now()}`,
      name: name.trim(),
      slug,
      created_at: new Date().toISOString()
    };

    db.categories.push(newCategory);
    writeDb(db);

    res.status(201).json({ success: true, category: newCategory });
  });

  app.put('/api/admin/categories/:id', authenticateAdmin, (req: Request, res: Response) => {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Category name is required' });
      return;
    }

    const db = readDb();
    const category = db.categories.find((c) => c.id === id);

    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    const oldName = category.name;
    category.name = name.trim();
    category.slug = slugify(name);

    // Update all posts using this category
    for (const post of db.posts) {
      if (post.category_id === id) {
        post.category_name = category.name;
      }
    }

    writeDb(db);
    res.json({ success: true, category });
  });

  app.delete('/api/admin/categories/:id', authenticateAdmin, (req: Request, res: Response) => {
    const { id } = req.params;
    const db = readDb();
    const index = db.categories.findIndex((c) => c.id === id);

    if (index === -1) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    // Check if any posts are linked
    const linkedPosts = db.posts.filter((p) => p.category_id === id);
    if (linkedPosts.length > 0) {
      // Reassign to "Other Prompts" if available, or first category
      const fallback = db.categories.find((c) => c.id !== id);
      if (fallback) {
        for (const post of linkedPosts) {
          post.category_id = fallback.id;
          post.category_name = fallback.name;
        }
      }
    }

    db.categories.splice(index, 1);
    writeDb(db);

    res.json({ success: true, message: 'Category deleted' });
  });

  // Admin Password Change
  app.put('/api/admin/change-password', authenticateAdmin, (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current password and new password are required' });
      return;
    }
    if (newPassword.length < 8) {
      res.status(400).json({ error: 'New password must be at least 8 characters' });
      return;
    }

    const db = readDb();
    const currentHash = hashPassword(currentPassword, db.admin.salt);
    if (currentHash !== db.admin.passwordHash) {
      res.status(400).json({ error: 'Incorrect current password' });
      return;
    }

    const newSalt = generateSalt();
    db.admin.passwordHash = hashPassword(newPassword, newSalt);
    db.admin.salt = newSalt;
    writeDb(db);

    res.json({ success: true, message: 'Admin password updated successfully' });
  });

  // Supabase Configuration Status & SQL Schema Export
  app.get('/api/admin/supabase-status', authenticateAdmin, (_req: Request, res: Response) => {
    const isConfigured = Boolean(
      process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const sqlSchema = `
-- TS Prompt Store - Supabase PostgreSQL Schema
-- Run this in the Supabase SQL Editor if connecting an external Supabase instance

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  category_name TEXT NOT NULL,
  featured_image_url TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  description TEXT,
  search_keywords TEXT,
  status TEXT NOT NULL DEFAULT 'published',
  is_sample BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- Row Level Security (RLS)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Allow public read access to categories and published posts only
CREATE POLICY "Public categories are viewable by everyone" ON categories FOR SELECT USING (true);
CREATE POLICY "Published posts are viewable by everyone" ON posts FOR SELECT USING (status = 'published');

-- Admin write policies restricted to service_role or authenticated admin
CREATE POLICY "Admins full access to categories" ON categories USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');
CREATE POLICY "Admins full access to posts" ON posts USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');
    `.trim();

    res.json({
      supabaseConfigured: isConfigured,
      supabaseUrl: process.env.SUPABASE_URL ? `${process.env.SUPABASE_URL.slice(0, 15)}...` : null,
      storageBucket: process.env.SUPABASE_STORAGE_BUCKET || 'prompt-images',
      sqlSchema
    });
  });

  // ----------------------------------------------------
  // VITE DEV MIDDLEWARE OR PRODUCTION STATIC SERVING
  // ----------------------------------------------------
  const isProduction = process.env.NODE_ENV === 'production';

  async function startServer() {
    if (!isProduction && !isVercel) {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa'
      });
      app.use(vite.middlewares);
    } else if (!isVercel) {
      const distPath = path.join(__dirname, 'dist');
      app.use(express.static(distPath));
      app.get('*', (_req: Request, res: Response) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    if (!isVercel) {
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`TS Prompt Store Server running on http://0.0.0.0:${PORT}`);
      });
    }
  }

  if (!isVercel) {
    startServer().catch((err) => {
      console.error('Fatal server startup error:', err);
      process.exit(1);
    });
  }

  export default app;
