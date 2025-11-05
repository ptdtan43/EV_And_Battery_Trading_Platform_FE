-- =============================================
-- Reset tất cả VerificationStatus về "Requested"
-- để test lại chức năng kiểm định
-- =============================================

USE Topic2;
GO

-- Backup trước khi update (optional)
SELECT 
    ProductId,
    Title,
    VerificationStatus AS OldVerificationStatus,
    'Requested' AS NewVerificationStatus
FROM Products
WHERE VerificationStatus != 'Requested';
GO

-- Update tất cả về "Requested"
UPDATE Products
SET VerificationStatus = 'Requested'
WHERE VerificationStatus != 'Requested';
GO

-- Kiểm tra kết quả
SELECT 
    ProductId,
    Title,
    Brand,
    Model,
    VerificationStatus,
    Status,
    CreatedAt
FROM Products
ORDER BY ProductId;
GO

-- Thống kê
SELECT 
    VerificationStatus,
    COUNT(*) AS TotalProducts
FROM Products
GROUP BY VerificationStatus;
GO

