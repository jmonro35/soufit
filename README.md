# SouFit

Fitness accountability app with a sou sou-style pot. Work out 5x/week, hit nutrition goals 5x/week, miss a goal → $5 to the pot. Best record at month's end wins it all.

---

## Deploy in 4 steps

### 1. Install dependencies
```bash
npm install
```

### 2. Test locally
```bash
npm run dev
```
Open http://localhost:5173 — should load the SouFit welcome screen.

### 3. Push to GitHub
```bash
git init
git add .
git commit -m "SouFit initial"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/soufit.git
git push -u origin main
```

### 4. Deploy on Vercel
1. Go to vercel.com → New Project
2. Import your `soufit` GitHub repo
3. Framework preset: **Vite**
4. Click Deploy
5. Done — Vercel gives you a live URL like `soufit.vercel.app`

Share that URL with your friends. That's it.

---

## Firebase setup reminder
In the Firebase console → Firestore → Rules, make sure you're in **test mode** (allows all reads/writes). For production later you can tighten the rules.

## Cloudinary reminder
Regenerate your API secret at cloudinary.com → Settings → Security since it was exposed. The app only uses your cloud name + upload preset, which are safe to be public.

---

## How the app works
- **Create Group** → you become the pot holder, get a 6-char invite code
- **Share the code** → friends enter it when they join
- **Everyone sets their own calorie goals** based on their body stats (Mifflin-St Jeor formula)
- **Green zone** = food goal minus 500 to food goal (over = miss, under = miss)
- **Workout proof** = paste a photo (no camera permission needed)
- **Venmo** = app opens pre-filled when someone owes money
