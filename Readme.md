# CollabBrain - Nền tảng Hỗ trợ Học tập Cộng tác & Quản lý Hiệu suất

**CollabBrain** là một nền tảng web hiện đại được thiết kế nhằm kết nối người học, tối ưu hóa hiệu suất làm việc nhóm và hỗ trợ cá nhân hóa lộ trình học tập. Ứng dụng cung cấp một không gian số tập trung giúp học sinh, sinh viên và các nhóm nghiên cứu dễ dàng trao đổi, chia sẻ tài nguyên và theo dõi tiến độ công việc.

---

## 🌟 Các tính năng chính (Key Features)

1. **Giao tiếp thời gian thực (Real-time Communication)**
   * Hỗ trợ nhắn tin riêng tư (1-1) và nhắn tin nhóm học tập.
   * Tích hợp gọi thoại (Voice Call) và gọi video (Video Call) trực tuyến chất lượng cao nhờ WebRTC và Socket.io.
   * Gửi tệp tin đính kèm và hình ảnh trực tiếp trong cuộc hội thoại.

2. **Quản lý công việc & Lịch học tập (Task Management & Todo List)**
   * Tạo, cập nhật và quản lý danh sách nhiệm vụ (Todo).
   * Lên lịch hẹn và nhắc nhở thông minh: Tích hợp chuông báo và thanh thông báo nổi (Premium Toast) nhắc lịch học sắp diễn ra trước 15 phút.

3. **Thẻ ghi nhớ kiến thức (Flashcards)**
   * Tạo các bộ thẻ học tập (Decks) theo từng môn học/chủ đề.
   * Ôn tập kiến thức nhanh chóng, hỗ trợ ghi nhớ thông tin học tập hiệu quả.

4. **Quản lý & Chia sẻ tài liệu (Document Sharing)**
   * Lưu trữ và chia sẻ các tài liệu học tập, bài tập, slide bài giảng trực tiếp trong nhóm.
   * Quản lý kho tài liệu cá nhân ("My Documents") an toàn và trực quan.

5. **Bảng điều khiển trực quan (Dashboard)**
   * Theo dõi tổng quan tiến độ hoàn thành công việc, số lượng bạn bè trực tuyến và lịch trình học tập hàng ngày.

---

## 🛠️ Công nghệ sử dụng (Technology Stack)

### Frontend
* **Core Framework**: React 19, TypeScript
* **Build Tool**: Vite
* **State Management**: Zustand
* **Routing**: React Router DOM v7
* **Data Fetching & Caching**: Axios & TanStack React Query v5
* **Real-time & WebRTC**: Socket.io-client & native WebRTC API
* **Styling & UI**: Tailwind CSS, Radix UI primitives, Lucide React
* **Form & Validation**: React Hook Form, Zod
* **Testing**: Vitest, Playwright

### Backend
* **Language & Runtime**: Node.js, Express (v5), TypeScript
* **Database & ORM**: PostgreSQL, Prisma ORM
* **Real-time & Communication**: Socket.io
* **Storage Services**: Supabase Storage & Cloudinary
* **Security & Auth**: JWT (JSON Web Tokens), Bcrypt (password hashing), Helmet, Express Rate Limit
* **Mailing**: Nodemailer (OTP / Notification emails)
* **Testing**: Vitest, Vitest-Mock-Extended
* **Document Parsing**: Mammoth (Word), PDF-Parse (PDF), XLSX (Excel), OfficeParser

---

## Quy định quản lý Source Code: Branching & Commit Conventions

Tài liệu này quy định cách thức quản lý các nhánh (branch) và cú pháp ghi chú commit nhằm đảm bảo source code của dự án luôn thống nhất, dễ bảo trì và tối ưu cho quá trình làm việc nhóm cũng như CI/CD.

---

## 1. Quy tắc quản lý nhánh (Branching Strategy)

Dự án áp dụng luồng làm việc với hai nhánh chính là `main` và `dev`. Việc kiểm soát chặt chẽ quá trình phân nhánh và gộp code là bắt buộc.

### Các nhánh lõi
*   **`main`**: Nhánh chứa source code ổn định nhất, đại diện cho phiên bản Production.
    *   **QUY TẮC TUYỆT ĐỐI: KHÔNG ĐƯỢC PUSH CODE TRỰC TIẾP LÊN NHÁNH `main`.**
    *   Nhánh `main` sẽ được bảo vệ (Branch Protection Rules). Code chỉ được đưa vào `main` thông qua Pull Request (PR) / Merge Request từ nhánh `dev`.
*   **`dev`**: Nhánh phát triển chính. Nơi tích hợp các tính năng mới nhất đã được kiểm tra (test) và review.

### Quy tắc tạo nhánh làm việc (Working Branches)
Tất cả các nhánh làm việc (tính năng, sửa lỗi...) **phải được tạo ra từ nhánh `dev`**.

*   **Nhánh tính năng (Feature):** Tạo từ `dev` -> `feat/<tên-tính-năng>` (Ví dụ: `feat/user-auth`)
*   **Nhánh sửa lỗi (Bugfix):** Tạo từ `dev` -> `fix/<tên-lỗi>` (Ví dụ: `fix/login-crash`)
*   **Các nhánh khác:** Tương tự, sử dụng tiền tố phù hợp như `chore/...`, `docs/...`, `refactor/...`

---

## 2. Quy ước Commit Message (Commit Conventions)

Mọi commit đẩy lên repository bắt buộc tuân theo chuẩn Conventional Commits với cấu trúc như sau:

```text
<type>(<scope>): <mô tả ngắn gọn>

[thông tin chi tiết nếu có]
```

### Các `type` được chấp nhận:
*   **`feat`**: Tính năng mới.
*   **`fix`**: Sửa lỗi.
*   **`docs`**: Thay đổi tài liệu/Readme.
*   **`style`**: Định dạng mã nguồn (khoảng trắng, dấu chấm phẩy, thụt lề, không ảnh hưởng logic).
*   **`refactor`**: Tái cấu trúc mã nguồn (sửa code nhưng không đổi tính năng hay sửa lỗi).
*   **`test`**: Thêm hoặc cập nhật các kiểm thử (tests).
*   **`chore`**: Các thay đổi nhỏ, cấu hình build, cập nhật thư viện (dependencies)...

### Ví dụ commit hợp lệ:
*   `feat(chat): add voice calling feature using WebRTC`
*   `fix(notification): resolve double-increment badge count bug`
*   `docs(readme): add CollabBrain project description`