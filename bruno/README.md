# Studifier API - Bruno Collection

Bộ sưu tập các request Bruno để kiểm thử API của ứng dụng Studifier.

## Cấu trúc thư mục

```
bruno/
├── studifier-api.bru              # File collection chính
├── environments/
│   └── Local.bru                 # Environment file (localhost)
└── studifier-api/
    └── Auth/
        ├── Login/                # Các test case đăng nhập
        ├── Register/             # Các test case đăng ký
        └── Forgot Password/      # Các test case quên mật khẩu
```

## Cách sử dụng

### 1. Cài đặt Bruno
- Download Bruno từ https://www.usebruno.com/
- Cài đặt và mở ứng dụng

### 2. Import collection
1. Mở Bruno
2. Click "Import Collection"
3. Chọn thư mục `bruno` trong project
4. Collection "Studifier API" sẽ xuất hiện

### 3. Thiết lập Environment
1. Chọn environment "Local" từ dropdown
2. Cập nhật các biến môi trường:
   - `baseUrl`: URL của backend (mặc định: http://localhost:3000)
   - `email`: Email test
   - `password`: Password test
   - `accessToken`: Sẽ được tự động cập nhật sau khi login
   - `refreshToken`: Sẽ được tự động cập nhật sau khi login

### 4. Chạy test

#### Test Flow Đăng nhập
1. `Login` - Đăng nhập với email/password hợp lệ
2. `Get Profile` - Lấy thông tin user (sau khi có accessToken)

#### Test Flow Đăng ký
1. `Register` - Đăng ký tài khoản mới
2. `Verify OTP - Register` - Xác thực OTP (mã OTP sẽ được gửi qua email hoặc log console)
3. `Login` - Đăng nhập sau khi xác thực thành công

#### Test Flow Quên mật khẩu
1. `Forgot Password - Send OTP` - Gửi yêu cầu quên mật khẩu
2. `Verify OTP - Forgot Password` - Xác thực OTP
3. `Reset Password` - Đặt lại mật khẩu mới

## Các API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/user/login` | Đăng nhập |
| POST | `/user/register` | Đăng ký tài khoản mới |
| POST | `/user/register/verify-otp` | Xác thực OTP đăng ký |
| POST | `/user/forgot-password/forgot` | Gửi yêu cầu quên mật khẩu |
| POST | `/user/forgot-password/otp` | Xác thực OTP quên mật khẩu |
| POST | `/user/forgot-password/reset` | Đặt lại mật khẩu |
| POST | `/user/refresh` | Làm mới access token |
| GET | `/user/profile` | Lấy thông tin người dùng |

## Lưu ý

- Một số API có rate limiting. Nếu gặp lỗi 429, hãy đợi 1-2 phút rồi thử lại.
- OTP có thời hạn 5 phút. Kiểm tra email hoặc console log để lấy mã OTP.
- Refresh token có thời hạn 7 ngày.
