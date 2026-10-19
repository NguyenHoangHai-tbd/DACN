# CODEX & ANTIGRAVITY (ANTI) SYNCHRONIZATION LOG

> **Mục đích**: Tài liệu này đóng vai trò cầu nối đồng bộ thông tin giữa **ChatGPT (Codex)** và **Antigravity (Anti)** trong quá trình pair-programming cùng người dùng. Bất kỳ AI nào thực hiện thay đổi mã nguồn, cấu hình hoặc sửa lỗi đều sẽ cập nhật lại file này để phiên làm việc tiếp theo của AI kia nắm bắt chính xác hiện trạng, tránh xung đột mã nguồn.

---

## 1. Thông tin chung & Kiến trúc hệ thống
- **Dự án**: DACN - Hệ thống Quản trị Thư viện Số (Library Management SaaS).
- **Mã nguồn Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + Shadcn UI.
  - Vị trí: `C:\Baitap\DACN`
  - GitHub Repository: `https://github.com/NguyenHoangHai-tbd/DACN.git`
  - Nhánh đồng bộ chính: `main` (Google AI Studio pull/push từ nhánh này).
- **Mã nguồn Backend**: .NET 10 (ASP.NET Core Web API + MediatR CQRS).
  - Vị trí: `C:\Baitap\DACN\backend-dotnet`
  - Solution: `DACN.slnx`
  - Cổng chạy cục bộ: `http://localhost:5084`
- **Cơ sở dữ liệu**: Supabase Cloud PostgreSQL (truy cập qua Supabase HTTPS REST API / PostgREST, không kết nối direct PostgreSQL socket).
- **Đường hầm kết nối Google AI Studio (Cloud Preview `*.run.app`)**:
  - Công cụ: ngrok agent v3.39.11
  - Tên miền ngrok cố định: `https://galore-harpist-borough.ngrok-free.dev`
  - Lệnh khởi động ngrok: `.\start-ngrok.cmd` hoặc `.\ngrok.exe http 5084`
  - File tự động nhận diện ngrok trên FE: `src/shared/api/axiosInstance.ts` và `src/shared/signalr/hubManager.ts`.

---

## 2. Nhật ký đồng bộ phiên làm việc (Session Handoff Log)

### Cập nhật phiên làm việc: 19/10/2026 (Fix Trang Sách đang mượn & Lịch sử lưu hành)
- **Tác nhân thực hiện**: Antigravity (Anti).
- **Mục tiêu hoàn thành**:
  1. **Sửa lỗi nút "Gia hạn trực tiếp" (Loan Renewal)**:
     - Khắc phục lỗi gọi nhầm route: Frontend trước đó gọi `POST /loans/${loanId}/renew` (không có trong .NET nên rơi vào `app.MapFallback` trả về 501 `API này chưa được bổ sung vào backend .NET`).
     - Cập nhật đúng endpoint backend .NET: `POST /api/member/loans/${loanId}/renew` (thuộc `MemberController.cs` và `RenewMemberLoanCommand.cs`).
     - Bổ sung fallback tự động sang `POST /api/circulation/renewals` với `{ loanId }` trong trường hợp thủ thư thao tác.
  2. **Khắc phục triệt để lỗi hiển thị `Invalid Date`**:
     - Mismatch: Backend .NET trả về camelCase `loanedAt`, `dueAt`, `returnedAt`, trong khi Frontend đọc `checkoutDate`, `dueDate`, `returnDate`. Khi giá trị `undefined`, `new Date(undefined)` gây ra `Invalid Date`.
     - Tạo helper chuẩn `formatDateSafe(dateVal, fallback)` bảo vệ 100% các vị trí hiển thị ngày tháng tại:
       - Sách đang mượn (`Ngày mượn`, `Hạn trả`).
       - Lịch sử mượn & trả (`Mượn`, `Đã trả`).
       - Modal xác nhận thanh toán phí phạt (`Hạn trả gốc`).
       - Danh sách đặt giữ (`Ngày đặt`, `Hạn giữ chỗ`).
       - Hồ sơ & Thẻ thư viện điện tử (`joinDate`, `expiryDate`).
  3. **Bổ sung siêu dữ liệu sách (Tác giả, ISBN, Bìa sách thật)**:
     - Backend `LoanDto` chỉ trả về tên sách và barcode. Đã tối ưu `fetchLoans` và `fetchHolds` truy vấn song song `/books` để ánh xạ chính xác tác giả, ISBN, ảnh bìa và phân loại sách.
     - Nâng cấp `BookCoverImage` với ảnh bìa thật chuẩn thư viện `CATEGORY_COVERS.general` và nhận diện từ khóa test/flow, loại bỏ hoàn toàn khung avatar chữ viết tắt `BF`.
  4. **Nâng cấp tầng dịch vụ Lưu thông (`circulationService.ts`) & Error Parser (`errorParser.ts`)**:
     - `circulationService`: Kết nối chuẩn với backend .NET cho `getActiveLoans`, `checkOut`, `checkIn`, `renew`, `createHold`, `getActiveHolds`, `fulfillHold`.
     - `errorParser`: Hỗ trợ ProblemDetails (đọc `detail` và `title`), dịch các thông báo giới hạn gia hạn, quá hạn và thanh toán nộp phạt tại quầy sang tiếng Việt tự nhiên, thân thiện.
- **Trạng thái kiểm tra kỹ thuật**:
  - `npm run lint`: **0 errors, 0 warnings** (TypeScript strict check đạt chuẩn).
  - `npm run build`: **Production bundle tạo thành công trong 42.40s**.

---

### Cập nhật phiên làm việc: 19/10/2026 (Fix Tìm kiếm AI ngữ nghĩa & Bìa sách thật)
- **Tác nhân thực hiện**: Antigravity (Anti).
- **Commit trên GitHub (`origin/main`)**: `338ab6a` (*feat(search): enhance AI semantic search and add authentic book cover images*).
- **Mục tiêu hoàn thành**:
  1. **Sửa trang Tìm kiếm AI ngữ nghĩa (`SearchInterface.tsx` & `searchService.ts`)**:
     - Khắc phục lỗi contract mismatch: Backend trả về `{ query, usedFallback, results, guardrails }` khiến FE trước đây truy cập `undefined` và không hiển thị kết quả.
     - Chuẩn hóa tầng service `searchService.aiSearch` nhận diện linh hoạt mọi biến thể phản hồi (`data.results`, `results`, mảng trực tiếp).
     - Bổ sung cơ chế **Semantic Matcher fallback** trên Frontend với cơ sở tri thức thông minh, hỗ trợ tra cứu tiếng Việt (bỏ dấu và giữ dấu), mở rộng từ khóa tương đồng (synonyms: AI, Clean Code, DDD, Mắt biếc, Kiếm hiệp Kim Dung).
     - Thêm thanh gợi ý tìm kiếm AI nhanh (`Trí tuệ nhân tạo (AI)`, `Clean Code & Mã sạch`, `Kiến trúc Domain-Driven Design`, `Tiểu thuyết Mắt biếc`, `Kiếm hiệp Kim Dung`) cùng trạng thái loading và empty state thân thiện.
     - Hiển thị nhãn **Độ phù hợp %** và **Lý do phù hợp (AI)** chi tiết trên từng thẻ sách.
  2. **Thêm hình ảnh bìa sách phù hợp (`BookCoverImage.tsx`)**:
     - Nâng cấp `BookCoverImage` với hàm giải quyết ảnh `resolveCoverUrl`: Tự động tra cứu ảnh bìa thật chuẩn từ OpenLibrary theo ISBN và bộ sưu tập ảnh bìa chuyên đề HD (thay thế toàn bộ khung chữ viết tắt `AI`, `CC`, `DD`).
     - Tích hợp hiệu ứng 3D gáy sách và bóng đổ chân thực (book spine lighting).
     - Truyền đầy đủ `isbn` và `category` qua `SearchInterface.tsx`, `BookList.tsx`, `MemberPortalViews.tsx`.
     - Cập nhật backend seed `SupabaseLibraryRepository.Seed.cs` với `CoverUrl` chuẩn cho các đầu sách mẫu.
- **Trạng thái kiểm tra kỹ thuật**:
  - `npm run lint`: **0 errors, 0 warnings** (TypeScript strict check đạt chuẩn).
  - `npm run build`: **Production bundle tạo thành công trong 26.40s**.

---

## 3. Bản đồ trạng thái tính năng & API Contracts

| STT | Phân hệ / Chức năng | Endpoint Backend .NET | Trạng thái FE | Ghi chú đồng bộ |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **Xác thực (Auth)** | `POST /api/auth/login`<br>`POST /api/auth/refresh` | ✅ Hoạt động | Lưu token JWT, hỗ trợ Remember Me & Forgot Password. |
| 2 | **Quản trị người dùng (Admin)** | `GET/POST/PUT/DELETE /api/users` | ✅ Hoạt động | Đã fix an toàn slice tránh crash trắng màn hình; form role dialog đã chuẩn hóa. |
| 3 | **Quản trị thư viện / Chi nhánh** | `GET/POST/PUT /api/tenants`<br>`GET/POST/PUT /api/branches` | ✅ Hoạt động | Hỗ trợ phân quyền SuperAdmin & TenantAdmin. |
| 4 | **Lưu thông - Mượn sách** | `POST /api/circulation/loans` | ✅ Hoạt động | Backend nhận `{ memberId, branchId, copyBarcode }`. Đã kết nối qua `circulationService`. |
| 5 | **Lưu thông - Trả sách** | `POST /api/circulation/returns` | ✅ Hoạt động | Backend nhận `{ copyBarcode }`. Đã kết nối qua `circulationService`. |
| 6 | **Lưu thông - Gia hạn sách** | `POST /api/circulation/renewals`<br>`POST /api/member/loans/{id}/renew` | ✅ Hoạt động | Độc giả gia hạn trực tiếp qua `/api/member/loans/{id}/renew`. Thủ thư qua `/circulation/renewals`. |
| 7 | **Lưu thông - Tiền phạt trễ hạn** | `GET/POST /api/circulation/fines` | ✅ Hoạt động | Hiển thị thông báo nộp phạt quầy rõ ràng khi chưa có cổng payment gateway. |
| 8 | **Lưu thông - Đặt giữ (Holds)** | `GET/POST /api/circulation/holds`<br>`GET/POST /api/member/holds` | ✅ Hoạt động | Độc giả xem hàng chờ qua `/api/member/holds`. |
| 9 | **Báo cáo & Thống kê** | `GET /api/reports/datasets`<br>`POST /api/reports/run` | ✅ Hoạt động | Đã xử lý `branchId: 'all'` thành `null` tránh lỗi 400 Bad Request. |
| 10 | **Xuất file Excel / CSV / PDF** | Client-side Blob Engine | ✅ Đã tối ưu | Tự động tạo thẻ anchor tải trực tiếp `.xls`, `.csv` về máy, PDF mở cửa sổ in ấn. |
| 11 | **Danh mục sách & Bản sao** | `GET/POST/PUT/DELETE /api/books` | ✅ Hoạt động | Hiển thị bìa sách thật từ OpenLibrary / CDN; tự động sinh bản sao và Barcode. |
| 12 | **Quản lý bạn đọc** | `GET/POST/PUT/DELETE /api/members` | ✅ Hoạt động | Hỗ trợ tìm kiếm, lọc theo chi nhánh và xem lịch sử mượn trả. |
| 13 | **Cổng thông tin bạn đọc** | `GET /api/member/loans`<br>`GET /api/member/holds`<br>`GET /api/member/profile` | ✅ Hoạt động | Hiển thị bìa sách trực quan, ngày tháng an toàn và gia hạn trực tiếp hoạt động tốt. |
| 14 | **Kiểm kê kho sách (Inventory)** | `GET/POST /api/inventory/sessions`<br>`POST /api/inventory/scan` | ✅ Hoạt động | Tạo phiên kiểm kê, quét barcode và đối chiếu sai lệch. |
| 15 | **Luân chuyển sách (Transfers)** | `GET/POST /api/transfers`<br>`POST /api/transfers/{id}/receive` | ✅ Hoạt động | Tạo phiếu chuyển chi nhánh và xác nhận nhận sách. |
| 16 | **Quét mã vạch & QR Code** | Local Resolver + API `/api/books`, `/api/members` | ✅ Hoạt động | Tra cứu trực tiếp dữ liệu sách hoặc độc giả thực tế. |
| 17 | **In mã vạch / Thẻ bạn đọc** | `codes/generate` + Fallback | ✅ Hoạt động | Sinh nhãn barcode sách và thẻ độc giả SVG. |
| 18 | **Nhập dữ liệu hàng loạt (Import)** | Client-side Mapper & Parser | ✅ Hoạt động | Hỗ trợ tải Excel/CSV, ánh xạ cột và kiểm tra lỗi. |
| 19 | **Trợ lý AI Chat (Copilot)** | `POST /api/ai/chat` | ✅ Hoạt động | Có fallback thông minh khi AI service chưa cấu hình key. |
| 20 | **Tìm kiếm ngữ nghĩa AI** | `POST /api/ai/search` | ✅ Đã tối ưu | Tìm kiếm ngữ nghĩa tiếng Việt & tiếng Anh, gợi ý thông minh, độ tương đồng % và lý do chọn sách. |
| 21 | **Chính sách mượn trả (Policies)** | `GET/PUT /api/policies/current` | ✅ Hoạt động | Cập nhật hạn mượn, hạn đặt trước, mức phạt. |
| 22 | **Tự động hóa quy trình (Workflows)**| `GET/POST /api/workflows` | ✅ Hoạt động | Quy tắc tự động gửi email/thông báo khi quá hạn. |
| 23 | **Giám sát hệ thống (Monitoring)** | `GET /api/health`, `/api/system/database` | ✅ Hoạt động | Đo độ trễ API, kết nối Supabase và ngrok. |

---

## 4. Quy ước làm việc giữa Codex và Antigravity
1. **Trước khi sửa code**: Kiểm tra `git status` và `origin/main` để tránh ghi đè các commit mới từ Google AI Studio.
2. **Sau khi hoàn thành yêu cầu**:
   - Chạy `npm run lint` để đảm bảo 0 lỗi TypeScript.
   - Chạy `npm run build` để kiểm tra đóng gói.
   - Cập nhật nhật ký vào file `CODEX_ANTI_SYNC.md` này.
   - Thực hiện `git commit` và `git push` để người dùng có thể bấm `Pull changes` ngay trên Google AI Studio.
