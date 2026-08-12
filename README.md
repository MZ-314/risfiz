# RisFiz — Our Growing Plant

A private static website for **Mustafiz Ahmed (Fiz)** and **Rismaditi Arinda (Ris)** — your shared diary, growing like a plant with every memory.

Yellow is Ris. Green is Fiz. Colors match [sharqiclasses.in](https://sharqiclasses.in).

## Quick Start

```bash
# Python
python -m http.server 8080

# Node
npx serve .
```

Visit `http://localhost:8080`

## Customize Content

Everything personal lives in **`memories.json`** and **`assets/images/`**.

### 1. Messages (FormSubmit)

Messages use [FormSubmit](https://formsubmit.co) — no API keys, no monthly limit, no extra setup.

Recipient emails live in `memories.json` under `site.fiz.email` and `site.ris.email`:

- **Fiz** green box → sends to Ris
- **Ris** yellow box → sends to Fiz

The first time someone sends to an address, FormSubmit emails that person a one-time activation link — click it once and you're set.

**If Kaspersky blocks the confirmation:** the message often still delivers. The site shows a yellow warning instead of an error so you don't click Send again by mistake. You can whitelist `formsubmit.co` in Kaspersky if you want a clean success message.

### 2. Add Memories (plant branches)

Each memory becomes a branch on the growing plant. Scroll down to walk back through time.

```json
{
  "date": "15 March 2025",
  "sortDate": "2025-03-15",
  "image": "assets/images/my-photo.jpg",
  "caption_en": "What happened that day...",
  "caption_id": "Apa yang terjadi hari itu..."
}
```

- **`sortDate`** controls order (newest at top, oldest at bottom/roots)
- Add photos to `assets/images/` and reference them in `"image"`

### 3. Edit the Roots Section

The bottom of the plant is "Before We Began" — edit the `roots` section in `memories.json` for your buildup story.

### 4. Optional Background Music

Add `assets/audio/ambient.mp3` — a music button appears after opening the envelope.

## Deploy on Vercel

1. Push this folder to a GitHub repo
2. Import the repo at [vercel.com](https://vercel.com)
3. Deploy — static site only; messages work via FormSubmit
4. Use an unguessable URL and share only with each other

## Site Flow

1. **Tap the envelope** — wax seal with RisFiz
2. **Hero** — Fiz & Ris, days together, Guwahati ↔ Bontang
3. **Our Plant** — scroll down through memories (newest → oldest)
4. **Roots** — the story before 1 November 2024
5. **Messages** — green box (Fiz → Ris), yellow box (Ris → Fiz)

## File Structure

```
├── index.html
├── memories.json       ← edit this
├── robots.txt          ← blocks search engines
├── css/style.css
├── js/main.js
└── assets/
    ├── images/         ← your photos
    └── audio/          ← optional ambient.mp3
```

## Privacy

- `robots.txt` blocks crawlers
- `noindex` meta tag in HTML
- Keep the Vercel URL private — only share between you two

---

Growing together since 1 November 2024.
