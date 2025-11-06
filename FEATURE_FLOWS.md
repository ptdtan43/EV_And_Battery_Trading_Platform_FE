# Hướng dẫn luồng tính năng

Tài liệu này mô tả các luồng đã triển khai cho: CRUD Sản phẩm, Duyệt/Từ chối bài đăng (Admin), Báo cáo bài đăng, Tìm kiếm, và CRUD Người dùng. Tài liệu cũng chỉ ra các file FE/BE liên quan để bạn lần theo nhanh.

## Quy ước
- API base: `src/config/api.js` → `API_CONFIG.BASE_URL`
- Helper gọi API: `src/lib/api.js`
- Service tập trung: `src/services/apiService.js`
- Trang chi tiết + đặt cọc: `src/pages/ProductDetail.jsx`
- Trang quản trị: `src/pages/AdminDashboard.jsx`

---

## 1) CRUD Sản phẩm (Product)

### Frontend
- Danh sách & chi tiết:
  - `src/pages/Products.jsx` – danh mục
  - `src/pages/ProductDetail.jsx` – chi tiết + đặt cọc
- Tạo/Sửa:
  - `src/pages/CreateListing.jsx` – tạo mới (xe/pin, upload ảnh)
  - `src/pages/EditListing.jsx` – chỉnh sửa (giữ ảnh cũ, thêm ảnh mới)
- Upload ảnh: sử dụng FormData trong các trang trên và các API ảnh bên dưới.

### Service (FE)
- `src/services/apiService.js`
  - `getAllProducts()` → GET `/api/Product`
  - `getProductById(id)` → GET `/api/Product/{id}`
  - `createProduct(data)` → POST `/api/Product`
  - `updateProduct(id, data)` → PUT `/api/Product/{id}`
  - `deleteProduct(id)` → DELETE `/api/Product/{id}`
  - Ảnh sản phẩm:
    - `getProductImages(productId)` → GET `/api/ProductImage/product/{productId}`
    - `uploadProductImage(formData)` → POST `/api/ProductImage`
    - `uploadMultipleProductImages(formData)` → POST `/api/ProductImage/multiple`
    - `deleteProductImage(imageId)` → DELETE `/api/ProductImage/{id}`

### Backend
- Controller: `backend/Controllers/ProductController.cs`
- Ảnh: `backend/Controllers/ProductImageController.cs`
- Model: `backend/Models/Product.cs`

### Tóm tắt luồng
1) Tạo: gửi JSON → `POST /api/Product` (trả về productId) → upload ảnh qua FormData.
2) Đọc: danh sách `GET /api/Product`; chi tiết `GET /api/Product/{id}`.
3) Sửa: `PUT /api/Product/{id}` cho dữ liệu; ảnh thêm/xóa riêng qua API ảnh.
4) Xóa: `DELETE /api/Product/{id}`.

---

## 2) Duyệt / Từ chối bài đăng (Admin)

### Frontend
- `src/pages/AdminDashboard.jsx` – duyệt/từ chối trong các tab xe/pin/hàng đợi.

### Service (FE)
- `src/services/apiService.js`
  - `approveProduct(id)` → POST `/api/Product/{id}/approve`
  - `rejectProduct(id, reason)` → POST `/api/Product/{id}/reject` body `{ reason }`

### Backend
- `backend/Controllers/ProductController.cs` – cập nhật trạng thái, ghi audit.

### Tóm tắt luồng
1) Admin chọn bài pending.
2) Duyệt → `POST /api/Product/{id}/approve`.
3) Từ chối (nhập lý do) → `POST /api/Product/{id}/reject`.
4) UI refresh, hiển thị badge trạng thái.

---

## 3) Báo cáo bài đăng (Report)

### Frontend
- Gửi báo cáo: `src/components/common/ReportModal.jsx`.
- Xử lý admin: `src/components/admin/ResolveReportModal.jsx` (và trong `AdminDashboard.jsx`).

### Service (FE)
- (Nếu backend đã có) các endpoint thường dùng:
  - POST `/api/Report` – tạo report
  - GET `/api/Report` – danh sách report (admin)
  - PUT `/api/Report/{id}/resolve` – xử lý

### Tóm tắt luồng
1) Người dùng mở modal, nhập lý do/chi tiết.
2) Gửi report.
3) Admin xem và xử lý trong dashboard.

---

## 4) Tìm kiếm

### Frontend
- Tìm nhanh & lọc nâng cao:
  - `src/pages/HomePage.jsx` – lấy `/api/Product`, lọc client.
  - `src/components/common/AdvancedSearchFilter.jsx` – UI lọc nâng cao.
  - `src/lib/advancedSearchApi.js` – gọi tìm kiếm nâng cao (nếu có backend hỗ trợ).

### Service (FE)
- `src/services/apiService.js`
  - `searchProducts(params)` → POST `/api/Search/products`
  - `searchUsers(params)` → POST `/api/Search/users`

### Tóm tắt luồng
1) Trang Home tải tất cả sản phẩm.
2) Lọc nâng cao gửi object filter tới `/api/Search/products`.
3) Render kết quả; ảnh/người bán được hydrate sau.

---

## 5) CRUD Người dùng (User)

### Frontend
- Quản lý phiên: `src/contexts/AuthContext.jsx` (đăng nhập/đăng ký/cập nhật profile, lưu `localStorage`).
- Trang dùng dữ liệu: `src/pages/Profile.jsx`, tab Users trong `AdminDashboard.jsx`, v.v.

### Service (FE)
- `src/services/apiService.js`
  - `getAllUsers()` → GET `/api/User`
  - `getUserById(id)` → GET `/api/User/{id}`
  - `updateUser(id, data)` → PUT `/api/User/{id}`
  - `deleteUser(id)` → DELETE `/api/User/{id}`
  - Auth gọi qua `AuthContext` + `src/lib/api.js`.

### Backend
- `backend/Controllers/UserController.cs`
  - `POST /api/User/login`
  - `POST /api/User/register`
  - `GET /api/User` (yêu cầu auth)
  - `GET /api/User/{id}` (auth)
  - `PUT /api/User/{id}` (auth)

### Tóm tắt luồng
1) Đăng ký/đăng nhập trả JWT + user → lưu `evtb_auth` trong `localStorage`.
2) Request có auth gắn `Authorization: Bearer <token>` (tự động bởi `src/lib/api.js`).
3) Cập nhật profile gọi `PUT /api/User/{id}`; `AuthContext` đồng bộ state & storage.

---

## 6) Đặt cọc & Thanh toán (ngữ cảnh)

- VNPay: `src/components/PayWithVnPayButton.jsx`, `src/components/PaymentSection.jsx`, `src/api/payment.js`, `src/lib/paymentApiClient.js`.
- Quy tắc cọc:
  - `src/pages/ProductDetail.jsx` → `getDepositAmount()`
    - Pin: cố định 500.000 VND
    - Xe: 5.000.000 VND nếu ≤ 300 triệu; 10.000.000 VND nếu > 300 triệu

---

## 7) Chat & chặn rò rỉ liên hệ (ngữ cảnh)

- Realtime: `src/pages/ChatHistory.jsx` + `src/services/signalRService.js` + SignalR Hub BE.
- Kiểm duyệt tin nhắn (số ĐT, link, MXH): `src/utils/messageValidator.js` (chặn ở UI và thêm lớp chặn tại `src/services/chatService.js`).

---

## Trace nhanh

- Duyệt sản phẩm (Admin): `AdminDashboard.jsx` → `apiService.approveProduct(id)` → `POST /api/Product/{id}/approve` → refresh list.
- Tạo sản phẩm có ảnh: `CreateListing.jsx` → `apiService.createProduct()` → productId → `apiService.uploadMultipleProductImages(formData)`.
- Tìm kiếm nâng cao: `AdvancedSearchFilter` → `advancedSearchProducts(filters)` → API → render + hydrate ảnh.

---

## Ghi chú
- Gọi API qua `src/lib/api.js` để thống nhất header auth & xử lý lỗi.
- Thêm endpoint mới: bổ sung vào `src/services/apiService.js` và gọi từ trang tương ứng.
- Tính năng admin: policy cấu hình tại `backend/Program.cs` → `AddAuthorization` (policy `AdminOnly`).

