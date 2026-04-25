-- =============================================
-- Bus Management System - Database Initialization Script
-- Developer: Luccin
-- Database: BusManagementDB
-- =============================================

-- Create database if it doesn't exist
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'BusManagementDB')
BEGIN
    CREATE DATABASE BusManagementDB;
END
GO

USE BusManagementDB;
GO

-- =============================================
-- DROP EXISTING TABLES (for clean setup)
-- =============================================
IF OBJECT_ID('dbo.Tickets', 'U') IS NOT NULL DROP TABLE dbo.Tickets;
IF OBJECT_ID('dbo.DriverAssignments', 'U') IS NOT NULL DROP TABLE dbo.DriverAssignments;
IF OBJECT_ID('dbo.Schedule', 'U') IS NOT NULL DROP TABLE dbo.Schedule;
IF OBJECT_ID('dbo.Routes', 'U') IS NOT NULL DROP TABLE dbo.Routes;
IF OBJECT_ID('dbo.Buses', 'U') IS NOT NULL DROP TABLE dbo.Buses;
IF OBJECT_ID('dbo.Drivers', 'U') IS NOT NULL DROP TABLE dbo.Drivers;
IF OBJECT_ID('dbo.Clients', 'U') IS NOT NULL DROP TABLE dbo.Clients;
IF OBJECT_ID('dbo.Admins', 'U') IS NOT NULL DROP TABLE dbo.Admins;
GO

-- =============================================
-- CREATE TABLES
-- =============================================

-- 1. Admins Table
CREATE TABLE Admins (
    AdminId INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(100) NOT NULL,
    Email NVARCHAR(100) UNIQUE NOT NULL,
    Password NVARCHAR(255) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    LastLogin DATETIME NULL,
    IsActive BIT DEFAULT 1
);
GO

-- 2. Clients Table
CREATE TABLE Clients (
    ClientId INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(100) NOT NULL,
    Email NVARCHAR(100) UNIQUE NOT NULL,
    Password NVARCHAR(255) NOT NULL,
    Phone NVARCHAR(20),
    CreatedAt DATETIME DEFAULT GETDATE(),
    LastLogin DATETIME NULL,
    IsActive BIT DEFAULT 1,
    TotalTicketsPurchased INT DEFAULT 0
);
GO

-- 3. Drivers Table
CREATE TABLE Drivers (
    DriverId INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(100) NOT NULL,
    LicenceNumber NVARCHAR(50) UNIQUE NOT NULL,
    LicencePhoto NVARCHAR(500),
    Email NVARCHAR(100) UNIQUE NOT NULL,
    Password NVARCHAR(255) NOT NULL,
    Phone NVARCHAR(20),
    CreatedAt DATETIME DEFAULT GETDATE(),
    LastLogin DATETIME NULL,
    IsActive BIT DEFAULT 1,
    IsAvailable BIT DEFAULT 1
);
GO

-- 4. Buses Table
CREATE TABLE Buses (
    BusId INT PRIMARY KEY IDENTITY(1,1),
    BusNumber NVARCHAR(50) UNIQUE NOT NULL,
    Capacity INT NOT NULL,
    Model NVARCHAR(100),
    Status NVARCHAR(50) DEFAULT 'Active',
    PurchaseDate DATE,
    LastMaintenanceDate DATE,
    NextMaintenanceDate DATE,
    CreatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT CHK_Capacity CHECK (Capacity > 0 AND Capacity <= 100),
    CONSTRAINT CHK_Bus_Status CHECK (Status IN ('Active', 'Inactive', 'Maintenance'))
);
GO

-- 5. Routes Table
CREATE TABLE Routes (
    RouteId INT PRIMARY KEY IDENTITY(1,1),
    Origin NVARCHAR(100) NOT NULL,
    Destination NVARCHAR(100) NOT NULL,
    Distance DECIMAL(10, 2),
    Price DECIMAL(10, 2) NOT NULL,
    EstimatedDuration INT,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT CHK_Origin_Destination CHECK (Origin <> Destination),
    CONSTRAINT CHK_Price CHECK (Price > 0),
    CONSTRAINT CHK_Distance CHECK (Distance > 0)
);
GO

-- 6. Schedule Table
CREATE TABLE Schedule (
    ScheduleId INT PRIMARY KEY IDENTITY(1,1),
    BusId INT NOT NULL FOREIGN KEY REFERENCES Buses(BusId) ON DELETE CASCADE,
    RouteId INT NOT NULL FOREIGN KEY REFERENCES Routes(RouteId) ON DELETE CASCADE,
    DepartureTime DATETIME NOT NULL,
    ArrivalTime DATETIME NOT NULL,
    Status NVARCHAR(50) DEFAULT 'Scheduled',
    CreatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT CHK_Times CHECK (ArrivalTime > DepartureTime),
    CONSTRAINT CHK_Schedule_Status CHECK (Status IN ('Scheduled', 'InProgress', 'Completed', 'Cancelled'))
);
GO

-- 7. Tickets Table
CREATE TABLE Tickets (
    TicketId INT PRIMARY KEY IDENTITY(1,1),
    ClientId INT NOT NULL FOREIGN KEY REFERENCES Clients(ClientId) ON DELETE CASCADE,
    ScheduleId INT NOT NULL FOREIGN KEY REFERENCES Schedule(ScheduleId) ON DELETE CASCADE,
    DateIssued DATETIME DEFAULT GETDATE(),
    SeatNumber NVARCHAR(10),
    TicketStatus NVARCHAR(50) DEFAULT 'Active',
    PaymentStatus NVARCHAR(50) DEFAULT 'Paid',
    PaymentMethod NVARCHAR(50)
);
GO

-- 8. DriverAssignments Table
CREATE TABLE DriverAssignments (
    AssignmentId INT PRIMARY KEY IDENTITY(1,1),
    DriverId INT NOT NULL FOREIGN KEY REFERENCES Drivers(DriverId) ON DELETE CASCADE,
    BusId INT NOT NULL FOREIGN KEY REFERENCES Buses(BusId) ON DELETE CASCADE,
    AssignmentDate DATETIME DEFAULT GETDATE(),
    StartDate DATE NOT NULL,
    EndDate DATE,
    Status NVARCHAR(50) DEFAULT 'Active',
    Notes NVARCHAR(500)
);
GO

-- =============================================
-- CREATE INDEXES
-- =============================================

-- Email indexes for login queries
CREATE INDEX IX_Admins_Email ON Admins(Email);
CREATE INDEX IX_Clients_Email ON Clients(Email);
CREATE INDEX IX_Drivers_Email ON Drivers(Email);
GO

-- Schedule indexes for performance
CREATE INDEX IX_Schedule_BusId ON Schedule(BusId);
CREATE INDEX IX_Schedule_RouteId ON Schedule(RouteId);
CREATE INDEX IX_Schedule_DepartureTime ON Schedule(DepartureTime);
CREATE INDEX IX_Schedule_Status ON Schedule(Status);
GO

-- Ticket indexes
CREATE INDEX IX_Tickets_ClientId ON Tickets(ClientId);
CREATE INDEX IX_Tickets_ScheduleId ON Tickets(ScheduleId);
CREATE INDEX IX_Tickets_DateIssued ON Tickets(DateIssued);
GO

-- DriverAssignment indexes
CREATE INDEX IX_DriverAssignments_DriverId ON DriverAssignments(DriverId);
CREATE INDEX IX_DriverAssignments_BusId ON DriverAssignments(BusId);
GO

-- =============================================
-- INSERT SEED DATA
-- =============================================

-- Default Admin Account
-- Password: admin (SHA256 hashed)
INSERT INTO Admins (Name, Email, Password)
VALUES ('System Administrator', 'admin@busmanagement.com', 
        '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918');
GO

-- Sample Routes
INSERT INTO Routes (Origin, Destination, Distance, Price, EstimatedDuration)
VALUES 
    ('Kigali', 'Musanze', 90.5, 2500.00, 120),
    ('Kigali', 'Huye', 135.2, 3500.00, 150),
    ('Musanze', 'Gisenyi', 62.3, 2000.00, 90),
    ('Kigali', 'Rubavu', 155.0, 4000.00, 180),
    ('Huye', 'Musanze', 180.0, 4500.00, 210);
GO

-- Sample Buses
INSERT INTO Buses (BusNumber, Capacity, Model, Status, PurchaseDate)
VALUES 
    ('RAB-001A', 50, 'Mercedes-Benz Sprinter', 'Active', '2023-01-15'),
    ('RAB-002B', 45, 'Toyota Coaster', 'Active', '2023-03-20'),
    ('RAB-003C', 60, 'Isuzu NQR', 'Active', '2023-05-10'),
    ('RAB-004D', 40, 'Mercedes-Benz Sprinter', 'Maintenance', '2023-07-05'),
    ('RAB-005E', 55, 'Toyota Coaster', 'Active', '2023-09-12');
GO

-- Sample Drivers
-- Password: driver123 (SHA256 hashed)
INSERT INTO Drivers (Name, LicenceNumber, Email, Password, Phone)
VALUES 
    ('Jean Claude Mugabo', 'RW123456', 'jc.mugabo@busmanagement.com', 
     'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', '+250788123456'),
    ('Marie Uwera', 'RW234567', 'marie.uwera@busmanagement.com', 
     'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', '+250788234567'),
    ('Patrick Nkusi', 'RW345678', 'patrick.nkusi@busmanagement.com', 
     'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', '+250788345678');
GO

-- Sample Clients
-- Password: client123 (SHA256 hashed)
INSERT INTO Clients (Name, Email, Password, Phone)
VALUES 
    ('Alice Mukamana', 'alice.mukamana@email.com', 
     '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', '+250788111222'),
    ('Bob Niyonzima', 'bob.niyonzima@email.com', 
     '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', '+250788222333'),
    ('Claire Umurerwa', 'claire.umurerwa@email.com', 
     '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', '+250788333444');
GO

-- Sample Driver Assignments
INSERT INTO DriverAssignments (DriverId, BusId, StartDate, Status)
VALUES 
    (1, 1, '2025-01-01', 'Active'),
    (2, 2, '2025-01-01', 'Active'),
    (3, 3, '2025-01-01', 'Active');
GO

-- Sample Schedules (Future dates)
INSERT INTO Schedule (BusId, RouteId, DepartureTime, ArrivalTime, Status)
VALUES 
    (1, 1, '2025-12-02 08:00:00', '2025-12-02 10:00:00', 'Scheduled'),
    (2, 2, '2025-12-02 09:00:00', '2025-12-02 11:30:00', 'Scheduled'),
    (3, 3, '2025-12-02 10:00:00', '2025-12-02 11:30:00', 'Scheduled'),
    (1, 4, '2025-12-02 14:00:00', '2025-12-02 17:00:00', 'Scheduled'),
    (2, 5, '2025-12-03 08:00:00', '2025-12-03 11:30:00', 'Scheduled');
GO

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

PRINT '========================================';
PRINT 'Database Initialization Complete!';
PRINT '========================================';
PRINT '';
PRINT 'Database Summary:';
SELECT 'Admins' AS TableName, COUNT(*) AS RecordCount FROM Admins
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
PRINT 'Default Login Credentials:';
PRINT '========================================';
PRINT 'Admin:  admin@busmanagement.com / admin';
PRINT 'Driver: jc.mugabo@busmanagement.com / driver123';
PRINT 'Client: alice.mukamana@email.com / client123';
PRINT '========================================';
GO


