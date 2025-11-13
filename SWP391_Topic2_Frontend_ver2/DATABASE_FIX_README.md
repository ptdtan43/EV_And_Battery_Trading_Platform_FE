# 🔧 Khắc phục vấn đề Database - ProductId, FinalPaymentDueDate, PayoutAmount, CompletedDate

## 🚨 Vấn đề phát hiện

Từ database hiện tại, các trường sau đang bị NULL mặc dù đã thanh toán thành công:
- **ProductId**: NULL
- **FinalPaymentDueDate**: NULL  
- **PayoutAmount**: NULL
- **CompletedDate**: NULL

## 🔍 Nguyên nhân

1. **Database chưa có các cột mới** - Các cột được thêm trong code nhưng chưa được tạo trong database
2. **VNPay callback không xử lý đúng** - Callback có thể không được gọi hoặc không cập nhật các trường mới
3. **Dữ liệu cũ chưa được migrate** - Các record cũ chưa được cập nhật với giá trị mặc định

## ✅ Giải pháp

### Bước 1: Cập nhật Database Schema

Chạy script `fix_database_columns.sql`:

```sql
-- Script sẽ:
-- 1. Kiểm tra các cột hiện có
-- 2. Thêm các cột mới nếu chưa có
-- 3. Thêm foreign key constraints
-- 4. Cập nhật dữ liệu hiện tại với giá trị mặc định
```

### Bước 2: Cập nhật Dữ liệu Hiện tại

Chạy script `update_existing_data.sql`:

```sql
-- Script sẽ:
-- 1. Cập nhật SellerId = 1 (admin) cho tất cả records
-- 2. Tính FinalPaymentDueDate = CreatedAt + 7 ngày
-- 3. Tính PayoutAmount = Amount * 0.95 (95%)
-- 4. Set CompletedDate = UpdatedAt cho các payment thành công
-- 5. Copy ProductId từ Orders sang Payments
```

### Bước 3: Test và Verify

Sử dụng `test_callback_fix.html` để:
- Kiểm tra database columns
- Test VNPay callback
- Verify dữ liệu sau khi cập nhật

## 🚀 Hướng dẫn thực hiện

### 1. Backup Database (Quan trọng!)
```sql
BACKUP DATABASE EVTB_DB TO DISK = 'C:\Backup\EVTB_DB_Before_Fix.bak'
```

### 2. Chạy Scripts theo thứ tự
```sql
-- Bước 1: Cập nhật schema
-- Chạy file: fix_database_columns.sql

-- Bước 2: Cập nhật dữ liệu
-- Chạy file: update_existing_data.sql
```

### 3. Verify kết quả
```sql
-- Kiểm tra Orders
SELECT 
    OrderId,
    ProductId,
    SellerId,
    FinalPaymentDueDate,
    CompletedDate
FROM Orders
ORDER BY CreatedAt DESC;

-- Kiểm tra Payments  
SELECT 
    PaymentId,
    ProductId,
    SellerId,
    PayoutAmount,
    FinalPaymentDueDate,
    CompletedDate
FROM Payments
ORDER BY CreatedAt DESC;
```

## 📊 Kết quả mong đợi

Sau khi chạy scripts:

### Orders Table:
- ✅ **SellerId**: 1 (hoặc ID seller thực tế)
- ✅ **ProductId**: ID sản phẩm (nếu có)
- ✅ **FinalPaymentDueDate**: CreatedAt + 7 ngày
- ✅ **CompletedDate**: UpdatedAt (cho orders đã hoàn thành)

### Payments Table:
- ✅ **SellerId**: 1 (hoặc ID seller thực tế)
- ✅ **ProductId**: Copy từ Order
- ✅ **PayoutAmount**: Amount * 0.95
- ✅ **FinalPaymentDueDate**: Copy từ Order
- ✅ **CompletedDate**: UpdatedAt (cho payments thành công)

## 🔄 Để tránh vấn đề trong tương lai

### 1. Deploy Backend Code
Đảm bảo backend đã được deploy với:
- OrderController.cs (có SellerId, FinalPaymentDueDate)
- PaymentController.cs (có PayoutAmount, CompletedDate)
- Models đã cập nhật

### 2. Test Payment Flow
```bash
# Test với test_enhanced_payment_flow.html
# Verify tất cả trường được lưu đúng
```

### 3. Monitor VNPay Callback
```csharp
// Đảm bảo callback endpoint hoạt động:
// GET /api/Payment/callback
// Cập nhật CompletedDate khi thành công
```

## 🛠️ Files cần thiết

1. **fix_database_columns.sql** - Cập nhật database schema
2. **update_existing_data.sql** - Cập nhật dữ liệu hiện tại  
3. **test_callback_fix.html** - Test tool để verify
4. **Backend code đã cập nhật** - OrderController, PaymentController

## ⚠️ Lưu ý quan trọng

1. **Backup database** trước khi chạy scripts
2. **Test trên môi trường dev** trước khi áp dụng production
3. **Verify kết quả** sau mỗi bước
4. **Monitor logs** để đảm bảo không có lỗi

## 🎯 Kết quả cuối cùng

Sau khi hoàn thành:
- ✅ Tất cả records sẽ có đầy đủ thông tin
- ✅ ProductId được lưu đúng
- ✅ FinalPaymentDueDate được tính toán
- ✅ PayoutAmount được tính toán (95%)
- ✅ CompletedDate được set cho giao dịch thành công
- ✅ Hệ thống sẵn sàng cho các giao dịch mới
