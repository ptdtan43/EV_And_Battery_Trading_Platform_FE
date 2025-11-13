# 💳 Khắc phục lỗi thanh toán VNPay - EV Trading Platform

## 🚨 Vấn đề đã được phát hiện

**Lỗi:** `HTTP 400: Deposit requires OrderId`

**Nguyên nhân:** 
1. Frontend gửi `orderId: null` trong payment request
2. Backend validation yêu cầu OrderId cho Deposit payment
3. Thiếu OrderController để tạo order trước khi thanh toán
4. Thiếu PaymentController để xử lý VNPay integration

## ✅ Giải pháp đã triển khai

### 1. Tạo OrderController
- **File:** `backend/Controllers/OrderController.cs`
- **Chức năng:** Tạo và quản lý orders
- **Endpoints:**
  - `POST /api/Order` - Tạo order mới
  - `GET /api/Order` - Lấy danh sách orders của user
  - `GET /api/Order/{id}` - Lấy thông tin order theo ID
  - `PUT /api/Order/{id}` - Cập nhật trạng thái order

### 2. Tạo PaymentController
- **File:** `backend/Controllers/PaymentController.cs`
- **Chức năng:** Xử lý thanh toán VNPay
- **Endpoints:**
  - `POST /api/Payment` - Tạo payment request
  - `GET /api/Payment/callback` - Xử lý callback từ VNPay
  - `GET /api/Payment/{id}` - Lấy thông tin payment

### 3. Tạo Models
- **Order.cs** - Model cho orders
- **Payment.cs** - Model cho payments
- **Cập nhật EVTBContext.cs** - Thêm DbSet cho Order và Payment

### 4. Cập nhật Frontend Logic
- **orderApi.js** - API helper cho orders
- **ProductDetail.jsx** - Sửa logic tạo order trước khi thanh toán
- **Payment flow:** Login → Create Order → Create Payment → Redirect to VNPay

### 5. Database Schema
- **Orders Table:** OrderId, UserId, ProductId, OrderStatus, DepositAmount, TotalAmount
- **Payments Table:** PaymentId, UserId, OrderId, Amount, PaymentType, PaymentStatus, VNPay fields

## 🚀 Hướng dẫn khởi động

### Bước 1: Cập nhật Database
```sql
-- Chạy script backend/init_database.sql để tạo bảng Orders và Payments
```

### Bước 2: Khởi động Backend
```bash
cd backend
dotnet restore
dotnet run
```

### Bước 3: Test Payment Flow
Mở file `test_payment_flow.html` trong browser để test:
1. Login để lấy JWT token
2. Tạo order với ProductId và Amount
3. Tạo payment với OrderId
4. Redirect đến VNPay

### Bước 4: Khởi động Frontend
```bash
npm run dev
```

## 🔄 Payment Flow mới

### Trước (Lỗi):
```
User clicks "Thanh toán" 
→ POST /api/payment { orderId: null, amount: 100000 }
→ ❌ HTTP 400: Deposit requires OrderId
```

### Sau (Đã sửa):
```
User clicks "Thanh toán"
→ POST /api/Order { productId: 1, depositAmount: 100000, totalAmount: 200000 }
→ ✅ Order created: { orderId: 123 }
→ POST /api/Payment { orderId: 123, amount: 100000, paymentType: "Deposit" }
→ ✅ Payment created: { paymentUrl: "https://sandbox.vnpayment.vn/..." }
→ Redirect to VNPay
```

## 📋 API Endpoints mới

### Orders
- `POST /api/Order` - Tạo order
- `GET /api/Order` - Lấy orders của user
- `GET /api/Order/{id}` - Lấy order theo ID
- `PUT /api/Order/{id}` - Cập nhật order

### Payments
- `POST /api/Payment` - Tạo payment
- `GET /api/Payment/callback` - VNPay callback
- `GET /api/Payment/{id}` - Lấy payment theo ID

## 🔧 Cấu hình VNPay

Trong `appsettings.json`:
```json
{
  "VNPay": {
    "Url": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
    "TmnCode": "2QXUI4J4",
    "HashSecret": "RAOEXHYVSDDIIENYWSLDKIENWSIEIY",
    "ReturnUrl": "http://localhost:5173/payment-result"
  }
}
```

## 🛠️ Troubleshooting

### Lỗi "Deposit requires OrderId"
- ✅ **Đã sửa:** Frontend tạo order trước khi thanh toán
- ✅ **Đã sửa:** OrderId được truyền đúng trong payment request

### Lỗi "Order not found"
- Kiểm tra OrderId có tồn tại không
- Kiểm tra Order có thuộc về user hiện tại không

### Lỗi "Payment URL empty"
- Kiểm tra VNPay configuration trong appsettings.json
- Kiểm tra VNPay credentials

### Lỗi CORS
- Backend đã cấu hình CORS cho frontend ports
- Kiểm tra Origin trong CORS policy

## 🎯 Kết quả mong đợi

Sau khi triển khai:
1. ✅ User click "Thanh toán" không bị lỗi
2. ✅ Order được tạo tự động trước khi thanh toán
3. ✅ Payment request có OrderId hợp lệ
4. ✅ Redirect đến VNPay thành công
5. ✅ VNPay callback được xử lý đúng
6. ✅ Order status được cập nhật sau thanh toán

## 📝 Test Cases

### Test Case 1: Full Payment Flow
1. Login với admin@gmail.com / 123456
2. Tạo order với ProductId = 1, Amount = 100000
3. Tạo payment với OrderId từ step 2
4. Verify paymentUrl được tạo
5. Redirect đến VNPay (sandbox)

### Test Case 2: Error Handling
1. Test với invalid OrderId
2. Test với expired token
3. Test với insufficient permissions

## 🔍 Debug Tools

- **test_payment_flow.html** - Test tool cho payment flow
- **Console logs** - Chi tiết từng bước trong browser console
- **Backend logs** - Logs từ OrderController và PaymentController

## 📚 Files đã tạo/cập nhật

### Backend
- `Controllers/OrderController.cs` ✨ NEW
- `Controllers/PaymentController.cs` ✨ NEW  
- `Models/Order.cs` ✨ NEW
- `Models/Payment.cs` ✨ NEW
- `Data/EVTBContext.cs` 🔄 UPDATED
- `appsettings.json` 🔄 UPDATED
- `init_database.sql` 🔄 UPDATED

### Frontend
- `lib/orderApi.js` ✨ NEW
- `pages/ProductDetail.jsx` 🔄 UPDATED

### Test Tools
- `test_payment_flow.html` ✨ NEW
