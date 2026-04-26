-- =============================================
-- Bus Management API - Seed Data Only
-- Run this AFTER the app has created the tables
-- (via migrations or DbInitializer)
-- =============================================

USE BusManagementApiDB;
GO

-- =============================================
-- CLEAR EXISTING DATA (Optional)
-- =============================================
-- DELETE FROM Tickets;
-- DELETE FROM DriverAssignments;
-- DELETE FROM Schedules;
-- DELETE FROM UserPermissions;
-- DELETE FROM Users;
-- DELETE FROM Permissions;
-- DELETE FROM Routes;
-- DELETE FROM Buses;
-- GO

-- =============================================
-- SEED BUSES
-- =============================================
IF NOT EXISTS (SELECT 1 FROM Buses)
BEGIN
    SET IDENTITY_INSERT Buses ON;

    INSERT INTO Buses (BusId, BusNumber, Capacity, Model, Status, CreatedAt) VALUES
    (1, 'BUS-001', 50, 'Mercedes Tourismo', 'Active', GETUTCDATE()),
    (2, 'BUS-002', 45, 'Volvo 9700', 'Active', GETUTCDATE()),
    (3, 'BUS-003', 55, 'Scania Touring', 'Active', GETUTCDATE()),
    (4, 'BUS-004', 40, 'MAN Lions Coach', 'Maintenance', GETUTCDATE()),
    (5, 'BUS-005', 50, 'Iveco Magelys', 'Active', GETUTCDATE());

    SET IDENTITY_INSERT Buses OFF;
    PRINT 'Buses seeded: 5 records';
END
GO

-- =============================================
-- SEED ROUTES
-- =============================================
IF NOT EXISTS (SELECT 1 FROM Routes)
BEGIN
    SET IDENTITY_INSERT Routes ON;

    INSERT INTO Routes (RouteId, Origin, Destination, Distance, Price, CreatedAt) VALUES
    (1, 'Kigali', 'Butare', 135.50, 2500.00, GETUTCDATE()),
    (2, 'Kigali', 'Musanze', 95.00, 2000.00, GETUTCDATE()),
    (3, 'Kigali', 'Gisenyi', 155.00, 3000.00, GETUTCDATE()),
    (4, 'Butare', 'Cyangugu', 87.00, 1800.00, GETUTCDATE()),
    (5, 'Musanze', 'Gisenyi', 60.00, 1500.00, GETUTCDATE()),
    (6, 'Kigali', 'Rwamagana', 60.00, 1200.00, GETUTCDATE()),
    (7, 'Kigali', 'Nyagatare', 150.00, 3500.00, GETUTCDATE());

    SET IDENTITY_INSERT Routes OFF;
    PRINT 'Routes seeded: 7 records';
END
GO

-- =============================================
-- SEED SCHEDULES
-- =============================================
IF NOT EXISTS (SELECT 1 FROM Schedules)
BEGIN
    INSERT INTO Schedules (BusId, RouteId, DepartureTime, ArrivalTime, CreatedAt) VALUES
    -- Tomorrow - Morning departures
    (1, 1, DATEADD(DAY, 1, CAST(GETDATE() AS DATE)) + '06:00', DATEADD(DAY, 1, CAST(GETDATE() AS DATE)) + '08:30', GETUTCDATE()),
    (2, 2, DATEADD(DAY, 1, CAST(GETDATE() AS DATE)) + '07:00', DATEADD(DAY, 1, CAST(GETDATE() AS DATE)) + '09:00', GETUTCDATE()),
    (3, 3, DATEADD(DAY, 1, CAST(GETDATE() AS DATE)) + '06:30', DATEADD(DAY, 1, CAST(GETDATE() AS DATE)) + '10:00', GETUTCDATE()),
    -- Tomorrow - Afternoon departures
    (1, 1, DATEADD(DAY, 1, CAST(GETDATE() AS DATE)) + '14:00', DATEADD(DAY, 1, CAST(GETDATE() AS DATE)) + '16:30', GETUTCDATE()),
    (2, 2, DATEADD(DAY, 1, CAST(GETDATE() AS DATE)) + '15:00', DATEADD(DAY, 1, CAST(GETDATE() AS DATE)) + '17:00', GETUTCDATE()),
    -- Day after tomorrow
    (5, 4, DATEADD(DAY, 2, CAST(GETDATE() AS DATE)) + '08:00', DATEADD(DAY, 2, CAST(GETDATE() AS DATE)) + '10:00', GETUTCDATE()),
    (5, 5, DATEADD(DAY, 2, CAST(GETDATE() AS DATE)) + '11:00', DATEADD(DAY, 2, CAST(GETDATE() AS DATE)) + '12:30', GETUTCDATE()),
    (3, 6, DATEADD(DAY, 2, CAST(GETDATE() AS DATE)) + '09:00', DATEADD(DAY, 2, CAST(GETDATE() AS DATE)) + '10:00', GETUTCDATE()),
    -- 3 days from now
    (1, 7, DATEADD(DAY, 3, CAST(GETDATE() AS DATE)) + '07:00', DATEADD(DAY, 3, CAST(GETDATE() AS DATE)) + '10:30', GETUTCDATE()),
    (2, 1, DATEADD(DAY, 3, CAST(GETDATE() AS DATE)) + '06:00', DATEADD(DAY, 3, CAST(GETDATE() AS DATE)) + '08:30', GETUTCDATE());

    PRINT 'Schedules seeded: 10 records';
END
GO

-- =============================================
-- ASSIGN DRIVERS TO BUSES
-- =============================================
-- Note: Run this after creating driver users via the API
-- Driver users need to be created first with UserType = 'Driver'

-- Check if we have drivers and no assignments
IF EXISTS (SELECT 1 FROM Users WHERE UserType = 'Driver')
   AND NOT EXISTS (SELECT 1 FROM DriverAssignments)
BEGIN
    DECLARE @DriverId1 INT = (SELECT TOP 1 UserId FROM Users WHERE UserType = 'Driver' ORDER BY UserId);
    DECLARE @DriverId2 INT = (SELECT TOP 1 UserId FROM Users WHERE UserType = 'Driver' AND UserId > @DriverId1 ORDER BY UserId);

    IF @DriverId1 IS NOT NULL
        INSERT INTO DriverAssignments (DriverId, BusId, Status, AssignmentDate) VALUES (@DriverId1, 1, 'Active', GETUTCDATE());

    IF @DriverId2 IS NOT NULL
        INSERT INTO DriverAssignments (DriverId, BusId, Status, AssignmentDate) VALUES (@DriverId2, 2, 'Active', GETUTCDATE());

    PRINT 'Driver assignments created';
END
GO

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

PRINT '';
PRINT '=== DATA SUMMARY ===';

SELECT 'Buses' AS [Table], COUNT(*) AS [Records] FROM Buses
UNION ALL SELECT 'Routes', COUNT(*) FROM Routes
UNION ALL SELECT 'Schedules', COUNT(*) FROM Schedules
UNION ALL SELECT 'Users', COUNT(*) FROM Users
UNION ALL SELECT 'Permissions', COUNT(*) FROM Permissions
UNION ALL SELECT 'UserPermissions', COUNT(*) FROM UserPermissions
UNION ALL SELECT 'DriverAssignments', COUNT(*) FROM DriverAssignments
UNION ALL SELECT 'Tickets', COUNT(*) FROM Tickets;

PRINT '';
PRINT '=== AVAILABLE SCHEDULES ===';

SELECT
    s.ScheduleId,
    b.BusNumber,
    r.Origin + ' -> ' + r.Destination AS Route,
    FORMAT(r.Price, 'N0') AS Price,
    FORMAT(s.DepartureTime, 'yyyy-MM-dd HH:mm') AS Departure,
    b.Capacity - ISNULL(t.TicketsSold, 0) AS AvailableSeats
FROM Schedules s
JOIN Buses b ON s.BusId = b.BusId
JOIN Routes r ON s.RouteId = r.RouteId
LEFT JOIN (
    SELECT ScheduleId, COUNT(*) AS TicketsSold
    FROM Tickets WHERE Status = 'Active'
    GROUP BY ScheduleId
) t ON s.ScheduleId = t.ScheduleId
WHERE s.DepartureTime > GETUTCDATE()
ORDER BY s.DepartureTime;

GO
