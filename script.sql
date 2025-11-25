-- ================================================
-- 1. CREATE DATABASE
-- ================================================
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'Topic2')
BEGIN
    CREATE DATABASE Topic2;
END
GO

USE Topic2;
GO

-- ================================================
-- 2. EF MIGRATIONS HISTORY TABLE
-- ================================================
IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

-- ================================================
-- 3. CREATE CORE TABLES
-- ================================================
BEGIN TRANSACTION;
GO

-- FeeSettings (with Description column)
IF OBJECT_ID(N'[FeeSettings]') IS NULL
BEGIN
    CREATE TABLE [FeeSettings] (
        [FeeId] int NOT NULL IDENTITY,
        [FeeType] nvarchar(50) NOT NULL,
        [FeeValue] decimal(10,4) NOT NULL,
        [IsActive] bit NULL DEFAULT 1,
        [CreatedDate] datetime2 NULL DEFAULT GETDATE(),
        [Description] nvarchar(500) NULL,
        CONSTRAINT [PK_FeeSettings] PRIMARY KEY ([FeeId])
    );
END;
GO

-- UserRoles
IF OBJECT_ID(N'[UserRoles]') IS NULL
BEGIN
    CREATE TABLE [UserRoles] (
        [RoleId] int NOT NULL IDENTITY,
        [RoleName] nvarchar(50) NOT NULL,
        [CreatedDate] datetime2 NULL DEFAULT GETDATE(),
        CONSTRAINT [PK_UserRoles] PRIMARY KEY ([RoleId])
    );
END;
GO

-- Users (with all new columns)
IF OBJECT_ID(N'[Users]') IS NULL
BEGIN
    CREATE TABLE [Users] (
        [UserId] int NOT NULL IDENTITY,
        [RoleId] int NULL,
        [Email] nvarchar(255) NOT NULL,
        [PasswordHash] nvarchar(255) NOT NULL,
        [FullName] nvarchar(200) NULL,
        [Phone] nvarchar(20) NULL,
        [Avatar] nvarchar(max) NULL,
        [AccountStatus] nvarchar(20) NULL DEFAULT N'Active',
        [AccountStatusReason] nvarchar(max) NULL,
        [StatusChangedDate] datetime2 NULL,
        [CreatedDate] datetime2 NULL DEFAULT GETDATE(),
        [ResetPasswordToken] nvarchar(max) NULL,
        [ResetPasswordTokenExpiry] datetime2 NULL,
        [PostCredits] int NOT NULL DEFAULT 0,
        CONSTRAINT [PK_Users] PRIMARY KEY ([UserId]),
        CONSTRAINT [FK_Users_UserRoles] FOREIGN KEY ([RoleId]) REFERENCES [UserRoles] ([RoleId])
    );
END;
GO

-- Chats
IF OBJECT_ID(N'[Chats]') IS NULL
BEGIN
    CREATE TABLE [Chats] (
        [ChatId] int NOT NULL IDENTITY,
        [User1Id] int NULL,
        [User2Id] int NULL,
        [CreatedDate] datetime2 NULL DEFAULT GETDATE(),
        CONSTRAINT [PK_Chats] PRIMARY KEY ([ChatId]),
        CONSTRAINT [FK_Chats_User1] FOREIGN KEY ([User1Id]) REFERENCES [Users] ([UserId]),
        CONSTRAINT [FK_Chats_User2] FOREIGN KEY ([User2Id]) REFERENCES [Users] ([UserId])
    );
END;
GO

-- Notifications (with IsRead)
IF OBJECT_ID(N'[Notifications]') IS NULL
BEGIN
    CREATE TABLE [Notifications] (
        [NotificationId] int NOT NULL IDENTITY,
        [UserId] int NULL,
        [NotificationType] nvarchar(50) NULL,
        [Title] nvarchar(255) NOT NULL,
        [Content] nvarchar(max) NULL,
        [IsRead] bit NOT NULL DEFAULT 0,
        [CreatedDate] datetime2 NULL DEFAULT GETDATE(),
        CONSTRAINT [PK_Notifications] PRIMARY KEY ([NotificationId]),
        CONSTRAINT [FK_Notifications_Users] FOREIGN KEY ([UserId]) REFERENCES [Users] ([UserId])
    );
END;
GO

-- Products (with WarrantyPeriod)
IF OBJECT_ID(N'[Products]') IS NULL
BEGIN
    CREATE TABLE [Products] (
        [ProductId] int NOT NULL IDENTITY,
        [SellerId] int NULL,
        [ProductType] nvarchar(20) NOT NULL,
        [Title] nvarchar(255) NOT NULL,
        [Description] nvarchar(max) NULL,
        [Price] decimal(18,2) NOT NULL,
        [Brand] nvarchar(100) NOT NULL,
        [Model] nvarchar(150) NULL,
        [Condition] nvarchar(50) NULL,
        [VehicleType] nvarchar(50) NULL,
        [ManufactureYear] int NULL,
        [Mileage] int NULL,
        [Transmission] nvarchar(50) NULL,
        [SeatCount] int NULL,
        [BatteryHealth] decimal(5,2) NULL,
        [BatteryType] nvarchar(50) NULL,
        [Capacity] decimal(10,2) NULL,
        [Voltage] decimal(8,2) NULL,
        [BMS] nvarchar(100) NULL,
        [CellType] nvarchar(50) NULL,
        [CycleCount] int NULL,
        [LicensePlate] nvarchar(20) NULL,
        [WarrantyPeriod] nvarchar(100) NULL,
        [Status] nvarchar(20) NULL DEFAULT N'Draft',
        [VerificationStatus] nvarchar(20) NULL DEFAULT N'NotRequested',
        [RejectionReason] nvarchar(500) NULL,
        [CreatedDate] datetime2 NULL DEFAULT GETDATE(),
        CONSTRAINT [PK_Products] PRIMARY KEY ([ProductId]),
        CONSTRAINT [FK_Products_Users] FOREIGN KEY ([SellerId]) REFERENCES [Users] ([UserId])
    );
END;
GO

-- Messages
IF OBJECT_ID(N'[Messages]') IS NULL
BEGIN
    CREATE TABLE [Messages] (
        [MessageId] int NOT NULL IDENTITY,
        [ChatId] int NULL,
        [SenderId] int NULL,
        [Content] nvarchar(max) NOT NULL,
        [IsRead] bit NULL DEFAULT 0,
        [CreatedDate] datetime2 NULL DEFAULT GETDATE(),
        CONSTRAINT [PK_Messages] PRIMARY KEY ([MessageId]),
        CONSTRAINT [FK_Messages_Chats] FOREIGN KEY ([ChatId]) REFERENCES [Chats] ([ChatId]),
        CONSTRAINT [FK_Messages_Users] FOREIGN KEY ([SenderId]) REFERENCES [Users] ([UserId])
    );
END;
GO

-- Favorites
IF OBJECT_ID(N'[Favorites]') IS NULL
BEGIN
    CREATE TABLE [Favorites] (
        [FavoriteId] int NOT NULL IDENTITY,
        [UserId] int NULL,
        [ProductId] int NULL,
        [CreatedDate] datetime2 NULL DEFAULT GETDATE(),
        CONSTRAINT [PK_Favorites] PRIMARY KEY ([FavoriteId]),
        CONSTRAINT [FK_Favorites_Product] FOREIGN KEY ([ProductId]) REFERENCES [Products] ([ProductId]),
        CONSTRAINT [FK_Favorites_User] FOREIGN KEY ([UserId]) REFERENCES [Users] ([UserId])
    );
END;
GO

-- Orders (with CancellationReason, CancelledDate, ContractUrl)
IF OBJECT_ID(N'[Orders]') IS NULL
BEGIN
    CREATE TABLE [Orders] (
        [OrderId] int NOT NULL IDENTITY,
        [BuyerId] int NULL,
        [SellerId] int NULL,
        [ProductId] int NULL,
        [TotalAmount] decimal(18,2) NOT NULL,
        [DepositAmount] decimal(18,2) NOT NULL,
        [Status] nvarchar(20) NULL DEFAULT N'Pending',
        [DepositStatus] nvarchar(20) NULL DEFAULT N'Pending',
        [FinalPaymentStatus] nvarchar(20) NULL DEFAULT N'Pending',
        [FinalPaymentDueDate] datetime2 NULL,
        [PayoutAmount] decimal(18,2) NULL,
        [PayoutStatus] nvarchar(20) NULL DEFAULT N'Pending',
        [CancellationReason] nvarchar(500) NULL,
        [CancelledDate] datetime2 NULL,
        [ContractUrl] nvarchar(max) NULL,
        [CreatedDate] datetime2 NULL DEFAULT GETDATE(),
        [CompletedDate] datetime2 NULL,
        CONSTRAINT [PK_Orders] PRIMARY KEY ([OrderId]),
        CONSTRAINT [FK_Orders_Product] FOREIGN KEY ([ProductId]) REFERENCES [Products] ([ProductId]),
        CONSTRAINT [FK_Orders_Buyer] FOREIGN KEY ([BuyerId]) REFERENCES [Users] ([UserId]),
        CONSTRAINT [FK_Orders_Seller] FOREIGN KEY ([SellerId]) REFERENCES [Users] ([UserId])
    );
END;
GO

-- ProductImages
IF OBJECT_ID(N'[ProductImages]') IS NULL
BEGIN
    CREATE TABLE [ProductImages] (
        [ImageId] int NOT NULL IDENTITY,
        [ProductId] int NULL,
        [Name] nvarchar(100) NULL,
        [ImageData] nvarchar(max) NOT NULL,
        [CreatedDate] datetime2 NULL DEFAULT GETDATE(),
        CONSTRAINT [PK_ProductImages] PRIMARY KEY ([ImageId]),
        CONSTRAINT [FK_ProductImages_Product] FOREIGN KEY ([ProductId]) REFERENCES [Products] ([ProductId])
    );
END;
GO

-- ReportedListings
IF OBJECT_ID(N'[ReportedListings]') IS NULL
BEGIN
    CREATE TABLE [ReportedListings] (
        [ReportId] int NOT NULL IDENTITY,
        [ProductId] int NULL,
        [ReporterId] int NULL,
        [ReportType] nvarchar(50) NULL,
        [ReportReason] nvarchar(500) NOT NULL,
        [Status] nvarchar(20) NULL DEFAULT N'Pending',
        [CreatedDate] datetime2 NULL DEFAULT GETDATE(),
        CONSTRAINT [PK_ReportedListings] PRIMARY KEY ([ReportId]),
        CONSTRAINT [FK_ReportedListings_Product] FOREIGN KEY ([ProductId]) REFERENCES [Products] ([ProductId]),
        CONSTRAINT [FK_ReportedListings_User] FOREIGN KEY ([ReporterId]) REFERENCES [Users] ([UserId])
    );
END;
GO

-- Payments (with PostCredits column)
IF OBJECT_ID(N'[Payments]') IS NULL
BEGIN
    CREATE TABLE [Payments] (
        [PaymentId] int NOT NULL IDENTITY,
        [OrderId] int NULL,
        [ProductId] int NULL,
        [PayerId] int NULL,
        [PaymentType] nvarchar(20) NULL,
        [Amount] decimal(18,2) NOT NULL,
        [PaymentMethod] nvarchar(50) NULL,
        [Status] nvarchar(20) NULL DEFAULT N'Pending',
        [PostCredits] int NULL,
        [CreatedDate] datetime2 NULL DEFAULT GETDATE(),
        [TransactionNo] nvarchar(100) NULL,
        [BankCode] nvarchar(50) NULL,
        [BankTranNo] nvarchar(100) NULL,
        [CardType] nvarchar(50) NULL,
        [PayDate] datetime2 NULL,
        [ResponseCode] nvarchar(10) NULL,
        [TransactionStatus] nvarchar(10) NULL,
        [SecureHash] nvarchar(512) NULL,
        CONSTRAINT [PK_Payments] PRIMARY KEY ([PaymentId]),
        CONSTRAINT [FK_Payments_Order] FOREIGN KEY ([OrderId]) REFERENCES [Orders] ([OrderId]),
        CONSTRAINT [FK_Payments_Product] FOREIGN KEY ([ProductId]) REFERENCES [Products] ([ProductId]),
        CONSTRAINT [FK_Payments_User] FOREIGN KEY ([PayerId]) REFERENCES [Users] ([UserId])
    );
END;
GO

-- Reviews
IF OBJECT_ID(N'[Reviews]') IS NULL
BEGIN
    CREATE TABLE [Reviews] (
        [ReviewId] int NOT NULL IDENTITY,
        [OrderId] int NULL,
        [ReviewerId] int NULL,
        [RevieweeId] int NULL,
        [Rating] int NULL,
        [Content] nvarchar(max) NULL,
        [CreatedDate] datetime2 NULL DEFAULT GETDATE(),
        CONSTRAINT [PK_Reviews] PRIMARY KEY ([ReviewId]),
        CONSTRAINT [FK_Reviews_Order] FOREIGN KEY ([OrderId]) REFERENCES [Orders] ([OrderId]),
        CONSTRAINT [FK_Reviews_Reviewer] FOREIGN KEY ([ReviewerId]) REFERENCES [Users] ([UserId]),
        CONSTRAINT [FK_Reviews_Reviewee] FOREIGN KEY ([RevieweeId]) REFERENCES [Users] ([UserId])
    );
END;
GO

-- ================================================
-- 4. CREDIT SYSTEM - CreditHistory Table
-- ================================================
IF OBJECT_ID(N'[CreditHistory]') IS NULL
BEGIN
    CREATE TABLE [CreditHistory] (
        [HistoryId] int NOT NULL IDENTITY,
        [UserId] int NOT NULL,
        [PaymentId] int NULL,
        [ProductId] int NULL,
        [ChangeType] nvarchar(20) NOT NULL,
        [CreditsBefore] int NOT NULL,
        [CreditsChanged] int NOT NULL,
        [CreditsAfter] int NOT NULL,
        [Reason] nvarchar(500) NULL,
        [CreatedBy] int NULL,
        [CreatedDate] datetime2 DEFAULT GETDATE(),
        CONSTRAINT [PK_CreditHistory] PRIMARY KEY ([HistoryId]),
        CONSTRAINT [FK_CreditHistory_User] FOREIGN KEY ([UserId]) REFERENCES [Users] ([UserId]),
        CONSTRAINT [FK_CreditHistory_Payment] FOREIGN KEY ([PaymentId]) REFERENCES [Payments] ([PaymentId]),
        CONSTRAINT [FK_CreditHistory_Product] FOREIGN KEY ([ProductId]) REFERENCES [Products] ([ProductId]),
        CONSTRAINT [FK_CreditHistory_CreatedBy] FOREIGN KEY ([CreatedBy]) REFERENCES [Users] ([UserId])
    );
END;
GO

COMMIT;
GO

-- ================================================
-- 5. CREATE INDEXES
-- ================================================

-- Chats indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Chats_User1Id')
    CREATE INDEX IX_Chats_User1Id ON Chats(User1Id);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Chats_User2Id')
    CREATE INDEX IX_Chats_User2Id ON Chats(User2Id);

-- Favorites indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Favorites_ProductId')
    CREATE INDEX IX_Favorites_ProductId ON Favorites(ProductId);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Favorites_UserId')
    CREATE INDEX IX_Favorites_UserId ON Favorites(UserId);

-- Messages indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Messages_ChatId')
    CREATE INDEX IX_Messages_ChatId ON Messages(ChatId);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Messages_SenderId')
    CREATE INDEX IX_Messages_SenderId ON Messages(SenderId);

-- Notifications indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Notifications_UserId')
    CREATE INDEX IX_Notifications_UserId ON Notifications(UserId);

-- Orders indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Orders_BuyerId')
    CREATE INDEX IX_Orders_BuyerId ON Orders(BuyerId);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Orders_ProductId')
    CREATE INDEX IX_Orders_ProductId ON Orders(ProductId);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Orders_SellerId')
    CREATE INDEX IX_Orders_SellerId ON Orders(SellerId);

-- Payments indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Payments_OrderId')
    CREATE INDEX IX_Payments_OrderId ON Payments(OrderId);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Payments_PayerId')
    CREATE INDEX IX_Payments_PayerId ON Payments(PayerId);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Payments_ProductId')
    CREATE INDEX IX_Payments_ProductId ON Payments(ProductId);

-- ProductImages indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ProductImages_ProductId')
    CREATE INDEX IX_ProductImages_ProductId ON ProductImages(ProductId);

-- Products indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Products_SellerId')
    CREATE INDEX IX_Products_SellerId ON Products(SellerId);

-- ReportedListings indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ReportedListings_ProductId')
    CREATE INDEX IX_ReportedListings_ProductId ON ReportedListings(ProductId);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ReportedListings_ReporterId')
    CREATE INDEX IX_ReportedListings_ReporterId ON ReportedListings(ReporterId);

-- Reviews indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Reviews_OrderId')
    CREATE INDEX IX_Reviews_OrderId ON Reviews(OrderId);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Reviews_RevieweeId')
    CREATE INDEX IX_Reviews_RevieweeId ON Reviews(RevieweeId);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Reviews_ReviewerId')
    CREATE INDEX IX_Reviews_ReviewerId ON Reviews(ReviewerId);

-- CreditHistory indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_CreditHistory_UserId')
    CREATE INDEX IX_CreditHistory_UserId ON CreditHistory(UserId);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_CreditHistory_CreatedDate')
    CREATE INDEX IX_CreditHistory_CreatedDate ON CreditHistory(CreatedDate DESC);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_CreditHistory_ChangeType')
    CREATE INDEX IX_CreditHistory_ChangeType ON CreditHistory(ChangeType);

-- Unique indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_UserRoles_RoleName')
    CREATE UNIQUE INDEX IX_UserRoles_RoleName ON UserRoles(RoleName);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_Email')
    CREATE UNIQUE INDEX IX_Users_Email ON Users(Email);


GO

-- ================================================
-- 6. SEED DATA
-- ================================================


-- EF Migrations History
IF NOT EXISTS (SELECT * FROM [__EFMigrationsHistory] WHERE MigrationId = N'20251014062519_InitialCreate')
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251014062519_InitialCreate', N'8.0.16');
END;
GO

-- User Roles
IF NOT EXISTS (SELECT * FROM UserRoles WHERE RoleName = N'Admin')
    INSERT INTO UserRoles (RoleName) VALUES (N'Admin');
IF NOT EXISTS (SELECT * FROM UserRoles WHERE RoleName = N'Member')
    INSERT INTO UserRoles (RoleName) VALUES (N'Member');
IF NOT EXISTS (SELECT * FROM UserRoles WHERE RoleName = N'Staff')
    INSERT INTO UserRoles (RoleName) VALUES (N'Staff');
GO

-- Fee Settings (Basic fees)
IF NOT EXISTS (SELECT * FROM FeeSettings WHERE FeeType = 'DepositPercentage')
    INSERT INTO FeeSettings (FeeType, FeeValue, IsActive, Description)
    VALUES ('DepositPercentage', 0.10, 1, 'Deposit percentage for orders (10%)');

IF NOT EXISTS (SELECT * FROM FeeSettings WHERE FeeType = 'VerificationFee')
    INSERT INTO FeeSettings (FeeType, FeeValue, IsActive, Description)
    VALUES ('VerificationFee', 50000.00, 1, 'Product verification fee');

GO

-- Post Credit Packages
IF NOT EXISTS (SELECT * FROM FeeSettings WHERE FeeType = 'PostCredit_5')
BEGIN
    INSERT INTO FeeSettings (FeeType, FeeValue, IsActive, Description)
    VALUES 
        ('PostCredit_5', 50000.00, 1, 'Starter Package - 5 post credits'),
        ('PostCredit_10', 90000.00, 1, 'Popular Package - 10 post credits (Save 10%)'),
        ('PostCredit_20', 160000.00, 1, 'Value Package - 20 post credits (Save 20%)'),
        ('PostCredit_50', 350000.00, 1, 'Premium Package - 50 post credits (Save 30%)');
END
GO

