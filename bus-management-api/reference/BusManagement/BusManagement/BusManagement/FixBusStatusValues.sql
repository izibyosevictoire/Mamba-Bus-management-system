-- =============================================
-- Fix Invalid Bus Status Values
-- =============================================

USE BusManagementDB;
GO

-- Display current invalid status values
PRINT '========================================';
PRINT 'Buses with Invalid Status Values:';
PRINT '========================================';

SELECT BusId, BusNumber, Status 
FROM Buses 
WHERE Status NOT IN ('Active', 'Inactive', 'Maintenance');
GO

-- Update invalid status values to valid ones
UPDATE Buses 
SET Status = 'Active' 
WHERE Status = 'Available';

UPDATE Buses 
SET Status = 'Inactive' 
WHERE Status = 'Unavailable';

UPDATE Buses 
SET Status = 'Maintenance' 
WHERE Status = 'In Service';

-- Any other invalid values default to 'Active'
UPDATE Buses 
SET Status = 'Active' 
WHERE Status NOT IN ('Active', 'Inactive', 'Maintenance');

PRINT '========================================';
PRINT 'Status values have been updated!';
PRINT '========================================';

-- Display all buses after update
SELECT BusId, BusNumber, Capacity, Model, Status 
FROM Buses 
ORDER BY BusId;
GO


