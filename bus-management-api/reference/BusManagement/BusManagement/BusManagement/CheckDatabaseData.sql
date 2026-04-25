-- =============================================
-- Check Current Database Data
-- =============================================

USE BusManagementDB;
GO

PRINT '========================================';
PRINT 'DATABASE DATA SUMMARY';
PRINT '========================================';
PRINT '';

-- Count all tables
SELECT 
    'Admins' AS TableName, 
    COUNT(*) AS RecordCount 
FROM Admins
UNION ALL
SELECT 'Clients', COUNT(*) FROM Clients
UNION ALL
SELECT 'Drivers', COUNT(*) FROM Drivers
UNION ALL
SELECT 'Buses', COUNT(*) FROM Buses
UNION ALL
SELECT 'Routes', COUNT(*) FROM Routes
UNION ALL
SELECT 'Schedule', COUNT(*) FROM Schedule
UNION ALL
SELECT 'Tickets', COUNT(*) FROM Tickets
UNION ALL
SELECT 'DriverAssignments', COUNT(*) FROM DriverAssignments;
GO

PRINT '';
PRINT '========================================';
PRINT 'EXISTING BUSES:';
PRINT '========================================';

IF EXISTS (SELECT 1 FROM Buses)
BEGIN
    SELECT BusId, BusNumber, Model, Capacity, Status FROM Buses ORDER BY BusId;
END
ELSE
BEGIN
    PRINT 'No buses found. Please add buses first.';
END
GO

PRINT '';
PRINT '========================================';
PRINT 'EXISTING ROUTES:';
PRINT '========================================';

IF EXISTS (SELECT 1 FROM Routes)
BEGIN
    SELECT RouteId, Origin, Destination, Distance, Price FROM Routes ORDER BY RouteId;
END
ELSE
BEGIN
    PRINT 'No routes found. Please add routes first.';
END
GO

PRINT '';
PRINT '========================================';
PRINT 'EXISTING SCHEDULES:';
PRINT '========================================';

IF EXISTS (SELECT 1 FROM Schedule)
BEGIN
    SELECT 
        s.ScheduleId,
        b.BusNumber,
        r.Origin,
        r.Destination,
        s.DepartureTime,
        s.ArrivalTime
    FROM Schedule s
    JOIN Buses b ON s.BusId = b.BusId
    JOIN Routes r ON s.RouteId = r.RouteId
    ORDER BY s.ScheduleId;
END
ELSE
BEGIN
    PRINT 'No schedules found. You need to add schedules before creating tickets.';
END
GO

PRINT '';
PRINT '========================================';
PRINT 'EXISTING CLIENTS:';
PRINT '========================================';

IF EXISTS (SELECT 1 FROM Clients)
BEGIN
    SELECT ClientId, Name, Email, Phone FROM Clients ORDER BY ClientId;
END
ELSE
BEGIN
    PRINT 'No clients found.';
END
GO

PRINT '';
PRINT '========================================';
PRINT 'READY TO ADD DATA?';
PRINT '========================================';
PRINT '';

-- Check prerequisites
IF NOT EXISTS (SELECT 1 FROM Buses)
BEGIN
    PRINT '❌ WARNING: No buses found. Add buses first!';
END
ELSE
BEGIN
    PRINT '✓ Buses: OK';
END

IF NOT EXISTS (SELECT 1 FROM Routes)
BEGIN
    PRINT '❌ WARNING: No routes found. Add routes first!';
END
ELSE
BEGIN
    PRINT '✓ Routes: OK';
END

IF NOT EXISTS (SELECT 1 FROM Schedule)
BEGIN
    PRINT '❌ WARNING: No schedules found. Add schedules first!';
END
ELSE
BEGIN
    PRINT '✓ Schedules: OK';
END

PRINT '';
IF EXISTS (SELECT 1 FROM Buses) AND EXISTS (SELECT 1 FROM Routes) AND EXISTS (SELECT 1 FROM Schedule)
BEGIN
    PRINT '✓✓✓ All prerequisites met! You can run AddClientsAndTickets.sql';
END
ELSE
BEGIN
    PRINT 'Please add missing data before running AddClientsAndTickets.sql';
END

GO


