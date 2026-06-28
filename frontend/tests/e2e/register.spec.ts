import { test, expect } from '@playwright/test';

test.describe('Register Flow E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('nên hiển thị tiêu đề và bước tạo tài khoản', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Tạo tài khoản ✨' })).toBeVisible();
    await expect(page.locator('text=Thông tin tài khoản')).toBeVisible();
  });

  test('nên báo lỗi khi gửi form đăng ký rỗng', async ({ page }) => {
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Vui lòng nhập họ tên')).toBeVisible();
    await expect(page.locator('text=Vui lòng nhập email')).toBeVisible();
    await expect(page.locator('text=Vui lòng nhập mật khẩu')).toBeVisible();
  });

  test('nên báo lỗi khi định dạng email sai', async ({ page }) => {
    await page.fill('#reg-name', 'John Doe');
    await page.fill('#reg-email', 'wrong-email');
    await page.fill('#reg-password', '123456');

    await page.click('button[type="submit"]');

    await expect(page.locator('text=Email không hợp lệ')).toBeVisible();
  });

  test('nên báo lỗi khi mật khẩu quá ngắn', async ({ page }) => {
    await page.fill('#reg-name', 'John Doe');
    await page.fill('#reg-email', 'john@test.com');
    await page.fill('#reg-password', '123');

    await page.click('button[type="submit"]');

    await expect(page.locator('text=Mật khẩu phải có ít nhất 6 ký tự')).toBeVisible();
  });

  test('nên đăng ký thành công qua 2 bước và chuyển hướng đến dashboard', async ({ page }) => {
    // 1. Mock API gửi OTP đăng ký thành công
    await page.route('**/register', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          status: 'SUCCESS',
          data: { message: 'OTP sent' },
        }),
      });
    });

    // 2. Mock API xác thực OTP và trả về tokens
    await page.route('**/register/verify-otp', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          status: 'SUCCESS',
          data: {
            accessToken: 'fake-access-token-reg',
            refreshToken: 'fake-refresh-token-reg',
          },
        }),
      });
    });

    // 3. Mock API lấy thông tin dashboard
    await page.route('**/notifications', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          status: 'SUCCESS',
          data: {
            enableAll: true,
            enableChat: true,
            enableFriend: true,
            enableGroup: true,
            enableSystem: true,
            enableSound: true,
            enableVibrate: true,
            chatPriority: 'HIGH',
          },
        }),
      });
    });

    // Điền thông tin Bước 1
    await page.fill('#reg-name', 'John Doe');
    await page.fill('#reg-email', 'success-reg@test.com');
    await page.fill('#reg-password', 'password123');

    // Click nút Tiếp tục/Đăng ký -> bước OTP
    await page.click('button[type="submit"]');

    // Kiểm tra giao diện đã đổi sang Bước 2: Xác minh email
    await expect(page.getByRole('heading', { name: 'Xác minh email 📬' })).toBeVisible();

    // Điền mã OTP 6 chữ số
    const otpInputs = page.locator('input[inputmode="numeric"]');
    for (let i = 0; i < 6; i++) {
      await otpInputs.nth(i).fill('1');
    }

    // Submit bước OTP
    await page.click('button[type="submit"]');

    // Đợi chuyển hướng sang dashboard
    await page.waitForURL('**/dashboard');
    await expect(page).toHaveURL(/.*dashboard/);
  });
});
