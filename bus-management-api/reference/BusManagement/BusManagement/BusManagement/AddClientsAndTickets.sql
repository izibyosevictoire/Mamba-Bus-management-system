-- =============================================
-- Add Sample Clients and Tickets
-- =============================================

USE BusManagementDB;
GO

PRINT '========================================';
PRINT 'Adding Sample Clients...';
PRINT '========================================';

-- Insert Sample Clients
-- Password for all clients: "password123" (SHA256 hashed)
-- Hash: ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f

INSERT INTO Clients (Name, Email, Password, Phone)
VALUES 
    ('Alice Mukamana', 'alice.mukamana@email.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', '+250788111222'),
    ('Bob Niyonzima', 'bob.niyonzima@email.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', '+250788222333'),
    ('Claire Umurerwa', 'claire.umurerwa@email.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', '+250788333444'),
    ('David Kagame', 'david.kagame@email.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', '+250788444555'),
    ('Emma Uwase', 'emma.uwase@email.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', '+250788555666'),
    ('Frank Habimana', 'frank.habimana@email.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', '+250788666777'),
    ('Grace Umutoni', 'grace.umutoni@email.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', '+250788777888'),
    ('Henry Mugisha', 'henry.mugisha@email.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', '+250788888999'),
    ('Irene Mutesi', 'irene.mutesi@email.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', '+250788999000'),
    ('John Uwimana', 'john.uwimana@email.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', '+250789000111');
GO

PRINT 'Clients added successfully!';
PRINT '';

PRINT '========================================';
PRINT 'Current Clients in Database:';
PRINT '========================================';

SELECT ClientId, Name, Email, Phone 
FROM Clients 
ORDER BY ClientId;
GO

PRINT '';
PRINT '========================================';
PRINT 'Checking Available Schedules...';
PRINT '========================================';

-- Show available schedules
SELECT ScheduleId, BusId, RouteId, DepartureTime, ArrivalTime 
FROM Schedule 
ORDER BY ScheduleId;
GO

PRINT '';
PRINT '========================================';
PRINT 'Adding Sample Tickets...';
PRINT '========================================';

-- Insert Sample Tickets
-- Make sure to use valid ScheduleId values from your Schedule table
-- Adjust the ScheduleId values based on your actual schedules

DECLARE @ClientId1 INT, @ClientId2 INT, @ClientId3 INT, @ClientId4 INT, @ClientId5 INT;
DECLARE @ClientId6 INT, @ClientId7 INT, @ClientId8 INT, @ClientId9 INT, @ClientId10 INT;

-- Get ClientIds of newly added clients
SELECT @ClientId1 = ClientId FROM Clients WHERE Email = 'alice.mukamana@email.com';
SELECT @ClientId2 = ClientId FROM Clients WHERE Email = 'bob.niyonzima@email.com';
SELECT @ClientId3 = ClientId FROM Clients WHERE Email = 'claire.umurerwa@email.com';
SELECT @ClientId4 = ClientId FROM Clients WHERE Email = 'david.kagame@email.com';
SELECT @ClientId5 = ClientId FROM Clients WHERE Email = 'emma.uwase@email.com';
SELECT @ClientId6 = ClientId FROM Clients WHERE Email = 'frank.habimana@email.com';
SELECT @ClientId7 = ClientId FROM Clients WHERE Email = 'grace.umutoni@email.com';
SELECT @ClientId8 = ClientId FROM Clients WHERE Email = 'henry.mugisha@email.com';
SELECT @ClientId9 = ClientId FROM Clients WHERE Email = 'irene.mutesi@email.com';
SELECT @ClientId10 = ClientId FROM Clients WHERE Email = 'john.uwimana@email.com';

-- Check if we have schedules to assign tickets to
IF EXISTS (SELECT 1 FROM Schedule)
BEGIN
    DECLARE @Schedule1 INT, @Schedule2 INT, @Schedule3 INT, @Schedule4 INT, @Schedule5 INT;
    
    -- Get first 5 schedule IDs
    SELECT TOP 1 @Schedule1 = ScheduleId FROM Schedule ORDER BY ScheduleId;
    SELECT TOP 1 @Schedule2 = ScheduleId FROM Schedule WHERE ScheduleId > @Schedule1 ORDER BY ScheduleId;
    SELECT TOP 1 @Schedule3 = ScheduleId FROM Schedule WHERE ScheduleId > @Schedule2 ORDER BY ScheduleId;
    SELECT TOP 1 @Schedule4 = ScheduleId FROM Schedule WHERE ScheduleId > @Schedule3 ORDER BY ScheduleId;
    SELECT TOP 1 @Schedule5 = ScheduleId FROM Schedule WHERE ScheduleId > @Schedule4 ORDER BY ScheduleId;
    
    -- Insert tickets with various dates (past and recent)
    INSERT INTO Tickets (ClientId, ScheduleId, DateIssued)
    VALUES 
        -- Recent tickets
        (@ClientId1, @Schedule1, DATEADD(DAY, -2, GETDATE())),
        (@ClientId2, @Schedule1, DATEADD(DAY, -2, GETDATE())),
        (@ClientId3, @Schedule2, DATEADD(DAY, -1, GETDATE())),
        (@ClientId4, @Schedule2, DATEADD(DAY, -1, GETDATE())),
        (@ClientId5, @Schedule3, GETDATE()),
        (@ClientId6, @Schedule3, GETDATE()),
        (@ClientId7, @Schedule4, GETDATE()),
        
        -- Older tickets (last week)
        (@ClientId1, @Schedule2, DATEADD(DAY, -7, GETDATE())),
        (@ClientId2, @Schedule3, DATEADD(DAY, -6, GETDATE())),
        (@ClientId3, @Schedule4, DATEADD(DAY, -5, GETDATE())),
        (@ClientId8, @Schedule1, DATEADD(DAY, -4, GETDATE())),
        (@ClientId9, @Schedule2, DATEADD(DAY, -3, GETDATE())),
        (@ClientId10, @Schedule3, DATEADD(DAY, -2, GETDATE())),
        
        -- More recent tickets
        (@ClientId4, @Schedule5, GETDATE()),
        (@ClientId5, @Schedule1, GETDATE()),
        (@ClientId6, @Schedule2, DATEADD(DAY, -1, GETDATE())),
        (@ClientId7, @Schedule3, DATEADD(DAY, -1, GETDATE())),
        (@ClientId8, @Schedule4, DATEADD(DAY, -2, GETDATE())),
        (@ClientId9, @Schedule5, DATEADD(DAY, -3, GETDATE())),
        (@ClientId10, @Schedule1, DATEADD(DAY, -4, GETDATE()));
    
    PRINT 'Tickets added successfully!';
END
ELSE
BEGIN
    PRINT 'WARNING: No schedules found in database!';
    PRINT 'Please add schedules first before creating tickets.';
END
GO

PRINT '';
PRINT '========================================';
PRINT 'Tickets Summary:';
PRINT '========================================';

-- Show ticket count per client
SELECT 
    c.Name AS ClientName,
    c.Email,
    COUNT(t.TicketId) AS TotalTickets
FROM Clients c
LEFT JOIN Tickets t ON c.ClientId = t.ClientId
GROUP BY c.Name, c.Email
ORDER BY TotalTickets DESC, c.Name;
GO

PRINT '';
PRINT '========================================';
PRINT 'Recent Tickets (Last 7 Days):';
PRINT '========================================';

-- Show recent tickets with details
SELECT TOP 10
    t.TicketId,
    c.Name AS ClientName,
    c.Email AS ClientEmail,
    s.ScheduleId,
    b.BusNumber,
    r.Origin,
    r.Destination,
    r.Price,
    s.DepartureTime,
    t.DateIssued
FROM Tickets t
JOIN Clients c ON t.ClientId = c.ClientId
JOIN Schedule s ON t.ScheduleId = s.ScheduleId
JOIN Buses b ON s.BusId = b.BusId
JOIN Routes r ON s.RouteId = r.RouteId
WHERE t.DateIssued >= DATEADD(DAY, -7, GETDATE())
ORDER BY t.DateIssued DESC;
GO

PRINT '';
PRINT '========================================';
PRINT 'Database Summary:';
PRINT '========================================';

SELECT 'Clients' AS TableName, COUNT(*) AS RecordCount FROM Clients
UNION ALL
SELECT 'Tickets', COUNT(*) FROM Tickets
UNION ALL
SELECT 'Schedules', COUNT(*) FROM Schedule
UNION ALL
SELECT 'Buses', COUNT(*) FROM Buses
UNION ALL
SELECT 'Routes', COUNT(*) FROM Routes;
GO

PRINT '';
PRINT '========================================';
PRINT 'Login Credentials for Test Clients:';
PRINT '========================================';
PRINT 'Email: alice.mukamana@email.com';
PRINT 'Email: bob.niyonzima@email.com';
PRINT 'Email: claire.umurerwa@email.com';
PRINT '... (and 7 more clients)';
PRINT '';
PRINT 'Password for all: password123';
PRINT '========================================';
GO


