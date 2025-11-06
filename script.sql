Create database Topic2
go
use Topic2
go

IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
GO

CREATE TABLE [FeeSettings] (
    [FeeId] int NOT NULL IDENTITY,
    [FeeType] nvarchar(50) NOT NULL,
    [FeeValue] decimal(10,4) NOT NULL,
    [IsActive] bit NULL DEFAULT CAST(1 AS bit),
    [CreatedDate] datetime2 NULL DEFAULT ((getdate())),
    CONSTRAINT [PK__FeeSetti__B387B22938E8F914] PRIMARY KEY ([FeeId])
);
GO

CREATE TABLE [UserRoles] (
    [RoleId] int NOT NULL IDENTITY,
    [RoleName] nvarchar(50) NOT NULL,
    [CreatedDate] datetime2 NULL DEFAULT ((getdate())),
    CONSTRAINT [PK__UserRole__8AFACE1AD8916952] PRIMARY KEY ([RoleId])
);
GO

CREATE TABLE [Users] (
    [UserId] int NOT NULL IDENTITY,
    [RoleId] int NULL,
    [Email] nvarchar(255) NOT NULL,
    [PasswordHash] nvarchar(255) NOT NULL,
    [FullName] nvarchar(200) NULL,
    [Phone] nvarchar(20) NULL,
    [Avatar] nvarchar(max) NULL,
    [AccountStatus] nvarchar(20) NULL DEFAULT N'Active',
    [CreatedDate] datetime2 NULL DEFAULT ((getdate())),
    [ResetPasswordToken] nvarchar(max) NULL,
    [ResetPasswordTokenExpiry] datetime2 NULL,
    [OAuthProvider] nvarchar(50) NULL,
    [OAuthId] nvarchar(255) NULL,
    [OAuthEmail] nvarchar(255) NULL,
    CONSTRAINT [PK__Users__1788CC4C582AC607] PRIMARY KEY ([UserId]),
    CONSTRAINT [FK_Users_UserRoles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [UserRoles] ([RoleId])
);
GO

CREATE TABLE [Chats] (
    [ChatId] int NOT NULL IDENTITY,
    [User1Id] int NULL,
    [User2Id] int NULL,
    [CreatedDate] datetime2 NULL DEFAULT ((getdate())),
    CONSTRAINT [PK__Chats__A9FBE7C5B3C6F7F2] PRIMARY KEY ([ChatId]),
    CONSTRAINT [FK_Chats_Users_User1Id] FOREIGN KEY ([User1Id]) REFERENCES [Users] ([UserId]),
    CONSTRAINT [FK_Chats_Users_User2Id] FOREIGN KEY ([User2Id]) REFERENCES [Users] ([UserId])
);
GO

CREATE TABLE [Notifications] (
    [NotificationId] int NOT NULL IDENTITY,
    [UserId] int NULL,
    [NotificationType] nvarchar(50) NULL,
    [Title] nvarchar(255) NOT NULL,
    [Content] nvarchar(max) NULL,
    [CreatedDate] datetime2 NULL DEFAULT ((getdate())),
    CONSTRAINT [PK__Notifica__20CF2E12D3FD203A] PRIMARY KEY ([NotificationId]),
    CONSTRAINT [FK__Notificat__UserI__6EF57B66] FOREIGN KEY ([UserId]) REFERENCES [Users] ([UserId])
);
GO

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
    [CreatedDate] datetime2 NULL DEFAULT ((getdate())),
    CONSTRAINT [PK__Products__B40CC6CDF2308A9F] PRIMARY KEY ([ProductId]),
    CONSTRAINT [FK_Products_Users_SellerId] FOREIGN KEY ([SellerId]) REFERENCES [Users] ([UserId])
);
GO

CREATE TABLE [Messages] (
    [MessageId] int NOT NULL IDENTITY,
    [ChatId] int NULL,
    [SenderId] int NULL,
    [Content] nvarchar(max) NOT NULL,
    [IsRead] bit NULL DEFAULT CAST(0 AS bit),
    [CreatedDate] datetime2 NULL DEFAULT ((getdate())),
    CONSTRAINT [PK__Messages__C87C0C9C4E88ABD4] PRIMARY KEY ([MessageId]),
    CONSTRAINT [FK_Messages_Chats_ChatId] FOREIGN KEY ([ChatId]) REFERENCES [Chats] ([ChatId]),
    CONSTRAINT [FK_Messages_Users_SenderId] FOREIGN KEY ([SenderId]) REFERENCES [Users] ([UserId])
);
GO

CREATE TABLE [Favorites] (
    [FavoriteId] int NOT NULL IDENTITY,
    [UserId] int NULL,
    [ProductId] int NULL,
    [CreatedDate] datetime2 NULL DEFAULT ((getdate())),
    CONSTRAINT [PK__Favorite__CE74FAD5376D3B40] PRIMARY KEY ([FavoriteId]),
    CONSTRAINT [FK__Favorites__Produ__693CA210] FOREIGN KEY ([ProductId]) REFERENCES [Products] ([ProductId]),
    CONSTRAINT [FK__Favorites__UserI__68487DD7] FOREIGN KEY ([UserId]) REFERENCES [Users] ([UserId])
);
GO

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
    [CreatedDate] datetime2 NULL DEFAULT ((getdate())),
    [CompletedDate] datetime2 NULL,
    CONSTRAINT [PK__Orders__C3905BCF658D7C8B] PRIMARY KEY ([OrderId]),
    CONSTRAINT [FK_Orders_Products_ProductId] FOREIGN KEY ([ProductId]) REFERENCES [Products] ([ProductId]),
    CONSTRAINT [FK_Orders_Users_BuyerId] FOREIGN KEY ([BuyerId]) REFERENCES [Users] ([UserId]),
    CONSTRAINT [FK_Orders_Users_SellerId] FOREIGN KEY ([SellerId]) REFERENCES [Users] ([UserId])
);
GO

CREATE TABLE [ProductImages] (
    [ImageId] int NOT NULL IDENTITY,
    [ProductId] int NULL,
    [Name] nvarchar(100) NULL,
    [ImageData] nvarchar(max) NOT NULL,
    [CreatedDate] datetime2 NULL DEFAULT ((getdate())),
    CONSTRAINT [PK__ProductI__7516F70C16ED296D] PRIMARY KEY ([ImageId]),
    CONSTRAINT [FK_ProductImages_Products_ProductId] FOREIGN KEY ([ProductId]) REFERENCES [Products] ([ProductId])
);
GO

CREATE TABLE [ReportedListings] (
    [ReportId] int NOT NULL IDENTITY,
    [ProductId] int NULL,
    [ReporterId] int NULL,
    [ReportType] nvarchar(50) NULL,
    [ReportReason] nvarchar(500) NOT NULL,
    [Status] nvarchar(20) NULL DEFAULT N'Pending',
    [CreatedDate] datetime2 NULL DEFAULT ((getdate())),
    CONSTRAINT [PK__Reported__D5BD48056CFD54E9] PRIMARY KEY ([ReportId]),
    CONSTRAINT [FK_ReportedListings_Products_ProductId] FOREIGN KEY ([ProductId]) REFERENCES [Products] ([ProductId]),
    CONSTRAINT [FK_ReportedListings_Users_ReporterId] FOREIGN KEY ([ReporterId]) REFERENCES [Users] ([UserId])
);
GO

CREATE TABLE [Payments] (
    [PaymentId] int NOT NULL IDENTITY,
    [OrderId] int NULL,
    [ProductId] int NULL,
    [PayerId] int NULL,
    [PaymentType] nvarchar(20) NULL,
    [Amount] decimal(18,2) NOT NULL,
    [PaymentMethod] nvarchar(50) NULL,
    [Status] nvarchar(20) NULL DEFAULT N'Pending',
    [CreatedDate] datetime2 NULL DEFAULT ((getdate())),
    [TransactionNo] nvarchar(100) NULL,
    [BankCode] nvarchar(50) NULL,
    [BankTranNo] nvarchar(100) NULL,
    [CardType] nvarchar(50) NULL,
    [PayDate] datetime2 NULL,
    [ResponseCode] nvarchar(10) NULL,
    [TransactionStatus] nvarchar(10) NULL,
    [SecureHash] nvarchar(512) NULL,
    CONSTRAINT [PK__Payments__9B556A3882005226] PRIMARY KEY ([PaymentId]),
    CONSTRAINT [FK_Payments_Orders_OrderId] FOREIGN KEY ([OrderId]) REFERENCES [Orders] ([OrderId]),
    CONSTRAINT [FK_Payments_Products_ProductId] FOREIGN KEY ([ProductId]) REFERENCES [Products] ([ProductId]),
    CONSTRAINT [FK_Payments_Users_PayerId] FOREIGN KEY ([PayerId]) REFERENCES [Users] ([UserId])
);
GO

CREATE TABLE [Reviews] (
    [ReviewId] int NOT NULL IDENTITY,
    [OrderId] int NULL,
    [ReviewerId] int NULL,
    [RevieweeId] int NULL,
    [Rating] int NULL,
    [Content] nvarchar(max) NULL,
    [CreatedDate] datetime2 NULL DEFAULT ((getdate())),
    CONSTRAINT [PK__Reviews__74BC79CE188E4A76] PRIMARY KEY ([ReviewId]),
    CONSTRAINT [FK_Reviews_Orders_OrderId] FOREIGN KEY ([OrderId]) REFERENCES [Orders] ([OrderId]),
    CONSTRAINT [FK_Reviews_Users_RevieweeId] FOREIGN KEY ([RevieweeId]) REFERENCES [Users] ([UserId]),
    CONSTRAINT [FK_Reviews_Users_ReviewerId] FOREIGN KEY ([ReviewerId]) REFERENCES [Users] ([UserId])
);
GO

CREATE INDEX [IX_Chats_User1Id] ON [Chats] ([User1Id]);
GO

CREATE INDEX [IX_Chats_User2Id] ON [Chats] ([User2Id]);
GO

CREATE INDEX [IX_Favorites_ProductId] ON [Favorites] ([ProductId]);
GO

CREATE INDEX [IX_Favorites_UserId] ON [Favorites] ([UserId]);
GO

CREATE INDEX [IX_Messages_ChatId] ON [Messages] ([ChatId]);
GO

CREATE INDEX [IX_Messages_SenderId] ON [Messages] ([SenderId]);
GO

CREATE INDEX [IX_Notifications_UserId] ON [Notifications] ([UserId]);
GO

CREATE INDEX [IX_Orders_BuyerId] ON [Orders] ([BuyerId]);
GO

CREATE INDEX [IX_Orders_ProductId] ON [Orders] ([ProductId]);
GO

CREATE INDEX [IX_Orders_SellerId] ON [Orders] ([SellerId]);
GO

CREATE INDEX [IX_Payments_OrderId] ON [Payments] ([OrderId]);
GO

CREATE INDEX [IX_Payments_PayerId] ON [Payments] ([PayerId]);
GO

CREATE INDEX [IX_Payments_ProductId] ON [Payments] ([ProductId]);
GO

CREATE INDEX [IX_ProductImages_ProductId] ON [ProductImages] ([ProductId]);
GO

CREATE INDEX [IX_Products_SellerId] ON [Products] ([SellerId]);
GO

CREATE INDEX [IX_ReportedListings_ProductId] ON [ReportedListings] ([ProductId]);
GO

CREATE INDEX [IX_ReportedListings_ReporterId] ON [ReportedListings] ([ReporterId]);
GO

CREATE INDEX [IX_Reviews_OrderId] ON [Reviews] ([OrderId]);
GO

CREATE INDEX [IX_Reviews_RevieweeId] ON [Reviews] ([RevieweeId]);
GO

CREATE INDEX [IX_Reviews_ReviewerId] ON [Reviews] ([ReviewerId]);
GO

CREATE UNIQUE INDEX [IX_UserRoles_RoleName] ON [UserRoles] ([RoleName]);
GO

CREATE UNIQUE INDEX [IX_Users_Email] ON [Users] ([Email]);
GO

CREATE INDEX [IX_Users_RoleId] ON [Users] ([RoleId]);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20251014062519_InitialCreate', N'8.0.16');
GO

COMMIT;
GO

INSERT INTO [UserRoles] ([RoleName])
VALUES 
    (N'Admin'),
    (N'Member');
GO
INSERT INTO FeeSettings (FeeType, FeeValue, IsActive)
VALUES ('DepositPercentage', 0.10, 1);  -- 10% deposit

INSERT INTO FeeSettings (FeeType, FeeValue, IsActive)
VALUES ('VerificationFee', 50000.00, 1); -- 50k VND cho kiểm định

ALTER TABLE [dbo].[Users] ADD [AccountStatusReason] NVARCHAR(MAX) NULL;

ALTER TABLE [dbo].[Notifications] ADD [IsRead] BIT NOT NULL DEFAULT 0;

ALTER TABLE [dbo].[Orders]
ADD [CancellationReason] nvarchar(500) NULL;    

