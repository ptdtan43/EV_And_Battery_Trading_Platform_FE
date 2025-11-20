----------------------------------------------
-- 1. CREATE DATABASE
----------------------------------------------
CREATE DATABASE Topic2;
GO
USE Topic2;
GO


----------------------------------------------
-- 2. INITIAL EF HISTORY TABLE
----------------------------------------------
IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO


----------------------------------------------
-- 3. CREATE TABLES
----------------------------------------------
BEGIN TRANSACTION;
GO

-- FeeSettings
CREATE TABLE [FeeSettings] (
    [FeeId] int NOT NULL IDENTITY,
    [FeeType] nvarchar(50) NOT NULL,
    [FeeValue] decimal(10,4) NOT NULL,
    [IsActive] bit NULL DEFAULT 1,
    [CreatedDate] datetime2 NULL DEFAULT GETDATE(),
    CONSTRAINT [PK_FeeSettings] PRIMARY KEY ([FeeId])
);
GO

-- UserRoles
CREATE TABLE [UserRoles] (
    [RoleId] int NOT NULL IDENTITY,
    [RoleName] nvarchar(50) NOT NULL,
    [CreatedDate] datetime2 NULL DEFAULT GETDATE(),
    CONSTRAINT [PK_UserRoles] PRIMARY KEY ([RoleId])
);
GO

-- Users
CREATE TABLE [Users] (
    [UserId] int NOT NULL IDENTITY,
    [RoleId] int NULL,
    [Email] nvarchar(255) NOT NULL,
    [PasswordHash] nvarchar(255) NOT NULL,
    [FullName] nvarchar(200) NULL,
    [Phone] nvarchar(20) NULL,
    [Avatar] nvarchar(max) NULL,
    [AccountStatus] nvarchar(20) NULL DEFAULT N'Active',
    [CreatedDate] datetime2 NULL DEFAULT GETDATE(),
    [ResetPasswordToken] nvarchar(max) NULL,
    [ResetPasswordTokenExpiry] datetime2 NULL,
    [OAuthProvider] nvarchar(50) NULL,
    [OAuthId] nvarchar(255) NULL,
    [OAuthEmail] nvarchar(255) NULL,
    CONSTRAINT [PK_Users] PRIMARY KEY ([UserId]),
    CONSTRAINT [FK_Users_UserRoles] FOREIGN KEY ([RoleId]) REFERENCES [UserRoles] ([RoleId])
);
GO

-- Chats
CREATE TABLE [Chats] (
    [ChatId] int NOT NULL IDENTITY,
    [User1Id] int NULL,
    [User2Id] int NULL,
    [CreatedDate] datetime2 NULL DEFAULT GETDATE(),
    CONSTRAINT [PK_Chats] PRIMARY KEY ([ChatId]),
    CONSTRAINT [FK_Chats_User1] FOREIGN KEY ([User1Id]) REFERENCES [Users] ([UserId]),
    CONSTRAINT [FK_Chats_User2] FOREIGN KEY ([User2Id]) REFERENCES [Users] ([UserId])
);
GO

-- Notifications
CREATE TABLE [Notifications] (
    [NotificationId] int NOT NULL IDENTITY,
    [UserId] int NULL,
    [NotificationType] nvarchar(50) NULL,
    [Title] nvarchar(255) NOT NULL,
    [Content] nvarchar(max) NULL,
    [CreatedDate] datetime2 NULL DEFAULT GETDATE(),
    CONSTRAINT [PK_Notifications] PRIMARY KEY ([NotificationId]),
    CONSTRAINT [FK_Notifications_Users] FOREIGN KEY ([UserId]) REFERENCES [Users] ([UserId])
);
GO

-- Products
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
    [Status] nvarchar(20) NULL DEFAULT N'Draft',
    [VerificationStatus] nvarchar(20) NULL DEFAULT N'NotRequested',
    [RejectionReason] nvarchar(500) NULL,
    [CreatedDate] datetime2 NULL DEFAULT GETDATE(),
    CONSTRAINT [PK_Products] PRIMARY KEY ([ProductId]),
    CONSTRAINT [FK_Products_Users] FOREIGN KEY ([SellerId]) REFERENCES [Users] ([UserId])
);
GO

-- Messages
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
GO

-- Favorites
CREATE TABLE [Favorites] (
    [FavoriteId] int NOT NULL IDENTITY,
    [UserId] int NULL,
    [ProductId] int NULL,
    [CreatedDate] datetime2 NULL DEFAULT GETDATE(),
    CONSTRAINT [PK_Favorites] PRIMARY KEY ([FavoriteId]),
    CONSTRAINT [FK_Favorites_Product] FOREIGN KEY ([ProductId]) REFERENCES [Products] ([ProductId]),
    CONSTRAINT [FK_Favorites_User] FOREIGN KEY ([UserId]) REFERENCES [Users] ([UserId])
);
GO

-- Orders
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
    [CreatedDate] datetime2 NULL DEFAULT GETDATE(),
    [CompletedDate] datetime2 NULL,
    CONSTRAINT [PK_Orders] PRIMARY KEY ([OrderId]),
    CONSTRAINT [FK_Orders_Product] FOREIGN KEY ([ProductId]) REFERENCES [Products] ([ProductId]),
    CONSTRAINT [FK_Orders_Buyer] FOREIGN KEY ([BuyerId]) REFERENCES [Users] ([UserId]),
    CONSTRAINT [FK_Orders_Seller] FOREIGN KEY ([SellerId]) REFERENCES [Users] ([UserId])
);
GO

-- ProductImages
CREATE TABLE [ProductImages] (
    [ImageId] int NOT NULL IDENTITY,
    [ProductId] int NULL,
    [Name] nvarchar(100) NULL,
    [ImageData] nvarchar(max) NOT NULL,
    [CreatedDate] datetime2 NULL DEFAULT GETDATE(),
    CONSTRAINT [PK_ProductImages] PRIMARY KEY ([ImageId]),
    CONSTRAINT [FK_ProductImages_Product] FOREIGN KEY ([ProductId]) REFERENCES [Products] ([ProductId])
);
GO

-- ReportedListings
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
GO

-- Payments
CREATE TABLE [Payments] (
    [PaymentId] int NOT NULL IDENTITY,
    [OrderId] int NULL,
    [ProductId] int NULL,
    [PayerId] int NULL,
    [PaymentType] nvarchar(20) NULL,
    [Amount] decimal(18,2) NOT NULL,
    [PaymentMethod] nvarchar(50) NULL,
    [Status] nvarchar(20) NULL DEFAULT N'Pending',
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
GO

-- Reviews
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
GO

COMMIT;
GO


----------------------------------------------
-- 4. CREATE INDEXES
----------------------------------------------
CREATE INDEX IX_Chats_User1Id ON Chats(User1Id);
CREATE INDEX IX_Chats_User2Id ON Chats(User2Id);
CREATE INDEX IX_Favorites_ProductId ON Favorites(ProductId);
CREATE INDEX IX_Favorites_UserId ON Favorites(UserId);
CREATE INDEX IX_Messages_ChatId ON Messages(ChatId);
CREATE INDEX IX_Messages_SenderId ON Messages(SenderId);
CREATE INDEX IX_Notifications_UserId ON Notifications(UserId);
CREATE INDEX IX_Orders_BuyerId ON Orders(BuyerId);
CREATE INDEX IX_Orders_ProductId ON Orders(ProductId);
CREATE INDEX IX_Orders_SellerId ON Orders(SellerId);
CREATE INDEX IX_Payments_OrderId ON Payments(OrderId);
CREATE INDEX IX_Payments_PayerId ON Payments(PayerId);
CREATE INDEX IX_Payments_ProductId ON Payments(ProductId);
CREATE INDEX IX_ProductImages_ProductId ON ProductImages(ProductId);
CREATE INDEX IX_Products_SellerId ON Products(SellerId);
CREATE INDEX IX_ReportedListings_ProductId ON ReportedListings(ProductId);
CREATE INDEX IX_ReportedListings_ReporterId ON ReportedListings(ReporterId);
CREATE INDEX IX_Reviews_OrderId ON Reviews(OrderId);
CREATE INDEX IX_Reviews_RevieweeId ON Reviews(RevieweeId);
CREATE INDEX IX_Reviews_ReviewerId ON Reviews(ReviewerId);

-- Unique
CREATE UNIQUE INDEX IX_UserRoles_RoleName ON UserRoles(RoleName);
CREATE UNIQUE INDEX IX_Users_Email ON Users(Email);
GO


----------------------------------------------
-- 5. SEED DATA
----------------------------------------------
INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20251014062519_InitialCreate', N'8.0.16');
GO

INSERT INTO UserRoles (RoleName) VALUES (N'Admin'), (N'Member');
GO

INSERT INTO FeeSettings (FeeType, FeeValue, IsActive)
VALUES ('DepositPercentage', 0.10, 1),
       ('VerificationFee', 50000.00, 1);
GO


----------------------------------------------
-- 6. ADD EXTRA COLUMNS (SAFE CHECK)
----------------------------------------------

-- Users.AccountStatusReason
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'AccountStatusReason')
	ALTER TABLE Users ADD AccountStatusReason nvarchar(max) NULL;
GO

-- Notifications.IsRead
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Notifications') AND name = 'IsRead')
	ALTER TABLE Notifications ADD IsRead bit NOT NULL DEFAULT 0;
GO

-- Orders.CancellationReason
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'CancellationReason')
	ALTER TABLE Orders ADD CancellationReason nvarchar(500) NULL;
GO

-- Orders.CancelledDate
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'CancelledDate')
	ALTER TABLE Orders ADD CancelledDate datetime2 NULL;
GO

-- Products.WarrantyPeriod
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Products') AND name = 'WarrantyPeriod')
BEGIN
    ALTER TABLE Products ADD WarrantyPeriod nvarchar(100) NULL;
    PRINT 'Added WarrantyPeriod column to Products table.';
END
ELSE PRINT 'WarrantyPeriod already exists.';
GO

-- Add Staff role
IF NOT EXISTS (SELECT * FROM UserRoles WHERE RoleName = N'Staff')
BEGIN
    INSERT INTO UserRoles (RoleName) VALUES (N'Staff');
    PRINT 'Added Staff role.';
END
ELSE PRINT 'Staff role exists.';
GO

-- Orders.ContractUrl
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'ContractUrl')
BEGIN
    ALTER TABLE Orders ADD ContractUrl nvarchar(max) NULL;
    PRINT 'Added ContractUrl to Orders.';
END
GO

-- Users.StatusChangedDate
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'StatusChangedDate')
BEGIN
    ALTER TABLE Users ADD StatusChangedDate datetime2 NULL;
    PRINT 'Added StatusChangedDate to Users.';
END
ELSE PRINT 'StatusChangedDate already exists.';
GO

-- Update existing suspended/deleted users
UPDATE Users
SET StatusChangedDate = GETDATE()
WHERE AccountStatus IN ('Suspended', 'Deleted') AND StatusChangedDate IS NULL;
GO

PRINT 'Migration completed successfully!';
GO
