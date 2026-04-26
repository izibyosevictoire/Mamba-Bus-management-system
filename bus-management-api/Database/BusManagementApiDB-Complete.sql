-- =============================================
-- Bus Management API - Complete Database Script
-- Creates database, tables, and seeds all data
-- WITHOUT using EF Core migrations
-- =============================================
-- Run in SQL Server Management Studio (SSMS)
-- =============================================

USE master;
GO

-- Drop and recreate database
IF EXISTS (SELECT name FROM sys.databases WHERE name = 'BusManagementApiDB')
BEGIN
    ALTER DATABASE BusManagementApiDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE BusManagementApiDB;
END
GO

CREATE DATABASE BusManagementApiDB;
GO

USE BusManagementApiDB;
GO

-- =============================================
-- TABLE: Buses
-- =============================================
CREATE TABLE Buses (
    BusId INT IDENTITY(1,1) NOT NULL,
    BusNumber NVARCHAR(50) NOT NULL,
    Capacity INT NOT NULL,
    Model NVARCHAR(100) NOT NULL,
    Status NVARCHAR(20) NOT NULL CONSTRAINT DF_Buses_Status DEFAULT 'Active',
    CreatedAt DATETIME2(7) NOT NULL CONSTRAINT DF_Buses_CreatedAt DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2(7) NULL,
    CONSTRAINT PK_Buses PRIMARY KEY (BusId),
    CONSTRAINT UQ_Buses_BusNumber UNIQUE (BusNumber)
);
GO

-- =============================================
-- TABLE: Routes
-- =============================================
CREATE TABLE Routes (
    RouteId INT IDENTITY(1,1) NOT NULL,
    Origin NVARCHAR(100) NOT NULL,
    Destination NVARCHAR(100) NOT NULL,
    Distance DECIMAL(10,2) NOT NULL,
    Price DECIMAL(10,2) NOT NULL,
    CreatedAt DATETIME2(7) NOT NULL CONSTRAINT DF_Routes_CreatedAt DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2(7) NULL,
    CONSTRAINT PK_Routes PRIMARY KEY (RouteId)
);
GO

-- =============================================
-- TABLE: Users
-- =============================================
CREATE TABLE Users (
    UserId INT IDENTITY(1,1) NOT NULL,
    Name NVARCHAR(100) NOT NULL,
    Email NVARCHAR(256) NOT NULL,
    PasswordHash NVARCHAR(MAX) NOT NULL,
    Phone NVARCHAR(20) NOT NULL,
    UserType NVARCHAR(20) NOT NULL CONSTRAINT DF_Users_UserType DEFAULT 'Client',
    LicenceNumber NVARCHAR(50) NULL,
    LicencePhoto NVARCHAR(500) NULL,
    IsActive BIT NOT NULL CONSTRAINT DF_Users_IsActive DEFAULT 1,
    CreatedAt DATETIME2(7) NOT NULL CONSTRAINT DF_Users_CreatedAt DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2(7) NULL,
    CONSTRAINT PK_Users PRIMARY KEY (UserId),
    CONSTRAINT UQ_Users_Email UNIQUE (Email)
);
GO

-- =============================================
-- TABLE: Permissions
-- =============================================
CREATE TABLE Permissions (
    PermissionId INT IDENTITY(1,1) NOT NULL,
    Name NVARCHAR(100) NOT NULL,
    Description NVARCHAR(500) NOT NULL,
    Module NVARCHAR(50) NOT NULL,
    CreatedAt DATETIME2(7) NOT NULL CONSTRAINT DF_Permissions_CreatedAt DEFAULT GETUTCDATE(),
    CONSTRAINT PK_Permissions PRIMARY KEY (PermissionId),
    CONSTRAINT UQ_Permissions_Name UNIQUE (Name)
);
GO

-- =============================================
-- TABLE: UserPermissions (Junction)
-- =============================================
CREATE TABLE UserPermissions (
    UserPermissionId INT IDENTITY(1,1) NOT NULL,
    UserId INT NOT NULL,
    PermissionId INT NOT NULL,
    AssignedAt DATETIME2(7) NOT NULL CONSTRAINT DF_UserPermissions_AssignedAt DEFAULT GETUTCDATE(),
    CONSTRAINT PK_UserPermissions PRIMARY KEY (UserPermissionId),
    CONSTRAINT FK_UserPermissions_Users FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE CASCADE,
    CONSTRAINT FK_UserPermissions_Permissions FOREIGN KEY (PermissionId) REFERENCES Permissions(PermissionId) ON DELETE CASCADE,
    CONSTRAINT UQ_UserPermissions UNIQUE (UserId, PermissionId)
);
GO

-- =============================================
-- TABLE: Schedules
-- =============================================
CREATE TABLE Schedules (
    ScheduleId INT IDENTITY(1,1) NOT NULL,
    BusId INT NOT NULL,
    RouteId INT NOT NULL,
    DepartureTime DATETIME2(7) NOT NULL,
    ArrivalTime DATETIME2(7) NOT NULL,
    CreatedAt DATETIME2(7) NOT NULL CONSTRAINT DF_Schedules_CreatedAt DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2(7) NULL,
    CONSTRAINT PK_Schedules PRIMARY KEY (ScheduleId),
    CONSTRAINT FK_Schedules_Buses FOREIGN KEY (BusId) REFERENCES Buses(BusId),
    CONSTRAINT FK_Schedules_Routes FOREIGN KEY (RouteId) REFERENCES Routes(RouteId)
);
GO

-- =============================================
-- TABLE: DriverAssignments
-- =============================================
CREATE TABLE DriverAssignments (
    AssignmentId INT IDENTITY(1,1) NOT NULL,
    DriverId INT NOT NULL,
    BusId INT NOT NULL,
    AssignmentDate DATETIME2(7) NOT NULL CONSTRAINT DF_DriverAssignments_AssignmentDate DEFAULT GETUTCDATE(),
    Status NVARCHAR(20) NOT NULL CONSTRAINT DF_DriverAssignments_Status DEFAULT 'Active',
    CONSTRAINT PK_DriverAssignments PRIMARY KEY (AssignmentId),
    CONSTRAINT FK_DriverAssignments_Users FOREIGN KEY (DriverId) REFERENCES Users(UserId),
    CONSTRAINT FK_DriverAssignments_Buses FOREIGN KEY (BusId) REFERENCES Buses(BusId)
);
GO

-- =============================================
-- TABLE: Tickets
-- =============================================
CREATE TABLE Tickets (
    TicketId INT IDENTITY(1,1) NOT NULL,
    ClientId INT NOT NULL,
    ScheduleId INT NOT NULL,
    TicketNumber NVARCHAR(50) NOT NULL,
    PricePaid DECIMAL(10,2) NOT NULL,
    Status NVARCHAR(20) NOT NULL CONSTRAINT DF_Tickets_Status DEFAULT 'Active',
    DateIssued DATETIME2(7) NOT NULL CONSTRAINT DF_Tickets_DateIssued DEFAULT GETUTCDATE(),
    CONSTRAINT PK_Tickets PRIMARY KEY (TicketId),
    CONSTRAINT FK_Tickets_Users FOREIGN KEY (ClientId) REFERENCES Users(UserId),
    CONSTRAINT FK_Tickets_Schedules FOREIGN KEY (ScheduleId) REFERENCES Schedules(ScheduleId),
    CONSTRAINT UQ_Tickets_TicketNumber UNIQUE (TicketNumber)
);
GO

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IX_Schedules_BusId ON Schedules(BusId);
CREATE INDEX IX_Schedules_RouteId ON Schedules(RouteId);
CREATE INDEX IX_DriverAssignments_DriverId ON DriverAssignments(DriverId);
CREATE INDEX IX_DriverAssignments_BusId ON DriverAssignments(BusId);
CREATE INDEX IX_Tickets_ClientId ON Tickets(ClientId);
CREATE INDEX IX_Tickets_ScheduleId ON Tickets(ScheduleId);
CREATE INDEX IX_UserPermissions_PermissionId ON UserPermissions(PermissionId);
GO

-- =============================================
-- SEED: Permissions (12 total)
-- =============================================
SET IDENTITY_INSERT Permissions ON;

INSERT INTO Permissions (PermissionId, Name, Description, Module) VALUES
(1, 'manage.buses', 'Create, edit, delete buses', 'Admin'),
(2, 'manage.routes', 'Create, edit, delete routes', 'Admin'),
(3, 'manage.schedules', 'Create, edit, delete schedules', 'Admin'),
(4, 'manage.users', 'Create, edit, delete users', 'Admin'),
(5, 'manage.permissions', 'Assign permissions to users', 'Admin'),
(6, 'manage.assignments', 'Assign drivers to buses', 'Admin'),
(7, 'tickets.view.all', 'View all tickets in system', 'Admin'),
(8, 'tickets.purchase', 'Purchase bus tickets', 'Client'),
(9, 'view.schedules', 'View available schedules', 'Shared'),
(10, 'view.routes', 'View available routes', 'Shared'),
(11, 'view.own.tickets', 'View own purchased tickets', 'Client'),
(12, 'view.own.assignment', 'View own driver assignment', 'Driver');

SET IDENTITY_INSERT Permissions OFF;
GO

-- =============================================
-- SEED: Users
-- BCrypt hash for password: Admin@123
-- Hash: $2a$11$LqH8z8Y5E5Y5Y5Y5Y5Y5Y.5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y
-- NOTE: Replace with actual hash from app registration
-- =============================================
SET IDENTITY_INSERT Users ON;

-- Admin user (Password: Admin@123)
INSERT INTO Users (UserId, Name, Email, PasswordHash, Phone, UserType, IsActive) VALUES
(1, 'System Administrator', 'admin@busmanagement.com', '$2a$11$6GtzWw7XalvUTYQNN0oj5utcD/VgYh1/64Z9hbXtDwwBy2nZ8Lapu', '0780000001', 'Admin', 1);

-- Driver users (Password: Admin@123)
INSERT INTO Users (UserId, Name, Email, PasswordHash, Phone, UserType, LicenceNumber, IsActive) VALUES
(2, 'John Mugabo', 'john.driver@busmanagement.com', '$2a$11$6GtzWw7XalvUTYQNN0oj5utcD/VgYh1/64Z9hbXtDwwBy2nZ8Lapu', '0780000002', 'Driver', 'DRV-2024-001', 1),
(3, 'Jane Uwimana', 'jane.driver@busmanagement.com', '$2a$11$6GtzWw7XalvUTYQNN0oj5utcD/VgYh1/64Z9hbXtDwwBy2nZ8Lapu', '0780000003', 'Driver', 'DRV-2024-002', 1);

-- Client users (Password: Admin@123)
INSERT INTO Users (UserId, Name, Email, PasswordHash, Phone, UserType, IsActive) VALUES
(4, 'Alice Mukamana', 'alice@client.com', '$2a$11$6GtzWw7XalvUTYQNN0oj5utcD/VgYh1/64Z9hbXtDwwBy2nZ8Lapu', '0780000004', 'Client', 1),
(5, 'Bob Habimana', 'bob@client.com', '$2a$11$6GtzWw7XalvUTYQNN0oj5utcD/VgYh1/64Z9hbXtDwwBy2nZ8Lapu', '0780000005', 'Client', 1);

SET IDENTITY_INSERT Users OFF;
GO

-- =============================================
-- SEED: UserPermissions
-- =============================================

-- Admin gets admin permissions + shared view
INSERT INTO UserPermissions (UserId, PermissionId) VALUES
(1, 1),  -- manage.buses
(1, 2),  -- manage.routes
(1, 3),  -- manage.schedules
(1, 4),  -- manage.users
(1, 5),  -- manage.permissions
(1, 6),  -- manage.assignments
(1, 7),  -- tickets.view.all
(1, 9),  -- view.schedules
(1, 10); -- view.routes

-- Drivers get driver permissions
INSERT INTO UserPermissions (UserId, PermissionId) VALUES
(2, 9),  -- view.schedules
(2, 10), -- view.routes
(2, 12), -- view.own.assignment
(3, 9),  -- view.schedules
(3, 10), -- view.routes
(3, 12); -- view.own.assignment

-- Clients get client permissions
INSERT INTO UserPermissions (UserId, PermissionId) VALUES
(4, 8),  -- tickets.purchase
(4, 9),  -- view.schedules
(4, 10), -- view.routes
(4, 11), -- view.own.tickets
(5, 8),  -- tickets.purchase
(5, 9),  -- view.schedules
(5, 10), -- view.routes
(5, 11); -- view.own.tickets
GO

-- =============================================
-- SEED: Buses
-- =============================================
SET IDENTITY_INSERT Buses ON;

INSERT INTO Buses (BusId, BusNumber, Capacity, Model, Status) VALUES
(1, 'BUS-001', 50, 'Mercedes Benz Tourismo', 'Active'),
(2, 'BUS-002', 45, 'Volvo 9700', 'Active'),
(3, 'BUS-003', 55, 'Scania Touring HD', 'Active'),
(4, 'BUS-004', 40, 'MAN Lions Coach', 'Maintenance'),
(5, 'BUS-005', 50, 'Iveco Magelys Pro', 'Active');

SET IDENTITY_INSERT Buses OFF;
GO

-- =============================================
-- SEED: Routes
-- =============================================
SET IDENTITY_INSERT Routes ON;

INSERT INTO Routes (RouteId, Origin, Destination, Distance, Price) VALUES
(1, 'Kigali', 'Butare (Huye)', 135.50, 2500.00),
(2, 'Kigali', 'Musanze', 95.00, 2000.00),
(3, 'Kigali', 'Gisenyi (Rubavu)', 155.00, 3000.00),
(4, 'Butare', 'Cyangugu (Rusizi)', 87.00, 1800.00),
(5, 'Musanze', 'Gisenyi (Rubavu)', 60.00, 1500.00),
(6, 'Kigali', 'Rwamagana', 60.00, 1200.00),
(7, 'Kigali', 'Nyagatare', 150.00, 3500.00);

SET IDENTITY_INSERT Routes OFF;
GO

-- =============================================
-- SEED: Schedules (Dynamic dates)
-- =============================================
DECLARE @Today DATE = CAST(GETDATE() AS DATE);

INSERT INTO Schedules (BusId, RouteId, DepartureTime, ArrivalTime) VALUES
-- Tomorrow morning
(1, 1, DATEADD(DAY, 1, @Today) + '06:00:00', DATEADD(DAY, 1, @Today) + '08:30:00'),
(2, 2, DATEADD(DAY, 1, @Today) + '07:00:00', DATEADD(DAY, 1, @Today) + '09:00:00'),
(3, 3, DATEADD(DAY, 1, @Today) + '06:30:00', DATEADD(DAY, 1, @Today) + '10:00:00'),
-- Tomorrow afternoon
(1, 1, DATEADD(DAY, 1, @Today) + '14:00:00', DATEADD(DAY, 1, @Today) + '16:30:00'),
(2, 2, DATEADD(DAY, 1, @Today) + '15:00:00', DATEADD(DAY, 1, @Today) + '17:00:00'),
-- Day after tomorrow
(5, 4, DATEADD(DAY, 2, @Today) + '08:00:00', DATEADD(DAY, 2, @Today) + '10:00:00'),
(5, 5, DATEADD(DAY, 2, @Today) + '11:00:00', DATEADD(DAY, 2, @Today) + '12:30:00'),
(3, 6, DATEADD(DAY, 2, @Today) + '09:00:00', DATEADD(DAY, 2, @Today) + '10:00:00'),
-- 3 days from now
(1, 7, DATEADD(DAY, 3, @Today) + '07:00:00', DATEADD(DAY, 3, @Today) + '10:30:00'),
(2, 1, DATEADD(DAY, 3, @Today) + '06:00:00', DATEADD(DAY, 3, @Today) + '08:30:00');
GO

-- =============================================
-- SEED: Driver Assignments
-- =============================================
INSERT INTO DriverAssignments (DriverId, BusId, Status) VALUES
(2, 1, 'Active'),  -- John -> BUS-001
(3, 2, 'Active');  -- Jane -> BUS-002
GO

-- =============================================
-- SEED: Sample Tickets
-- =============================================
INSERT INTO Tickets (ClientId, ScheduleId, TicketNumber, PricePaid, Status) VALUES
(4, 1, 'TKT-2024-0001', 2500.00, 'Active'),  -- Alice: Kigali-Butare
(4, 2, 'TKT-2024-0002', 2000.00, 'Active'),  -- Alice: Kigali-Musanze
(5, 3, 'TKT-2024-0003', 3000.00, 'Active'),  -- Bob: Kigali-Gisenyi
(5, 4, 'TKT-2024-0004', 2500.00, 'Active');  -- Bob: Kigali-Butare (afternoon)
GO

-- =============================================
-- EF Core Migration History (Optional)
-- Add this if you want EF to think migrations ran
-- =============================================
CREATE TABLE __EFMigrationsHistory (
    MigrationId NVARCHAR(150) NOT NULL,
    ProductVersion NVARCHAR(32) NOT NULL,
    CONSTRAINT PK___EFMigrationsHistory PRIMARY KEY (MigrationId)
);

INSERT INTO __EFMigrationsHistory (MigrationId, ProductVersion)
VALUES ('20241210000000_InitialCreate', '8.0.11');
GO

-- =============================================
-- VERIFICATION
-- =============================================
PRINT '';
PRINT '========================================';
PRINT '  DATABASE CREATED SUCCESSFULLY!';
PRINT '========================================';
PRINT '';
PRINT '  TEST ACCOUNTS (Password: Admin@123)';
PRINT '  ----------------------------------------';
PRINT '  Admin:   admin@busmanagement.com';
PRINT '  Driver:  john.driver@busmanagement.com';
PRINT '  Driver:  jane.driver@busmanagement.com';
PRINT '  Client:  alice@client.com';
PRINT '  Client:  bob@client.com';
PRINT '========================================';
PRINT '';

-- Summary counts
SELECT 'Data Summary' AS [Info], '' AS [Value]
UNION ALL SELECT '  Permissions', CAST(COUNT(*) AS VARCHAR) FROM Permissions
UNION ALL SELECT '  Users', CAST(COUNT(*) AS VARCHAR) FROM Users
UNION ALL SELECT '  UserPermissions', CAST(COUNT(*) AS VARCHAR) FROM UserPermissions
UNION ALL SELECT '  Buses', CAST(COUNT(*) AS VARCHAR) FROM Buses
UNION ALL SELECT '  Routes', CAST(COUNT(*) AS VARCHAR) FROM Routes
UNION ALL SELECT '  Schedules', CAST(COUNT(*) AS VARCHAR) FROM Schedules
UNION ALL SELECT '  DriverAssignments', CAST(COUNT(*) AS VARCHAR) FROM DriverAssignments
UNION ALL SELECT '  Tickets', CAST(COUNT(*) AS VARCHAR) FROM Tickets;

-- Show users with permissions
PRINT '';
PRINT 'Users and their permissions:';
SELECT
    u.Name,
    u.Email,
    u.UserType,
    STRING_AGG(p.Name, ', ') AS Permissions
FROM Users u
LEFT JOIN UserPermissions up ON u.UserId = up.UserId
LEFT JOIN Permissions p ON up.PermissionId = p.PermissionId
GROUP BY u.UserId, u.Name, u.Email, u.UserType
ORDER BY u.UserId;

-- Show available schedules
PRINT '';
PRINT 'Available Schedules:';
SELECT
    s.ScheduleId,
    b.BusNumber,
    r.Origin + ' -> ' + r.Destination AS [Route],
    FORMAT(r.Price, 'N0') + ' RWF' AS Price,
    FORMAT(s.DepartureTime, 'yyyy-MM-dd HH:mm') AS Departure,
    b.Capacity AS Seats
FROM Schedules s
JOIN Buses b ON s.BusId = b.BusId
JOIN Routes r ON s.RouteId = r.RouteId
ORDER BY s.DepartureTime;

GO
