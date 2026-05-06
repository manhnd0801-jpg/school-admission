# School Admission — Landing Page + CMS Tuyển Sinh THPT

Hệ thống landing page giới thiệu trường THPT kết hợp CMS quản lý nội dung, bài viết và lead tuyển sinh.

## Tính năng

- **Landing Page** — Hero, giới thiệu, chương trình đào tạo, thành tích, cơ sở vật chất, giáo viên, học phí, testimonials, form đăng ký
- **CMS Nội dung** — Chỉnh sửa từng section trên landing page, lịch sử thay đổi, khôi phục phiên bản cũ
- **CMS Bài viết** — Soạn thảo với TipTap editor, lên lịch xuất bản, quản lý trạng thái (Draft → Pending → Published)
- **CMS Lead** — Quản lý danh sách đăng ký tư vấn, phân công nhân viên, ghi chú, xuất Excel
- **Phân quyền** — Admin và Staff với NextAuth.js
- **Background Workers** — BullMQ xử lý xuất Excel, gửi email thông báo, lên lịch xuất bản bài viết

## Tech Stack

| Layer | Công nghệ |
|---|---|
| Framework | Next.js 14 (App Router) |
| Database | PostgreSQL + Prisma ORM |
| Cache / Queue | Redis + BullMQ |
| Auth | NextAuth.js v4 |
| Editor | TipTap |
| Storage | AWS S3 / Cloudflare R2 |
| Email | Nodemailer (SMTP) |
| Styling | Tailwind CSS |
| Validation | Zod |
| Testing | Vitest + fast-check (property-based) |

## Yêu cầu

- Node.js >= 20
- PostgreSQL
- Redis

## Cài đặt

```bash
# 1. Clone repo
git clone https://github.com/manhnd0801-jpg/school-admission.git
cd school-admission

# 2. Cài dependencies
npm install

# 3. Cấu hình biến môi trường
cp .env.example .env
# Chỉnh sửa .env với thông tin thực tế

# 4. Khởi tạo database
npm run db:migrate

# 5. Seed dữ liệu mẫu
npm run db:seed

# 6. Chạy development server
npm run dev
```

Truy cập [http://localhost:3000](http://localhost:3000)

## Biến môi trường

| Biến | Mô tả |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection URL |
| `NEXTAUTH_SECRET` | JWT secret (tạo bằng `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | URL của ứng dụng |
| `S3_BUCKET_NAME` | Tên S3/R2 bucket lưu ảnh upload |
| `S3_ACCESS_KEY_ID` | AWS/R2 access key |
| `S3_SECRET_ACCESS_KEY` | AWS/R2 secret key |
| `S3_PUBLIC_URL` | CDN URL public cho file upload |
| `SMTP_HOST` | SMTP server host |
| `SMTP_USER` | SMTP username |
| `SMTP_PASSWORD` | SMTP password |
| `NOTIFICATION_EMAIL` | Email nhận thông báo lead mới |
| `NEXT_PUBLIC_SCHOOL_NAME` | Tên trường hiển thị trên site |

Xem đầy đủ tại [`.env.example`](.env.example).

## Scripts

```bash
npm run dev           # Development server
npm run build         # Build production
npm run start         # Production server
npm run worker        # Chạy background workers
npm run test          # Chạy tests
npm run test:coverage # Test coverage
npm run db:migrate    # Chạy migrations
npm run db:seed       # Seed dữ liệu mẫu
npm run db:studio     # Mở Prisma Studio
```

## Cấu trúc thư mục

```
src/
├── app/
│   ├── (public)/          # Landing page, tin tức
│   ├── admin/             # CMS admin pages
│   └── api/               # API routes
├── components/
│   └── landing/           # Các section của landing page
├── lib/                   # Utilities (auth, prisma, redis, queue, ...)
├── schemas/               # Zod schemas validate nội dung section
├── types/                 # TypeScript types
└── workers/               # BullMQ background workers
prisma/
├── schema.prisma          # Database schema
└── seed.ts                # Seed script
```

## Deploy với Docker

```bash
docker-compose up -d
```

## License

Private — All rights reserved.
