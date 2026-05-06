# Tài Liệu Yêu Cầu

## Giới Thiệu

Hệ thống **Landing Page + CMS Quản Lý Tuyển Sinh Trường THPT** bao gồm hai thành phần chính:

1. **Landing Page công khai** — trang giới thiệu trường THPT dành cho phụ huynh và học sinh, cung cấp đầy đủ thông tin về chương trình đào tạo, thành tích, cơ sở vật chất, giáo viên, học phí và quy trình tuyển sinh.
2. **CMS nội bộ** — hệ thống quản lý nội dung dành cho đội tuyển sinh, cho phép quản lý nội dung trang, bài viết và danh sách lead đăng ký tư vấn.

Mục tiêu kinh doanh: đạt Conversion Rate ≥ 8%, Bounce Rate ≤ 50%, thời gian phiên trung bình ≥ 2 phút, và thu thập đủ số lượng lead theo target tuyển sinh hàng năm.

---

## Bảng Thuật Ngữ

| Thuật ngữ | Định nghĩa |
|---|---|
| **Landing_Page** | Trang web công khai giới thiệu trường THPT, hiển thị cho phụ huynh và học sinh |
| **CMS** | Content Management System — hệ thống quản lý nội dung nội bộ dành cho nhân viên tuyển sinh |
| **Lead** | Thông tin liên hệ của phụ huynh/học sinh đã điền form đăng ký tư vấn |
| **Form_Dang_Ky** | Biểu mẫu đăng ký tư vấn trên Landing Page |
| **Nhan_Vien_Tuyen_Sinh** | Người dùng có quyền truy cập CMS để quản lý nội dung và lead |
| **Quan_Tri_Vien** | Người dùng có toàn quyền quản trị CMS bao gồm phân quyền tài khoản |
| **Bai_Viet** | Bài đăng tin tức, thông báo hoặc blog được quản lý trong CMS |
| **Section** | Một khối nội dung trên Landing Page (Hero, Giới thiệu, Thành tích, v.v.) |
| **Testimonial** | Lời nhận xét/đánh giá từ phụ huynh hoặc học sinh cũ |
| **SEO** | Search Engine Optimization — tối ưu hóa công cụ tìm kiếm |

---

## Yêu Cầu

---

### Yêu Cầu 1: Hiển Thị Landing Page

**User Story:** Là một phụ huynh hoặc học sinh, tôi muốn xem trang giới thiệu trường đầy đủ thông tin, để tôi có thể đánh giá và quyết định đăng ký tư vấn.

#### Tiêu Chí Chấp Nhận

1. THE Landing_Page SHALL hiển thị đầy đủ các section theo thứ tự: Hero, Giới thiệu, Chương trình đào tạo, Thành tích, Cơ sở vật chất, Hoạt động ngoại khóa, Giáo viên, Tuyển sinh, Học phí, Testimonials, Form đăng ký, Footer.
2. WHEN người dùng truy cập Landing_Page, THE Landing_Page SHALL tải và hiển thị nội dung đầy đủ trong vòng 3 giây trên kết nối 4G tiêu chuẩn.
3. THE Landing_Page SHALL hiển thị đúng trên các trình duyệt Chrome, Firefox, Safari, Edge phiên bản mới nhất.
4. THE Landing_Page SHALL hiển thị đúng trên thiết bị di động với màn hình từ 320px đến 428px chiều rộng (responsive design).
5. THE Landing_Page SHALL hiển thị đúng trên màn hình máy tính bảng từ 768px đến 1024px chiều rộng.
6. WHEN người dùng cuộn trang, THE Landing_Page SHALL hiển thị thanh điều hướng cố định (sticky navigation) với liên kết đến từng section.
7. WHEN người dùng nhấp vào liên kết điều hướng, THE Landing_Page SHALL cuộn mượt (smooth scroll) đến section tương ứng trong vòng 500ms.

---

### Yêu Cầu 2: Section Hero và Kêu Gọi Hành Động

**User Story:** Là một phụ huynh, tôi muốn thấy thông điệp nổi bật và nút kêu gọi hành động ngay khi vào trang, để tôi nhanh chóng biết cách đăng ký tư vấn.

#### Tiêu Chí Chấp Nhận

1. THE Landing_Page SHALL hiển thị section Hero với tiêu đề chính (tên trường), tiêu đề phụ (slogan), hình ảnh/video nền và ít nhất một nút CTA (Call-to-Action).
2. WHEN người dùng nhấp vào nút CTA trên Hero section, THE Landing_Page SHALL cuộn đến Form_Dang_Ky.
3. THE Landing_Page SHALL hiển thị nút CTA nổi bật (floating CTA) cố định ở góc màn hình trên thiết bị di động.
4. WHILE người dùng đang xem Landing_Page trên thiết bị di động, THE Landing_Page SHALL hiển thị nút "Đăng ký ngay" cố định ở cuối màn hình.

---

### Yêu Cầu 3: Form Đăng Ký Tư Vấn

**User Story:** Là một phụ huynh quan tâm, tôi muốn điền form đăng ký tư vấn nhanh chóng, để nhà trường có thể liên hệ lại với tôi.

#### Tiêu Chí Chấp Nhận

1. THE Form_Dang_Ky SHALL thu thập các trường thông tin: Họ tên phụ huynh (bắt buộc), Số điện thoại (bắt buộc), Email (tùy chọn), Tên học sinh (bắt buộc), Năm học dự kiến vào lớp 10 (bắt buộc, phải là năm nguyên trong khoảng năm hiện tại đến năm hiện tại + 5), Ghi chú (tùy chọn).
2. WHEN người dùng nhấn nút "Gửi đăng ký", THE Form_Dang_Ky SHALL kiểm tra tất cả các trường bắt buộc trước khi gửi.
3. IF trường bắt buộc bị bỏ trống, THEN THE Form_Dang_Ky SHALL hiển thị thông báo lỗi cụ thể ngay bên dưới trường đó.
4. WHEN người dùng nhập số điện thoại không hợp lệ (không phải 10 chữ số bắt đầu bằng 0), THE Form_Dang_Ky SHALL hiển thị thông báo "Số điện thoại không hợp lệ".
5. WHEN người dùng nhập email không đúng định dạng, THE Form_Dang_Ky SHALL hiển thị thông báo "Email không đúng định dạng".
6. WHEN form được gửi thành công, THE Form_Dang_Ky SHALL hiển thị thông báo xác nhận "Đăng ký thành công! Chúng tôi sẽ liên hệ với bạn trong vòng 24 giờ" và xóa dữ liệu trong form.
7. WHEN form được gửi thành công, THE CMS SHALL lưu thông tin Lead vào cơ sở dữ liệu với trạng thái "Mới".
8. IF lỗi kết nối xảy ra khi gửi form, THEN THE Form_Dang_Ky SHALL hiển thị thông báo "Có lỗi xảy ra, vui lòng thử lại" và giữ nguyên dữ liệu người dùng đã nhập.
9. THE Form_Dang_Ky SHALL áp dụng cơ chế chống spam (rate limiting: tối đa 3 lần gửi từ cùng IP trong 1 giờ).
10. WHEN form được gửi thành công, THE CMS SHALL gửi email thông báo đến địa chỉ email của đội tuyển sinh được cấu hình sẵn.
11. WHEN người dùng gửi form với số điện thoại đã tồn tại trong hệ thống trong vòng 24 giờ, THE Form_Dang_Ky SHALL hiển thị thông báo "Số điện thoại này đã đăng ký, chúng tôi sẽ liên hệ sớm" và không tạo lead trùng lặp.

---

### Yêu Cầu 4: Tối Ưu SEO và Hiệu Năng

**User Story:** Là Nhan_Vien_Tuyen_Sinh, tôi muốn trang web xuất hiện cao trên kết quả tìm kiếm Google, để thu hút nhiều phụ huynh và học sinh hơn.

#### Tiêu Chí Chấp Nhận

1. THE Landing_Page SHALL có thẻ meta title, meta description và Open Graph tags cho mỗi trang.
2. THE Landing_Page SHALL đạt điểm Google PageSpeed Insights ≥ 80 trên thiết bị di động.
3. THE Landing_Page SHALL đạt điểm Google PageSpeed Insights ≥ 90 trên máy tính để bàn.
4. THE Landing_Page SHALL sử dụng cấu trúc heading đúng thứ bậc (H1 → H2 → H3) trên mỗi trang.
5. THE Landing_Page SHALL có sitemap.xml và robots.txt hợp lệ.
6. THE Landing_Page SHALL sử dụng định dạng ảnh tối ưu (WebP với fallback JPEG/PNG) và lazy loading cho ảnh ngoài viewport.
7. WHERE tính năng Google Analytics được bật, THE Landing_Page SHALL gửi sự kiện theo dõi khi người dùng gửi form thành công.

---

### Yêu Cầu 5: Xác Thực và Phân Quyền CMS

**User Story:** Là Quan_Tri_Vien, tôi muốn kiểm soát quyền truy cập vào CMS, để đảm bảo chỉ nhân viên được phép mới có thể quản lý nội dung và lead.

#### Tiêu Chí Chấp Nhận

1. WHEN người dùng truy cập CMS, THE CMS SHALL yêu cầu đăng nhập bằng email và mật khẩu.
2. IF thông tin đăng nhập không hợp lệ, THEN THE CMS SHALL hiển thị thông báo "Email hoặc mật khẩu không đúng" và không tiết lộ trường nào sai.
3. IF người dùng đăng nhập sai 5 lần liên tiếp, THEN THE CMS SHALL khóa tài khoản trong 15 phút và hiển thị thông báo tương ứng.
4. THE CMS SHALL hỗ trợ hai vai trò: Quan_Tri_Vien (toàn quyền) và Nhan_Vien_Tuyen_Sinh (quyền hạn chế theo cấu hình).
5. WHILE người dùng đã đăng nhập, THE CMS SHALL duy trì phiên làm việc trong 8 giờ kể từ lần hoạt động cuối.
6. WHEN phiên làm việc hết hạn, THE CMS SHALL tự động đăng xuất và chuyển hướng đến trang đăng nhập.
7. THE Quan_Tri_Vien SHALL có quyền tạo, chỉnh sửa, vô hiệu hóa tài khoản Nhan_Vien_Tuyen_Sinh.
8. WHEN Quan_Tri_Vien đặt lại mật khẩu cho tài khoản, THE CMS SHALL gửi email chứa liên kết đặt lại mật khẩu có hiệu lực trong 24 giờ.

---

### Yêu Cầu 6: Quản Lý Nội Dung Landing Page (CMS)

**User Story:** Là Nhan_Vien_Tuyen_Sinh, tôi muốn chỉnh sửa nội dung các section trên Landing Page mà không cần lập trình viên, để cập nhật thông tin kịp thời.

#### Tiêu Chí Chấp Nhận

1. THE CMS SHALL cho phép Nhan_Vien_Tuyen_Sinh chỉnh sửa nội dung văn bản, hình ảnh và liên kết của từng Section trên Landing_Page.
2. WHEN Nhan_Vien_Tuyen_Sinh lưu thay đổi nội dung, THE CMS SHALL cập nhật Landing_Page trong vòng 60 giây.
3. THE CMS SHALL hỗ trợ tải lên hình ảnh định dạng JPG, PNG, WebP với kích thước tối đa 10MB mỗi file.
4. IF hình ảnh tải lên vượt quá 10MB, THEN THE CMS SHALL hiển thị thông báo lỗi "Kích thước file vượt quá 10MB" và không lưu file.
5. THE CMS SHALL tự động nén hình ảnh tải lên xuống kích thước phù hợp cho web (tối đa 200KB cho ảnh thông thường).
6. THE CMS SHALL lưu lịch sử chỉnh sửa nội dung với thông tin: người chỉnh sửa, thời gian, nội dung trước và sau khi thay đổi.
7. WHEN Nhan_Vien_Tuyen_Sinh muốn hoàn tác thay đổi, THE CMS SHALL cho phép khôi phục về phiên bản trước đó trong vòng 30 ngày.
8. THE CMS SHALL cung cấp tính năng xem trước (preview) nội dung trước khi xuất bản.

---

### Yêu Cầu 7: Quản Lý Bài Viết (CMS)

**User Story:** Là Nhan_Vien_Tuyen_Sinh, tôi muốn đăng và quản lý bài viết tin tức, thông báo tuyển sinh, để cung cấp thông tin cập nhật cho phụ huynh và học sinh.

#### Tiêu Chí Chấp Nhận

1. THE CMS SHALL cho phép Nhan_Vien_Tuyen_Sinh tạo, chỉnh sửa, xuất bản và xóa Bai_Viet.
2. THE CMS SHALL cung cấp trình soạn thảo văn bản phong phú (rich text editor) hỗ trợ: định dạng chữ (đậm, nghiêng, gạch chân), danh sách, tiêu đề, chèn hình ảnh và liên kết.
3. WHEN Nhan_Vien_Tuyen_Sinh tạo Bai_Viet, THE CMS SHALL yêu cầu các trường bắt buộc: tiêu đề, nội dung, danh mục, ảnh đại diện.
4. THE CMS SHALL hỗ trợ trạng thái bài viết: Nháp (Draft), Chờ duyệt (Pending), Đã xuất bản (Published), Đã ẩn (Archived).
5. WHEN Bai_Viet được chuyển sang trạng thái "Đã xuất bản", THE Landing_Page SHALL hiển thị bài viết đó trong mục tin tức trong vòng 60 giây.
6. THE CMS SHALL cho phép lên lịch xuất bản bài viết vào thời điểm cụ thể trong tương lai.
7. THE CMS SHALL hỗ trợ tìm kiếm bài viết theo tiêu đề, danh mục và trạng thái.
8. THE CMS SHALL hiển thị danh sách bài viết với phân trang, mỗi trang tối đa 20 bài viết.
9. WHEN Nhan_Vien_Tuyen_Sinh xóa Bai_Viet, THE CMS SHALL yêu cầu xác nhận trước khi xóa vĩnh viễn.
10. THE CMS SHALL tự động tạo URL thân thiện (slug) từ tiêu đề bài viết, có thể chỉnh sửa thủ công.

---

### Yêu Cầu 8: Trang Bài Viết Công Khai

**User Story:** Là một phụ huynh hoặc học sinh, tôi muốn đọc tin tức và thông báo tuyển sinh trên trang web, để cập nhật thông tin mới nhất từ nhà trường.

#### Tiêu Chí Chấp Nhận

1. THE Landing_Page SHALL có trang danh sách bài viết tại đường dẫn `/tin-tuc` hiển thị tất cả bài viết có trạng thái "Đã xuất bản".
2. THE Landing_Page SHALL hiển thị danh sách bài viết với thông tin: ảnh đại diện, tiêu đề, danh mục, ngày xuất bản, đoạn trích.
3. THE Landing_Page SHALL hỗ trợ phân trang trên trang danh sách bài viết, mỗi trang tối đa 12 bài viết.
4. WHEN người dùng nhấp vào bài viết, THE Landing_Page SHALL hiển thị trang chi tiết bài viết tại đường dẫn `/tin-tuc/[slug]`.
5. THE Landing_Page SHALL hiển thị trang chi tiết bài viết với đầy đủ nội dung, ảnh đại diện, tiêu đề, danh mục, ngày xuất bản và tên tác giả.
6. WHEN người dùng truy cập slug bài viết không tồn tại hoặc chưa xuất bản, THE Landing_Page SHALL hiển thị trang 404.
7. THE Landing_Page SHALL hiển thị tối đa 3 bài viết mới nhất trong section Footer hoặc một section riêng trên Landing Page chính.

---

### Yêu Cầu 9: Trang Chính Sách Bảo Mật

**User Story:** Là một phụ huynh, tôi muốn đọc chính sách bảo mật của nhà trường trước khi cung cấp thông tin cá nhân, để tôi yên tâm về việc dữ liệu của mình được bảo vệ.

#### Tiêu Chí Chấp Nhận

1. THE Landing_Page SHALL có trang chính sách bảo mật tại đường dẫn `/chinh-sach-bao-mat`.
2. THE Landing_Page SHALL hiển thị liên kết đến trang chính sách bảo mật trong Form_Dang_Ky (tại checkbox đồng ý) và trong Footer.
3. THE trang chính sách bảo mật SHALL nêu rõ: loại dữ liệu thu thập, mục đích sử dụng, thời gian lưu trữ, quyền của người dùng và thông tin liên hệ.
4. THE trang chính sách bảo mật SHALL có thẻ meta noindex để không xuất hiện trên kết quả tìm kiếm.

---

### Yêu Cầu 10: Quản Lý Lead (CMS)

**User Story:** Là Nhan_Vien_Tuyen_Sinh, tôi muốn xem và quản lý danh sách lead đăng ký tư vấn, để theo dõi và chăm sóc từng lead hiệu quả.

#### Tiêu Chí Chấp Nhận

1. THE CMS SHALL hiển thị danh sách Lead với các cột: Họ tên phụ huynh, Số điện thoại, Tên học sinh, Năm học dự kiến, Trạng thái, Ngày đăng ký, Người phụ trách.
2. THE CMS SHALL hỗ trợ các trạng thái Lead: Mới, Đã liên hệ, Đang tư vấn, Đã đăng ký, Không tiếp tục.
3. WHEN Nhan_Vien_Tuyen_Sinh cập nhật trạng thái Lead, THE CMS SHALL lưu lịch sử thay đổi trạng thái với thông tin người thực hiện và thời gian.
4. THE CMS SHALL cho phép tìm kiếm Lead theo họ tên, số điện thoại và trạng thái.
5. THE CMS SHALL cho phép lọc Lead theo trạng thái, năm học dự kiến và khoảng thời gian đăng ký.
6. THE CMS SHALL cho phép gán Lead cho Nhan_Vien_Tuyen_Sinh cụ thể để phụ trách.
7. THE CMS SHALL cho phép Nhan_Vien_Tuyen_Sinh thêm ghi chú vào từng Lead.
8. THE CMS SHALL hiển thị danh sách Lead với phân trang, mỗi trang tối đa 50 lead.
9. THE CMS SHALL cho phép xuất danh sách Lead ra file Excel (.xlsx) với tất cả các trường thông tin.
10. WHEN Quan_Tri_Vien xuất file Lead, THE CMS SHALL ghi lại log xuất dữ liệu với thông tin: người xuất, thời gian, số lượng bản ghi.
11. THE CMS SHALL hiển thị dashboard tóm tắt số lượng Lead theo từng trạng thái trong ngày, tuần và tháng hiện tại.

---

### Yêu Cầu 11: Thống Kê và Báo Cáo

**User Story:** Là Quan_Tri_Vien, tôi muốn xem báo cáo tổng quan về hiệu quả tuyển sinh, để đưa ra quyết định điều chỉnh chiến lược kịp thời.

#### Tiêu Chí Chấp Nhận

1. THE CMS SHALL hiển thị dashboard với các chỉ số: tổng số Lead, số Lead mới trong ngày/tuần/tháng, tỷ lệ chuyển đổi theo từng giai đoạn.
2. THE CMS SHALL hiển thị biểu đồ số lượng Lead theo thời gian (ngày/tuần/tháng) trong 12 tháng gần nhất.
3. THE CMS SHALL hiển thị tỷ lệ Lead theo trạng thái dưới dạng biểu đồ tròn (pie chart).
4. THE CMS SHALL cho phép lọc báo cáo theo khoảng thời gian tùy chọn.
5. WHERE tính năng Google Analytics được tích hợp, THE CMS SHALL hiển thị số lượt truy cập Landing_Page, bounce rate và thời gian phiên trung bình.

---

### Yêu Cầu 12: Bảo Mật và Tuân Thủ

**User Story:** Là Quan_Tri_Vien, tôi muốn hệ thống bảo vệ dữ liệu người dùng và tuân thủ các quy định bảo mật, để tránh rủi ro pháp lý và bảo vệ uy tín nhà trường.

#### Tiêu Chí Chấp Nhận

1. THE CMS SHALL truyền tải toàn bộ dữ liệu qua giao thức HTTPS với chứng chỉ SSL/TLS hợp lệ.
2. THE Landing_Page SHALL hiển thị thông báo chính sách bảo mật và thu thập dữ liệu trước khi người dùng gửi Form_Dang_Ky.
3. WHEN người dùng gửi Form_Dang_Ky, THE Form_Dang_Ky SHALL yêu cầu người dùng tích vào ô đồng ý chính sách bảo mật.
4. THE CMS SHALL mã hóa mật khẩu người dùng bằng thuật toán bcrypt với cost factor ≥ 12.
5. THE CMS SHALL ghi log tất cả các hành động quan trọng: đăng nhập, đăng xuất, thay đổi nội dung, xuất dữ liệu, thay đổi quyền.
6. IF phát hiện truy cập bất thường (hơn 100 request/phút từ cùng IP), THEN THE CMS SHALL tự động chặn IP đó trong 1 giờ.
7. THE CMS SHALL lưu trữ dữ liệu Lead tối thiểu 3 năm theo quy định lưu trữ hồ sơ tuyển sinh.

---

### Yêu Cầu 13: Khả Năng Sẵn Sàng và Phục Hồi

**User Story:** Là Quan_Tri_Vien, tôi muốn hệ thống hoạt động ổn định và có khả năng phục hồi khi sự cố xảy ra, để không bỏ lỡ lead trong mùa tuyển sinh.

#### Tiêu Chí Chấp Nhận

1. THE Landing_Page SHALL đạt uptime ≥ 99.5% trong mùa tuyển sinh (tháng 1 đến tháng 8 hàng năm).
2. THE CMS SHALL thực hiện sao lưu dữ liệu tự động hàng ngày và lưu trữ bản sao lưu trong 30 ngày.
3. IF hệ thống gặp sự cố, THEN THE CMS SHALL có khả năng phục hồi dữ liệu từ bản sao lưu trong vòng 4 giờ.
4. WHEN hệ thống đang bảo trì, THE Landing_Page SHALL hiển thị trang thông báo bảo trì với thông tin thời gian dự kiến hoàn thành.
5. THE Form_Dang_Ky SHALL lưu tạm thời dữ liệu lead vào hàng đợi (queue) khi cơ sở dữ liệu tạm thời không khả dụng, và xử lý lại khi kết nối được khôi phục.
