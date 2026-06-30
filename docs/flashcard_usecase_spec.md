## 2.5.X. UCXX: Quản lý Flashcard và Học tập

### Bảng 2.XX: Bảng Use Case quản lý Flashcard và Học tập

| Thuộc tính | Mô tả |
|---|---|
| **Use Case ID** | UCXX |
| **Tên chức năng** | Quản lý Flashcard và Học tập |
| **Mô tả** | Cho phép người dùng tạo các bộ thẻ học (deck), tạo/xem/sửa/xóa các flashcard trong bộ, chia sẻ bộ thẻ với người dùng khác, và học tập theo phương pháp lặp lại ngắn cách (spaced repetition) sử dụng thuật toán SM-2. |
| **Tác nhân** | Người dùng đã đăng nhập |
| **Điều kiện trước** | Người dùng đã đăng nhập thành công vào hệ thống. |
| **Điều kiện tiên quyết** | Người dùng có thể tạo deck mới, thêm flashcard vào deck, học flashcard và xem tiến độ học tập. |
| **Các Use Case con** | UCXX-1: Quản lý Deck; UCXX-2: Quản lý Flashcard; UCXX-3: Học tập Spaced Repetition; UCXX-4: Chia sẻ Deck |

---

### UCXX-1: Quản lý Deck

| Thuộc tính | Mô tả |
|---|---|
| **Use Case ID** | UCXX-1 |
| **Tên chức năng** | Quản lý Deck (tạo, xem, sửa, xóa bộ thẻ) |
| **Mô tả** | Cho phép người dùng tạo bộ thẻ học mới với tên, mô tả, màu sắc và biểu tượng; xem danh sách bộ thẻ của mình hoặc bộ thẻ công khai; chỉnh sửa thông tin bộ thẻ; xóa bộ thẻ. |
| **Tác nhân** | Người dùng đã đăng nhập |
| **Điều kiện trước** | Người dùng đã đăng nhập. |
| **Điều kiện tiên quyết** | Deck được tạo thành công và lưu vào CSDL. |

#### Luồng chính

1. Người dùng truy cập trang Decks (`/flashcards`) bằng điều hướng từ sidebar.
2. Hệ thống hiển thị giao diện với 2 tab: **"Bộ thẻ của tôi"** và **"Khám phá"**.
3. Tab **"Bộ thẻ của tôi"**: Hệ thống gọi API `GET /flashcard/decks` để lấy danh sách deck của người dùng (phân trang).
4. Tab **"Khám phá"**: Hệ thống gọi API `GET /flashcard/decks/explore` để lấy danh sách deck công khai của người khác (phân trang).
5. Người dùng nhấn nút **"Tạo bộ thẻ"** (nút `+` hoặc button).
6. Hệ thống hiển thị modal **CreateDeckModal** với form:
   - **Tên bộ thẻ** (bắt buộc, text input)
   - **Mô tả** (tùy chọn, textarea)
   - **Màu sắc** (mặc định `#3B82F6`, color picker)
   - **Biểu tượng** (tùy chọn, dropdown chọn icon: Book, Language, Science, Math, History, Code, Music, Art)
   - **Chế độ công khai** (toggle switch, mặc định: riêng tư)
7. Người dùng nhấn **"Tạo"**.
8. Hệ thống gọi API `POST /flashcard/decks` với dữ liệu form.
9. Hệ thống kiểm tra dữ liệu (tên không được rỗng, độ dài hợp lệ).
10. Hệ thống tạo deck mới trong CSDL, trả về deck vừa tạo.
11. Hệ thống cập nhật danh sách deck trên giao diện, đóng modal, hiển thị thông báo thành công.

#### Luồng thay thế

5a. Người dùng nhấn icon **chỉnh sửa** trên một DeckCard thay vì tạo mới.
- Hệ thống hiển thị modal với dữ liệu deck hiện tại (pre-filled).
- Người dùng chỉnh sửa thông tin và nhấn **"Lưu"**.
- Hệ thống gọi API `PATCH /flashcard/decks/:deckId` để cập nhật deck.

#### Luồng ngoại lệ

7a. Người dùng bỏ trống trường **Tên bộ thẻ**.
- 8a. Hệ thống hiển thị cảnh báo dưới trường nhập liệu: *"Tên bộ thẻ không được để trống"*.

7b. Tên bộ thẻ vượt quá giới hạn ký tự.
- 8b. Hệ thống hiển thị cảnh báo: *"Tên bộ thẻ không được vượt quá 100 ký tự"*.

9a. Lỗi kết nối CSDL hoặc server.
- 10a. Hệ thống hiển thị thông báo lỗi: *"Đã xảy ra lỗi khi tạo bộ thẻ. Vui lòng thử lại."*.

---

### UCXX-2: Quản lý Flashcard

| Thuộc tính | Mô tả |
|---|---|
| **Use Case ID** | UCXX-2 |
| **Tên chức năng** | Quản lý Flashcard (tạo, xem, sửa, xóa thẻ) |
| **Mô tả** | Cho phép người dùng tạo flashcard với mặt trước (câu hỏi) và mặt sau (đáp án), thêm gợi ý, thẻ đánh dấu, độ khó; xem danh sách thẻ trong deck; chỉnh sửa hoặc xóa thẻ. |
| **Tác nhân** | Người dùng đã đăng nhập (chủ sở hữu deck hoặc người được chia sẻ với quyền canEdit) |
| **Điều kiện trước** | Người dùng đã mở trang chi tiết deck (`DeckDetailPage`) và có quyền thêm thẻ. |
| **Điều kiện tiên quyết** | Flashcard được tạo/thêm thành công và lưu vào CSDL. |

#### Luồng chính

1. Tại trang chi tiết Deck (`/flashcards/:deckId`), người dùng nhấn nút **"Thêm Flashcard"** hoặc **"Thêm thẻ"** (`+`).
2. Hệ thống hiển thị modal **CreateFlashcardModal** với form:
   - **Mặt trước (Câu hỏi)*** - Textarea, tối đa 600 ký tự
   - **Mặt sau (Đáp án)*** - Textarea, tối đa 600 ký tự
   - **Gợi ý** (tùy chọn) - Input text
   - **Độ khó** (tùy chọn) - Dropdown: Dễ, Trung bình, Khó (mặc định: Trung bình)
3. Người dùng nhấn nút **"Thêm thẻ"**.
4. Hệ thống gọi API `POST /flashcard/decks/:deckId/cards` với dữ liệu form.
5. Hệ thống kiểm tra dữ liệu (câu hỏi và đáp án không rỗng, không vượt quá 600 ký tự).
6. Hệ thống tạo flashcard mới trong CSDL với các trường mặc định:
   - `intervalDays = 1`
   - `easeFactor = 2.5`
   - `repetitions = 0`
   - `nextReviewAt = null`
7. Hệ thống cập nhật giao diện, đóng modal, hiển thị thông báo thành công.
8. Người dùng có thể xem thẻ vừa tạo trong danh sách thẻ của deck.

#### Luồng thay thế

3a. Người dùng nhấn nút **"Thêm nhiều thẻ"** (bulk create) thay vì tạo từng thẻ.
- Hệ thống hiển thị modal với danh sách các cặp câu hỏi - đáp án.
- Người dùng nhập nhiều thẻ cùng lúc.
- Hệ thống gọi API `POST /flashcard/decks/:deckId/cards/bulk`.

3b. Người dùng nhấn icon **sửa** trên một flashcard.
- Hệ thống hiển thị modal với dữ liệu flashcard hiện tại (pre-filled).
- Người dùng chỉnh sửa và nhấn **"Lưu"**.
- Hệ thống gọi API `PATCH /flashcard/cards/:cardId`.

3c. Người dùng nhấn icon **xóa** trên một flashcard.
- Hệ thống hiển thị dialog xác nhận: *"Bạn có chắc muốn xóa thẻ này?"*.
- Người dùng xác nhận xóa.
- Hệ thống gọi API `DELETE /flashcard/cards/:cardId` (soft delete: `isDeleted = true`).

#### Luồng ngoại lệ

5a. Trường **Mặt trước** hoặc **Mặt sau** bị bỏ trống.
- 6a. Hệ thống hiển thị cảnh báo: *"Mặt trước/đáp án không được để trống"*.

5b. Trường **Mặt trước** hoặc **Mặt sau** vượt quá 600 ký tự.
- 6b. Hệ thống hiển thị cảnh báo: *"Mặt trước/đáp án không được vượt quá 600 ký tự"*.

5c. Người dùng không có quyền thêm thẻ (deck riêng tư của người khác).
- 6c. Hệ thống hiển thị cảnh báo: *"Bạn không có quyền thêm thẻ vào bộ thẻ này"*.

---

### UCXX-3: Học tập Spaced Repetition (SM-2)

| Thuộc tính | Mô tả |
|---|---|
| **Use Case ID** | UCXX-3 |
| **Tên chức năng** | Học tập Spaced Repetition với thuật toán SM-2 |
| **Mô tả** | Cho phép người dùng học flashcard theo phương pháp lặp lại ngắn cách (spaced repetition) sử dụng thuật toán SM-2. Hệ thống lên lịch ôn tập tự động dựa trên chất lượng ghi nhớ của người dùng. |
| **Tác nhân** | Người dùng đã đăng nhập |
| **Điều kiện trước** | Người dùng đang ở trang chi tiết deck có ít nhất 1 flashcard. |
| **Điều kiện tiên quyết** | Hệ thống ghi nhận kết quả học tập và cập nhật lịch ôn tập cho thẻ. |

#### Luồng chính

1. Tại trang chi tiết Deck, người dùng nhấn nút **"Học ngay"** (`StudyModeButton`).
2. Hệ thống gọi API `GET /flashcard/decks/:deckId/study` để lấy danh sách thẻ cần học (thẻ đến hạn ôn + thẻ mới chưa học).
3. Hệ thống hiển thị giao diện **StudyMode** với thanh tiến độ và thẻ học đầu tiên.
4. Thẻ hiển thị **câu hỏi** (mặt trước) rõ ràng ở giữa màn hình. Gợi ý hiển thị bên dưới nếu có.
5. Người dùng suy nghĩ câu trả lời, sau đó **nhấn vào thẻ** hoặc nhấn nút **"Lật thẻ"** (`FlipIcon`).
6. Hệ thống lật thẻ (flip animation), hiển thị **đáp án** (mặt sau) cùng với badge độ khó.
7. Hệ thống hiển thị 4 nút đánh giá chất lượng ghi nhớ:
   - **Quên** (màu đỏ) - Quality = 0, ôn lại sau ~1 phút
   - **Khó** (màu cam) - Quality = 2, ôn lại sau ~6 phút
   - **Nhớ** (màu xanh lá) - Quality = 3, ôn lại sau ~1 ngày
   - **Dễ** (màu xanh dương) - Quality = 5, ôn lại sau ~4 ngày
8. Người dùng nhấn một trong 4 nút đánh giá.
9. Hệ thống gọi API `POST /flashcard/cards/:cardId/review` với `quality` và `timeSpent`.
10. Hệ thống tính toán thông số SM-2 mới và cập nhật vào CSDL:
    - Nếu `quality < 3`: reset `repetitions = 0`, `intervalDays = 1`
    - Nếu `quality >= 3`:
      - `repetitions = repetitions + 1`
      - Nếu `repetitions = 1`: `intervalDays = 1`
      - Nếu `repetitions = 2`: `intervalDays = 6`
      - Nếu `repetitions > 2`: `intervalDays = intervalDays × easeFactor`
    - Tính `easeFactor` mới: `easeFactor = max(1.3, easeFactor + (0.1 - (5 - quality) × (0.08 + (5 - quality) × 0.02)))`
    - `nextReviewAt = now + intervalDays`
11. Hệ thống chuyển sang thẻ tiếp theo hoặc hiển thị màn hình **Hoàn thành** nếu đã học hết thẻ.

#### Luồng thay thế

5a. Người dùng nhấn nút **"Trước"** để quay lại thẻ trước đó.
- Hệ thống hiển thị thẻ trước đó (không lật).

5b. Người dùng nhấn nút **"Sau"** để bỏ qua thẻ hiện tại.
- Hệ thống chuyển sang thẻ tiếp theo.

5c. Người dùng nhấn icon **EyeOff** để ẩn/hiện đáp án mà không cần lật thẻ.
- Hệ thống toggle hiển thị đáp án.

#### Luồng ngoại lệ

8a. Không có thẻ nào để học (tất cả thẻ đã được học gần đây).
- 9a. Hệ thống hiển thị thông báo: *"Tất cả thẻ đã được ôn tập. Quay lại sau nhé!"*.
- 10a. Hệ thống quay về trang chi tiết deck.

8b. Deck không có thẻ nào.
- 9b. Hệ thống hiển thị thông báo: *"Bộ thẻ này chưa có thẻ nào. Hãy thêm thẻ trước khi học."*.
- 10b. Hệ thống quay về trang chi tiết deck.

---

### UCXX-4: Chia sẻ Deck

| Thuộc tính | Mô tả |
|---|---|
| **Use Case ID** | UCXX-4 |
| **Tên chức năng** | Chia sẻ Deck với người dùng khác |
| **Mô tả** | Cho phép chủ sở hữu deck chia sẻ deck với người dùng khác, cấp quyền xem hoặc quyền chỉnh sửa. Người dùng được chia sẻ có thể xem và học deck, nếu có quyền canEdit thì được thêm/sửa flashcard. |
| **Tác nhân** | Chủ sở hữu deck (chỉ có chủ sở hữu mới có quyền chia sẻ) |
| **Điều kiện trước** | Người dùng đang ở trang chi tiết deck mà mình sở hữu. |
| **Điều kiện tiên quyết** | Người dùng được chia sẻ có thể xem deck và tham gia học tập. |

#### Luồng chính

1. Tại trang chi tiết Deck, người dùng nhấn nút **"Chia sẻ"** hoặc **"Share"**.
2. Hệ thống hiển thị dialog/panel chia sẻ.
3. Người dùng nhập **email** hoặc **username** của người cần chia sẻ.
4. Người dùng chọn quyền:
   - **Chỉ xem** (`canEdit = false`): Người được chia sẻ chỉ xem được deck và học flashcard
   - **Chỉnh sửa** (`canEdit = true`): Người được chia sẻ có thể thêm, sửa, xóa flashcard
5. Người dùng nhấn **"Chia sẻ"**.
6. Hệ thống gọi API `POST /flashcard/decks/:deckId/share` với `{ targetUserId, canEdit }`.
7. Hệ thống tạo bản ghi trong bảng `DeckShare` trong CSDL.
8. Hệ thống hiển thị thông báo thành công và cập nhật danh sách người đã chia sẻ.

#### Luồng thay thế

5a. Người dùng nhấn icon **xóa** bên cạnh một người đã chia sẻ.
- Hệ thống hiển thị dialog xác nhận.
- Người dùng xác nhận xóa.
- Hệ thống gọi API `DELETE /flashcard/decks/:deckId/share/:targetUserId`.
- Hệ thống xóa bản ghi `DeckShare` tương ứng.

5b. Người dùng bật/tắt toggle **canEdit** cho một người đã chia sẻ.
- Hệ thống gọi API `PATCH /flashcard/decks/:deckId/share/:targetUserId` để cập nhật quyền.

#### Luồng ngoại lệ

4a. Người dùng nhập email/username không tồn tại trong hệ thống.
- 5a. Hệ thống hiển thị cảnh báo: *"Không tìm thấy người dùng với email/username này"*.

4b. Người dùng cố gắng chia sẻ deck riêng tư (không phải của mình).
- 5b. Hệ thống hiển thị cảnh báo: *"Bạn không có quyền chia sẻ bộ thẻ này"*.

4c. Người dùng cố gắng chia sẻ với chính mình.
- 5c. Hệ thống hiển thị cảnh báo: *"Bạn không thể chia sẻ bộ thẻ với chính mình"*.

4d. Deck đã được chia sẻ với người dùng này trước đó.
- 5d. Hệ thống hiển thị cảnh báo: *"Bộ thẻ đã được chia sẻ với người dùng này"*.

---

### Bảng 2.YY: Bảng các lớp/module chính của chức năng Flashcard

| Module | Layer | Mô tả |
|---|---|---|
| `DecksPage` | Presentation (Frontend) | Trang chính hiển thị danh sách deck với 2 tab "Bộ thẻ của tôi" và "Khám phá" |
| `DeckDetailPage` | Presentation (Frontend) | Trang chi tiết deck hiển thị danh sách flashcard, thông tin deck, nút học, thống kê |
| `DeckCard` | Presentation (Frontend) | Component hiển thị card deck trong danh sách với menu actions |
| `CreateDeckModal` | Presentation (Frontend) | Modal tạo/chỉnh sửa deck với form |
| `CreateFlashcardModal` | Presentation (Frontend) | Modal tạo flashcard với form (front, back, hint, difficulty) |
| `StudyCard` | Presentation (Frontend) | Component thẻ học với flip animation và 4 nút đánh giá |
| `flashcard.store` | State Management (Frontend) | Zustand store quản lý state decks, cards, study mode |
| `flashcard.service` | API Client (Frontend) | Gọi các API endpoints liên quan đến flashcard |
| `flashcard.route` | API Route (Backend) | Định nghĩa các endpoints REST cho flashcard |
| `flashcard.controller` | Controller (Backend) | Xử lý request, validation input, gọi service, trả response |
| `flashcard.service` | Business Logic (Backend) | Validation nghiệp vụ, xử lý logic SM-2, gọi repository |
| `flashcard.repo` | Data Access (Backend) | Thao tác CSDL với Prisma ORM, cài đặt thuật toán SM-2 |
| `Deck`, `Flashcard`, `Review`, `DeckShare` | Database Model (Prisma) | Các bảng trong CSDL lưu trữ dữ liệu flashcard |

---

### Bảng 2.ZZ: Bảng API Endpoints của chức năng Flashcard

| Method | Endpoint | Tác nhân | Mô tả |
|---|---|---|---|
| `POST` | `/flashcard/decks` | Người dùng đăng nhập | Tạo deck mới |
| `GET` | `/flashcard/decks` | Người dùng đăng nhập | Lấy danh sách deck của người dùng (phân trang) |
| `GET` | `/flashcard/decks/explore` | Người dùng đăng nhập | Lấy danh sách deck công khai (phân trang) |
| `GET` | `/flashcard/decks/:deckId` | Người dùng đăng nhập | Lấy chi tiết một deck |
| `PATCH` | `/flashcard/decks/:deckId` | Chủ sở hữu deck | Cập nhật thông tin deck |
| `DELETE` | `/flashcard/decks/:deckId` | Chủ sở hữu deck | Xóa deck (soft delete) |
| `POST` | `/flashcard/decks/:deckId/cards` | Chủ sở hữu / canEdit | Tạo flashcard mới |
| `POST` | `/flashcard/decks/:deckId/cards/bulk` | Chủ sở hữu / canEdit | Tạo nhiều flashcard cùng lúc |
| `GET` | `/flashcard/decks/:deckId/cards` | Người dùng đăng nhập | Lấy danh sách flashcard trong deck (phân trang) |
| `GET` | `/flashcard/cards/:cardId` | Người dùng đăng nhập | Lấy chi tiết một flashcard |
| `PATCH` | `/flashcard/cards/:cardId` | Chủ sở hữu / canEdit | Cập nhật flashcard |
| `DELETE` | `/flashcard/cards/:cardId` | Chủ sở hữu deck | Xóa flashcard (soft delete) |
| `GET` | `/flashcard/decks/:deckId/study` | Người dùng đăng nhập | Lấy danh sách thẻ cần học (due + new) |
| `GET` | `/flashcard/decks/:deckId/stats` | Người dùng đăng nhập | Lấy thống kê deck (total, due, new, learned) |
| `POST` | `/flashcard/cards/:cardId/review` | Người dùng đăng nhập | Gửi kết quả ôn tập, cập nhật SM-2 |
| `POST` | `/flashcard/decks/:deckId/share` | Chủ sở hữu deck | Chia sẻ deck với người dùng khác |
| `GET` | `/flashcard/decks/:deckId/shares` | Người dùng đăng nhập | Lấy danh sách người đã chia sẻ deck |
| `DELETE` | `/flashcard/decks/:deckId/share/:targetUserId` | Chủ sở hữu deck | Xóa chia sẻ deck |
