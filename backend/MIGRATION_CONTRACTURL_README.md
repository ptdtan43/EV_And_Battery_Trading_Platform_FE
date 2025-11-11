# 🔧 Migration: Thêm cột ContractUrl vào bảng Orders

## 🚨 Vấn đề

Backend code đang cố truy cập cột `ContractUrl` trong bảng `Orders`, nhưng cột này chưa tồn tại trong database, gây ra lỗi:

```
Invalid column name 'ContractUrl'
```

## ✅ Giải pháp

Chạy migration script để thêm cột `ContractUrl` (và các cột liên quan) vào bảng `Orders`.

## 📋 Các bước thực hiện

### Bước 1: Kết nối với SQL Server Database

Mở SQL Server Management Studio (SSMS) hoặc Azure Data Studio và kết nối với database của bạn.

### Bước 2: Chạy Migration Script

Chạy file `add_contracturl_migration.sql`:

```sql
-- File: backend/add_contracturl_migration.sql
```

Script này sẽ:
- ✅ Thêm cột `ContractUrl` (nvarchar(max), nullable) vào bảng `Orders`
- ✅ Thêm cột `CancellationReason` (nvarchar(max), nullable) nếu chưa có
- ✅ Thêm cột `CancelledDate` (datetime2, nullable) nếu chưa có

### Bước 3: Xác nhận Migration

Sau khi chạy script, kiểm tra xem các cột đã được thêm thành công:

```sql
-- Kiểm tra các cột trong bảng Orders
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Orders'
AND COLUMN_NAME IN ('ContractUrl', 'CancellationReason', 'CancelledDate');
```

### Bước 4: Khởi động lại Backend

Sau khi migration hoàn tất, khởi động lại backend service để áp dụng thay đổi.

## 📝 Lưu ý

- Migration script sẽ **không** gây mất dữ liệu (các cột mới là nullable)
- Script có kiểm tra để tránh thêm cột trùng lặp
- Nếu cột đã tồn tại, script sẽ bỏ qua và không báo lỗi

## 🔍 Kiểm tra sau Migration

Sau khi migration, test lại API:

```bash
GET /api/Order/buyer
GET /api/Order/seller
```

Các API này sẽ hoạt động bình thường mà không còn lỗi `Invalid column name 'ContractUrl'`.

## ⚠️ Nếu vẫn gặp lỗi

Nếu sau khi chạy migration vẫn gặp lỗi, kiểm tra:

1. **Database connection**: Đảm bảo backend đang kết nối đúng database
2. **Table name**: Đảm bảo tên bảng là `Orders` (không phải `Order`)
3. **Permissions**: Đảm bảo user database có quyền ALTER TABLE

## 📞 Hỗ trợ

Nếu gặp vấn đề, kiểm tra:
- Logs của backend để xem lỗi chi tiết
- SQL Server error logs
- Connection string trong `appsettings.json`

