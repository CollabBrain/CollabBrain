import { test, expect } from '@playwright/test';

test.describe('Authentication Flow E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('nên hiển thị giao diện đăng nhập đầy đủ các thành phần', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Chào mừng trở lại 👋' })).toBeVisible();
    
    const registerLink = page.locator('a', { hasText: 'Đăng ký miễn phí' });
    await expect(registerLink).toBeVisible();
  });

  test('nên hiển thị lỗi validation khi gửi form rỗng', async ({ page }) => {
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Vui lòng nhập email')).toBeVisible();
    await expect(page.locator('text=Vui lòng nhập mật khẩu')).toBeVisible();
  });

  test('nên hiển thị lỗi khi nhập email sai định dạng', async ({ page }) => {
    await page.fill('input[type="email"]', 'incorrect-email');
    await page.fill('input[type="password"]', '123456');
    
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Email không hợp lệ')).toBeVisible();
  });

  test('nên đăng nhập thành công và chuyển hướng tới dashboard', async ({ page }) => {
    // Mock API đăng nhập trả về thành công
    await page.route('**/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          status: 'SUCCESS',
          data: {
            accessToken: 'fake-access-token-xyz',
            refreshToken: 'fake-refresh-token-xyz',
          },
        }),
      });
    });

    // Mock API lấy thông tin thông báo tại dashboard
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

    // Nhập email và mật khẩu đúng chuẩn
    await page.fill('input[type="email"]', 'success@test.com');
    await page.fill('input[type="password"]', 'password123');

    // Click nút Đăng nhập
    await page.click('button[type="submit"]');

    // Đợi trang chuyển hướng sang dashboard
    await page.waitForURL('**/dashboard');
    await expect(page).toHaveURL(/.*dashboard/);
  });
});
