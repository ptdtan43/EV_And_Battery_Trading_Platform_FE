-- Thêm test user để test chức năng forgot password
USE Topic2;

-- Kiểm tra xem đã có user admin@gmail.com chưa
IF NOT EXISTS (SELECT * FROM Users WHERE Email = 'admin@gmail.com')
BEGIN
    -- Thêm test user
    INSERT INTO Users (RoleId, Email, PasswordHash, FullName, Phone, AccountStatus, CreatedDate)
    VALUES (1, 'admin@gmail.com', '$2a$11$rQZ8K9vL2nS1mT3oP4qR5uV6wX7yZ8aB9cD0eF1gH2iJ3kL4mN5oP6qR7sT8uV', 'Admin User', '0123456789', 'Active', GETDATE());
    
    PRINT 'Test user admin@gmail.com created successfully.';
    PRINT 'Password: 123456';
END
ELSE
BEGIN
    PRINT 'User admin@gmail.com already exists.';
END

-- Kiểm tra xem có RoleId = 1 chưa
IF NOT EXISTS (SELECT * FROM UserRoles WHERE RoleId = 1)
BEGIN
    INSERT INTO UserRoles (RoleName, CreatedDate) VALUES ('Admin', GETDATE());
    PRINT 'Admin role created.';
END

-- Hiển thị thông tin user
SELECT 
    UserId,
    Email,
    FullName,
    Phone,
    AccountStatus,
    CreatedDate
FROM Users 
WHERE Email = 'admin@gmail.com';

PRINT 'Setup completed! You can now test forgot password with admin@gmail.com';
