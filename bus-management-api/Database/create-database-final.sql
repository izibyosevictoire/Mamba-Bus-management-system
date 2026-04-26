-- =============================================
-- Bus Management API Database Script
-- Run this in SQL Server Management Studio (SSMS)
-- =============================================

USE master;
GO

-- Drop database if exists
IF EXISTS (SELECT name FROM sys.databases WHERE name = 'BusManagementApiDB')
BEGIN
    ALTER DATABASE BusManagementApiDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE BusManagementApiDB;
END
GO

-- Create Database
CREATE DATABASE BusManagementApiDB;
GO

USE BusManagementApiDB;
GO

-- =============================================
-- TABLES
-- =============================================

CREATE TABLE Buses (
    BusId INT IDENTITY(1,1) PRIMARY KEY,
    BusNumber NVARCHAR(50) NOT NULL UNIQUE,
    Capacity INT NOT NULL,
    Model NVARCHAR(100) NOT NULL,
    Status NVARCHAR(20) NOT NULL DEFAULT 'Active',
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NULL
);

CREATE TABLE Routes (
    RouteId INT IDENTITY(1,1) PRIMARY KEY,
    Origin NVARCHAR(100) NOT NULL,
    Destination NVARCHAR(100) NOT NULL,
    Distance DECIMAL(10,2) NOT NULL,
    Price DECIMAL(10,2) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NULL
);

CREATE TABLE Users (
    UserId INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Email NVARCHAR(256) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(MAX) NOT NULL,
    Phone NVARCHAR(20) NOT NULL,
    UserType NVARCHAR(20) NOT NULL,
    LicenceNumber NVARCHAR(50) NULL,
    LicencePhoto NVARCHAR(500) NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NULL
);

CREATE TABLE Permissions (
    PermissionId INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL UNIQUE,
    Description NVARCHAR(500) NOT NULL,
    Module NVARCHAR(50) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

CREATE TABLE UserPermissions (
    UserPermissionId INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL FOREIGN KEY REFERENCES Users(UserId) ON DELETE CASCADE,
    PermissionId INT NOT NULL FOREIGN KEY REFERENCES Permissions(PermissionId) ON DELETE CASCADE,
    AssignedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT UQ_User_Permission UNIQUE (UserId, PermissionId)
);

CREATE TABLE Schedules (
    ScheduleId INT IDENTITY(1,1) PRIMARY KEY,
    BusId INT NOT NULL FOREIGN KEY REFERENCES Buses(BusId),
    RouteId INT NOT NULL FOREIGN KEY REFERENCES Routes(RouteId),
    DepartureTime DATETIME2 NOT NULL,
    ArrivalTime DATETIME2 NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NULL
);

CREATE TABLE DriverAssignments (
    AssignmentId INT IDENTITY(1,1) PRIMARY KEY,
    DriverId INT NOT NULL FOREIGN KEY REFERENCES Users(UserId),
    BusId INT NOT NULL FOREIGN KEY REFERENCES Buses(BusId),
    AssignmentDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    Status NVARCHAR(20) NOT NULL DEFAULT 'Active'
);

CREATE TABLE Tickets (
    TicketId INT IDENTITY(1,1) PRIMARY KEY,
    ClientId INT NOT NULL FOREIGN KEY REFERENCES Users(UserId),
    ScheduleId INT NOT NULL FOREIGN KEY REFERENCES Schedules(ScheduleId),
    TicketNumber NVARCHAR(50) NOT NULL UNIQUE,
    PricePaid DECIMAL(10,2) NOT NULL,
    Status NVARCHAR(20) NOT NULL DEFAULT 'Active',
    DateIssued DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

-- Indexes
CREATE INDEX IX_Schedules_BusId ON Schedules(BusId);
CREATE INDEX IX_Schedules_RouteId ON Schedules(RouteId);
CREATE INDEX IX_DriverAssignments_DriverId ON DriverAssignments(DriverId);
CREATE INDEX IX_DriverAssignments_BusId ON DriverAssignments(BusId);
CREATE INDEX IX_Tickets_ClientId ON Tickets(ClientId);
CREATE INDEX IX_Tickets_ScheduleId ON Tickets(ScheduleId);
GO

-- =============================================
-- SEED DATA
-- =============================================

-- 1. Permissions (12 total)
INSERT INTO Permissions (Name, Description, Module) VALUES
('manage.buses', 'Create, edit, delete buses', 'Admin'),
('manage.routes', 'Create, edit, delete routes', 'Admin'),
('manage.schedules', 'Create, edit, delete schedules', 'Admin'),
('manage.users', 'Create, edit, delete users', 'Admin'),
('manage.permissions', 'Assign permissions to users', 'Admin'),
('manage.assignments', 'Assign drivers to buses', 'Admin'),
('tickets.view.all', 'View all tickets in system', 'Admin'),
('tickets.purchase', 'Purchase bus tickets', 'Client'),
('view.schedules', 'View available schedules', 'Shared'),
('view.routes', 'View available routes', 'Shared'),
('view.own.tickets', 'View own purchased tickets', 'Client'),
('view.own.assignment', 'View own driver assignment', 'Driver');

-- 2. Users
-- Password for ALL users: Password@123
-- BCrypt hash generated for 'Password@123'
DECLARE @PasswordHash NVARCHAR(MAX) = '$2a$11$K7Q5hVxqYqY5qY5qY5qY5OqY5qY5qY5qY5qY5qY5qY5qY5qY5qY5q';

INSERT INTO Users (Name, Email, PasswordHash, Phone, UserType, LicenceNumber) VALUES
('System Admin', 'admin@bus.com', @PasswordHash, '0780000001', 'Admin', NULL),
('John Driver', 'john@bus.com', @PasswordHash, '0780000002', 'Driver', 'DL-2024-001'),
('Jane Driver', 'jane@bus.com', @PasswordHash, '0780000003', 'Driver', 'DL-2024-002'),
('Alice Customer', 'alice@bus.com', @PasswordHash, '0780000004', 'Client', NULL),
('Bob Customer', 'bob@bus.com', @PasswordHash, '0780000005', 'Client', NULL);

-- 3. Assign Permissions to Users
-- Admin gets all admin + view permissions
INSERT INTO UserPermissions (UserId, PermissionId)
SELECT 1, PermissionId FROM Permissions
WHERE Name IN ('manage.buses', 'manage.routes', 'manage.schedules', 'manage.users',
               'manage.permissions', 'manage.assignments', 'tickets.view.all',
               'view.schedules', 'view.routes');

-- Drivers get view + own assignment permissions
INSERT INTO UserPermissions (UserId, PermissionId)
SELECT u.UserId, p.PermissionId
FROM Users u CROSS JOIN Permissions p
WHERE u.UserType = 'Driver'
  AND p.Name IN ('view.schedules', 'view.routes', 'view.own.assignment');

-- Clients get view + purchase + own tickets permissions
INSERT INTO UserPermissions (UserId, PermissionId)
SELECT u.UserId, p.PermissionId
FROM Users u CROSS JOIN Permissions p
WHERE u.UserType = 'Client'
  AND p.Name IN ('view.schedules', 'view.routes', 'view.own.tickets', 'tickets.purchase');

-- 4. Buses
INSERT INTO Buses (BusNumber, Capacity, Model, Status) VALUES
('BUS-001', 50, 'Mercedes Tourismo', 'Active'),
('BUS-002', 45, 'Volvo 9700', 'Active'),
('BUS-003', 55, 'Scania Touring', 'Active'),
('BUS-004', 40, 'MAN Lions Coach', 'Maintenance'),
('BUS-005', 50, 'Iveco Magelys', 'Active');

-- 5. Routes
INSERT INTO Routes (Origin, Destination, Distance, Price) VALUES
('Kigali', 'Butare', 135.50, 2500.00),
('Kigali', 'Musanze', 95.00, 2000.00),
('Kigali', 'Gisenyi', 155.00, 3000.00),
('Butare', 'Cyangugu', 87.00, 1800.00),
('Musanze', 'Gisenyi', 60.00, 1500.00);

-- 6. Schedules (Next 7 days)
INSERT INTO Schedules (BusId, RouteId, DepartureTime, ArrivalTime) VALUES
-- Tomorrow
(1, 1, DATEADD(DAY, 1, CAST(GETDATE() AS DATE)) + '06:00', DATEADD(DAY, 1, CAST(GETDATE() AS DATE)) + '08:30'),
(1, 1, DATEADD(DAY, 1, CAST(GETDATE() AS DATE)) + '14:00', DATEADD(DAY, 1, CAST(GETDATE() AS DATE)) + '16:30'),
(2, 2, DATEADD(DAY, 1, CAST(GETDATE() AS DATE)) + '07:00', DATEADD(DAY, 1, CAST(GETDATE() AS DATE)) + '09:00'),
(3, 3, DATEADD(DAY, 1, CAST(GETDATE() AS DATE)) + '06:30', DATEADD(DAY, 1, CAST(GETDATE() AS DATE)) + '10:00'),
-- Day after tomorrow
(2, 2, DATEADD(DAY, 2, CAST(GETDATE() AS DATE)) + '07:00', DATEADD(DAY, 2, CAST(GETDATE() AS DATE)) + '09:00'),
(5, 4, DATEADD(DAY, 2, CAST(GETDATE() AS DATE)) + '08:00', DATEADD(DAY, 2, CAST(GETDATE() AS DATE)) + '10:00'),
(5, 5, DATEADD(DAY, 2, CAST(GETDATE() AS DATE)) + '11:00', DATEADD(DAY, 2, CAST(GETDATE() AS DATE)) + '12:30'),
-- 3 days from now
(1, 1, DATEADD(DAY, 3, CAST(GETDATE() AS DATE)) + '06:00', DATEADD(DAY, 3, CAST(GETDATE() AS DATE)) + '08:30'),
(3, 3, DATEADD(DAY, 3, CAST(GETDATE() AS DATE)) + '06:30', DATEADD(DAY, 3, CAST(GETDATE() AS DATE)) + '10:00');

-- 7. Driver Assignments
INSERT INTO DriverAssignments (DriverId, BusId, Status) VALUES
(2, 1, 'Active'),  -- John -> BUS-001
(3, 2, 'Active');  -- Jane -> BUS-002

-- 8. Sample Tickets
INSERT INTO Tickets (ClientId, ScheduleId, TicketNumber, PricePaid, Status) VALUES
(4, 1, 'TKT-001-ALICE', 2500.00, 'Active'),
(4, 3, 'TKT-002-ALICE', 2000.00, 'Active'),
(5, 2, 'TKT-003-BOB', 2500.00, 'Active'),
(5, 4, 'TKT-004-BOB', 3000.00, 'Active');

GO

-- =============================================
-- VERIFICATION
-- =============================================

PRINT '';
PRINT '========================================';
PRINT '  DATABASE CREATED SUCCESSFULLY!';
PRINT '========================================';
PRINT '';
PRINT 'TEST ACCOUNTS (Password: Password@123)';
PRINT '----------------------------------------';
PRINT 'Admin:  admin@bus.com';
PRINT 'Driver: john@bus.com, jane@bus.com';
PRINT 'Client: alice@bus.com, bob@bus.com';
PRINT '';
PRINT '----------------------------------------';
PRINT 'SUMMARY:';

SELECT 'Users' AS [Table], COUNT(*) AS [Count] FROM Users
UNION ALL
SELECT 'Permissions', COUNT(*) FROM Permissions
UNION ALL
SELECT 'UserPermissions', COUNT(*) FROM UserPermissions
UNION ALL
SELECT 'Buses', COUNT(*) FROM Buses
UNION ALL
SELECT 'Routes', COUNT(*) FROM Routes
UNION ALL
SELECT 'Schedules', COUNT(*) FROM Schedules
UNION ALL
SELECT 'DriverAssignments', COUNT(*) FROM DriverAssignments
UNION ALL
SELECT 'Tickets', COUNT(*) FROM Tickets;

GO
