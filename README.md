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

### 1. Messages (email setup on Vercel)

Messages go through **your own site** at `/api/send`, using [Web3Forms](https://web3forms.com) on the server (no email in the URL — Kaspersky-friendly).

**One-time setup (~5 min):**

1. Go to [web3forms.com](https://web3forms.com) and create **two forms**:
   - Form 1: recipient **`rismaditiarindaa@gmail.com`** (for Fiz → Ris) → copy its **Access Key**
   - Form 2: recipient **`aimjetkhalifa10@gmail.com`** (for Ris → Fiz) → copy its **Access Key**

2. In Vercel → your project → **Settings → Environment Variables**, add:

| Name | Value |
|------|-------|
| `WEB3FORMS_KEY_TO_RIS` | access key from form 1 (delivers to Ris) |
| `WEB3FORMS_KEY_TO_FIZ` | access key from form 2 (delivers to Fiz) |

3. **Redeploy** the site

- **Fiz** green box → sends to Ris
- **Ris** yellow box → sends to Fiz

You can remove old `RESEND_API_KEY` / `FIZ_EMAIL` / `RIS_EMAIL` vars if you added them — they're no longer used.

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
3. Add the Web3Forms environment variables above (for messages)
4. Deploy — Vercel runs the static site **and** the `/api/send` function
5. Use an unguessable URL and share only with each other

## Site Flow

1. **Tap the envelope** — wax seal with F+R
2. **Hero** — Fiz & Ris, days together, Kohima ↔ Bontang
3. **Our Plant** — scroll down through memories (newest → oldest)
4. **Roots** — the story before 1 November 2024
5. **Messages** — green box (Fiz → Ris), yellow box (Ris → Fiz)

## File Structure

```
├── api/send.js         ← sends messages (Vercel serverless)
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
