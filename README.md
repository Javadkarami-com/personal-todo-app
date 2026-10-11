# My Tasks & Notes PWA — Flowbite & Tailwind Edition

A personal, offline-capable Progressive Web App built with pure vanilla JavaScript, styled entirely with **Flowbite components** and **Tailwind CSS**.

---

## 🛠️ Rebuilding the CSS

Whenever you edit `index.html`, `app.js`, or `tailwind.config.js`, recompile the static Tailwind CSS bundle with:

```bash
# Production minified build:
npx tailwindcss -i ./src/input.css -o ./dist/output.css --minify

# Or watch mode for rapid development:
npx tailwindcss -i ./src/input.css -o ./dist/output.css --watch
```

Only the utilities and Flowbite components actually in use are compiled into `dist/output.css` (~43 KB minified), keeping the PWA lightweight and fast.

---

## 📁 Project Architecture

```
todo-pwa/
├── dist/
│   └── output.css           # Compiled Tailwind CSS + Flowbite utilities
├── src/
│   └── input.css            # Base Tailwind directives + local @font-face rules
├── assets/
│   ├── armin.png            # Armin Department logo
│   ├── sasan.webp           # Gold Sassan Jewelry logo
│   └── favicon.png          # KhoshKam brand logo
├── fonts/                   # Bundled local offline fonts
│   ├── Vazirmatn-*.woff2    # Vazirmatn font (Arabic/Persian & Latin)
│   └── Nunito-*.woff2       # Nunito fallback
├── icons/                   # PWA icons (192x192, 512x512, maskable)
├── flowbite.min.js          # Offline Flowbite interactive JavaScript
├── index.html               # Main application shell with Flowbite markup
├── app.js                   # Application state, localStorage, and handlers
├── tailwind.config.js       # Custom theme colors (crimson, ivory, gold), fonts
├── manifest.json            # PWA standalone configuration
└── service-worker.js        # Offline cache manifest (v4)
```

---

## 🎨 Theme & Palette

- **Primary Red**: Deep Crimson (`#A4161A` / `primary-600`, with `#C1121F` on active/hover, `#FBEAEA` soft background)
- **Background**: Warm Ivory (`#FBF8F5` / `bg-ivory`)
- **Card Background**: Pure White (`#FFFFFF` / `bg-white`)
- **Text**: Rich Charcoal (`#1F2022` / `text-charcoal`) & Warm Gray (`#7A7471` / `text-muted`)
- **Gold Accent**: `#C9A227` (`border-gold/50`)
- **Border**: `#EDE6E0` (`border-borderwarm`)

---

## 🚀 How to Publish & Update on Your Phone

### Deploy:
- **Netlify**: Drag & drop the `todo-pwa` directory into your site's **Deploys** tab at [app.netlify.com](https://app.netlify.com).
- **GitHub Pages**:
  ```bash
  git add .
  git commit -m "Rewrite UI with Flowbite and Tailwind CSS"
  git push origin main
  ```

### Refresh on Mobile:
1. **iPhone**: Open the app, force close it from the iOS App Switcher (swipe up), and reopen it.
2. **Android**: Open the app, swipe down to reload (or tap **⋮ $\rightarrow$ Reload**), and reopen.
