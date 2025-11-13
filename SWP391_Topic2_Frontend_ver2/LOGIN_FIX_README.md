# 🔧 Khắc phục lỗi đăng nhập - EV Trading Platform

## 🚨 Vấn đề đã được phát hiện

**Nguyên nhân chính:** Backend thiếu `UserController` để xử lý các API endpoint:
- `/api/User/login`
- `/api/User/register`
- `/api/User` (GET users)

Frontend đang cố gắng gọi các API này nhưng backend chỉ có `PasswordResetController`.

## ✅ Giải pháp đã triển khai

### 1. Tạo UserController
- **File:** `backend/Controllers/UserController.cs`
- **Chức năng:** Xử lý login, register, và quản lý users
- **JWT Authentication:** Tích hợp đầy đủ với JWT tokens

### 2. Tạo Program.cs chính
- **File:** `backend/Program.cs`
- **Cấu hình:** JWT Authentication, CORS, Database Context
- **Services:** Đăng ký EmailService và PasswordResetService

### 3. Tạo Model và Database Context
- **File:** `backend/Models/User.cs` - Model User với đầy đủ fields
- **File:** `backend/Data/EVTBContext.cs` - Entity Framework Context
- **File:** `backend/EVTB_Backend.csproj` - Project file với dependencies

### 4. Database Setup
- **File:** `backend/init_database.sql` - Script tạo database và bảng Users
- **Test Account:** admin@gmail.com / 123456

## 🚀 Hướng dẫn khởi động

### Bước 1: Khởi tạo Database
```sql
-- Chạy script này trong SQL Server Management Studio
-- File: backend/init_database.sql
```

### Bước 2: Khởi động Backend
```bash
cd backend
dotnet restore
dotnet run
```
Backend sẽ chạy tại: `http://localhost:5044`

### Bước 3: Test API
Mở file `test_login_api.html` trong browser để test các API endpoints.

### Bước 4: Khởi động Frontend
```bash
npm install
npm run dev
```
Frontend sẽ chạy tại: `http://localhost:5173`

## 🔍 Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@gmail.com | 123456 |
| User | test@example.com | 123456 |

## 📋 API Endpoints

### Authentication
- `POST /api/User/login` - Đăng nhập
- `POST /api/User/register` - Đăng ký

### User Management (Requires Authentication)
- `GET /api/User` - Lấy danh sách users
- `GET /api/User/{id}` - Lấy thông tin user theo ID
- `PUT /api/User/{id}` - Cập nhật thông tin user

### Password Reset
- `POST /api/PasswordReset/forgot-password` - Quên mật khẩu
- `POST /api/PasswordReset/reset-password` - Đặt lại mật khẩu
- `GET /api/PasswordReset/validate-token` - Validate token

## 🔧 Cấu hình CORS

Backend đã được cấu hình để cho phép các origin sau:
- `http://localhost:5179`
- `http://localhost:5181` 
- `http://localhost:5177`
- `http://localhost:5182`

## 🛠️ Troubleshooting

### Lỗi "Failed to fetch"
1. Kiểm tra backend có đang chạy không
2. Kiểm tra URL trong `src/lib/api.js`
3. Kiểm tra CORS configuration

### Lỗi "401 Unauthorized"
1. Kiểm tra email/password có đúng không
2. Kiểm tra user có tồn tại trong database không
3. Kiểm tra AccountStatus = "Active"

### Lỗi "500 Internal Server Error"
1. Kiểm tra database connection string
2. Kiểm tra database có tồn tại không
3. Kiểm tra logs trong console

## 📝 Ghi chú

- JWT token có thời hạn 60 phút (có thể cấu hình trong appsettings.json)
- Password được hash bằng BCrypt
- Email service chỉ log trong development mode
- Database sử dụng SQL Server LocalDB

## 🎯 Kết quả mong đợi

Sau khi triển khai:
1. ✅ Login form hoạt động bình thường
2. ✅ Register form hoạt động bình thường  
3. ✅ JWT token được tạo và lưu trong localStorage
4. ✅ User được redirect về trang chủ sau khi đăng nhập
5. ✅ Protected routes hoạt động với authentication
