# Kế Hoạch Triển Khai: Landing Page + CMS Quản Lý Tuyển Sinh Trường THPT

## Tổng Quan

Triển khai hệ thống full-stack với Next.js (App Router), PostgreSQL + Prisma, NextAuth.js, BullMQ + Redis, AWS S3/R2, TipTap và Tailwind CSS. Các task được sắp xếp theo thứ tự tăng dần từ nền tảng hạ tầng đến tích hợp cuối cùng.

## Tasks

- [x] 1. Khởi tạo dự án và cấu hình hạ tầng cơ bản
  - Tạo dự án Next.js 14+ với App Router, TypeScript strict mode
  - Cài đặt và cấu hình Tailwind CSS, Prisma, NextAuth.js, BullMQ, Sharp, TipTap, Zod, fast-check, Vitest, Supertest, Playwright
  - Tạo file `.env.example` với tất cả biến môi trường cần thiết (DATABASE_URL, REDIS_URL, S3_*, SMTP_*, NEXTAUTH_SECRET, v.v.)
  - Tạo `docker-compose.yml` với 4 services: `app` (Next.js), `worker` (BullMQ), `postgres`, `redis`
  - Cấu hình `vitest.config.ts` với môi trường test và coverage
  - _Requirements: 12.1_

- [x] 2. Định nghĩa schema Prisma và migration cơ sở dữ liệu
  - [x] 2.1 Tạo Prisma schema với đầy đủ các model: User, Section, ContentHistory, Article, Lead, LeadStatusHistory, LeadNote, AuditLog, ExportLog
    - Định nghĩa tất cả enum: UserRole, SectionType, ArticleStatus, LeadStatus
    - Thêm đầy đủ relations: Article→User (author), LeadStatusHistory→User (changedBy)
    - Thêm đầy đủ index theo thiết kế, bao gồm `@@index([phone, createdAt])` cho duplicate check và `@@index([createdAt])` trên ContentHistory cho cleanup job
    - **Không có model RateLimit** — rate limiting dùng Redis
    - _Requirements: 5.4, 6.6, 7.4, 10.2, 10.3, 12.4, 12.5_
  - [x] 2.2 Tạo seed script để khởi tạo dữ liệu mẫu: tài khoản Admin mặc định, 11 Section với nội dung placeholder
    - _Requirements: 1.1, 5.1_

- [x] 3. Triển khai validation functions và business logic cốt lõi
  - [x] 3.1 Tạo file `src/lib/validation.ts` với các hàm: `validatePhone`, `validateEmail`, `validateForm`, `validateArticle`, `validateImageSize`
    - Implement theo đúng regex và rules trong design: phone `/^0\d{9}$/`, email RFC 5322 simplified
    - Export `ValidationResult` interface
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 6.3, 7.3_
  - [x] 3.2 Tạo file `src/schemas/section-content.ts` với Zod schemas cho từng SectionType
    - Implement `validateSectionContent(type, content)` — gọi trước mỗi lần lưu Section vào DB
    - _Requirements: 6.1_
  - [x] 3.2 Viết property test cho `validatePhone` (Property 2)
    - **Property 2: Validation số điện thoại chỉ chấp nhận đúng định dạng**
    - **Validates: Requirements 3.4**
  - [x] 3.3 Viết property test cho `validateEmail` (Property 3)
    - **Property 3: Validation email chỉ chấp nhận đúng định dạng**
    - **Validates: Requirements 3.5**
  - [x] 3.4 Viết property test cho `validateForm` (Property 1)
    - **Property 1: Validation form từ chối mọi dữ liệu thiếu trường bắt buộc**
    - **Validates: Requirements 3.2, 3.3**
  - [x] 3.5 Viết property test cho `validateForm` với `privacyConsent = false` (Property 18)
    - **Property 18: Form bị từ chối khi chưa đồng ý chính sách bảo mật**
    - **Validates: Requirements 10.3**

- [x] 4. Triển khai slug generation và article utilities
  - [x] 4.1 Tạo file `src/lib/slug.ts` với hàm `generateSlug` xử lý tiếng Việt (normalize NFD, replace đ→d, strip diacritics, URL-safe)
    - Implement logic tự động thêm suffix số khi slug trùng trong DB
    - _Requirements: 7.10_
  - [x] 4.2 Viết property test cho `generateSlug` (Property 15)
    - **Property 15: Slug được tạo từ tiêu đề là URL-safe và duy nhất**
    - **Validates: Requirements 7.10**

- [x] 5. Triển khai xác thực và phân quyền CMS
  - [x] 5.1 Cấu hình NextAuth.js với Credentials Provider trong `src/app/api/auth/[...nextauth]/route.ts`
    - Implement `handleLogin` với bcrypt compare, account lockout (5 lần sai → khóa 15 phút), reset failed attempts khi đăng nhập thành công
    - JWT session với sliding window 8 giờ
    - _Requirements: 5.1, 5.2, 5.3, 5.5, 5.6_
  - [x] 5.2 Tạo middleware `src/middleware.ts` bảo vệ tất cả route `/admin/*`, redirect về `/admin/login` khi chưa xác thực
    - Implement RBAC: kiểm tra role ADMIN cho các route `/admin/users`
    - _Requirements: 5.1, 5.4_
  - [x] 5.3 Tạo trang đăng nhập `/admin/login` với form email/password, hiển thị thông báo lỗi chung (không tiết lộ trường nào sai)
    - _Requirements: 5.1, 5.2, 5.3_
  - [x] 5.4 Viết integration test cho auth flow: đăng nhập thành công, sai mật khẩu, lockout sau 5 lần, session timeout
    - _Requirements: 5.1, 5.2, 5.3, 5.5, 5.6_

- [x] 6. Triển khai rate limiting (Redis) và audit logging
  - [x] 6.1 Tạo `src/lib/rate-limit.ts` với hàm `checkRateLimit(key, maxCount, windowSeconds)` dùng Redis `INCR` + `EXPIRE`
    - Trả về `{ allowed, remaining, retryAfter }` — không dùng PostgreSQL model
    - Form submission: `checkRateLimit('form:${ip}', 3, 3600)`
    - CMS IP block: `checkRateLimit('cms:${ip}', 100, 60)`
    - _Requirements: 3.9, 12.6_
  - [x] 6.2 Tạo `src/lib/audit.ts` với hàm `logAudit(userId, action, resource?, resourceId?, metadata?, ip?)` ghi vào model AuditLog
    - _Requirements: 12.5_
  - [x] 6.3 Tạo `src/lib/revalidate.ts` với các hàm `revalidateLandingPage()` và `revalidateArticle(slug)` dùng Next.js `revalidatePath`
    - Gọi sau mỗi lần CMS lưu section, publish article, hoặc worker scheduled-publish
    - _Requirements: 6.2_
  - [x] 6.4 Viết property test cho rate limiting Redis (Property 5)
    - **Property 5: Rate limiting chặn đúng sau khi vượt ngưỡng**
    - **Validates: Requirements 3.9, 12.6**

- [x] 7. Triển khai API lead submission (public)
  - [x] 7.1 Tạo API route `POST /api/leads` trong `src/app/api/leads/route.ts`
    - Implement `handleLeadSubmission`: validate → rate limit (Redis) → privacy consent → duplicate check trong DB transaction (tránh race condition) → DB insert → email notify; fallback to BullMQ queue khi DB lỗi
    - Trả về 200 OK cả khi queued hoặc duplicate, 400 khi validation fail, 429 khi rate limited (với `Retry-After` header)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 12.3_
  - [x] 7.2 Cấu hình BullMQ worker `src/workers/lead-submission.worker.ts` để xử lý lại lead từ queue khi DB phục hồi
    - Worker chạy như process riêng biệt (không phải trong Next.js API Routes)
    - Sau khi INSERT thành công: gọi `emailService.notifyTeam(lead)`
    - _Requirements: 13.5_
  - [x] 7.3 Viết property test cho lead submission tạo lead với status NEW (Property 4)
    - **Property 4: Gửi form hợp lệ tạo lead trong DB với trạng thái NEW**
    - **Validates: Requirements 3.7**
  - [x] 7.4 Viết property test cho queue fallback khi DB không khả dụng (Property 19)
    - **Property 19: Form submission được enqueue khi DB không khả dụng**
    - **Validates: Requirements 11.5**

- [x] 8. Checkpoint — Đảm bảo tất cả tests pass
  - Chạy `vitest --run` để kiểm tra toàn bộ unit và property tests đã viết
  - Hỏi người dùng nếu có vấn đề cần làm rõ trước khi tiếp tục

- [x] 9. Triển khai API nội dung công khai (Landing Page)
  - [x] 9.1 Tạo API route `GET /api/content` trả về tất cả sections đang visible, cấu hình ISR revalidate 60 giây
    - _Requirements: 1.1, 6.2_
  - [x] 9.2 Tạo API routes `GET /api/articles` (danh sách published, phân trang 12/trang) và `GET /api/articles/[slug]` (chi tiết, 404 nếu không tồn tại hoặc chưa published)
    - Cấu hình ISR revalidate 60 giây cho cả hai routes
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 7.5_

- [x] 10. Triển khai Landing Page — Layout và Navigation
  - [x] 10.1 Tạo layout `src/app/(public)/layout.tsx` với StickyNav component
    - Implement `<StickyNav>` dùng Intersection Observer để highlight section đang xem
    - Smooth scroll ≤ 500ms khi click link điều hướng
    - _Requirements: 1.6, 1.7_
  - [x] 10.2 Tạo trang chính `src/app/(public)/page.tsx` fetch nội dung từ `/api/content` (SSG/ISR)
    - Render đầy đủ 11 section theo thứ tự: Hero, Giới thiệu, Chương trình, Thành tích, Cơ sở vật chất, Ngoại khóa, Giáo viên, Tuyển sinh, Học phí, Testimonials, Form đăng ký, Footer
    - _Requirements: 1.1, 1.2_

- [x] 11. Triển khai các Section Components của Landing Page
  - [x] 11.1 Tạo `<HeroSection>` với tiêu đề, tiêu đề phụ, background image/video, CTA button scroll đến `#registration-form`
    - _Requirements: 2.1, 2.2_
  - [x] 11.2 Tạo các section components còn lại: `<IntroSection>`, `<ProgramSection>`, `<AchievementSection>`, `<FacilitySection>`, `<ExtracurricularSection>`, `<TeacherSection>`, `<AdmissionSection>`, `<TuitionSection>`, `<TestimonialSection>` (carousel), `<Footer>`
    - Mỗi component nhận `SectionProps` với `content: Json` từ DB
    - Sử dụng Next.js `<Image>` với WebP, lazy loading cho ảnh ngoài viewport, eager cho hero
    - _Requirements: 1.1, 4.6_
  - [x] 11.3 Tạo `<FloatingCTA>` cố định ở cuối màn hình trên mobile (< 768px) với nút "Đăng ký ngay"
    - _Requirements: 2.3, 2.4_

- [x] 12. Triển khai Registration Form (Landing Page)
  - [x] 12.1 Tạo `<RegistrationForm>` component với các trường: Họ tên phụ huynh, Số điện thoại, Email (optional), Tên học sinh, Năm học dự kiến, Ghi chú (optional), checkbox đồng ý chính sách bảo mật
    - Client-side validation với hiển thị lỗi inline bên dưới từng trường
    - Submit gọi `POST /api/leads`, hiển thị success message và clear form, hoặc giữ data khi lỗi; hiển thị thông báo riêng khi duplicate SĐT
    - Tích hợp GA4 event tracking khi submit thành công
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.8, 3.11, 4.7, 12.2, 12.3_
  - [x] 12.2 Viết unit tests cho RegistrationForm: validation hiển thị đúng lỗi, success state, error state giữ data
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 3.8_

- [x] 13. Tối ưu SEO và hiệu năng Landing Page
  - [x] 13.1 Thêm metadata vào `src/app/(public)/layout.tsx` và page: meta title, meta description, Open Graph tags
    - Cấu trúc heading đúng thứ bậc H1→H2→H3 trong tất cả section components
    - _Requirements: 4.1, 4.4_
  - [x] 13.2 Tạo `src/app/sitemap.ts` và `src/app/robots.ts` theo Next.js App Router convention
    - _Requirements: 4.5_
  - [x] 13.3 Viết property test kiểm tra cấu trúc heading HTML (Property 6)
    - **Property 6: Cấu trúc heading HTML tuân thủ thứ bậc đúng**
    - **Validates: Requirements 4.4**
  - [x] 13.4 Viết property test kiểm tra lazy loading ảnh (Property 7)
    - **Property 7: Tất cả ảnh ngoài viewport phải có lazy loading**
    - **Validates: Requirements 4.6**

- [x] 14. Triển khai trang bài viết công khai và trang chính sách bảo mật
  - [x] 14.1 Tạo trang danh sách bài viết `src/app/(public)/tin-tuc/page.tsx` với SSG/ISR (revalidate 60s)
    - Fetch từ `/api/articles`, hiển thị card bài viết (ảnh, tiêu đề, danh mục, ngày, excerpt), phân trang 12/trang
    - _Requirements: 8.1, 8.2, 8.3_
  - [x] 14.2 Tạo trang chi tiết bài viết `src/app/(public)/tin-tuc/[slug]/page.tsx` với SSG/ISR
    - `generateStaticParams` cho tất cả bài viết published, 404 nếu slug không tồn tại hoặc chưa published
    - Open Graph tags riêng cho từng bài viết (title, description, image từ coverImage)
    - _Requirements: 8.4, 8.5, 8.6, 4.1_
  - [x] 14.3 Tạo trang chính sách bảo mật `src/app/(public)/chinh-sach-bao-mat/page.tsx`
    - Meta tag `noindex`, liên kết từ Form đăng ký và Footer
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 15. Triển khai upload ảnh và image processing (CMS)
  - [x] 15.1 Tạo API route `POST /api/admin/upload` với Multer/formidable, kiểm tra kích thước ≤ 10MB, xử lý nén bằng Sharp (output ≤ 200KB, chuyển đổi WebP), upload lên S3/R2
    - Trả về URL ảnh sau khi upload thành công
    - _Requirements: 6.3, 6.4, 6.5_
  - [x] 15.2 Viết property test cho image size validation (Property 8)
    - **Property 8: Validation kích thước file ảnh tải lên**
    - **Validates: Requirements 6.3, 6.4**
  - [x] 15.3 Viết property test cho image compression pipeline (Property 9)
    - **Property 9: Nén ảnh đảm bảo output ≤ 200KB**
    - **Validates: Requirements 6.5**

- [x] 16. Triển khai CMS — Quản lý nội dung Section
  - [x] 16.1 Tạo API routes CMS cho sections: `GET /api/admin/sections`, `PUT /api/admin/sections/[id]`, `GET /api/admin/sections/[id]/history`, `POST /api/admin/sections/[id]/restore`
    - `PUT`: validate content bằng Zod (`validateSectionContent`) trước khi lưu, tạo ContentHistory, ghi AuditLog, gọi `revalidateLandingPage()` sau khi lưu thành công
    - `POST restore`: khôi phục `contentBefore`, gọi `revalidateLandingPage()`
    - _Requirements: 6.1, 6.2, 6.6, 6.7, 12.5_
  - [x] 16.2 Tạo trang CMS `/admin/content` với danh sách sections, toggle visibility, inline editor cho từng section, preview panel
    - _Requirements: 6.1, 6.8_
  - [x] 16.3 Viết property test cho content history và restore (Property 10)
    - **Property 10: Chỉnh sửa nội dung tạo lịch sử và có thể khôi phục**
    - **Validates: Requirements 6.6, 6.7, 10.3, 12.5**

- [ ] 17. Triển khai CMS — Quản lý bài viết
  - [x] 17.1 Tạo API routes CMS cho articles: `GET /api/admin/articles` (filter/search/pagination 20/trang), `POST /api/admin/articles`, `PUT /api/admin/articles/[id]`, `DELETE /api/admin/articles/[id]`
    - Validate trường bắt buộc khi tạo/sửa, auto-generate slug, xử lý scheduled publish (lưu `scheduledAt`, worker sẽ poll)
    - Khi status → PUBLISHED: gọi `revalidateArticle(slug)` để on-demand ISR
    - Hỗ trợ luồng trạng thái: DRAFT→PENDING, DRAFT→PUBLISHED (admin), PENDING→PUBLISHED, PENDING→DRAFT, PUBLISHED→ARCHIVED, ARCHIVED→DRAFT
    - Ghi AuditLog cho các thao tác quan trọng
    - _Requirements: 7.1, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 7.10, 12.5_
  - [x] 17.4 Tạo BullMQ worker `src/workers/scheduled-publish.worker.ts` — poll mỗi phút, tìm Article có `scheduledAt <= now()` và `status = DRAFT`, update `status = PUBLISHED`, gọi `revalidateArticle(slug)`
    - _Requirements: 7.6_
  - [x] 17.2 Tạo trang CMS `/admin/articles` với danh sách bài viết (filter theo tiêu đề/danh mục/trạng thái, phân trang), nút tạo/sửa/xóa
    - Confirm dialog trước khi xóa vĩnh viễn
    - _Requirements: 7.1, 7.7, 7.8, 7.9_
  - [x] 17.3 Tạo trang tạo/sửa bài viết `/admin/articles/[id]` với TipTap rich text editor, upload ảnh đại diện, chọn trạng thái, lên lịch xuất bản, chỉnh sửa slug
    - _Requirements: 7.2, 7.3, 7.4, 7.6, 7.10_
  - [x] 17.4 Viết property test cho article validation (Property 11)
    - **Property 11: Validation bài viết từ chối dữ liệu thiếu trường bắt buộc**
    - **Validates: Requirements 7.3**
  - [x] 17.5 Viết property test cho article status transitions (Property 12 — phần Article)
    - **Property 12: Chuyển trạng thái bài viết chỉ theo luồng hợp lệ**
    - **Validates: Requirements 7.4**
  - [x] 17.6 Viết property test cho search/filter bài viết (Property 13 — phần Article)
    - **Property 13: Kết quả tìm kiếm luôn chứa và chỉ chứa các mục khớp query**
    - **Validates: Requirements 7.7**
  - [x] 17.7 Viết property test cho phân trang bài viết (Property 14 — phần Article)
    - **Property 14: Phân trang trả về đúng số lượng và không trùng lặp (page size 20)**
    - **Validates: Requirements 7.8**

- [x] 18. Checkpoint — Đảm bảo tất cả tests pass
  - Chạy `vitest --run` để kiểm tra toàn bộ tests
  - Hỏi người dùng nếu có vấn đề cần làm rõ trước khi tiếp tục

- [ ] 19. Triển khai CMS — Quản lý Lead
  - [x] 19.1 Tạo API routes CMS cho leads: `GET /api/admin/leads` (filter/search/pagination 50/trang), `PATCH /api/admin/leads/[id]` (cập nhật trạng thái/ghi chú), `POST /api/admin/leads/[id]/assign`
    - `PATCH` phải tạo LeadStatusHistory khi đổi trạng thái, ghi AuditLog
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 12.5_
  - [x] 19.2 Tạo API routes cho export lead:
    - `GET /api/admin/leads/export` — nếu count ≤ 1000: stream Excel trực tiếp; nếu > 1000: enqueue job, trả về `{ jobId }`
    - `GET /api/admin/leads/export/:jobId` — poll status; khi done trả về presigned S3 URL (expire 1 giờ)
    - Ghi ExportLog sau khi export thành công
    - Tạo BullMQ worker `src/workers/lead-export.worker.ts` cho async export
    - _Requirements: 10.9, 10.10_
  - [ ] 19.3 Tạo trang CMS `/admin/leads` với bảng danh sách lead (filter theo trạng thái/năm học/khoảng thời gian, tìm kiếm theo tên/SĐT, phân trang 50/trang), cập nhật trạng thái inline, gán nhân viên, thêm ghi chú, nút export Excel
    - _Requirements: 10.1, 10.2, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9_
  - [ ] 19.4 Viết property test cho lead status transitions (Property 12 — phần Lead)
    - **Property 12: Chuyển trạng thái lead chỉ theo luồng hợp lệ**
    - **Validates: Requirements 10.2**
  - [ ] 19.5 Viết property test cho search/filter lead (Property 13 — phần Lead)
    - **Property 13: Kết quả tìm kiếm lead luôn chứa và chỉ chứa các mục khớp query**
    - **Validates: Requirements 10.4**
  - [ ] 19.6 Viết property test cho filter lead theo khoảng thời gian (Property 16)
    - **Property 16: Kết quả lọc lead và báo cáo chỉ chứa dữ liệu trong phạm vi filter**
    - **Validates: Requirements 10.5, 11.4**
  - [ ] 19.7 Viết property test cho phân trang lead (Property 14 — phần Lead)
    - **Property 14: Phân trang trả về đúng số lượng và không trùng lặp (page size 50)**
    - **Validates: Requirements 10.8**

- [ ] 20. Triển khai CMS — Dashboard và Báo Cáo
  - [ ] 20.1 Tạo API route `GET /api/admin/reports` trả về: tổng lead, lead mới theo ngày/tuần/tháng, phân bổ theo trạng thái, lead theo thời gian (12 tháng), hỗ trợ filter khoảng thời gian
    - _Requirements: 10.11, 11.1, 11.2, 11.3, 11.4_
  - [ ] 20.2 Tạo trang CMS `/admin/dashboard` với KPI cards, line chart (lead theo thời gian), pie chart (phân bổ trạng thái), date range filter
    - Tích hợp hiển thị GA4 metrics nếu được cấu hình (lượt truy cập, bounce rate, session duration)
    - _Requirements: 10.11, 11.1, 11.2, 11.3, 11.4, 11.5_
  - [ ] 20.3 Viết property test cho tính chính xác số liệu dashboard (Property 17)
    - **Property 17: Số liệu dashboard phản ánh chính xác dữ liệu thực tế**
    - **Validates: Requirements 10.11, 11.1, 11.2, 11.3**

- [ ] 21. Triển khai CMS — Quản lý người dùng
  - [ ] 21.1 Tạo API routes `GET /api/admin/users`, `POST /api/admin/users`, `PUT /api/admin/users/[id]`, `POST /api/admin/users/[id]/reset-password` (chỉ ADMIN role)
    - `POST /api/admin/users`: hash password với bcrypt cost factor ≥ 12
    - `POST reset-password`: tạo token có hiệu lực 24h, gửi email link đặt lại mật khẩu
    - Ghi AuditLog cho tất cả thao tác
    - _Requirements: 5.4, 5.7, 5.8, 12.4, 12.5_
  - [ ] 21.2 Tạo trang CMS `/admin/users` (chỉ ADMIN) với danh sách users, tạo/sửa/vô hiệu hóa tài khoản, reset password
    - _Requirements: 5.4, 5.7, 5.8_

- [ ] 22. Tích hợp và kết nối toàn bộ hệ thống
  - [ ] 22.1 Tạo CMS layout `src/app/admin/layout.tsx` với sidebar navigation (Dashboard, Nội dung, Bài viết, Lead, Người dùng), hiển thị thông tin user đang đăng nhập, nút đăng xuất
    - Ẩn menu "Người dùng" với role STAFF
    - _Requirements: 5.4_
  - [ ] 22.2 Thêm CSRF protection cho tất cả mutating API routes CMS: verify `Origin` header khớp với `NEXTAUTH_URL` trong middleware
    - Cookie NextAuth.js dùng `SameSite=Strict`
    - _Requirements: 12.1_
  - [ ] 22.3 Tạo BullMQ worker entrypoint `src/workers/index.ts` khởi động tất cả workers: `lead-submission`, `scheduled-publish`, `lead-export`
    - Cấu hình PM2 `ecosystem.config.js` cho production worker process
    - _Requirements: 13.5_
  - [ ] 22.4 Tạo cron job (BullMQ repeatable job) chạy hàng ngày để xóa `ContentHistory` records cũ hơn 30 ngày
    - _Requirements: 6.7_
  - [ ] 22.5 Tạo trang maintenance `src/app/maintenance/page.tsx` và cấu hình middleware redirect khi `MAINTENANCE_MODE=true`
    - _Requirements: 13.4_
  - [ ] 22.6 Tạo trang 404 tùy chỉnh `src/app/not-found.tsx` và error boundary `src/app/error.tsx`
    - _Requirements: 1.3, 8.6_
  - [ ] 22.7 Viết integration tests cho các luồng chính: form submission end-to-end (bao gồm duplicate check trong transaction), CMS login → edit content → verify on-demand revalidation, lead status update → history recorded, scheduled publish → article published
    - _Requirements: 3.7, 3.11, 6.2, 10.3_

- [ ] 23. Checkpoint cuối — Đảm bảo tất cả tests pass
  - Chạy `vitest --run` để kiểm tra toàn bộ unit, property và integration tests
  - Hỏi người dùng nếu có vấn đề cần làm rõ trước khi hoàn thành

## Ghi Chú

- Tasks đánh dấu `*` là tùy chọn và có thể bỏ qua để triển khai MVP nhanh hơn
- Mỗi task tham chiếu đến yêu cầu cụ thể để đảm bảo traceability
- Property tests sử dụng **fast-check** với tối thiểu 100 iterations mỗi property
- Checkpoints đảm bảo kiểm tra tăng dần sau mỗi nhóm tính năng lớn
- Tất cả API routes CMS phải được bảo vệ bởi NextAuth.js middleware
- Mật khẩu phải được hash bằng bcrypt với cost factor ≥ 12 (Req 12.4)
- Toàn bộ dữ liệu truyền qua HTTPS (cấu hình ở infrastructure level, Req 12.1)
- **Rate limiting dùng Redis** — không dùng PostgreSQL model (xem Task 6.1)
- **BullMQ worker chạy process riêng** — không chạy trong Next.js API Routes (xem Task 22.3)
- **On-demand revalidation** — gọi `revalidatePath` sau mỗi lần CMS lưu thay đổi (xem Task 6.3)
- **Section.content validate bằng Zod** trước khi lưu vào DB (xem Task 3.2)
