-- Migration: Add ContractUrl column to Orders table
-- Date: 2025-11-10
-- Description: Add ContractUrl column to support contract file uploads

-- Check if ContractUrl column exists, if not, add it
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'ContractUrl')
BEGIN
    ALTER TABLE Orders ADD ContractUrl nvarchar(max) NULL;
    PRINT 'Added ContractUrl column to Orders table.';
END
ELSE
BEGIN
    PRINT 'ContractUrl column already exists in Orders table.';
END
GO

-- Also add CancellationReason and CancelledDate if they don't exist (for completeness)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'CancellationReason')
BEGIN
    ALTER TABLE Orders ADD CancellationReason nvarchar(max) NULL;
    PRINT 'Added CancellationReason column to Orders table.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'CancelledDate')
BEGIN
    ALTER TABLE Orders ADD CancelledDate datetime2 NULL;
    PRINT 'Added CancelledDate column to Orders table.';
END
GO

PRINT 'Migration completed successfully.';
GO

