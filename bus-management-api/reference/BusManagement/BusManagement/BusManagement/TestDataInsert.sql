USE [BusManagementDB]
GO

-- =============================================
-- TEST DATA INSERTION SCRIPT FOR BUS MANAGEMENT SYSTEM
-- Localized for Rwanda
-- =============================================

-- Clear existing data (in reverse order of foreign key dependencies)
DELETE FROM [dbo].[Tickets]
DELETE FROM [dbo].[Schedule]
DELETE FROM [dbo].[DriverAssignments]
DELETE FROM [dbo].[Routes]
DELETE FROM [dbo].[Buses]
DELETE FROM [dbo].[Drivers]
DELETE FROM [dbo].[Clients]
DELETE FROM [dbo].[Admins]

-- Reset identity seeds
DBCC CHECKIDENT ('[dbo].[Tickets]', RESEED, 0)
DBCC CHECKIDENT ('[dbo].[Schedule]', RESEED, 0)
DBCC CHECKIDENT ('[dbo].[DriverAssignments]', RESEED, 0)
DBCC CHECKIDENT ('[dbo].[Routes]', RESEED, 0)
DBCC CHECKIDENT ('[dbo].[Buses]', RESEED, 0)
DBCC CHECKIDENT ('[dbo].[Drivers]', RESEED, 0)
DBCC CHECKIDENT ('[dbo].[Clients]', RESEED, 0)
DBCC CHECKIDENT ('[dbo].[Admins]', RESEED, 0)

GO

-- =============================================
-- INSERT ADMINS
-- =============================================
SET IDENTITY_INSERT [dbo].[Admins] ON
GO

INSERT INTO [dbo].[Admins] ([AdminId], [Name], [Email], [Password])
VALUES 
    (1, N'Jean Claude Habimana', N'admin1@yopmail.com', N'8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918'),
    (2, N'Marie Uwase', N'admin2@yopmail.com', N'8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918'),
    (3, N'Patrick Nkurunziza', N'admin3@yopmail.com', N'8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918'),
    (4, N'Uwimana Grace', N'admin4@yopmail.com', N'8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918'),
    (5, N'Mugisha Eric', N'admin5@yopmail.com', N'8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918')

SET IDENTITY_INSERT [dbo].[Admins] OFF
GO

-- =============================================
-- INSERT CLIENTS
-- =============================================
SET IDENTITY_INSERT [dbo].[Clients] ON
GO

INSERT INTO [dbo].[Clients] ([ClientId], [Name], [Email], [Password], [Phone])
VALUES 
    (1, N'Uwimana Grace', N'client1@yopmail.com', N'8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', N'+250788123456'),
    (2, N'Mugisha Eric', N'client2@yopmail.com', N'8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', N'+250788234567'),
    (3, N'Mukamazimpaka Jeanne', N'client3@yopmail.com', N'8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', N'+250788345678'),
    (4, N'Nshimiyimana Patrick', N'client4@yopmail.com', N'8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', N'+250788456789'),
    (5, N'Ingabire Alice', N'client5@yopmail.com', N'8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', N'+250788567890')

SET IDENTITY_INSERT [dbo].[Clients] OFF
GO

-- =============================================
-- INSERT DRIVERS
-- =============================================
SET IDENTITY_INSERT [dbo].[Drivers] ON
GO

INSERT INTO [dbo].[Drivers] ([DriverId], [Name], [LicenceNumber], [LicencePhoto], [Email], [Password], [Phone])
VALUES 
    (1, N'Nkurunziza Emmanuel', N'DL-RW-2020-001234', N'/images/licenses/driver1.jpg', N'driver1@yopmail.com', N'8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', N'+250788100001'),
    (2, N'Uwizeye Benjamin', N'DL-RW-2019-005678', N'/images/licenses/driver2.jpg', N'driver2@yopmail.com', N'8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', N'+250788100002'),
    (3, N'Mbarushimana Jean', N'DL-RW-2021-009012', N'/images/licenses/driver3.jpg', N'driver3@yopmail.com', N'8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', N'+250788100003'),
    (4, N'Hategekimana Robert', N'DL-RW-2020-003456', N'/images/licenses/driver4.jpg', N'driver4@yopmail.com', N'8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', N'+250788100004'),
    (5, N'Munyamahoro Frank', N'DL-RW-2018-007890', N'/images/licenses/driver5.jpg', N'driver5@yopmail.com', N'8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', N'+250788100005')

SET IDENTITY_INSERT [dbo].[Drivers] OFF
GO

-- =============================================
-- INSERT BUSES
-- =============================================
SET IDENTITY_INSERT [dbo].[Buses] ON
GO

INSERT INTO [dbo].[Buses] ([BusId], [BusNumber], [Capacity], [Model], [Status])
VALUES 
    (1, N'RAA 100 A', 45, N'Yutong ZK6100H', N'Active'),
    (2, N'RAA 101 B', 50, N'King Long XMQ6127', N'Active'),
    (3, N'RAA 102 C', 45, N'Yutong ZK6100H', N'Active'),
    (4, N'RAA 103 D', 35, N'Golden Dragon XML6102', N'Active'),
    (5, N'RAA 104 E', 50, N'King Long XMQ6127', N'Active')

SET IDENTITY_INSERT [dbo].[Buses] OFF
GO

-- =============================================
-- INSERT ROUTES (Major Routes in Rwanda)
-- =============================================
SET IDENTITY_INSERT [dbo].[Routes] ON
GO

INSERT INTO [dbo].[Routes] ([RouteId], [Origin], [Destination], [Distance], [Price])
VALUES 
    (1, N'Kigali', N'Musanze', 90, 3000),
    (2, N'Kigali', N'Huye (Butare)', 135, 3500),
    (3, N'Kigali', N'Rubavu (Gisenyi)', 155, 4000),
    (4, N'Kigali', N'Rwamagana', 50, 2000),
    (5, N'Kigali Airport', N'City Center', 15, 1500)

SET IDENTITY_INSERT [dbo].[Routes] OFF
GO

-- =============================================
-- INSERT SCHEDULES
-- =============================================
SET IDENTITY_INSERT [dbo].[Schedule] ON
GO

DECLARE @BaseDate DATETIME = CAST(GETDATE() AS DATE)

INSERT INTO [dbo].[Schedule] ([ScheduleId], [BusId], [RouteId], [DepartureTime], [ArrivalTime])
VALUES 
    (1, 1, 1, DATEADD(HOUR, 6, @BaseDate), DATEADD(HOUR, 8, @BaseDate)),
    (2, 2, 2, DATEADD(HOUR, 7, @BaseDate), DATEADD(HOUR, 9, @BaseDate) + 30),
    (3, 3, 3, DATEADD(HOUR, 8, @BaseDate), DATEADD(HOUR, 11, @BaseDate)),
    (4, 4, 4, DATEADD(HOUR, 9, @BaseDate), DATEADD(HOUR, 10, @BaseDate)),
    (5, 5, 5, DATEADD(HOUR, 10, @BaseDate), DATEADD(HOUR, 10, @BaseDate) + 30)

SET IDENTITY_INSERT [dbo].[Schedule] OFF
GO

-- =============================================
-- INSERT DRIVER ASSIGNMENTS
-- =============================================
SET IDENTITY_INSERT [dbo].[DriverAssignments] ON
GO

DECLARE @AssignDate DATETIME = CAST(GETDATE() AS DATE)

INSERT INTO [dbo].[DriverAssignments] ([AssignmentId], [DriverId], [BusId], [AssignmentDate], [Status])
VALUES 
    (1, 1, 1, @AssignDate, N'Active'),
    (2, 2, 2, @AssignDate, N'Active'),
    (3, 3, 3, @AssignDate, N'Active'),
    (4, 4, 4, @AssignDate, N'Active'),
    (5, 5, 5, @AssignDate, N'Active')

SET IDENTITY_INSERT [dbo].[DriverAssignments] OFF
GO

-- =============================================
-- INSERT TICKETS
-- =============================================
SET IDENTITY_INSERT [dbo].[Tickets] ON
GO

DECLARE @TicketDate DATETIME = GETDATE()

INSERT INTO [dbo].[Tickets] ([TicketId], [ClientId], [ScheduleId], [DateIssued])
VALUES 
    (1, 1, 1, DATEADD(HOUR, -2, @TicketDate)),
    (2, 2, 2, DATEADD(HOUR, -1, @TicketDate)),
    (3, 3, 3, DATEADD(HOUR, -3, @TicketDate)),
    (4, 4, 4, @TicketDate),
    (5, 5, 5, DATEADD(HOUR, 1, @TicketDate))

SET IDENTITY_INSERT [dbo].[Tickets] OFF
GO

-- =============================================
-- VERIFY DATA INSERTION
-- =============================================
PRINT '============================================='
PRINT 'DATA INSERTION COMPLETE - SUMMARY'
PRINT '============================================='
PRINT 'Admins: ' + CAST((SELECT COUNT(*) FROM [dbo].[Admins]) AS VARCHAR(10))
PRINT 'Clients: ' + CAST((SELECT COUNT(*) FROM [dbo].[Clients]) AS VARCHAR(10))
PRINT 'Drivers: ' + CAST((SELECT COUNT(*) FROM [dbo].[Drivers]) AS VARCHAR(10))
PRINT 'Buses: ' + CAST((SELECT COUNT(*) FROM [dbo].[Buses]) AS VARCHAR(10))
PRINT 'Routes: ' + CAST((SELECT COUNT(*) FROM [dbo].[Routes]) AS VARCHAR(10))
PRINT 'Schedules: ' + CAST((SELECT COUNT(*) FROM [dbo].[Schedule]) AS VARCHAR(10))
PRINT 'Driver Assignments: ' + CAST((SELECT COUNT(*) FROM [dbo].[DriverAssignments]) AS VARCHAR(10))
PRINT 'Tickets: ' + CAST((SELECT COUNT(*) FROM [dbo].[Tickets]) AS VARCHAR(10))
PRINT '============================================='

-- =============================================
-- SAMPLE QUERIES TO VERIFY DATA
-- =============================================

-- Show popular routes
SELECT TOP 5 
    r.Origin,
    r.Destination,
    r.Distance,
    r.Price,
    COUNT(t.TicketId) AS TotalTickets
FROM [dbo].[Routes] r
INNER JOIN [dbo].[Schedule] s ON r.RouteId = s.RouteId
INNER JOIN [dbo].[Tickets] t ON s.ScheduleId = t.ScheduleId
GROUP BY r.Origin, r.Destination, r.Distance, r.Price
ORDER BY TotalTickets DESC

-- Show upcoming schedules
SELECT TOP 10
    b.BusNumber,
    r.Origin,
    r.Destination,
    s.DepartureTime,
    s.ArrivalTime,
    d.Name AS DriverName
FROM [dbo].[Schedule] s
INNER JOIN [dbo].[Buses] b ON s.BusId = b.BusId
INNER JOIN [dbo].[Routes] r ON s.RouteId = r.RouteId
LEFT JOIN [dbo].[DriverAssignments] da ON b.BusId = da.BusId AND CAST(s.DepartureTime AS DATE) = CAST(da.AssignmentDate AS DATE)
LEFT JOIN [dbo].[Drivers] d ON da.DriverId = d.DriverId
WHERE s.DepartureTime > GETDATE()
ORDER BY s.DepartureTime

GO

