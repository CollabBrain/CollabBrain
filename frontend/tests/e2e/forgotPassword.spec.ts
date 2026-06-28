import { test, expect } from '@playwright/test';

test.describe('ForgotPassword Flow E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/forgot-password');
  });

  test('nên hiển thị giao diện quên mật khẩu', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Quên mật khẩu 🔑' })).toBeVisible();
    await expect(page.locator('text=Nhập email')).toBeVisible();
  });

  test('nên báo lỗi khi gửi form email rỗng hoặc không đúng định dạng', async ({ page }) => {
    // Để trống email và nhấn gửi
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Vui lòng nhập email')).toBeVisible();

    // Điền email sai định dạng
    await page.fill('#forgot-email', 'invalid-email');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Email không hợp lệ')).toBeVisible();
  });
});
