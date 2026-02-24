# How to run the Podcast Pitch app (step by step)

Follow these in order. You’ll need a Supabase account (free) and Node.js on your computer.

---

## Step 1: Open the project folder

In your terminal (or VS Code terminal), go into the project:

```bash
cd "c:\Users\andre\Downloads\Podcast Tool"
```

(Or whatever path you use to the “Podcast Tool” folder.)

---

## Step 2: Create a Supabase project

1. Go to **https://supabase.com** and sign in (or create a free account).
2. Click **New project**.
3. Pick an organization (or create one), name the project (e.g. “podcast-pitch”), set a database password (save it somewhere), choose a region, then click **Create project**.
4. Wait until the project is ready (green checkmark).

---

## Step 3: Add the database tables and sample data

1. In the Supabase dashboard, open your project.
2. In the left sidebar, click **SQL Editor**.
3. Click **New query**.
4. Open the file **`supabase/schema.sql`** from this project in a text editor. Copy **all** of its contents.
5. Paste into the Supabase SQL Editor and click **Run** (or press Ctrl+Enter). You should see “Success” and no errors.
6. Click **New query** again.
7. Open **`supabase/seed.sql`** from this project. Copy all of its contents.
8. Paste into the SQL Editor and click **Run**. Again you should see “Success”.

You now have the tables and 15 sample podcasts in the database.

---

## Step 4: Get your Supabase URL and key

1. In the Supabase sidebar, click **Project Settings** (gear icon at the bottom).
2. Click **API** in the left menu.
3. You’ll see:
   - **Project URL** (e.g. `https://xxxxx.supabase.co`) — copy this.
   - **Project API keys** — under “anon public”, click **Reveal** and copy that key (starts with `eyJ...`).

Keep these handy for the next step.

---

## Step 5: Tell the app how to connect to Supabase

1. In the “Podcast Tool” folder, find the file **`.env.local.example`**.
2. Copy it and rename the copy to **`.env.local`** (same folder).
3. Open **`.env.local`** in a text editor.
4. Replace the placeholders with your real values:
   - `NEXT_PUBLIC_SUPABASE_URL=` → paste your **Project URL** (from Step 4).
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY=` → paste your **anon** key (from Step 4).

Save the file. Leave `OPENAI_API_KEY` and `RESEND_API_KEY` empty for now (the app still works without them).

---

## Step 6: Set the auth redirect URL in Supabase

So “Log in with Google” and email confirmation links work:

1. In Supabase, go to **Authentication** → **URL configuration**.
2. Set **Site URL** to: `http://localhost:3001`
3. Under **Redirect URLs**, add: `http://localhost:3001/auth/callback`
4. Click **Save**.

(If you only use email/password and don’t use “Continue with Google”, you can skip this and still run the app.)

---

## Step 7: Install dependencies and start the app

Back in the project folder in your terminal:

```bash
npm install
```

Wait until it finishes. Then:

```bash
npm run dev
```

You should see something like “Ready on http://localhost:3001”.

---

## Step 8: Open the app in your browser

1. Open a browser and go to: **http://localhost:3001**
2. You should see the main landing page with “Get on podcasts without a PR team” and **Log in** / **Sign up**.
3. Click **Sign up**, create an account (email + password), then log in. You’ll be taken to the Dashboard.
4. Try **Discover** to see the sample podcasts, add some to your **Target list**, then **Generate pitches** from the target list.

---

## If something goes wrong

- **“Your project’s URL and API key are required”**  
  Your `.env.local` is missing or the URL/key are wrong. Check Step 5 and that the file is named exactly `.env.local` and is in the “Podcast Tool” folder.

- **“Failed to fetch” or auth errors**  
  Make sure the Site URL and Redirect URL in Supabase (Step 6) are exactly `http://localhost:3001` and `http://localhost:3001/auth/callback`.

- **No podcasts on Discover**  
  Run **`supabase/seed.sql`** again in the Supabase SQL Editor (Step 3).

- **`npm install` or `npm run dev` not found**  
  Install Node.js from https://nodejs.org (LTS version), then try again from the project folder.

Once the app is running, you can leave the terminal open; closing it stops the dev server. Run `npm run dev` again whenever you want to start it.
