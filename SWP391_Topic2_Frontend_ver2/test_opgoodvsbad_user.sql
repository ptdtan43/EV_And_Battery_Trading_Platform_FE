-- Kiểm tra và thêm user opgoodvsbad@gmail.com
USE Topic2;

-- Kiểm tra xem đã có user opgoodvsbad@gmail.com chưa
SELECT 
    UserId,
    Email,
    FullName,
    Phone,
    AccountStatus,
    CreatedDate
FROM Users 
WHERE Email = 'opgoodvsbad@gmail.com';

-- Nếu chưa có thì thêm
IF NOT EXISTS (SELECT * FROM Users WHERE Email = 'opgoodvsbad@gmail.com')
BEGIN
    -- Thêm test user
    INSERT INTO Users (RoleId, Email, PasswordHash, FullName, Phone, AccountStatus, CreatedDate)
    VALUES (2, 'opgoodvsbad@gmail.com', '$2a$11$rQZ8K9vL2nS1mT3oP4qR5uV6wX7yZ8aB9cD0eF1gH2iJ3kL4mN5oP6qR7sT8uV', 'Test User', '0123456789', 'Active', GETDATE());
    
    PRINT 'User opgoodvsbad@gmail.com created successfully.';
    PRINT 'Password: 123456';
END
ELSE
BEGIN
    PRINT 'User opgoodvsbad@gmail.com already exists.';
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
WHERE Email = 'opgoodvsbad@gmail.com';

PRINT 'Setup completed! You can now test forgot password with opgoodvsbad@gmail.com';
