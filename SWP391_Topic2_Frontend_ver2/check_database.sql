-- Script kiểm tra database hiện tại
-- Chạy script này để xem database có gì

-- 1. Liệt kê tất cả databases
SELECT name FROM sys.databases;

-- 2. Kiểm tra database hiện tại
SELECT DB_NAME() AS CurrentDatabase;

-- 3. Liệt kê tất cả tables trong database hiện tại
SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'BASE TABLE';

-- 4. Kiểm tra cấu trúc bảng Users (nếu có)
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND type in (N'U'))
BEGIN
    SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        CHARACTER_MAXIMUM_LENGTH
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Users'
    ORDER BY ORDINAL_POSITION;
END
ELSE
BEGIN
    PRINT 'Table Users does not exist.';
END
