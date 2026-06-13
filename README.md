# PearlyPath AI — Deployment Guide

## What's in this folder
```
pearlypath/
├── api/
│   └── chat.js          ← Vercel serverless function (keeps API key secret)
├── src/
│   ├── main.jsx         ← React entry point
│   └── App.jsx          ← Full app (DO NOT share publicly — contains logo)
├── index.html
├── package.json
├── vite.config.js
├── vercel.json
└── .gitignore
```

---

## Step-by-Step Deployment

### 1. Install Node.js
Download from https://nodejs.org — install the LTS version.

### 2. Get your Anthropic API key
- Go to https://console.anthropic.com
- Sign up / log in
- Click "API Keys" → "Create Key"
- Copy the key (starts with `sk-ant-...`)
- Add some credit ($5 is enough for a presentation)

### 3. Create a GitHub repository
- Go to https://github.com and sign in (or create account)
- Click "New repository"
- Name it `pearlypath-ai`, set to **Private**
- Click "Create repository"

### 4. Upload the project to GitHub
Option A — GitHub Desktop (easiest):
- Download GitHub Desktop from https://desktop.github.com
- File → Add Local Repository → select this folder
- Commit "Initial commit" → Push to origin

Option B — Terminal:
```bash
cd pearlypath
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOURUSERNAME/pearlypath-ai.git
git push -u origin main
```

### 5. Deploy to Vercel
- Go to https://vercel.com and sign up with your GitHub account
- Click "Add New Project"
- Import your `pearlypath-ai` repository
- Under "Framework Preset" select **Vite**
- Click "Environment Variables" and add:
  - Name: `ANTHROPIC_API_KEY`
  - Value: paste your `sk-ant-...` key
- Click **Deploy**

### 6. Get your live URL
Vercel will give you a URL like:
`https://pearlypath-ai.vercel.app`

That's your app — live, working, shareable!

### 7. Generate your QR code
- Go to https://qr.io or https://www.qrcode-monkey.com
- Paste your Vercel URL
- Download the QR code image
- Print it or display it on a screen at your presentation

---

## Updating the app later
Just edit `src/App.jsx`, commit, and push to GitHub.
Vercel auto-deploys every push — live within ~60 seconds.

---

## Important notes
- Your API key is stored securely in Vercel's environment variables
- It is NEVER exposed to the browser — all AI calls go through `/api/chat`
- The `.gitignore` ensures `.env` files are never accidentally pushed
