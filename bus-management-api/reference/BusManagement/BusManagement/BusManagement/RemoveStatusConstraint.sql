-- =============================================
-- Remove the CHK_Bus_Status Constraint
-- (This constraint doesn't exist in your original schema)
-- =============================================

USE BusManagementDB;
GO

PRINT '========================================';
PRINT 'Checking for CHK_Bus_Status constraint...';
PRINT '========================================';

-- Check if constraint exists
IF EXISTS (
    SELECT 1 
    FROM sys.check_constraints 
    WHERE name = 'CHK_Bus_Status' 
    AND parent_object_id = OBJECT_ID('dbo.Buses')
)
BEGIN
    PRINT 'Constraint CHK_Bus_Status found. Removing...';
    
    ALTER TABLE Buses 
    DROP CONSTRAINT CHK_Bus_Status;
    
    PRINT 'Constraint removed successfully!';
END
ELSE
BEGIN
    PRINT 'Constraint CHK_Bus_Status does not exist.';
END
GO

-- Check for any other constraints on the Status column
PRINT '';
PRINT '========================================';
PRINT 'Other constraints on Buses table:';
PRINT '========================================';

SELECT 
    con.name AS ConstraintName,
    con.type_desc AS ConstraintType
FROM sys.check_constraints con
WHERE con.parent_object_id = OBJECT_ID('dbo.Buses');
GO

PRINT '';
PRINT '========================================';
PRINT 'Current Buses in database:';
PRINT '========================================';

SELECT BusId, BusNumber, Model, Capacity, Status 
FROM Buses 
ORDER BY BusId;
GO

PRINT '';
PRINT '========================================';
PRINT 'Done! You can now use any status values.';
PRINT '========================================';


