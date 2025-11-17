-- Chỉ thêm các columns cần thiết cho password reset
-- Chạy script này nếu bạn đã có bảng Users

USE EVAndBatteryTradingPlatform;

-- Thêm các columns cho password reset (nếu chưa có)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND name = 'ResetPasswordToken')
BEGIN
    ALTER TABLE [dbo].[Users] ADD [ResetPasswordToken] nvarchar(MAX) NULL;
    PRINT 'Column ResetPasswordToken added successfully.';
END
ELSE
BEGIN
    PRINT 'Column ResetPasswordToken already exists.';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND name = 'ResetPasswordTokenExpiry')
BEGIN
    ALTER TABLE [dbo].[Users] ADD [ResetPasswordTokenExpiry] datetime2 NULL;
    PRINT 'Column ResetPasswordTokenExpiry added successfully.';
END
ELSE
BEGIN
    PRINT 'Column ResetPasswordTokenExpiry already exists.';
END

-- Tạo indexes cho performance (nếu chưa có)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND name = 'IX_Users_ResetPasswordToken')
BEGIN
    CREATE INDEX [IX_Users_ResetPasswordToken] ON [dbo].[Users] ([ResetPasswordToken]);
    PRINT 'Index IX_Users_ResetPasswordToken created successfully.';
END
ELSE
BEGIN
    PRINT 'Index IX_Users_ResetPasswordToken already exists.';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND name = 'IX_Users_ResetPasswordTokenExpiry')
BEGIN
    CREATE INDEX [IX_Users_ResetPasswordTokenExpiry] ON [dbo].[Users] ([ResetPasswordTokenExpiry]);
    PRINT 'Index IX_Users_ResetPasswordTokenExpiry created successfully.';
END
ELSE
BEGIN
    PRINT 'Index IX_Users_ResetPasswordTokenExpiry already exists.';
END

PRINT 'Password reset columns setup completed!';
