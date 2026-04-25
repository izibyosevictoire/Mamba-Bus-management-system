-- =============================================
-- Add Sample Buses, Routes, and Schedules
-- Run this first if you don't have data yet
-- =============================================

USE BusManagementDB;
GO

PRINT '========================================';
PRINT 'Adding Sample Buses...';
PRINT '========================================';

-- Add buses only if none exist
IF NOT EXISTS (SELECT 1 FROM Buses)
BEGIN
    INSERT INTO Buses (BusNumber, Capacity, Model, Status)
    VALUES 
        ('RAB-001A', 50, 'Mercedes-Benz Sprinter', 'Available'),
        ('RAB-002B', 45, 'Toyota Coaster', 'Available'),
        ('RAB-003C', 60, 'Isuzu NQR', 'Available'),
        ('RAB-004D', 40, 'Mercedes-Benz Sprinter', 'Available'),
        ('RAB-005E', 55, 'Toyota Coaster', 'Available'),
        ('RAB-006F', 50, 'Yutong ZK6127H', 'Available'),
        ('RAB-007G', 48, 'Golden Dragon XML6102', 'Unavailable'),
        ('RAB-008H', 52, 'King Long XMQ6127', 'Available');
    
    PRINT 'Buses added successfully!';
END
ELSE
BEGIN
    PRINT 'Buses already exist. Skipping...';
END
GO

SELECT BusId, BusNumber, Model, Capacity, Status FROM Buses;
GO

PRINT '';
PRINT '========================================';
PRINT 'Adding Sample Routes...';
PRINT '========================================';

-- Add routes only if none exist
IF NOT EXISTS (SELECT 1 FROM Routes)
BEGIN
    INSERT INTO Routes (Origin, Destination, Distance, Price)
    VALUES 
        ('Kigali', 'Musanze', 90, 2500),
        ('Kigali', 'Huye', 135, 3500),
        ('Kigali', 'Rubavu', 155, 4000),
        ('Musanze', 'Rubavu', 62, 2000),
        ('Huye', 'Musanze', 180, 4500),
        ('Kigali', 'Rwamagana', 55, 1500),
        ('Kigali', 'Muhanga', 48, 1200),
        ('Huye', 'Rubavu', 200, 5000),
        ('Kigali', 'Nyagatare', 170, 4200),
        ('Musanze', 'Huye', 180, 4500);
    
    PRINT 'Routes added successfully!';
END
ELSE
BEGIN
    PRINT 'Routes already exist. Skipping...';
END
GO

SELECT RouteId, Origin, Destination, Distance, Price FROM Routes;
GO

PRINT '';
PRINT '========================================';
PRINT 'Adding Sample Schedules...';
PRINT '========================================';

-- Add schedules only if none exist
IF NOT EXISTS (SELECT 1 FROM Schedule)
BEGIN
    DECLARE @Today DATETIME = CAST(GETDATE() AS DATE);
    DECLARE @Tomorrow DATETIME = DATEADD(DAY, 1, @Today);
    DECLARE @DayAfter DATETIME = DATEADD(DAY, 2, @Today);
    
    INSERT INTO Schedule (BusId, RouteId, DepartureTime, ArrivalTime)
    VALUES 
        -- Today's schedules
        (1, 1, DATEADD(HOUR, 8, @Today), DATEADD(HOUR, 10, @Today)),   -- Kigali-Musanze 8am
        (2, 2, DATEADD(HOUR, 9, @Today), DATEADD(HOUR, 11.5, @Today)), -- Kigali-Huye 9am
        (3, 3, DATEADD(HOUR, 10, @Today), DATEADD(HOUR, 13, @Today)),  -- Kigali-Rubavu 10am
        (4, 6, DATEADD(HOUR, 14, @Today), DATEADD(HOUR, 15.5, @Today)), -- Kigali-Rwamagana 2pm
        (5, 7, DATEADD(HOUR, 15, @Today), DATEADD(HOUR, 16.5, @Today)), -- Kigali-Muhanga 3pm
        
        -- Tomorrow's schedules
        (1, 1, DATEADD(HOUR, 7, @Tomorrow), DATEADD(HOUR, 9, @Tomorrow)),   -- Kigali-Musanze 7am
        (2, 2, DATEADD(HOUR, 8, @Tomorrow), DATEADD(HOUR, 10.5, @Tomorrow)), -- Kigali-Huye 8am
        (3, 3, DATEADD(HOUR, 9, @Tomorrow), DATEADD(HOUR, 12, @Tomorrow)),   -- Kigali-Rubavu 9am
        (4, 4, DATEADD(HOUR, 10, @Tomorrow), DATEADD(HOUR, 12, @Tomorrow)),  -- Musanze-Rubavu 10am
        (5, 5, DATEADD(HOUR, 11, @Tomorrow), DATEADD(HOUR, 14.5, @Tomorrow)), -- Huye-Musanze 11am
        (6, 6, DATEADD(HOUR, 13, @Tomorrow), DATEADD(HOUR, 14.5, @Tomorrow)), -- Kigali-Rwamagana 1pm
        (1, 9, DATEADD(HOUR, 16, @Tomorrow), DATEADD(HOUR, 18.5, @Tomorrow)), -- Kigali-Nyagatare 4pm
        
        -- Day after tomorrow
        (1, 1, DATEADD(HOUR, 6, @DayAfter), DATEADD(HOUR, 8, @DayAfter)),    -- Kigali-Musanze 6am
        (2, 2, DATEADD(HOUR, 7, @DayAfter), DATEADD(HOUR, 9.5, @DayAfter)),  -- Kigali-Huye 7am
        (3, 3, DATEADD(HOUR, 8, @DayAfter), DATEADD(HOUR, 11, @DayAfter)),   -- Kigali-Rubavu 8am
        (4, 4, DATEADD(HOUR, 9, @DayAfter), DATEADD(HOUR, 11, @DayAfter)),   -- Musanze-Rubavu 9am
        (5, 5, DATEADD(HOUR, 10, @DayAfter), DATEADD(HOUR, 13.5, @DayAfter)), -- Huye-Musanze 10am
        (6, 8, DATEADD(HOUR, 12, @DayAfter), DATEADD(HOUR, 17, @DayAfter)),   -- Huye-Rubavu 12pm
        (1, 7, DATEADD(HOUR, 15, @DayAfter), DATEADD(HOUR, 16.5, @DayAfter)), -- Kigali-Muhanga 3pm
        (2, 10, DATEADD(HOUR, 17, @DayAfter), DATEADD(HOUR, 20.5, @DayAfter)); -- Musanze-Huye 5pm
    
    PRINT 'Schedules added successfully!';
END
ELSE
BEGIN
    PRINT 'Schedules already exist. Skipping...';
END
GO

PRINT '';
PRINT '========================================';
PRINT 'Schedule Summary:';
PRINT '========================================';

SELECT 
    s.ScheduleId,
    b.BusNumber,
    r.Origin,
    r.Destination,
    r.Price,
    s.DepartureTime,
    s.ArrivalTime
FROM Schedule s
JOIN Buses b ON s.BusId = b.BusId
JOIN Routes r ON s.RouteId = r.RouteId
ORDER BY s.DepartureTime;
GO

PRINT '';
PRINT '========================================';
PRINT 'Database Ready!';
PRINT '========================================';
PRINT 'You can now run AddClientsAndTickets.sql';
PRINT '========================================';
GO


