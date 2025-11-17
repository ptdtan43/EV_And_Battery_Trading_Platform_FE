-- Migration để thêm các field cho password reset vào bảng Users

-- Thêm các cột mới vào bảng Users
ALTER TABLE Users 
ADD ResetPasswordToken NVARCHAR(MAX) NULL,
ADD ResetPasswordTokenExpiry DATETIME2 NULL;

-- Tạo index cho ResetPasswordToken để tăng hiệu suất tìm kiếm
CREATE INDEX IX_Users_ResetPasswordToken ON Users (ResetPasswordToken);

-- Tạo index cho ResetPasswordTokenExpiry để dễ dàng cleanup expired tokens
CREATE INDEX IX_Users_ResetPasswordTokenExpiry ON Users (ResetPasswordTokenExpiry);

-- Comment cho các cột mới
EXEC sys.sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Token để reset password, được tạo khi user yêu cầu quên mật khẩu', 
    @level0type = N'SCHEMA', @level0name = N'dbo', 
    @level1type = N'TABLE', @level1name = N'Users', 
    @level2type = N'COLUMN', @level2name = N'ResetPasswordToken';

EXEC sys.sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Thời gian hết hạn của token reset password', 
    @level0type = N'SCHEMA', @level0name = N'dbo', 
    @level1type = N'TABLE', @level1name = N'Users', 
    @level2type = N'COLUMN', @level2name = N'ResetPasswordTokenExpiry';
