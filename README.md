# Workout Tracker

Bilingual (EN/AR) workout tracking PWA with progress charts and YouTube video links per exercise.

## Deploy to GitHub Pages

1. Create a new repo on GitHub named `workout-tracker`
2. If you use a **different repo name**, update `base` in `vite.config.js`:
   ```js
   base: '/your-repo-name/',
   ```
3. Push the code:
   ```bash
   git init
   git add .
   git commit -m "initial commit"
   git branch -M main
   git remote add origin https://github.com/WillyYaPlzz/workout-tracker.git
   git push -u origin main
   ```
4. In GitHub → repo → **Settings → Pages** → Source: select **GitHub Actions**
5. The workflow runs automatically on push. Your site will be live at:
   ```
   https://YOUR_USERNAME.github.io/workout-tracker/
   ```

## Local dev

```bash
npm install
npm run dev
```

## Add to Home Screen (iOS)

Open the deployed URL in Safari → Share → Add to Home Screen. The app runs standalone with safe-area insets for notch/Dynamic Island.
