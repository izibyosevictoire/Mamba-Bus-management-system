-- =============================================
-- Complete Bus Status Fix Script
-- Run this to fix all status-related issues
-- =============================================

USE BusManagementDB;
GO

PRINT '========================================';
PRINT 'BEFORE: Current Buses and Their Status';
PRINT '========================================';

-- Show all current buses
SELECT BusId, BusNumber, Model, Status 
FROM Buses 
ORDER BY BusId;
GO

PRINT '';
PRINT '========================================';
PRINT 'Fixing Invalid Status Values...';
PRINT '========================================';

-- Temporarily disable the CHECK constraint
ALTER TABLE Buses NOCHECK CONSTRAINT CHK_Bus_Status;
GO

-- Update all invalid status values
UPDATE Buses SET Status = 'Active' WHERE Status = 'Available';
UPDATE Buses SET Status = 'Inactive' WHERE Status = 'Unavailable';  
UPDATE Buses SET Status = 'Maintenance' WHERE Status = 'In Service';
UPDATE Buses SET Status = 'Active' WHERE Status NOT IN ('Active', 'Inactive', 'Maintenance');
GO

-- Re-enable the CHECK constraint
ALTER TABLE Buses CHECK CONSTRAINT CHK_Bus_Status;
GO

PRINT 'Status values updated successfully!';
PRINT '';
PRINT '========================================';
PRINT 'AFTER: Updated Buses and Their Status';
PRINT '========================================';

-- Show all buses after fix
SELECT BusId, BusNumber, Model, Status 
FROM Buses 
ORDER BY BusId;
GO

PRINT '';
PRINT '========================================';
PRINT 'Valid Status Values: Active, Inactive, Maintenance';
PRINT '========================================';


