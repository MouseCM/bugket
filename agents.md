# Bugket Project Context
*This file is used to provide context and rules for AI assistants working on this project.*

## 📌 Project Overview
**Bugket** is an English learning web application designed to help users practice speaking, vocabulary, and listening with the help of AI (Google Gemini).

- **Tech Stack:**
  - Frontend: Vanilla HTML/CSS/JS (no framework, Lucide Icons via CDN for icons, Animate.css for animations, SweetAlert2 for popups)
  - Backend: Node.js, Express.js
  - Database: PostgreSQL (local, user: `mouse`, db: `bugket`, port: `5432`)
  - ORM: Prisma v5 (`npx prisma@5` — DO NOT upgrade to v7+)
  - AI Engine: Google Generative AI (Gemini 1.5 Flash / gemini-3-flash-preview)
  - Auth: JWT (jsonwebtoken) + bcryptjs for password hashing

## 📁 Key File Structure
- `server.js`: Main backend — Express routes, Prisma client, AI integrations, Auth APIs.
- `prisma/schema.prisma`: Database models — `User`, `Word`.
- `prisma/seed.js`: Seeds 200 vocabulary words from `data/words.json`.
- `gen_words.js`: Script to regenerate `data/words.json` (run with `node gen_words.js`).
- `public/`: All frontend assets.
  - `index.html`: Home page.
  - `login.html`: Login page (2-column glassmorphism layout).
  - `register.html`: Register page (same layout as login).
  - `dashboard.html`: User personal dashboard (requires login).
  - `chat.html`: Conversation & pronunciation practice.
  - `learn.html`: Vocabulary lists & flashcards.
  - `games.html`: Games landing — Flappy Bird, Word Search, Unscramble, Match, Quiz.
  - `js/auth.js`: Auth logic — login form, register form, JWT localStorage, navbar avatar/dropdown.
  - `js/chat.js`: Chat & pronunciation JS logic.
  - `js/dashboard.js`: Dashboard page logic (fetch user stats).
  - `styles.css`: Global styles — dark theme, design tokens, components.

## ⚙️ Core Philosophies
1. **No External Frontend Frameworks:** Stick to Vanilla CSS and JS unless explicitly requested. Avoid TailwindCSS, React, etc.
2. **Design First:** Create rich, immersive interfaces (smooth animations, gradients, responsive designs, glassmorphism) using `styles.css`. Never leave UI looking basic.
3. **Robust Backend:** Secure configuration limits via `.env`. Database integration via Prisma for typesafety and readable asynchronous queries.
4. **Gamification:** Encourage user learning via simple but visually appealing HTML canvas or DOM-based games.

## 🔑 AI Features
- **Conversational Chat:** Maintains history context constraints to feed API dynamically.
- **Pronunciation Checking:** Uses Gemini to analyze transcript vs target string → score/100 + IPA + feedback.
- **Voice APIs:** Web Speech API (`speechSynthesis`, `SpeechRecognition`) on client side.
- **Voice Settings:** User can select AI voice and speech rate from the chat UI settings panel.

## 🗄️ Database Schema (Prisma)
```
model User {
  id             Int      @id @default(autoincrement())
  email          String   @unique
  password       String   // (bcrypt hashed)
  name           String
  streak         Int      @default(0)
  wordsLearned   Int      @default(0)
  estimatedLevel String   @default("A1")
  createdAt      DateTime @default(now())
}

model Word {
  id         Int     @id @default(autoincrement())
  english    String  @unique
  vietnamese String
  level      String  (A1, A2, B1, B2, C1)
  ipa        String?
  example    String?
}
```

## 🔐 Auth & User API Routes
- `POST /api/auth/register` — { email, password, name } → creates user
- `POST /api/auth/login`    — { email, password } → returns JWT & user info
- `GET /api/user/me`        — returns { name, streak, wordsLearned, estimatedLevel }
- JWT stored in `localStorage` as `token`, user info object as `user` (JSON string)

## 📦 Key Commands
```bash
npm install              # Install dependencies
node gen_words.js        # Regenerate data/words.json
npx prisma@5 db push     # Sync schema to DB
npx prisma@5 db seed     # Seed vocabulary
npm run dev              # Start dev server (port 3000)
```

## ⚠️ Important Notes
- Always use `npx prisma@5` (NOT `npx prisma`) to avoid auto-installing Prisma v7+ which has breaking changes.
- The `DATABASE_URL` in `.env` is `postgresql://mouse@localhost:5432/bugket?schema=public`.
- `JWT_SECRET` is in `.env` — never expose it to the client.
- The word list in `server.js` has been fully removed — all vocabulary comes from PostgreSQL via Prisma.
