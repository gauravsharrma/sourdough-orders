# Deploying Sourdough Orders to Netlify

## Important: SQLite Won't Work on Netlify

Netlify uses serverless functions with a **read-only filesystem** — your SQLite database can't write data there. You need to swap to **Turso**, a cloud-hosted SQLite service (free tier: 500 DBs, 9 GB storage). Your queries stay the same since Turso speaks SQLite.

---

## Step 1: Create a Turso Database

1. Install the Turso CLI:
   ```bash
   # macOS/Linux
   curl -sSfL https://get.tur.so/install.sh | bash

   # Windows (use WSL or scoop)
   scoop install turso
   ```

2. Sign up and authenticate:
   ```bash
   turso auth signup    # or: turso auth login
   ```

3. Create a database:
   ```bash
   turso db create sourdough-orders
   ```

4. Get your database URL:
   ```bash
   turso db show sourdough-orders --url
   # Output: libsql://sourdough-orders-<your-username>.turso.io
   ```

5. Create an auth token:
   ```bash
   turso db tokens create sourdough-orders
   # Output: eyJhbGci... (save this)
   ```

---

## Step 2: Update the App for Turso

1. Install the Turso driver:
   ```bash
   npm install @libsql/client
   ```

2. Replace `src/db/index.ts` with:
   ```ts
   import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
   import { drizzle as drizzleLibsql } from "drizzle-orm/libsql";
   import * as schema from "./schema";

   function createDb() {
     const url = process.env.DATABASE_URL || "";

     if (url.startsWith("file:") || url.endsWith(".db")) {
       // Local development — use better-sqlite3
       const Database = require("better-sqlite3");
       const path = require("path");
       const dbPath = url.startsWith("file:")
         ? path.resolve(process.cwd(), url.replace("file:", "").replace("./", ""))
         : url;
       const sqlite = new Database(dbPath);
       sqlite.pragma("journal_mode = WAL");
       sqlite.pragma("foreign_keys = ON");
       return drizzleSqlite(sqlite, { schema });
     }

     // Production — use Turso (libsql)
     const { createClient } = require("@libsql/client");
     const client = createClient({
       url,
       authToken: process.env.TURSO_AUTH_TOKEN,
     });
     return drizzleLibsql(client, { schema });
   }

   export const db = createDb();
   ```

3. Update `drizzle.config.ts` for Turso migrations:
   ```ts
   import { defineConfig } from "drizzle-kit";

   const isProduction = process.env.DATABASE_URL?.startsWith("libsql://");

   export default defineConfig({
     schema: "./src/db/schema.ts",
     out: "./drizzle",
     dialect: isProduction ? "turso" : "sqlite",
     dbCredentials: isProduction
       ? {
           url: process.env.DATABASE_URL!,
           authToken: process.env.TURSO_AUTH_TOKEN,
         }
       : { url: "./data/sourdough.db" },
   });
   ```

4. Push your schema to Turso:
   ```bash
   DATABASE_URL=libsql://sourdough-orders-<you>.turso.io \
   TURSO_AUTH_TOKEN=eyJhbGci... \
   npx drizzle-kit push
   ```

5. Seed the production database:
   ```bash
   DATABASE_URL=libsql://sourdough-orders-<you>.turso.io \
   TURSO_AUTH_TOKEN=eyJhbGci... \
   npx tsx scripts/seed.ts
   ```
   > Note: You may need to update `scripts/seed.ts` to use the same `createDb()` logic, or just run `seed.ts` locally pointed at your Turso URL.

---

## Step 3: Prepare for Netlify

1. Install the Netlify Next.js adapter:
   ```bash
   npm install @netlify/plugin-nextjs
   ```

2. Create `netlify.toml` in your project root:
   ```toml
   [build]
     command = "npm run build"
     publish = ".next"

   [[plugins]]
     package = "@netlify/plugin-nextjs"
   ```

3. Make sure `better-sqlite3` is not bundled in production. Add to `next.config.ts`:
   ```ts
   import type { NextConfig } from "next";

   const nextConfig: NextConfig = {
     serverExternalPackages: ["better-sqlite3"],
   };

   export default nextConfig;
   ```

---

## Step 4: Push to GitHub

```bash
git add -A
git commit -m "Prepare for Netlify deployment with Turso"
git remote add origin https://github.com/<your-username>/sourdough-orders.git
git branch -M main
git push -u origin main
```

---

## Step 5: Deploy on Netlify

1. Go to [app.netlify.com](https://app.netlify.com) and sign in (GitHub account works).

2. Click **"Add new site"** → **"Import an existing project"**.

3. Select **GitHub** and pick your `sourdough-orders` repository.

4. Netlify auto-detects Next.js. Confirm build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`

5. Click **"Show advanced"** → **"New variable"** and add your environment variables:

   | Key                         | Value                                              |
   |-----------------------------|---------------------------------------------------|
   | `DATABASE_URL`              | `libsql://sourdough-orders-<you>.turso.io`        |
   | `TURSO_AUTH_TOKEN`          | `eyJhbGci...`                                      |
   | `WHATSAPP_PHONE_NUMBER_ID`  | Your Phone Number ID from Meta Developer Console   |
   | `WHATSAPP_ACCESS_TOKEN`     | Your WhatsApp permanent access token               |
   | `WHATSAPP_VERIFY_TOKEN`     | A random string you choose                         |
   | `WHATSAPP_APP_SECRET`       | Your Meta App Secret                               |
   | `STRIPE_SECRET_KEY`         | `sk_live_...` (or `sk_test_...` for testing first) |
   | `STRIPE_PUBLISHABLE_KEY`    | `pk_live_...` (or `pk_test_...`)                   |
   | `STRIPE_WEBHOOK_SECRET`     | `whsec_...` (set after creating webhook below)     |
   | `NEXT_PUBLIC_APP_URL`       | `https://your-site-name.netlify.app`               |

6. Click **"Deploy site"**. Wait for the build to finish.

7. Once deployed, note your site URL (e.g., `https://sourdough-orders.netlify.app`).

---

## Step 6: Set Up a Custom Domain (Optional)

1. In Netlify: **Site settings** → **Domain management** → **Add custom domain**.
2. Enter your domain (e.g., `orders.mybakery.com`).
3. Follow the DNS instructions — either:
   - Point an **A record** to Netlify's load balancer IP, or
   - Add a **CNAME** record pointing to `your-site.netlify.app`
4. Netlify provides **free HTTPS** via Let's Encrypt automatically.

---

## Step 7: Configure WhatsApp Webhook (Production)

1. Go to [developers.facebook.com](https://developers.facebook.com) → Your App → WhatsApp → Configuration.

2. Set **Callback URL** to:
   ```
   https://your-site-name.netlify.app/api/webhooks/whatsapp
   ```

3. Set **Verify Token** to the same value as your `WHATSAPP_VERIFY_TOKEN` env var.

4. Click **"Verify and save"**.

5. Under **Webhook fields**, subscribe to **`messages`**.

6. **Go live:** In your Meta App, switch from Development to Live mode:
   - Go to **App Review** → Request permissions for `whatsapp_business_messaging`
   - Add a real phone number (not the test number) under WhatsApp > Phone Numbers
   - Complete business verification if required

---

## Step 8: Configure Stripe Webhook (Production)

1. Go to [dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks).

2. Click **"Add endpoint"**.

3. Set the **Endpoint URL** to:
   ```
   https://your-site-name.netlify.app/api/webhooks/stripe
   ```

4. Under **Events to send**, select:
   - `checkout.session.completed`

5. Click **"Add endpoint"**.

6. Copy the **Signing secret** (`whsec_...`).

7. Go back to Netlify → **Site settings** → **Environment variables** → update `STRIPE_WEBHOOK_SECRET` with the signing secret.

8. **Redeploy** the site so the new env var takes effect:
   - Netlify → **Deploys** → **Trigger deploy** → **Deploy site**

---

## Step 9: Go Live Checklist

- [ ] Switch Stripe from test mode to live mode (swap `sk_test_` → `sk_live_` keys)
- [ ] Switch WhatsApp app from Development to Live mode
- [ ] Verify your Turso database has seed data (products)
- [ ] Test the full flow: send a WhatsApp message → order → pay → check dashboard
- [ ] Set your real bakery name and pickup hours in Settings
- [ ] Update the welcome message for your customers
- [ ] Set a custom domain (optional but professional)
- [ ] Add password protection to the dashboard (Netlify → Site settings → Access control → Basic auth, or use Netlify Identity)

---

## Protecting Your Dashboard

Your dashboard is public by default. Options to lock it down:

### Option A: Netlify Basic Auth (Simplest)
1. Create a `_headers` file in your `public/` folder:
   ```
   /*
     Basic-Auth: yourusername:yourpassword
   ```
   > Note: This protects ALL pages including the API webhooks. To exclude webhooks, you'll need Option B.

### Option B: Netlify Identity (Recommended)
1. Enable **Netlify Identity** in Site settings → Identity.
2. Invite yourself as a user.
3. Add the Netlify Identity widget to your layout.
4. API routes (webhooks) remain publicly accessible for WhatsApp/Stripe.

### Option C: Middleware Auth
Add a simple auth check in `src/middleware.ts`:
```ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Skip auth for API routes (webhooks need public access)
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const auth = request.headers.get("authorization");
  const expected = "Basic " + btoa(process.env.DASHBOARD_USER + ":" + process.env.DASHBOARD_PASS);

  if (auth !== expected) {
    return new NextResponse("Unauthorized", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Dashboard"' },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/).*)"],
};
```
Then add `DASHBOARD_USER` and `DASHBOARD_PASS` to your Netlify env vars.

---

## Monitoring & Maintenance

- **Netlify logs:** Deploys → select a deploy → Function logs
- **Turso dashboard:** [app.turso.tech](https://app.turso.tech) — view data, run queries
- **Stripe dashboard:** Monitor payments, refunds, disputes
- **WhatsApp:** Meta Business Suite for message analytics

## Redeploying After Code Changes

```bash
git add -A
git commit -m "Your change description"
git push origin main
```

Netlify auto-deploys on every push to `main`. That's it.
