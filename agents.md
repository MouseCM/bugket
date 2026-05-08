# Bugket Project Context
*This file is used to provide context and rules for AI assistants working on this project.*

## 📌 Project Overview
**Bugket** is an English learning web application designed to help users practice speaking, vocabulary, and listening with the help of AI (Google Gemini).

- **Tech Stack:**
  - Frontend: Vanilla HTML/CSS/JS (Lucide Icons via CDN, Animate.css, SweetAlert2)
  - Backend: Node.js, Express.js
  - Database: PostgreSQL via Prisma Accelerate (cloud proxy)
  - AI Engine: Google Generative AI (Gemini 1.5 Flash / gemini-3-flash-preview)
  - Auth: JWT (jsonwebtoken) + bcryptjs password hashing
  - Email: Nodemailer (Gmail SMTP) for forgot-password OTP

## 📁 Project Structure

```
bugket/
├── server.js              # App entry point — mounts routes, serves static files
├── package.json           # Dependencies & npm scripts
├── .env                   # Env vars (never commit)
├── vercel.json            # Vercel deployment config
│
├── lib/                   # Shared utility modules (no routes here)
│   ├── prisma.js          # Singleton PrismaClient
│   ├── gemini.js          # GoogleGenerativeAI client + error detector
│   ├── jwt.js             # signToken, verifyToken, requireAuth middleware
│   └── mailer.js          # Nodemailer Gmail transporter
│
├── routes/                # Express Router modules (one file per domain)
│   ├── auth.js            # POST /api/auth/{register,login,forgot-password,reset-password}
│   ├── user.js            # GET /api/user/me, POST /api/user/progress, GET /api/user/rankings
│   ├── words.js           # GET /api/words
│   ├── chat.js            # GET /api/chat/topics, POST /api/chat, POST /api/chat/pronunciation
│   └── games.js           # GET /api/games/word-search
│
├── prisma/
│   ├── schema.prisma      # DB models: User, Word
│   └── seed.js            # Seeds vocabulary from scripts/seed_true_words.js data
│
├── scripts/
│   └── seed_true_words.js # Generates & seeds 200 vocabulary words via Gemini
│
└── public/                # Static frontend (served by Express)
    ├── index.html         # Home page
    ├── login.html         # Login (2-col glassmorphism)
    ├── register.html      # Register (same layout)
    ├── forgot-password.html # 3-step OTP forgot password
    ├── dashboard.html     # User dashboard + rankings
    ├── chat.html          # AI conversation practice
    ├── learn.html         # Vocabulary flashcards + pronunciation
    ├── games.html         # Games landing
    ├── games-flappy.html  # Flappy Bird (space rocket theme)
    ├── games-match.html   # Word matching game
    ├── games-quiz.html    # Multiple-choice quiz
    ├── games-unscramble.html # Word unscramble
    ├── games-word-search.html # Word search puzzle
    ├── styles.css         # Global dark-theme design system
    ├── logo.png           # App logo
    └── js/
        ├── auth.js        # Navbar, login form, register form logic
        ├── home.js        # Home page ambient animations
        ├── word-intent.js # Fetch & render vocab on home/dashboard
        ├── learn.js       # Flashcard, pronunciation, progress tracking
        ├── chat.js        # AI chat + pronunciation practice
        ├── dashboard.js   # Dashboard stats + rankings
        ├── animations.js  # Scroll reveal & ambient mouse animations
        ├── games.js       # Games landing page logic
        ├── games-flappy.js
        ├── games-match.js
        ├── games-quiz.js
        ├── games-unscramble.js
        └── games-word-search.js
```

## ⚙️ Core Philosophies
1. **No External Frontend Frameworks:** Vanilla CSS/JS only (no React, Tailwind, etc.)
2. **Design First:** Rich dark-mode, glassmorphism, smooth animations via `styles.css`
3. **Modular Backend:** Each concern (auth, user, chat, words, games) lives in its own `routes/*.js`; shared helpers go in `lib/*.js`
4. **Gamification:** Streak, words-learned counter, CEFR level auto-update as users practice

## 🔑 AI Features
- **Conversational Chat:** Gemini with multi-turn history, 8 topic presets
- **Pronunciation Grading:** Gemini evaluates Web Speech API transcript vs. target word → score/100 + IPA + feedback
- **Voice APIs:** Web Speech API (`speechSynthesis`, `SpeechRecognition`) on client

## 🗄️ Database Schema (Prisma)
```
model User {
  id                   Int       @id @default(autoincrement())
  email                String    @unique
  password             String    // bcrypt hashed
  name                 String
  streak               Int       @default(0)
  wordsLearned         Int       @default(0)
  estimatedLevel       String    @default("A1")  // A1-C2 (auto-calculated)
  lastLearnedAt        DateTime?                  // used for streak logic
  passwordResetToken   String?                    // 6-digit OTP
  passwordResetExpiry  DateTime?                  // OTP expiry (15 min)
  createdAt            DateTime  @default(now())
}

model Word {
  id         Int     @id @default(autoincrement())
  english    String  @unique
  vietnamese String
  level      String  // A1, A2, B1, B2, C1
  ipa        String?
  example    String?
}
```

## 📊 Progress Tracking Logic
**`POST /api/user/progress`** (called by `learn.js` on pronunciation score ≥ 50):
- `wordsLearned` increments by 1
- Streak logic uses `lastLearnedAt`:
  - Same day → streak unchanged
  - Next day → streak + 1
  - Missed a day → streak resets to 1
- `estimatedLevel` auto-recalculates:
  - 0–29 words → A1 | 30–59 → A2 | 60–99 → B1 | 100–149 → B2 | 150+ → C1

## 🔐 Auth & User API Routes
| Method | Endpoint | Body / Params | Description |
|--------|----------|---------------|-------------|
| POST | `/api/auth/register` | `{email, password, name}` | Create account |
| POST | `/api/auth/login` | `{email, password}` | Returns JWT + user |
| POST | `/api/auth/forgot-password` | `{email}` | Sends 6-digit OTP via email |
| POST | `/api/auth/reset-password` | `{email, code, newPassword}` | Verifies OTP, sets new password |
| GET | `/api/user/me` | Bearer token | Get live user stats |
| POST | `/api/user/progress` | Bearer token | Increment wordsLearned + streak |
| GET | `/api/user/rankings` | Optional Bearer | Top-10 boards (words, streak, level) |

## 📦 Key Commands
```bash
npm install              # Install all dependencies
npm run dev              # Start dev server (port 3000)
npm run db:push          # Sync Prisma schema to DB
npm run db:seed          # Seed 200 vocabulary words
node scripts/seed_true_words.js  # Regenerate word list via AI
```

## ⚠️ Important Notes
- Always use `npx prisma@5` (NOT `npx prisma`) to avoid Prisma v7+ breaking changes
- `DATABASE_URL` uses Prisma Accelerate cloud proxy (not a direct Postgres URL)
- JWT stored in `localStorage` as `token`; user object as `user` (JSON)
- Forgot-password email requires a **Gmail App Password** (not your Google account password)
  - Generate at: https://myaccount.google.com/apppasswords
  - Set `EMAIL_USER` and `EMAIL_PASS` in `.env`
- Legacy API aliases in `server.js`: `/api/pronunciation` → `/api/chat/pronunciation`, `/api/conversation-topics` → `/api/chat/topics`
