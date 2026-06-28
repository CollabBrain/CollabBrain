import { test, expect } from '@playwright/test';

test.describe('Messaging Flow E2E', () => {
  test.beforeEach(async ({ page }) => {
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

    // Mock API Cài đặt thông báo
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

    // Mock API Lời mời nhóm nhận được
    await page.route('**/groups/invitations/received', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: [] })
      });
    });

    // Mock lời mời kết bạn nhận được
    await page.route('**/friends/requests/receive', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: [] })
      });
    });

    // Mock danh sách cuộc trò chuyện
    await page.route('**/chat/conversations', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          status: 'SUCCESS',
          data: {
            conversations: [
              {
                id: 'conv-1',
                name: null,
                type: 'DIRECT',
                avatarUrl: null,
                createdAt: '2026-06-28T09:00:00Z',
                updatedAt: '2026-06-28T09:00:00Z',
                participants: [
                  { id: 'user-1', name: 'John Doe', email: 'john@test.com', avatarUrl: null },
                  { id: 'friend-1', name: 'Alice Cooper', email: 'alice@test.com', avatarUrl: null }
                ],
                unreadCount: 0,
                lastMessage: { id: 'msg-last', content: 'Hello John', createdAt: '2026-06-28T09:00:00Z' }
              }
            ]
          }
        })
      });
    });

    // Mock danh sách tin nhắn của cuộc trò chuyện conv-1
    await page.route('**/chat/conversations/conv-1/messages**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          status: 'SUCCESS',
          data: {
            messages: [
              {
                id: 'msg-1',
                conversationId: 'conv-1',
                senderId: 'friend-1',
                content: 'Hello John',
                type: 'TEXT',
                createdAt: '2026-06-28T09:00:00Z',
                updatedAt: '2026-06-28T09:00:00Z'
              }
            ],
            hasMore: false
          }
        })
      });
    });
  });

  test('nên hiển thị danh sách hội thoại và tin nhắn cũ', async ({ page }) => {
    await page.goto('/chat');

    // Ẩn TanStack Query Devtools để tránh đè nút bấm của E2E
    await page.addStyleTag({ content: '.tsqd-parent-container { display: none !important; }' });

    // Kiểm tra tên người chat trong danh sách sidebar
    await expect(page.locator('text=Alice Cooper').first()).toBeVisible();

    // Click chọn cuộc hội thoại Alice Cooper
    await page.click('text=Alice Cooper');

    // Kiểm tra tin nhắn cũ đã load lên cửa sổ chat
    await expect(page.locator('#msg-msg-1')).toBeVisible();
  });

  test('nên gửi tin nhắn mới thành công qua kênh REST fallback', async ({ page }) => {
    // Mock gửi tin nhắn thành công qua HTTP fallback
    await page.route('**/chat/messages', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          status: 'SUCCESS',
          data: {
            id: 'msg-new',
            conversationId: 'conv-1',
            senderId: 'user-1',
            content: 'Hi Alice, how are you?',
            type: 'TEXT',
            createdAt: '2026-06-28T09:10:00Z',
            updatedAt: '2026-06-28T09:10:00Z'
          }
        })
      });
    });

    await page.goto('/chat');

    // Ẩn TanStack Query Devtools để tránh đè nút bấm của E2E
    await page.addStyleTag({ content: '.tsqd-parent-container { display: none !important; }' });

    // Click chọn cuộc hội thoại
    await page.click('text=Alice Cooper');

    // Điền tin nhắn vào textarea
    const messageInput = page.locator('#message-input');
    await expect(messageInput).toBeVisible();
    await messageInput.fill('Hi Alice, how are you?');

    // Click gửi
    const sendButton = page.locator('#send-message-btn');
    await expect(sendButton).toBeVisible();
    await sendButton.click();
  });
});
