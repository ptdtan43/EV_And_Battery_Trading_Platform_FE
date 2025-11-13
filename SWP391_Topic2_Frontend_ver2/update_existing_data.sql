-- Script để cập nhật dữ liệu hiện tại với các trường mới
USE EVTB_DB;
GO

PRINT '=== UPDATING EXISTING DATA WITH NEW FIELDS ===';

-- 1. Cập nhật Orders table
PRINT 'Updating Orders table...';

-- Cập nhật SellerId mặc định cho các order chưa có
UPDATE Orders 
SET SellerId = 1  -- Default to admin as seller
WHERE SellerId IS NULL;

PRINT 'Updated Orders with default SellerId.';

-- Cập nhật FinalPaymentDueDate (7 ngày từ CreatedAt)
UPDATE Orders 
SET FinalPaymentDueDate = DATEADD(day, 7, CreatedAt)
WHERE FinalPaymentDueDate IS NULL;

PRINT 'Updated Orders with FinalPaymentDueDate (7 days from CreatedAt).';

-- Cập nhật CompletedDate cho các order đã hoàn thành
UPDATE Orders 
SET CompletedDate = UpdatedAt
WHERE OrderStatus IN ('Paid', 'Completed', 'Deposited') 
  AND CompletedDate IS NULL;

PRINT 'Updated Orders with CompletedDate for completed orders.';

-- 2. Cập nhật Payments table
PRINT 'Updating Payments table...';

-- Cập nhật SellerId mặc định cho các payment chưa có
UPDATE Payments 
SET SellerId = 1  -- Default to admin as seller
WHERE SellerId IS NULL;

PRINT 'Updated Payments with default SellerId.';

-- Cập nhật PayoutAmount (95% của Amount)
UPDATE Payments 
SET PayoutAmount = Amount * 0.95
WHERE PayoutAmount IS NULL;

PRINT 'Updated Payments with PayoutAmount (95% of Amount).';

-- Cập nhật FinalPaymentDueDate từ Order
UPDATE Payments 
SET FinalPaymentDueDate = o.FinalPaymentDueDate
FROM Payments p
INNER JOIN Orders o ON p.OrderId = o.OrderId
WHERE p.FinalPaymentDueDate IS NULL 
  AND o.FinalPaymentDueDate IS NOT NULL;

PRINT 'Updated Payments with FinalPaymentDueDate from Orders.';

-- Cập nhật CompletedDate cho các payment đã thành công
UPDATE Payments 
SET CompletedDate = UpdatedAt
WHERE PaymentStatus = 'Success' 
  AND CompletedDate IS NULL;

PRINT 'Updated Payments with CompletedDate for successful payments.';

-- 3. Cập nhật ProductId từ Order
UPDATE Payments 
SET ProductId = o.ProductId
FROM Payments p
INNER JOIN Orders o ON p.OrderId = o.OrderId
WHERE p.ProductId IS NULL 
  AND o.ProductId IS NOT NULL;

PRINT 'Updated Payments with ProductId from Orders.';

-- 4. Hiển thị kết quả sau khi cập nhật
PRINT '=== FINAL RESULTS ===';

-- Orders summary
SELECT 
    'Orders' as TableName,
    COUNT(*) as TotalRecords,
    COUNT(SellerId) as RecordsWithSellerId,
    COUNT(ProductId) as RecordsWithProductId,
    COUNT(FinalPaymentDueDate) as RecordsWithFinalPaymentDueDate,
    COUNT(CompletedDate) as RecordsWithCompletedDate
FROM Orders;

-- Payments summary
SELECT 
    'Payments' as TableName,
    COUNT(*) as TotalRecords,
    COUNT(SellerId) as RecordsWithSellerId,
    COUNT(ProductId) as RecordsWithProductId,
    COUNT(PayoutAmount) as RecordsWithPayoutAmount,
    COUNT(FinalPaymentDueDate) as RecordsWithFinalPaymentDueDate,
    COUNT(CompletedDate) as RecordsWithCompletedDate
FROM Payments;

-- Sample data để verify
PRINT '=== SAMPLE DATA ===';

SELECT TOP 3
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
ORDER BY CreatedAt DESC;

SELECT TOP 3
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
ORDER BY CreatedAt DESC;

PRINT 'Data update completed successfully!';
