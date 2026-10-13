# TS Prompt Store — Setup & Deployment Guide

This guide details the architecture, configuration, hosting options, and administration procedures for **TS Prompt Store**.

---

## 1. Environment Variables

Create a `.env` file in the project root (see `.env.example`):

```bash
# Server Port
PORT=3000

# App URL for absolute link generation and sitemaps
APP_URL="https://yourdomain.com"

# Admin Authentication
ADMIN_EMAIL="admin@tspromptstore.com"
ADMIN_PASSWORD="YourSecurePasswordHere!"
SESSION_SECRET="generate-a-strong-random-secret-key"

# Optional External Supabase Integration (if desired)
SUPABASE_URL=""
SUPABASE_SERVICE_ROLE_KEY=""
SUPABASE_STORAGE_BUCKET="prompt-images"
```

---

## 2. Default Initial Administrator

When the server starts for the first time without an existing database file:
- **Default Email:** `admin@tspromptstore.com`
- **Default Password:** `AdminSecurePrompt2026!` (or the value of `ADMIN_PASSWORD` in your `.env`)
- Passwords are salt-hashed using **PBKDF2 with SHA-512** (10,000 iterations). Plaintext passwords are never saved.
- You can change your password anytime inside the Admin Dashboard under the **Admin Security** tab.

---

## 3. Hidden Admin Panel Route

The administrative portal is hosted exclusively at the secret URL:

```
https://yourdomain.com/Admin-nexappo-tahsin-2013
```

### Security Measures:
- This URL is **not linked anywhere** on the public website (no footer, header, menu, or sitemap references).
- Visiting the route while unauthenticated displays the Admin Login form.
- Direct API calls to `/api/admin/*` are protected with server-side bearer session verification. Unauthenticated requests are rejected with `401 Unauthorized`.
- Sessions expire after 24 hours.

---

## 4. Database & Storage Architecture (Zero-Firebase)

TS Prompt Store comes with a high-performance, persistent server engine:
- **Database:** Atomic persistent JSON database (`data/db.json`) with safe temp-file swapping to prevent data corruption.
- **Image Storage:** Multi-part file upload with type validation (JPG, PNG, WebP) and size limits (10MB), stored in `/uploads/` and served statically.
- **Sample Data Management:** Initial curated posts are flagged with `is_sample: true`. You can click **"Remove All Sample Posts"** in the Admin Dashboard at any time to wipe sample data with one click.

### Optional Supabase Integration:
If you want to use Supabase instead of the built-in storage:
1. Create a project at [supabase.com](https://supabase.com).
2. Go to the SQL Editor and execute the schema:

```sql
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

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public categories are viewable by everyone" ON categories FOR SELECT USING (true);
CREATE POLICY "Published posts are viewable by everyone" ON posts FOR SELECT USING (status = 'published');
```

3. Provide `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env`.

---

## 5. Deployment Options

### Deployment on Vercel (ভার্সেল ডিপ্লয়মেন্ট):
The project is configured for Vercel with `vercel.json` and `/api/index.ts`.

1. **Push your code to GitHub / GitLab / Bitbucket.**
2. **Log into Vercel** ([vercel.com](https://vercel.com)) and click **"Add New..." &rarr; "Project"**.
3. **Import your Git repository.**
4. **Build and Output Settings:**
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. **Environment Variables (Optional / Recommended):**
   - `ADMIN_EMAIL`: Your custom admin email
   - `ADMIN_PASSWORD`: Your secret admin password
   - `SESSION_SECRET`: Random 32+ character string
   - `APP_URL`: Your Vercel production URL (e.g., `https://ts-prompt-store.vercel.app`)
   - `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`: (Optional) for persistent Supabase database
6. Click **Deploy**. Vercel will build the frontend into `dist/` and route API / dynamic routes through `/api/index.ts` automatically!

### Deployment on Render / Railway / VPS / Cloud Run:
1. Build: `npm run build`
2. Start: `npm start` (runs `tsx server.ts`)
3. The server handles both the API endpoints (`/api/*`), image uploads (`/uploads/*`), sitemap (`/sitemap.xml`), and serves the compiled SPA frontend.

---

## 6. Verification Checklist

1. **Homepage:** Clean white-and-blue theme, text logo "TS Prompt Store", search bar.
2. **Mobile View:** Exactly 2 prompt cards per row.
3. **Prompt Detail:** Accessible at `/prompt/:slug`, displays title &rarr; image &rarr; prompt box &rarr; Copy Prompt button &rarr; AI platform shortcuts &rarr; related prompts.
4. **Copy Action:** Clicking "Copy Full Prompt" displays "Prompt copied successfully!".
5. **AI Shortcuts:** Verified URLs for Google Gemini, ChatGPT, Google Flow, Grok, and Google AI Studio open in new tabs.
6. **Admin Panel:** Visit `/Admin-nexappo-tahsin-2013` to test login, creating posts, editing, deleting, category management, and image upload.
