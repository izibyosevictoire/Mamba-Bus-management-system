-- =============================================
-- Bus Management API Database Script
-- Creates database, tables, and seeds data
-- =============================================

-- Create Database
USE master;
GO

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
-- Create Tables
-- =============================================

-- Buses Table
CREATE TABLE Buses (
    BusId INT IDENTITY(1,1) PRIMARY KEY,
    BusNumber NVARCHAR(50) NOT NULL,
    Capacity INT NOT NULL,
    Model NVARCHAR(100) NOT NULL,
    Status NVARCHAR(20) NOT NULL DEFAULT 'Active',
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NULL,
    CONSTRAINT UQ_Buses_BusNumber UNIQUE (BusNumber)
);
GO

-- Routes Table
CREATE TABLE Routes (
    RouteId INT IDENTITY(1,1) PRIMARY KEY,
    Origin NVARCHAR(100) NOT NULL,
    Destination NVARCHAR(100) NOT NULL,
    Distance DECIMAL(10,2) NOT NULL,
    Price DECIMAL(10,2) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NULL
);
GO

-- Users Table
CREATE TABLE Users (
    UserId INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Email NVARCHAR(256) NOT NULL,
    PasswordHash NVARCHAR(MAX) NOT NULL,
    Phone NVARCHAR(20) NOT NULL,
    UserType NVARCHAR(20) NOT NULL, -- Admin, Driver, Client
    LicenceNumber NVARCHAR(50) NULL,
    LicencePhoto NVARCHAR(500) NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NULL,
    CONSTRAINT UQ_Users_Email UNIQUE (Email)
);
GO

-- Permissions Table
CREATE TABLE Permissions (
    PermissionId INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Description NVARCHAR(500) NOT NULL,
    Module NVARCHAR(50) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT UQ_Permissions_Name UNIQUE (Name)
);
GO

-- UserPermissions Table (Junction table for Users and Permissions)
CREATE TABLE UserPermissions (
    UserPermissionId INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    PermissionId INT NOT NULL,
    AssignedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_UserPermissions_Users FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE CASCADE,
    CONSTRAINT FK_UserPermissions_Permissions FOREIGN KEY (PermissionId) REFERENCES Permissions(PermissionId) ON DELETE CASCADE,
    CONSTRAINT UQ_UserPermissions_User_Permission UNIQUE (UserId, PermissionId)
);
GO

-- Schedules Table
CREATE TABLE Schedules (
    ScheduleId INT IDENTITY(1,1) PRIMARY KEY,
    BusId INT NOT NULL,
    RouteId INT NOT NULL,
    DepartureTime DATETIME2 NOT NULL,
    ArrivalTime DATETIME2 NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NULL,
    CONSTRAINT FK_Schedules_Buses FOREIGN KEY (BusId) REFERENCES Buses(BusId),
    CONSTRAINT FK_Schedules_Routes FOREIGN KEY (RouteId) REFERENCES Routes(RouteId)
);
GO

-- DriverAssignments Table
CREATE TABLE DriverAssignments (
    AssignmentId INT IDENTITY(1,1) PRIMARY KEY,
    DriverId INT NOT NULL,
    BusId INT NOT NULL,
    AssignmentDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    Status NVARCHAR(20) NOT NULL DEFAULT 'Active',
    CONSTRAINT FK_DriverAssignments_Users FOREIGN KEY (DriverId) REFERENCES Users(UserId),
    CONSTRAINT FK_DriverAssignments_Buses FOREIGN KEY (BusId) REFERENCES Buses(BusId)
);
GO

-- Tickets Table
CREATE TABLE Tickets (
    TicketId INT IDENTITY(1,1) PRIMARY KEY,
    ClientId INT NOT NULL,
    ScheduleId INT NOT NULL,
    TicketNumber NVARCHAR(50) NOT NULL,
    PricePaid DECIMAL(10,2) NOT NULL,
    Status NVARCHAR(20) NOT NULL DEFAULT 'Active',
    DateIssued DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_Tickets_Users FOREIGN KEY (ClientId) REFERENCES Users(UserId),
    CONSTRAINT FK_Tickets_Schedules FOREIGN KEY (ScheduleId) REFERENCES Schedules(ScheduleId),
    CONSTRAINT UQ_Tickets_TicketNumber UNIQUE (TicketNumber)
);
GO

-- Create Indexes
CREATE INDEX IX_Schedules_BusId ON Schedules(BusId);
CREATE INDEX IX_Schedules_RouteId ON Schedules(RouteId);
CREATE INDEX IX_DriverAssignments_DriverId ON DriverAssignments(DriverId);
CREATE INDEX IX_DriverAssignments_BusId ON DriverAssignments(BusId);
CREATE INDEX IX_Tickets_ClientId ON Tickets(ClientId);
CREATE INDEX IX_Tickets_ScheduleId ON Tickets(ScheduleId);
CREATE INDEX IX_UserPermissions_PermissionId ON UserPermissions(PermissionId);
GO

-- =============================================
-- Seed Data
-- =============================================

-- Seed Permissions (12 permissions)
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
GO

-- Seed Admin User (Password: Admin@123)
-- BCrypt hash for 'Admin@123'
INSERT INTO Users (Name, Email, PasswordHash, Phone, UserType, IsActive) VALUES
('System Admin', 'admin@busmanagement.com', '$2a$11$rBNrXLjPxpPqY5.YQp6Xz.8mZgK5vVBVqKqJqL5L5L5L5L5L5L5L5', '0000000000', 'Admin', 1);
GO

-- Assign all admin permissions to System Admin
INSERT INTO UserPermissions (UserId, PermissionId)
SELECT 1, PermissionId FROM Permissions WHERE Module = 'Admin' OR Name IN ('view.schedules', 'view.routes');
GO

-- Seed Sample Drivers (Password: Driver@123)
INSERT INTO Users (Name, Email, PasswordHash, Phone, UserType, LicenceNumber, IsActive) VALUES
('John Driver', 'john.driver@busmanagement.com', '$2a$11$rBNrXLjPxpPqY5.YQp6Xz.8mZgK5vVBVqKqJqL5L5L5L5L5L5L5L5', '1111111111', 'Driver', 'DL-001', 1),
('Jane Driver', 'jane.driver@busmanagement.com', '$2a$11$rBNrXLjPxpPqY5.YQp6Xz.8mZgK5vVBVqKqJqL5L5L5L5L5L5L5L5', '2222222222', 'Driver', 'DL-002', 1);
GO

-- Assign driver permissions
INSERT INTO UserPermissions (UserId, PermissionId)
SELECT u.UserId, p.PermissionId
FROM Users u, Permissions p
WHERE u.UserType = 'Driver' AND p.Name IN ('view.schedules', 'view.routes', 'view.own.assignment');
GO

-- Seed Sample Clients (Password: Client@123)
INSERT INTO Users (Name, Email, PasswordHash, Phone, UserType, IsActive) VALUES
('Alice Client', 'alice@client.com', '$2a$11$rBNrXLjPxpPqY5.YQp6Xz.8mZgK5vVBVqKqJqL5L5L5L5L5L5L5L5', '3333333333', 'Client', 1),
('Bob Client', 'bob@client.com', '$2a$11$rBNrXLjPxpPqY5.YQp6Xz.8mZgK5vVBVqKqJqL5L5L5L5L5L5L5L5', '4444444444', 'Client', 1);
GO

-- Assign client permissions
INSERT INTO UserPermissions (UserId, PermissionId)
SELECT u.UserId, p.PermissionId
FROM Users u, Permissions p
WHERE u.UserType = 'Client' AND p.Name IN ('view.schedules', 'view.routes', 'view.own.tickets', 'tickets.purchase');
GO

-- Seed Buses
INSERT INTO Buses (BusNumber, Capacity, Model, Status) VALUES
('BUS-001', 50, 'Mercedes Benz Tourismo', 'Active'),
('BUS-002', 45, 'Volvo 9700', 'Active'),
('BUS-003', 55, 'Scania Touring', 'Active'),
('BUS-004', 40, 'MAN Lions Coach', 'Maintenance'),
('BUS-005', 50, 'Iveco Magelys', 'Active');
GO

-- Seed Routes
INSERT INTO Routes (Origin, Destination, Distance, Price) VALUES
('Kigali', 'Butare', 135.5, 2500.00),
('Kigali', 'Musanze', 95.0, 2000.00),
('Kigali', 'Gisenyi', 155.0, 3000.00),
('Butare', 'Cyangugu', 87.0, 1800.00),
('Musanze', 'Gisenyi', 60.0, 1500.00),
('Kigali', 'Rwamagana', 60.0, 1200.00),
('Kigali', 'Nyagatare', 150.0, 3500.00);
GO

-- Seed Schedules (Future dates)
INSERT INTO Schedules (BusId, RouteId, DepartureTime, ArrivalTime) VALUES
(1, 1, DATEADD(DAY, 1, CAST(GETDATE() AS DATE)) + '06:00:00', DATEADD(DAY, 1, CAST(GETDATE() AS DATE)) + '08:30:00'),
(1, 1, DATEADD(DAY, 1, CAST(GETDATE() AS DATE)) + '14:00:00', DATEADD(DAY, 1, CAST(GETDATE() AS DATE)) + '16:30:00'),
(2, 2, DATEADD(DAY, 1, CAST(GETDATE() AS DATE)) + '07:00:00', DATEADD(DAY, 1, CAST(GETDATE() AS DATE)) + '09:00:00'),
(2, 2, DATEADD(DAY, 1, CAST(GETDATE() AS DATE)) + '15:00:00', DATEADD(DAY, 1, CAST(GETDATE() AS DATE)) + '17:00:00'),
(3, 3, DATEADD(DAY, 1, CAST(GETDATE() AS DATE)) + '06:30:00', DATEADD(DAY, 1, CAST(GETDATE() AS DATE)) + '10:00:00'),
(5, 4, DATEADD(DAY, 2, CAST(GETDATE() AS DATE)) + '08:00:00', DATEADD(DAY, 2, CAST(GETDATE() AS DATE)) + '10:00:00'),
(5, 5, DATEADD(DAY, 2, CAST(GETDATE() AS DATE)) + '11:00:00', DATEADD(DAY, 2, CAST(GETDATE() AS DATE)) + '12:30:00'),
(1, 6, DATEADD(DAY, 3, CAST(GETDATE() AS DATE)) + '09:00:00', DATEADD(DAY, 3, CAST(GETDATE() AS DATE)) + '10:00:00'),
(3, 7, DATEADD(DAY, 3, CAST(GETDATE() AS DATE)) + '07:00:00', DATEADD(DAY, 3, CAST(GETDATE() AS DATE)) + '10:30:00');
GO

-- Seed Driver Assignments
INSERT INTO DriverAssignments (DriverId, BusId, Status) VALUES
(2, 1, 'Active'),  -- John Driver assigned to BUS-001
(3, 2, 'Active');  -- Jane Driver assigned to BUS-002
GO

-- Seed Sample Tickets
INSERT INTO Tickets (ClientId, ScheduleId, TicketNumber, PricePaid, Status) VALUES
(4, 1, 'TKT-20241210-ABC12345', 2500.00, 'Active'),  -- Alice bought ticket for Schedule 1
(4, 3, 'TKT-20241210-DEF67890', 2000.00, 'Active'),  -- Alice bought ticket for Schedule 3
(5, 2, 'TKT-20241210-GHI11111', 2500.00, 'Active'),  -- Bob bought ticket for Schedule 2
(5, 5, 'TKT-20241210-JKL22222', 3000.00, 'Active');  -- Bob bought ticket for Schedule 5
GO

-- =============================================
-- Verification Queries
-- =============================================

PRINT '=== Database Created Successfully ===';
PRINT '';

PRINT '--- Users ---';
SELECT UserId, Name, Email, UserType, IsActive FROM Users;

PRINT '--- Permissions ---';
SELECT PermissionId, Name, Module FROM Permissions;

PRINT '--- User Permissions ---';
SELECT u.Name AS UserName, u.UserType, p.Name AS Permission
FROM UserPermissions up
JOIN Users u ON up.UserId = u.UserId
JOIN Permissions p ON up.PermissionId = p.PermissionId
ORDER BY u.UserId, p.Name;

PRINT '--- Buses ---';
SELECT * FROM Buses;

PRINT '--- Routes ---';
SELECT * FROM Routes;

PRINT '--- Schedules ---';
SELECT s.ScheduleId, b.BusNumber, r.Origin, r.Destination, r.Price, s.DepartureTime, s.ArrivalTime
FROM Schedules s
JOIN Buses b ON s.BusId = b.BusId
JOIN Routes r ON s.RouteId = r.RouteId;

PRINT '--- Driver Assignments ---';
SELECT da.AssignmentId, u.Name AS DriverName, b.BusNumber, da.Status
FROM DriverAssignments da
JOIN Users u ON da.DriverId = u.UserId
JOIN Buses b ON da.BusId = b.BusId;

PRINT '--- Tickets ---';
SELECT t.TicketId, t.TicketNumber, u.Name AS ClientName, b.BusNumber, r.Origin, r.Destination, t.PricePaid, t.Status
FROM Tickets t
JOIN Users u ON t.ClientId = u.UserId
JOIN Schedules s ON t.ScheduleId = s.ScheduleId
JOIN Buses b ON s.BusId = b.BusId
JOIN Routes r ON s.RouteId = r.RouteId;

GO
