-- Script để thêm cột WarrantyPeriod vào bảng Products
USE EVTB_DB;
GO

-- Kiểm tra và thêm cột WarrantyPeriod nếu chưa tồn tại
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Products') AND name = 'WarrantyPeriod')
BEGIN
    ALTER TABLE Products ADD WarrantyPeriod nvarchar(100) NULL;
    PRINT 'Added WarrantyPeriod column to Products table.';
END
ELSE
BEGIN
    PRINT 'WarrantyPeriod column already exists in Products table.';
END
GO

