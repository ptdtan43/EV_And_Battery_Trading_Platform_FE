# Hướng dẫn Setup Chức năng Quên Mật khẩu

## Tổng quan
Chức năng quên mật khẩu đã được triển khai hoàn chỉnh với các tính năng:
- Gửi email reset password
- Token bảo mật với thời hạn 1 giờ
- Validation token real-time
- UI/UX thân thiện

## Cấu trúc Token ResetPasswordToken

### ResetPasswordToken là gì?
ResetPasswordToken là một chuỗi mã ngẫu nhiên được:
1. **Tạo**: Khi user yêu cầu quên mật khẩu
2. **Lưu**: Trong database (bảng Users, cột ResetPasswordToken)
3. **Gửi**: Qua email cho user
4. **Sử dụng**: Để xác thực khi reset password
5. **Hết hạn**: Sau 1 giờ (có thể cấu hình)

### Luồng hoạt động:
```
1. User nhập email → ForgotPassword
2. Backend tạo token → Lưu vào DB
3. Gửi email với link chứa token
4. User click link → ResetPassword page
5. Backend validate token → Reset password
6. Xóa token khỏi DB
```

## Setup Backend

### 1. Chạy Migration Database
```sql
-- Chạy file: backend/Migrations/AddPasswordResetFields.sql
ALTER TABLE Users 
ADD ResetPasswordToken NVARCHAR(MAX) NULL,
ADD ResetPasswordTokenExpiry DATETIME2 NULL;

CREATE INDEX IX_Users_ResetPasswordToken ON Users (ResetPasswordToken);
CREATE INDEX IX_Users_ResetPasswordTokenExpiry ON Users (ResetPasswordTokenExpiry);
```

### 2. Cài đặt Dependencies
```bash
# Trong thư mục backend
dotnet add package BCrypt.Net-Next
```

### 3. Cấu hình Email (appsettings.json)
```json
{
  "EmailSettings": {
    "SmtpHost": "smtp.gmail.com",
    "SmtpPort": 587,
    "SmtpUsername": "your-email@gmail.com",
    "SmtpPassword": "your-app-password",
    "FromEmail": "noreply@evtb.com",
    "FromName": "EV Trading Platform"
  },
  "FrontendUrl": "http://localhost:5173"
}
```

### 4. Đăng ký Services trong Program.cs
```csharp
// Thêm vào Program.cs
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IPasswordResetService, PasswordResetService>();
```

## Setup Frontend

### 1. Các file đã được cập nhật:
- `src/pages/ForgotPassword.jsx` - Form gửi email
- `src/pages/ResetPassword.jsx` - Form reset password
- `src/styles/forgotpassword.css` - Styles cho UI

### 2. API Endpoints:
- `POST /api/PasswordReset/forgot-password` - Gửi email reset
- `POST /api/PasswordReset/reset-password` - Reset password
- `GET /api/PasswordReset/validate-token` - Validate token

## Testing

### 1. Development Mode
Trong development mode, email sẽ được log ra console thay vì gửi thật:
```
=== EMAIL RESET PASSWORD ===
To: user@example.com
UserName: user@example.com
Reset Token: abc123...
Reset Link: http://localhost:5173/reset-password?token=abc123...
=============================
```

### 2. Test Flow:
1. Vào `http://localhost:5173/forgot-password`
2. Nhập email có trong database
3. Kiểm tra console để lấy token
4. Vào `http://localhost:5173/reset-password?token=YOUR_TOKEN`
5. Nhập mật khẩu mới
6. Đăng nhập với mật khẩu mới

## Bảo mật

### 1. Token Security:
- Token được tạo ngẫu nhiên 32 bytes
- Chỉ sử dụng được 1 lần
- Tự động hết hạn sau 1 giờ
- Không thể đoán được

### 2. Email Security:
- Không tiết lộ thông tin user không tồn tại
- Luôn trả về success message
- Token chỉ hiển thị trong development

### 3. Password Security:
- Sử dụng BCrypt để hash password
- Validation độ mạnh mật khẩu
- Xác nhận mật khẩu

## Troubleshooting

### 1. Email không gửi được:
- Kiểm tra cấu hình SMTP trong appsettings.json
- Trong development, kiểm tra console logs
- Đảm bảo email settings đúng

### 2. Token không hợp lệ:
- Kiểm tra token có hết hạn không
- Đảm bảo token được lưu đúng trong database
- Kiểm tra URL có đúng format không

### 3. Database errors:
- Chạy migration để thêm columns
- Kiểm tra connection string
- Đảm bảo User model có ResetPasswordToken fields

## Production Setup

### 1. Email Service:
- Sử dụng email service thật (SendGrid, AWS SES, etc.)
- Cấu hình domain email
- Setup SPF/DKIM records

### 2. Security:
- Đổi JWT secret key
- Cấu hình HTTPS
- Setup rate limiting cho forgot password

### 3. Monitoring:
- Log tất cả reset password attempts
- Monitor failed attempts
- Setup alerts cho suspicious activities
