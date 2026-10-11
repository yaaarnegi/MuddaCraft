# 🌾 MuddaCraft Studio - Artisanal E-Commerce Store

An authentic, eco-friendly e-commerce website for handcrafted **Mudda** stools and chairs made from sustainable Sarkanda river reeds, bamboo, and organic jute cord.

---

## 🚀 Quick Start

This project requires **zero external npm installations** to run. It uses native modern JavaScript, CSS design systems, and a zero-dependency Node.js server.

### 1. Run the Local Server
```bash
# Start with Node
npm start
# or
node server.js
```
The store will be live at: **`http://localhost:3000`**

### 2. Or Open Directly in Any Browser
You can also open `index.html` directly in your browser without any server:
```bash
open index.html
```

---

## 📁 Project Structure

```
mudda-store/
├── .agents/skills/  # 5 Installed AI Agent Skills (GSAP, Three.js, Design DNA, Motion, Genjutsu)
│   ├── gsap-skills/SKILL.md
│   ├── threejs-skills/SKILL.md
│   ├── design-dna/SKILL.md
│   ├── motion-design/SKILL.md
│   └── genjutsu/SKILL.md
├── index.html       # Storefront with 3D studio modal & frosted Liquid Glass UI
├── styles.css       # Artisanal design system + Apple Liquid Glass frosted panels
├── app.js           # Catalog state, category filters, cart drawer, checkout logic
├── animations.js    # Lenis smooth scroll, GSAP ScrollTrigger, ambient fiber canvas
├── three-viewer.js  # Interactive Three.js WebGL 3D Mudda Stool inspection studio
├── server.js        # Zero-dependency local Node.js static & mock API server
├── package.json     # Project scripts and metadata
└── README.md        # Documentation and multi-agent instructions
```

---

## 🤝 Pairing with OpenAI Codex on This Repository

This repository is set up so you can work on it with **Antigravity** and **OpenAI Codex** simultaneously:

### How to Open with Codex:
1. Open your **Codex desktop app**, **Codex CLI**, or **IDE extension**.
2. Select this folder:
   `/Users/negib/.gemini/antigravity/scratch/mudda-store`

### Great Tasks for Codex to Build Next:
* **Stripe Payment Gateway:** Ask Codex:
  > *"Add a real Stripe Checkout backend route to `server.js` and connect the modal pay button."*
* **Product Review Submission:** Ask Codex:
  > *"Add a form in `index.html` and logic in `app.js` allowing customers to submit a star rating and photo review."*
* **Admin Inventory Dashboard:** Ask Codex:
  > *"Create an `admin.html` page to view incoming orders from `localStorage` or the server and toggle inventory stock."*
* **SQLite / Database Persistence:** Ask Codex:
  > *"Add a SQLite database to save orders and products persistently on the server."*

### How Antigravity Can Assist:
* Run the server, verify endpoints, and test changes made by Codex.
* Check git diffs, ensure code quality, and fix linting or syntax errors.
* Build automated browser tests or additional responsive features.
