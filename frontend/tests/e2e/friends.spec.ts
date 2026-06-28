import { test, expect } from '@playwright/test';

test.describe('Friend Management E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Đăng ký bộ lắng nghe log console của trình duyệt để dễ debug
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER PAGE ERROR:', err.message));

    // Đăng nhập giả lập với token JWT hợp lệ để parse được userId = 'user-1'
    await page.addInitScript(() => {
      const validJwt = 'header.eyJpZCI6InVzZXItMSIsIm5hbWUiOiJKb2huIERvZSIsImVtYWlsIjoiam9obkB0ZXN0LmNvbSJ9.signature';
      window.localStorage.setItem('collab_access_token', validJwt);
      window.localStorage.setItem('collab_refresh_token', 'fake-refresh-token-456');
      window.localStorage.setItem('auth-storage', JSON.stringify({
        state: {
          accessToken: validJwt,
          refreshToken: 'fake-refresh-token-456',
          isAuthenticated: true,
        },
        version: 0,
      }));
    });

    // Mock API Profile
    await page.route('**/profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          data: { id: 'user-1', name: 'John Doe', email: 'john@test.com' }
        })
      });
    });

    // Mock API Cài đặt thông báo (yêu cầu bởi MainLayout)
    await page.route('**/notifications', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          data: {
            enableAll: true,
            enableChat: true,
            enableFriend: true,
            enableGroup: true,
            enableSystem: true,
            enableSound: true,
            enableVibrate: true,
            chatPriority: 'HIGH'
          }
        })
      });
    });

    // Mock API Lời mời nhóm nhận được (yêu cầu bởi MainLayout)
    await page.route('**/groups/invitations/received', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: [] })
      });
    });

    // Mock danh sách cuộc trò chuyện (yêu cầu bởi MainLayout - tránh lỗi 401 redirect)
    await page.route('**/chat/conversations', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          status: 'SUCCESS',
          data: { conversations: [] }
        })
      });
    });

    // Mock danh sách bạn bè
    await page.route('**/friends/list', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          data: [
            { id: 'friend-1', name: 'Alice Cooper', email: 'alice@test.com', avatarUrl: null, bio: 'Student' }
          ]
        })
      });
    });

    // Mock lời mời kết bạn nhận được
    await page.route('**/friends/requests/receive', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          data: [
            {
              senderId: 'user-bob',
              receiverId: 'user-1',
              status: 'PENDING',
              createdAt: '2026-06-28T09:00:00Z',
              sender: { id: 'user-bob', name: 'Bob Marley', email: 'bob@test.com', avatarUrl: null }
            }
          ]
        })
      });
    });

    // Mock lời mời kết bạn đã gửi
    await page.route('**/friends/requests/sent', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: [] })
      });
    });

    // Mock gợi ý kết bạn
    await page.route('**/friends/suggestions', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          data: [
            { id: 'user-charlie', name: 'Charlie Puth', email: 'charlie@test.com', avatarUrl: null, bio: 'Singer' }
          ]
        })
      });
    });

    // Mock danh sách bị chặn
    await page.route('**/friends/blocked', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: [] })
      });
    });
  });

  test('nên hiển thị danh sách bạn bè và lời mời kết bạn', async ({ page }) => {
    await page.goto('/friends');

    // Ẩn TanStack Query Devtools để tránh đè nút bấm của E2E
    await page.addStyleTag({ content: '.tsqd-parent-container { display: none !important; }' });

    // Đợi UI render xong và kiểm tra
    await expect(page.getByRole('heading', { name: 'Bạn bè', exact: true })).toBeVisible();
    await expect(page.locator('text=Alice Cooper').first()).toBeVisible();
    await expect(page.locator('text=Bob Marley')).toBeVisible();
  });

  test('nên chấp nhận lời mời kết bạn thành công', async ({ page }) => {
    await page.route('**/friends/accept/user-bob', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, message: 'Accepted' })
      });
    });

    await page.goto('/friends');

    // Ẩn TanStack Query Devtools để tránh đè nút bấm của E2E
    await page.addStyleTag({ content: '.tsqd-parent-container { display: none !important; }' });

    const acceptBtn = page.locator('button', { hasText: 'Đồng ý' });
    await expect(acceptBtn).toBeVisible();
    await acceptBtn.click();
  });
});
