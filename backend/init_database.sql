-- Script để tạo database và bảng Users
USE master;
GO

-- Tạo database nếu chưa tồn tại
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'EVTB_DB')
BEGIN
    CREATE DATABASE EVTB_DB;
    PRINT 'Database EVTB_DB created successfully.';
END
ELSE
BEGIN
    PRINT 'Database EVTB_DB already exists.';
END
GO

USE EVTB_DB;
GO

-- Tạo bảng Users nếu chưa tồn tại
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
BEGIN
    CREATE TABLE Users (
        UserId int IDENTITY(1,1) PRIMARY KEY,
        Email nvarchar(255) NOT NULL UNIQUE,
        Password nvarchar(MAX) NOT NULL,
        FullName nvarchar(255) NOT NULL,
        Phone nvarchar(20) NULL,
        Avatar nvarchar(500) NULL,
        RoleId int NOT NULL DEFAULT 2,
        AccountStatus nvarchar(50) NOT NULL DEFAULT 'Active',
        ResetPasswordToken nvarchar(1000) NULL,
        ResetPasswordTokenExpiry datetime2 NULL,
        CreatedAt datetime2 NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt datetime2 NOT NULL DEFAULT GETUTCDATE()
    );
    
    -- Tạo index cho ResetPasswordToken
    CREATE INDEX IX_Users_ResetPasswordToken ON Users (ResetPasswordToken);
    CREATE INDEX IX_Users_ResetPasswordTokenExpiry ON Users (ResetPasswordTokenExpiry);
    
    PRINT 'Table Users created successfully.';
END
ELSE
BEGIN
    PRINT 'Table Users already exists.';
END
GO

-- Tạo bảng Orders nếu chưa tồn tại
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Orders' AND xtype='U')
BEGIN
    CREATE TABLE Orders (
        OrderId int IDENTITY(1,1) PRIMARY KEY,
        UserId int NOT NULL,
        ProductId int NOT NULL,
        SellerId int NULL,
        OrderStatus nvarchar(50) NOT NULL DEFAULT 'Pending',
        DepositAmount decimal(18,2) NOT NULL,
        TotalAmount decimal(18,2) NOT NULL,
        FinalPaymentDueDate datetime2 NULL,
        CompletedDate datetime2 NULL,
        CreatedAt datetime2 NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt datetime2 NOT NULL DEFAULT GETUTCDATE()
    );
    
    -- Foreign key constraints
    ALTER TABLE Orders ADD CONSTRAINT FK_Orders_Users FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE CASCADE;
    ALTER TABLE Orders ADD CONSTRAINT FK_Orders_Sellers FOREIGN KEY (SellerId) REFERENCES Users(UserId) ON DELETE SET NULL;
    
    PRINT 'Table Orders created successfully.';
END
ELSE
BEGIN
    -- Add new columns if they don't exist
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'SellerId')
    BEGIN
        ALTER TABLE Orders ADD SellerId int NULL;
        ALTER TABLE Orders ADD CONSTRAINT FK_Orders_Sellers FOREIGN KEY (SellerId) REFERENCES Users(UserId) ON DELETE SET NULL;
        PRINT 'Added SellerId column to Orders table.';
    END
    
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'FinalPaymentDueDate')
    BEGIN
        ALTER TABLE Orders ADD FinalPaymentDueDate datetime2 NULL;
        PRINT 'Added FinalPaymentDueDate column to Orders table.';
    END
    
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'CompletedDate')
    BEGIN
        ALTER TABLE Orders ADD CompletedDate datetime2 NULL;
        PRINT 'Added CompletedDate column to Orders table.';
    END
    
    PRINT 'Table Orders already exists.';
END
GO

-- Tạo bảng Payments nếu chưa tồn tại
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Payments' AND xtype='U')
BEGIN
    CREATE TABLE Payments (
        PaymentId nvarchar(50) PRIMARY KEY,
        UserId int NOT NULL,
        OrderId int NULL,
        ProductId int NULL,
        SellerId int NULL,
        Amount decimal(18,2) NOT NULL,
        PayoutAmount decimal(18,2) NULL,
        PaymentType nvarchar(50) NOT NULL DEFAULT 'Deposit',
        PaymentStatus nvarchar(50) NOT NULL DEFAULT 'Pending',
        PaymentUrl nvarchar(1000) NULL,
        VNPayTransactionId nvarchar(50) NULL,
        VNPayResponseCode nvarchar(10) NULL,
        VNPayMessage nvarchar(500) NULL,
        FinalPaymentDueDate datetime2 NULL,
        CompletedDate datetime2 NULL,
        CreatedAt datetime2 NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt datetime2 NOT NULL DEFAULT GETUTCDATE()
    );
    
    -- Foreign key constraints
    ALTER TABLE Payments ADD CONSTRAINT FK_Payments_Users FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE CASCADE;
    ALTER TABLE Payments ADD CONSTRAINT FK_Payments_Orders FOREIGN KEY (OrderId) REFERENCES Orders(OrderId) ON DELETE SET NULL;
    ALTER TABLE Payments ADD CONSTRAINT FK_Payments_Sellers FOREIGN KEY (SellerId) REFERENCES Users(UserId) ON DELETE SET NULL;
    
    PRINT 'Table Payments created successfully.';
END
ELSE
BEGIN
    -- Add new columns if they don't exist
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Payments') AND name = 'SellerId')
    BEGIN
        ALTER TABLE Payments ADD SellerId int NULL;
        ALTER TABLE Payments ADD CONSTRAINT FK_Payments_Sellers FOREIGN KEY (SellerId) REFERENCES Users(UserId) ON DELETE SET NULL;
        PRINT 'Added SellerId column to Payments table.';
    END
    
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Payments') AND name = 'PayoutAmount')
    BEGIN
        ALTER TABLE Payments ADD PayoutAmount decimal(18,2) NULL;
        PRINT 'Added PayoutAmount column to Payments table.';
    END
    
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Payments') AND name = 'FinalPaymentDueDate')
    BEGIN
        ALTER TABLE Payments ADD FinalPaymentDueDate datetime2 NULL;
        PRINT 'Added FinalPaymentDueDate column to Payments table.';
    END
    
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Payments') AND name = 'CompletedDate')
    BEGIN
        ALTER TABLE Payments ADD CompletedDate datetime2 NULL;
        PRINT 'Added CompletedDate column to Payments table.';
    END
    
    PRINT 'Table Payments already exists.';
END
GO

-- Thêm admin user nếu chưa tồn tại
IF NOT EXISTS (SELECT * FROM Users WHERE Email = 'admin@gmail.com')
BEGIN
    INSERT INTO Users (Email, Password, FullName, Phone, RoleId, AccountStatus, CreatedAt, UpdatedAt)
    VALUES ('admin@gmail.com', '$2a$11$rQZ8K9vL2nS1mT3oP4qR5uV6wX7yZ8aB9cD0eF1gH2iJ3kL4mN5oP6qR7sT8uV', 'Admin User', '0123456789', 1, 'Active', GETUTCDATE(), GETUTCDATE());
    
    PRINT 'Admin user created successfully.';
    PRINT 'Email: admin@gmail.com';
    PRINT 'Password: 123456';
END
ELSE
BEGIN
    PRINT 'Admin user already exists.';
END
GO

-- Hiển thị thông tin users
SELECT 
    UserId,
    Email,
    FullName,
    Phone,
    RoleId,
    AccountStatus,
    CreatedAt
FROM Users;

PRINT 'Database setup completed successfully!';
