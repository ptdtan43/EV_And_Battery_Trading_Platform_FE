-- Script để kiểm tra và khắc phục vấn đề cụ thể
USE EVTB_DB;
GO

PRINT '=== DEBUGGING CURRENT ISSUE ===';

-- 1. Kiểm tra cấu trúc bảng hiện tại
PRINT '1. Checking current table structure...';

-- Kiểm tra Orders table
PRINT 'Orders table columns:';
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Orders'
ORDER BY ORDINAL_POSITION;

-- Kiểm tra Payments table
PRINT 'Payments table columns:';
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Payments'
ORDER BY ORDINAL_POSITION;

-- 2. Kiểm tra dữ liệu hiện tại
PRINT '2. Checking current data...';

-- Kiểm tra Orders 3 và 4
SELECT 
    'Orders 3 & 4' as TableName,
    OrderId,
    UserId,
    ProductId,
    SellerId,
    OrderStatus,
    DepositAmount,
    TotalAmount,
    FinalPaymentDueDate,
    CompletedDate,
    CreatedAt
FROM Orders 
WHERE OrderId IN (3, 4)
ORDER BY OrderId;

-- Kiểm tra Payments cho Orders 3 và 4
SELECT 
    'Payments for Orders 3 & 4' as TableName,
    PaymentId,
    UserId,
    OrderId,
    ProductId,
    SellerId,
    Amount,
    PayoutAmount,
    PaymentType,
    PaymentStatus,
    FinalPaymentDueDate,
    CompletedDate,
    CreatedAt
FROM Payments 
WHERE OrderId IN (3, 4)
ORDER BY OrderId;

-- 3. Thêm các cột mới nếu chưa có
PRINT '3. Adding missing columns...';

-- Thêm cột vào Orders
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'SellerId')
BEGIN
    ALTER TABLE Orders ADD SellerId int NULL;
    PRINT 'Added SellerId to Orders table.';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'FinalPaymentDueDate')
BEGIN
    ALTER TABLE Orders ADD FinalPaymentDueDate datetime2 NULL;
    PRINT 'Added FinalPaymentDueDate to Orders table.';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'CompletedDate')
BEGIN
    ALTER TABLE Orders ADD CompletedDate datetime2 NULL;
    PRINT 'Added CompletedDate to Orders table.';
END

-- Thêm cột vào Payments
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Payments') AND name = 'SellerId')
BEGIN
    ALTER TABLE Payments ADD SellerId int NULL;
    PRINT 'Added SellerId to Payments table.';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Payments') AND name = 'PayoutAmount')
BEGIN
    ALTER TABLE Payments ADD PayoutAmount decimal(18,2) NULL;
    PRINT 'Added PayoutAmount to Payments table.';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Payments') AND name = 'FinalPaymentDueDate')
BEGIN
    ALTER TABLE Payments ADD FinalPaymentDueDate datetime2 NULL;
    PRINT 'Added FinalPaymentDueDate to Payments table.';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Payments') AND name = 'CompletedDate')
BEGIN
    ALTER TABLE Payments ADD CompletedDate datetime2 NULL;
    PRINT 'Added CompletedDate to Payments table.';
END

-- 4. Cập nhật dữ liệu cho Orders 3 và 4
PRINT '4. Updating data for Orders 3 & 4...';

-- Cập nhật Orders 3 và 4
UPDATE Orders 
SET 
    SellerId = 1,  -- Default to admin as seller
    FinalPaymentDueDate = DATEADD(day, 7, CreatedAt),
    CompletedDate = CASE 
        WHEN OrderStatus IN ('Paid', 'Completed', 'Deposited') THEN UpdatedAt 
        ELSE NULL 
    END
WHERE OrderId IN (3, 4);

PRINT 'Updated Orders 3 & 4 with SellerId, FinalPaymentDueDate, and CompletedDate.';

-- Cập nhật Payments cho Orders 3 và 4
UPDATE Payments 
SET 
    SellerId = 1,  -- Default to admin as seller
    PayoutAmount = Amount * 0.95,  -- 95% payout
    FinalPaymentDueDate = DATEADD(day, 7, CreatedAt),
    CompletedDate = CASE 
        WHEN PaymentStatus = 'Success' THEN UpdatedAt 
        ELSE NULL 
    END
WHERE OrderId IN (3, 4);

PRINT 'Updated Payments for Orders 3 & 4 with SellerId, PayoutAmount, FinalPaymentDueDate, and CompletedDate.';

-- Copy ProductId từ Orders sang Payments
UPDATE Payments 
SET ProductId = o.ProductId
FROM Payments p
INNER JOIN Orders o ON p.OrderId = o.OrderId
WHERE p.OrderId IN (3, 4) 
  AND p.ProductId IS NULL 
  AND o.ProductId IS NOT NULL;

PRINT 'Copied ProductId from Orders to Payments for Orders 3 & 4.';

-- 5. Kiểm tra kết quả sau khi cập nhật
PRINT '5. Final results after update...';

-- Kiểm tra Orders sau khi cập nhật
SELECT 
    'Updated Orders 3 & 4' as TableName,
    OrderId,
    UserId,
    ProductId,
    SellerId,
    OrderStatus,
    DepositAmount,
    TotalAmount,
    FinalPaymentDueDate,
    CompletedDate,
    CreatedAt
FROM Orders 
WHERE OrderId IN (3, 4)
ORDER BY OrderId;

-- Kiểm tra Payments sau khi cập nhật
SELECT 
    'Updated Payments for Orders 3 & 4' as TableName,
    PaymentId,
    UserId,
    OrderId,
    ProductId,
    SellerId,
    Amount,
    PayoutAmount,
    PaymentType,
    PaymentStatus,
    FinalPaymentDueDate,
    CompletedDate,
    CreatedAt
FROM Payments 
WHERE OrderId IN (3, 4)
ORDER BY OrderId;

-- 6. Tóm tắt kết quả
PRINT '6. Summary...';

SELECT 
    'Summary' as Info,
    'Orders 3 & 4' as Records,
    COUNT(*) as TotalRecords,
    COUNT(SellerId) as RecordsWithSellerId,
    COUNT(ProductId) as RecordsWithProductId,
    COUNT(FinalPaymentDueDate) as RecordsWithFinalPaymentDueDate,
    COUNT(CompletedDate) as RecordsWithCompletedDate
FROM Orders 
WHERE OrderId IN (3, 4)

UNION ALL

SELECT 
    'Summary' as Info,
    'Payments for Orders 3 & 4' as Records,
    COUNT(*) as TotalRecords,
    COUNT(SellerId) as RecordsWithSellerId,
    COUNT(ProductId) as RecordsWithProductId,
    COUNT(PayoutAmount) as RecordsWithPayoutAmount,
    COUNT(CompletedDate) as RecordsWithCompletedDate
FROM Payments 
WHERE OrderId IN (3, 4);

PRINT 'Debug and fix completed!';
