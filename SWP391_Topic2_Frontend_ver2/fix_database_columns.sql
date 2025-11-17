-- Script để kiểm tra và cập nhật database với các cột mới
USE EVTB_DB;
GO

-- Kiểm tra các cột trong bảng Orders
PRINT '=== CHECKING ORDERS TABLE ===';
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Orders'
ORDER BY ORDINAL_POSITION;
GO

-- Kiểm tra các cột trong bảng Payments
PRINT '=== CHECKING PAYMENTS TABLE ===';
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Payments'
ORDER BY ORDINAL_POSITION;
GO

-- Thêm các cột mới vào Orders nếu chưa có
PRINT '=== UPDATING ORDERS TABLE ===';

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'SellerId')
BEGIN
    ALTER TABLE Orders ADD SellerId int NULL;
    PRINT 'Added SellerId column to Orders table.';
END
ELSE
BEGIN
    PRINT 'SellerId column already exists in Orders table.';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'FinalPaymentDueDate')
BEGIN
    ALTER TABLE Orders ADD FinalPaymentDueDate datetime2 NULL;
    PRINT 'Added FinalPaymentDueDate column to Orders table.';
END
ELSE
BEGIN
    PRINT 'FinalPaymentDueDate column already exists in Orders table.';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'CompletedDate')
BEGIN
    ALTER TABLE Orders ADD CompletedDate datetime2 NULL;
    PRINT 'Added CompletedDate column to Orders table.';
END
ELSE
BEGIN
    PRINT 'CompletedDate column already exists in Orders table.';
END

-- Thêm foreign key constraint cho SellerId nếu chưa có
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Orders_Sellers')
BEGIN
    ALTER TABLE Orders ADD CONSTRAINT FK_Orders_Sellers FOREIGN KEY (SellerId) REFERENCES Users(UserId) ON DELETE SET NULL;
    PRINT 'Added FK_Orders_Sellers constraint.';
END
ELSE
BEGIN
    PRINT 'FK_Orders_Sellers constraint already exists.';
END

-- Thêm các cột mới vào Payments nếu chưa có
PRINT '=== UPDATING PAYMENTS TABLE ===';

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Payments') AND name = 'SellerId')
BEGIN
    ALTER TABLE Payments ADD SellerId int NULL;
    PRINT 'Added SellerId column to Payments table.';
END
ELSE
BEGIN
    PRINT 'SellerId column already exists in Payments table.';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Payments') AND name = 'PayoutAmount')
BEGIN
    ALTER TABLE Payments ADD PayoutAmount decimal(18,2) NULL;
    PRINT 'Added PayoutAmount column to Payments table.';
END
ELSE
BEGIN
    PRINT 'PayoutAmount column already exists in Payments table.';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Payments') AND name = 'FinalPaymentDueDate')
BEGIN
    ALTER TABLE Payments ADD FinalPaymentDueDate datetime2 NULL;
    PRINT 'Added FinalPaymentDueDate column to Payments table.';
END
ELSE
BEGIN
    PRINT 'FinalPaymentDueDate column already exists in Payments table.';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Payments') AND name = 'CompletedDate')
BEGIN
    ALTER TABLE Payments ADD CompletedDate datetime2 NULL;
    PRINT 'Added CompletedDate column to Payments table.';
END
ELSE
BEGIN
    PRINT 'CompletedDate column already exists in Payments table.';
END

-- Thêm foreign key constraint cho SellerId nếu chưa có
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Payments_Sellers')
BEGIN
    ALTER TABLE Payments ADD CONSTRAINT FK_Payments_Sellers FOREIGN KEY (SellerId) REFERENCES Users(UserId) ON DELETE SET NULL;
    PRINT 'Added FK_Payments_Sellers constraint.';
END
ELSE
BEGIN
    PRINT 'FK_Payments_Sellers constraint already exists.';
END

-- Cập nhật dữ liệu hiện tại với các giá trị mặc định
PRINT '=== UPDATING EXISTING DATA ===';

-- Cập nhật Orders với SellerId mặc định và FinalPaymentDueDate
UPDATE Orders 
SET 
    SellerId = 1, -- Default to admin as seller
    FinalPaymentDueDate = DATEADD(day, 7, CreatedAt)
WHERE SellerId IS NULL;

PRINT 'Updated existing Orders with default SellerId and FinalPaymentDueDate.';

-- Cập nhật Payments với SellerId, PayoutAmount, FinalPaymentDueDate
UPDATE Payments 
SET 
    SellerId = 1, -- Default to admin as seller
    PayoutAmount = Amount * 0.95, -- 95% payout
    FinalPaymentDueDate = DATEADD(day, 7, CreatedAt)
WHERE SellerId IS NULL;

PRINT 'Updated existing Payments with default SellerId, PayoutAmount, and FinalPaymentDueDate.';

-- Cập nhật CompletedDate cho các payment đã thành công
UPDATE Payments 
SET CompletedDate = UpdatedAt
WHERE PaymentStatus = 'Success' AND CompletedDate IS NULL;

PRINT 'Updated CompletedDate for successful payments.';

-- Cập nhật CompletedDate cho các order đã hoàn thành
UPDATE Orders 
SET CompletedDate = UpdatedAt
WHERE OrderStatus IN ('Paid', 'Completed') AND CompletedDate IS NULL;

PRINT 'Updated CompletedDate for completed orders.';

-- Hiển thị kết quả sau khi cập nhật
PRINT '=== FINAL RESULTS ===';
SELECT 
    'Orders' as TableName,
    COUNT(*) as TotalRecords,
    COUNT(SellerId) as RecordsWithSellerId,
    COUNT(FinalPaymentDueDate) as RecordsWithFinalPaymentDueDate,
    COUNT(CompletedDate) as RecordsWithCompletedDate
FROM Orders
UNION ALL
SELECT 
    'Payments' as TableName,
    COUNT(*) as TotalRecords,
    COUNT(SellerId) as RecordsWithSellerId,
    COUNT(PayoutAmount) as RecordsWithPayoutAmount,
    COUNT(CompletedDate) as RecordsWithCompletedDate
FROM Payments;

PRINT 'Database update completed successfully!';
