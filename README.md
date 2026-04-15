# bugket

Website học tiếng Anh (UI tiếng Việt) cho cả mobile và desktop, gồm:

- Trang chủ
- Trang học từ vựng mới
- Trang trò chơi (word search + sắp xếp lại từ)
- Trang chat với AI qua Gemini API

## Chạy dự án

1. Cài dependencies:

```bash
npm install
```

2. Tạo file `.env`:

```bash
cp .env.example .env
```

3. Điền key:

```bash
PORT=3000
GEMINI_API_KEY=your_real_key_here
GEMINI_MODEL=gemini-1.5-flash
```

4. Chạy:

```bash
npm run dev
```

Truy cập: http://localhost:3000
