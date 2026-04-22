# bugket

Website hoc tieng Anh (UI tieng Viet) cho ca mobile va desktop, gom:

- Trang chu
- Trang hoc tu vung moi
- Trang tro choi (word search + sap xep lai tu)
- Trang chat voi AI qua Gemini API

## Chay du an local

1. Cai dependencies:

```bash
npm install
```

2. Tao `.env` (tu tao file moi) voi cac bien toi thieu:

```bash
PORT=3000
DATABASE_URL="postgresql://mouse@localhost:5432/bugket?schema=public"
JWT_SECRET="replace_with_strong_secret"
GEMINI_API_KEY="your_real_key_here"
GEMINI_MODEL="gemini-1.5-flash"
```

3. Khoi tao schema + seed:

```bash
npx prisma@5 migrate deploy
npm run db:seed
```

4. Chay server:

```bash
npm run dev
```

Truy cap: http://localhost:3000

## Deploy Vercel + Prisma Postgres

1. Trong Vercel Project Settings > Environment Variables, them:
- `DATABASE_URL` = `postgres://...@db.prisma.io:5432/postgres?sslmode=require`
- `JWT_SECRET` = secret manh (bat buoc)
- `GEMINI_API_KEY` = API key Gemini
- `GEMINI_MODEL` = tuy chon

2. Apply migration cho production database (truoc hoac trong release flow):

```bash
npm run db:migrate:deploy
```

3. Seed du lieu tu vung 1 lan cho production (neu can):

```bash
npm run db:seed
```

4. Redeploy tren Vercel va kiem tra cac endpoint:
- `GET /api/health`
- `GET /api/words?limit=5`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/user/me` (Bearer token)

## Bao mat

- Tuyet doi khong commit secret that (`DATABASE_URL`, `JWT_SECRET`, `GEMINI_API_KEY`) vao git.
- Neu key/URL da bi lo, rotate ngay truoc khi chay production.
