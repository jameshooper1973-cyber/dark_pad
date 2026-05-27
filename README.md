# DarkPad — The Obsidian Editor

A gothic dark-themed rich text notepad built with Next.js. Deploy on Vercel in one click.

## Features

- **65 Google Fonts** — preview each font rendered in itself inside the dropdown
- **Rich text editing** — bold, italic, underline, strikethrough, alignment, colors, line height
- **Local Storage vault** — save, save-as, load, and delete named documents
- **Auto-save** — saves to localStorage every 2 seconds (toggleable)
- **Search & Replace** — find text/symbols/characters with optional case-sensitivity; replace one or all
- **Image insert at cursor** — click the 🖼 button to insert any image at the cursor position
- **Export to .txt** — plain text download
- **Export to .html** — styled HTML with embedded fonts
- **Export to .pdf** — paginated PDF via jsPDF
- **Export to Slides** — self-contained HTML slideshow (splits on blank lines, arrow-key navigation)
- **Keyboard shortcuts** — Ctrl+S save, Ctrl+F search, Ctrl+B/I/U formatting
- **Statusbar** — live word and character count
- **Splash page** — dramatic entry page with saved doc count

## Layout

```
Page 1 (/) → Splash / Entry
Page 2 (/notepad) → Editor
  ┌─────────────────────────────────┐
  │  TOOLBAR — 100px tall, full     │  ← grid row 1
  │  width (scrollable, 600+px)     │
  ├─────────────────────────────────┤
  │  [Search & Replace panel]       │  ← conditional row
  ├─────────────────────────────────┤
  │                                 │
  │     WRITING CANVAS              │  ← grid row 3 (fills remaining)
  │     contenteditable             │
  │                                 │
  ├─────────────────────────────────┤
  │  STATUS BAR — 28px              │  ← grid row 4
  └─────────────────────────────────┘
```

## Deploy to Vercel

```bash
# 1. Push to GitHub
git init
git add .
git commit -m "DarkPad initial"
git remote add origin https://github.com/YOUR_USERNAME/darkpad
git push -u origin main

# 2. Go to vercel.com → Import from GitHub → select repo → Deploy
```

No environment variables needed. All data stays in the browser.

## Local development

```bash
npm install
npm run dev
# → http://localhost:3000
```

## Stack

- Next.js 14 (Pages Router)
- React 18
- jsPDF (PDF export)
- Google Fonts API (font loading)
- LocalStorage (persistence)
