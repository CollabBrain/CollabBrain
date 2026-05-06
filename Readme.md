# Quy định quản lý Source Code: Branching & Commit Conventions

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
type[scope]: <mô tả ngắn gọn>