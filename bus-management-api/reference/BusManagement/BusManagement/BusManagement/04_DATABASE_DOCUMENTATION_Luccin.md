# Database Documentation
**Developer: Luccin**

---

## Table of Contents
1. [Overview](#overview)
2. [Database Architecture](#database-architecture)
3. [Table Schemas](#table-schemas)
4. [Relationships & Constraints](#relationships--constraints)
5. [Indexes & Performance](#indexes--performance)
6. [Stored Procedures](#stored-procedures)
7. [Views](#views)
8. [Security](#security)
9. [Backup & Recovery](#backup--recovery)
10. [Migration Scripts](#migration-scripts)

---

## Overview

The Bus Management System uses **Microsoft SQL Server** as its primary database. The database is designed to support a multi-role bus management platform with separate modules for Admins, Clients, and Drivers.

### Database Information
- **Database Name**: `BusManagementDB`
- **SQL Server Version**: SQL Server Express (or higher)
- **Connection Method**: Integrated Security (Windows Authentication)
- **Collation**: SQL_Latin1_General_CP1_CI_AS
- **Character Encoding**: UTF-8 support via NVARCHAR

### Connection String
```
Data Source=DESKTOP-6F3M6TN\SQLEXPRESS;
Initial Catalog=BusManagementDB;
Integrated Security=True;
TrustServerCertificate=True
```

**Connection String Breakdown**:
- `Data Source`: SQL Server instance name
- `Initial Catalog`: Database name
- `Integrated Security`: Use Windows authentication
- `TrustServerCertificate`: Accept self-signed certificates (development only)

---

## Database Architecture

### Entity-Relationship Diagram

```
┌────────────┐         ┌──────────────┐         ┌────────────┐
│   Admins   │         │   Clients    │         │  Drivers   │
└─────┬──────┘         └──────┬───────┘         └─────┬──────┘
      │                       │                       │
      │                       │                       │
      └───────────────────────┴───────────────────────┘
                              │
                              │ (Authentication)
                              │
                ┌─────────────┴─────────────┐
                │                           │
        ┌───────▼────────┐         ┌───────▼───────────┐
        │     Buses      │◄────────┤ DriverAssignments │
        └───────┬────────┘         └───────────────────┘
                │
                │
        ┌───────▼────────┐
        │   Schedule     │◄───────────┐
        └───────┬────────┘            │
                │                     │
                │                ┌────▼────┐
        ┌───────▼────────┐       │ Routes  │
        │    Tickets     │       └─────────┘
        └────────────────┘
                │
                └──────► (Links to Clients)
```

### Database Statistics

| Component | Count | Purpose |
|-----------|-------|---------|
| Tables | 7 | Core data storage |
| Views | 3+ | Simplified data access |
| Stored Procedures | 5+ | Business logic |
| Indexes | 15+ | Performance optimization |
| Foreign Keys | 6 | Referential integrity |

---

## Table Schemas

### 1. Admins Table

**Purpose**: Store administrator user accounts.

```sql
CREATE TABLE Admins (
    AdminId INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(100) NOT NULL,
    Email NVARCHAR(100) UNIQUE NOT NULL,
    Password NVARCHAR(255) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    LastLogin DATETIME NULL,
    IsActive BIT DEFAULT 1
);
```

**Field Descriptions**:
| Field | Type | Description |
|-------|------|-------------|
| `AdminId` | INT | Primary key, auto-increment |
| `Name` | NVARCHAR(100) | Full name of admin |
| `Email` | NVARCHAR(100) | Unique email for login |
| `Password` | NVARCHAR(255) | SHA256 hashed password |
| `CreatedAt` | DATETIME | Account creation timestamp |
| `LastLogin` | DATETIME | Last successful login |
| `IsActive` | BIT | Account status (1=Active, 0=Disabled) |

**Sample Data**:
```sql
INSERT INTO Admins (Name, Email, Password)
VALUES ('System Admin', 'admin@busmanagement.com', 
        '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918'); -- SHA256('admin')
```

**Business Rules**:
- Email must be unique
- Password must be hashed before storage (SHA256)
- Admins cannot be deleted, only deactivated (`IsActive = 0`)

---

### 2. Clients Table

**Purpose**: Store passenger/customer accounts.

```sql
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
```

**Field Descriptions**:
| Field | Type | Description |
|-------|------|-------------|
| `ClientId` | INT | Primary key, auto-increment |
| `Name` | NVARCHAR(100) | Client's full name |
| `Email` | NVARCHAR(100) | Unique email for login |
| `Password` | NVARCHAR(255) | SHA256 hashed password |
| `Phone` | NVARCHAR(20) | Contact phone number |
| `CreatedAt` | DATETIME | Registration date |
| `LastLogin` | DATETIME | Last login timestamp |
| `IsActive` | BIT | Account status |
| `TotalTicketsPurchased` | INT | Cached count for analytics |

**Indexes**:
```sql
CREATE INDEX IX_Clients_Email ON Clients(Email);
CREATE INDEX IX_Clients_Phone ON Clients(Phone);
```

---

### 3. Drivers Table

**Purpose**: Store bus driver accounts with license information.

```sql
CREATE TABLE Drivers (
    DriverId INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(100) NOT NULL,
    LicenceNumber NVARCHAR(50) UNIQUE NOT NULL,
    LicencePhoto NVARCHAR(500),  -- File path to uploaded photo
    Email NVARCHAR(100) UNIQUE NOT NULL,
    Password NVARCHAR(255) NOT NULL,
    Phone NVARCHAR(20),
    CreatedAt DATETIME DEFAULT GETDATE(),
    LastLogin DATETIME NULL,
    IsActive BIT DEFAULT 1,
    IsAvailable BIT DEFAULT 1  -- Current availability for assignments
);
```

**Field Descriptions**:
| Field | Type | Description |
|-------|------|-------------|
| `DriverId` | INT | Primary key, auto-increment |
| `Name` | NVARCHAR(100) | Driver's full name |
| `LicenceNumber` | NVARCHAR(50) | Unique driver's license number |
| `LicencePhoto` | NVARCHAR(500) | Relative path to license photo file |
| `Email` | NVARCHAR(100) | Unique email for login |
| `Password` | NVARCHAR(255) | SHA256 hashed password |
| `Phone` | NVARCHAR(20) | Contact phone number |
| `CreatedAt` | DATETIME | Registration date |
| `LastLogin` | DATETIME | Last login timestamp |
| `IsActive` | BIT | Account status |
| `IsAvailable` | BIT | Available for new assignments |

**File Storage**:
- License photos stored in: `/wwwroot/uploads/licences/`
- File naming: `{OriginalName}_{GUID}.{Extension}`
- Supported formats: PNG, JPG, JPEG

**Constraints**:
```sql
ALTER TABLE Drivers
ADD CONSTRAINT CHK_LicenceNumber_Format 
CHECK (LicenceNumber LIKE '[A-Z][A-Z][0-9][0-9][0-9][0-9][0-9][0-9]');
```

---

### 4. Buses Table

**Purpose**: Store bus fleet information.

```sql
CREATE TABLE Buses (
    BusId INT PRIMARY KEY IDENTITY(1,1),
    BusNumber NVARCHAR(50) UNIQUE NOT NULL,
    Capacity INT NOT NULL,
    Model NVARCHAR(100),
    Status NVARCHAR(50) DEFAULT 'Active',
    PurchaseDate DATE,
    LastMaintenanceDate DATE,
    NextMaintenanceDate DATE,
    CreatedAt DATETIME DEFAULT GETDATE()
);
```

**Field Descriptions**:
| Field | Type | Description |
|-------|------|-------------|
| `BusId` | INT | Primary key, auto-increment |
| `BusNumber` | NVARCHAR(50) | Unique bus identifier/plate number |
| `Capacity` | INT | Number of seats |
| `Model` | NVARCHAR(100) | Bus make and model |
| `Status` | NVARCHAR(50) | Active, Inactive, Maintenance |
| `PurchaseDate` | DATE | Date bus was acquired |
| `LastMaintenanceDate` | DATE | Last maintenance date |
| `NextMaintenanceDate` | DATE | Scheduled next maintenance |
| `CreatedAt` | DATETIME | Record creation timestamp |

**Status Values**:
- `Active`: Operational and available for scheduling
- `Inactive`: Temporarily out of service
- `Maintenance`: Under maintenance, cannot be scheduled

**Constraints**:
```sql
ALTER TABLE Buses
ADD CONSTRAINT CHK_Capacity CHECK (Capacity > 0 AND Capacity <= 100);

ALTER TABLE Buses
ADD CONSTRAINT CHK_Status CHECK (Status IN ('Active', 'Inactive', 'Maintenance'));
```

---

### 5. Routes Table

**Purpose**: Define bus routes with pricing.

```sql
CREATE TABLE Routes (
    RouteId INT PRIMARY KEY IDENTITY(1,1),
    Origin NVARCHAR(100) NOT NULL,
    Destination NVARCHAR(100) NOT NULL,
    Distance DECIMAL(10, 2),  -- in kilometers
    Price DECIMAL(10, 2) NOT NULL,  -- in Rwandan Francs
    EstimatedDuration INT,  -- in minutes
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT CHK_Origin_Destination CHECK (Origin <> Destination)
);
```

**Field Descriptions**:
| Field | Type | Description |
|-------|------|-------------|
| `RouteId` | INT | Primary key, auto-increment |
| `Origin` | NVARCHAR(100) | Starting location |
| `Destination` | NVARCHAR(100) | Ending location |
| `Distance` | DECIMAL(10,2) | Route distance in KM |
| `Price` | DECIMAL(10,2) | Ticket price in Frw |
| `EstimatedDuration` | INT | Typical journey time in minutes |
| `IsActive` | BIT | Route availability status |
| `CreatedAt` | DATETIME | Record creation timestamp |

**Business Rules**:
- Origin and Destination must be different
- Price must be positive
- Distance must be positive

**Constraints**:
```sql
ALTER TABLE Routes
ADD CONSTRAINT CHK_Price CHECK (Price > 0);

ALTER TABLE Routes
ADD CONSTRAINT CHK_Distance CHECK (Distance > 0);
```

**Sample Data**:
```sql
INSERT INTO Routes (Origin, Destination, Distance, Price, EstimatedDuration)
VALUES 
('Kigali', 'Musanze', 90.5, 2500.00, 120),
('Kigali', 'Huye', 135.2, 3500.00, 150),
('Musanze', 'Gisenyi', 62.3, 2000.00, 90);
```

---

### 6. Schedule Table

**Purpose**: Link buses to routes with specific departure/arrival times.

```sql
CREATE TABLE Schedule (
    ScheduleId INT PRIMARY KEY IDENTITY(1,1),
    BusId INT NOT NULL FOREIGN KEY REFERENCES Buses(BusId) ON DELETE CASCADE,
    RouteId INT NOT NULL FOREIGN KEY REFERENCES Routes(RouteId) ON DELETE CASCADE,
    DepartureTime DATETIME NOT NULL,
    ArrivalTime DATETIME NOT NULL,
    Status NVARCHAR(50) DEFAULT 'Scheduled',
    CreatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT CHK_Times CHECK (ArrivalTime > DepartureTime)
);
```

**Field Descriptions**:
| Field | Type | Description |
|-------|------|-------------|
| `ScheduleId` | INT | Primary key, auto-increment |
| `BusId` | INT | Foreign key to Buses table |
| `RouteId` | INT | Foreign key to Routes table |
| `DepartureTime` | DATETIME | Journey start date/time |
| `ArrivalTime` | DATETIME | Expected arrival date/time |
| `Status` | NVARCHAR(50) | Scheduled, InProgress, Completed, Cancelled |
| `CreatedAt` | DATETIME | Record creation timestamp |

**Status Values**:
- `Scheduled`: Future journey, not started
- `InProgress`: Bus currently on route
- `Completed`: Journey finished
- `Cancelled`: Journey cancelled

**Constraints**:
```sql
ALTER TABLE Schedule
ADD CONSTRAINT CHK_Schedule_Status 
CHECK (Status IN ('Scheduled', 'InProgress', 'Completed', 'Cancelled'));
```

**Indexes for Performance**:
```sql
CREATE INDEX IX_Schedule_BusId ON Schedule(BusId);
CREATE INDEX IX_Schedule_RouteId ON Schedule(RouteId);
CREATE INDEX IX_Schedule_DepartureTime ON Schedule(DepartureTime);
CREATE INDEX IX_Schedule_Status ON Schedule(Status);
```

---

### 7. Tickets Table

**Purpose**: Store ticket purchases by clients.

```sql
CREATE TABLE Tickets (
    TicketId INT PRIMARY KEY IDENTITY(1,1),
    ClientId INT NOT NULL FOREIGN KEY REFERENCES Clients(ClientId) ON DELETE CASCADE,
    ScheduleId INT NOT NULL FOREIGN KEY REFERENCES Schedule(ScheduleId) ON DELETE CASCADE,
    DateIssued DATETIME DEFAULT GETDATE(),
    SeatNumber NVARCHAR(10),
    TicketStatus NVARCHAR(50) DEFAULT 'Active',
    PaymentStatus NVARCHAR(50) DEFAULT 'Paid',
    PaymentMethod NVARCHAR(50),
    CONSTRAINT FK_Tickets_Clients FOREIGN KEY (ClientId) REFERENCES Clients(ClientId),
    CONSTRAINT FK_Tickets_Schedule FOREIGN KEY (ScheduleId) REFERENCES Schedule(ScheduleId)
);
```

**Field Descriptions**:
| Field | Type | Description |
|-------|------|-------------|
| `TicketId` | INT | Primary key, auto-increment |
| `ClientId` | INT | Foreign key to Clients table |
| `ScheduleId` | INT | Foreign key to Schedule table |
| `DateIssued` | DATETIME | Purchase timestamp |
| `SeatNumber` | NVARCHAR(10) | Assigned seat (future enhancement) |
| `TicketStatus` | NVARCHAR(50) | Active, Used, Cancelled, Refunded |
| `PaymentStatus` | NVARCHAR(50) | Paid, Pending, Failed, Refunded |
| `PaymentMethod` | NVARCHAR(50) | Cash, Card, MobileMoney |

**Indexes**:
```sql
CREATE INDEX IX_Tickets_ClientId ON Tickets(ClientId);
CREATE INDEX IX_Tickets_ScheduleId ON Tickets(ScheduleId);
CREATE INDEX IX_Tickets_DateIssued ON Tickets(DateIssued);
```

---

### 8. DriverAssignments Table

**Purpose**: Link drivers to buses for operational management.

```sql
CREATE TABLE DriverAssignments (
    AssignmentId INT PRIMARY KEY IDENTITY(1,1),
    DriverId INT NOT NULL FOREIGN KEY REFERENCES Drivers(DriverId) ON DELETE CASCADE,
    BusId INT NOT NULL FOREIGN KEY REFERENCES Buses(BusId) ON DELETE CASCADE,
    AssignmentDate DATETIME DEFAULT GETDATE(),
    StartDate DATE NOT NULL,
    EndDate DATE,  -- NULL means ongoing assignment
    Status NVARCHAR(50) DEFAULT 'Active',
    Notes NVARCHAR(500),
    CONSTRAINT FK_DriverAssignments_Drivers FOREIGN KEY (DriverId) REFERENCES Drivers(DriverId),
    CONSTRAINT FK_DriverAssignments_Buses FOREIGN KEY (BusId) REFERENCES Buses(BusId)
);
```

**Field Descriptions**:
| Field | Type | Description |
|-------|------|-------------|
| `AssignmentId` | INT | Primary key, auto-increment |
| `DriverId` | INT | Foreign key to Drivers table |
| `BusId` | INT | Foreign key to Buses table |
| `AssignmentDate` | DATETIME | When assignment was made |
| `StartDate` | DATE | Assignment effective start date |
| `EndDate` | DATE | Assignment end date (NULL = ongoing) |
| `Status` | NVARCHAR(50) | Active, Inactive, Temporary |
| `Notes` | NVARCHAR(500) | Additional assignment notes |

**Business Rules**:
- One driver can be assigned to multiple buses
- One bus can have multiple drivers (shift-based)
- Active assignments: `Status = 'Active' AND (EndDate IS NULL OR EndDate >= GETDATE())`

---

## Relationships & Constraints

### Foreign Key Relationships

```sql
-- Tickets → Clients
ALTER TABLE Tickets
ADD CONSTRAINT FK_Tickets_Clients 
FOREIGN KEY (ClientId) REFERENCES Clients(ClientId) ON DELETE CASCADE;

-- Tickets → Schedule
ALTER TABLE Tickets
ADD CONSTRAINT FK_Tickets_Schedule 
FOREIGN KEY (ScheduleId) REFERENCES Schedule(ScheduleId) ON DELETE CASCADE;

-- Schedule → Buses
ALTER TABLE Schedule
ADD CONSTRAINT FK_Schedule_Buses 
FOREIGN KEY (BusId) REFERENCES Buses(BusId) ON DELETE CASCADE;

-- Schedule → Routes
ALTER TABLE Schedule
ADD CONSTRAINT FK_Schedule_Routes 
FOREIGN KEY (RouteId) REFERENCES Routes(RouteId) ON DELETE CASCADE;

-- DriverAssignments → Drivers
ALTER TABLE DriverAssignments
ADD CONSTRAINT FK_DriverAssignments_Drivers 
FOREIGN KEY (DriverId) REFERENCES Drivers(DriverId) ON DELETE CASCADE;

-- DriverAssignments → Buses
ALTER TABLE DriverAssignments
ADD CONSTRAINT FK_DriverAssignments_Buses 
FOREIGN KEY (BusId) REFERENCES Buses(BusId) ON DELETE CASCADE;
```

### Cascade Behavior

**ON DELETE CASCADE**: When parent record is deleted, child records are automatically deleted.

| Parent Table | Child Table | Cascade Effect |
|--------------|-------------|----------------|
| Clients | Tickets | Delete client → Delete all their tickets |
| Schedule | Tickets | Delete schedule → Delete all tickets for that schedule |
| Buses | Schedule | Delete bus → Delete all its schedules |
| Routes | Schedule | Delete route → Delete all schedules using that route |
| Drivers | DriverAssignments | Delete driver → Delete all their assignments |
| Buses | DriverAssignments | Delete bus → Delete all driver assignments |

**⚠️ Warning**: Use soft deletes (IsActive flag) instead of hard deletes for historical data preservation.

---

## Indexes & Performance

### Primary Indexes (Automatic)

All `PRIMARY KEY` constraints automatically create clustered indexes:
- `Admins(AdminId)`
- `Clients(ClientId)`
- `Drivers(DriverId)`
- `Buses(BusId)`
- `Routes(RouteId)`
- `Schedule(ScheduleId)`
- `Tickets(TicketId)`
- `DriverAssignments(AssignmentId)`

### Custom Indexes

#### Unique Indexes
```sql
CREATE UNIQUE INDEX IX_Admins_Email ON Admins(Email);
CREATE UNIQUE INDEX IX_Clients_Email ON Clients(Email);
CREATE UNIQUE INDEX IX_Drivers_Email ON Drivers(Email);
CREATE UNIQUE INDEX IX_Drivers_LicenceNumber ON Drivers(LicenceNumber);
CREATE UNIQUE INDEX IX_Buses_BusNumber ON Buses(BusNumber);
```

#### Non-Clustered Indexes
```sql
-- For login queries
CREATE INDEX IX_Clients_Email_Password ON Clients(Email, Password);
CREATE INDEX IX_Drivers_Email_Password ON Drivers(Email, Password);
CREATE INDEX IX_Admins_Email_Password ON Admins(Email, Password);

-- For schedule queries
CREATE INDEX IX_Schedule_DepartureTime_Status ON Schedule(DepartureTime, Status);
CREATE INDEX IX_Schedule_BusId_DepartureTime ON Schedule(BusId, DepartureTime);

-- For ticket queries
CREATE INDEX IX_Tickets_ClientId_DateIssued ON Tickets(ClientId, DateIssued DESC);

-- For driver assignment queries
CREATE INDEX IX_DriverAssignments_DriverId_Status ON DriverAssignments(DriverId, Status);
CREATE INDEX IX_DriverAssignments_BusId_Status ON DriverAssignments(BusId, Status);
```

### Performance Tips

1. **Use Indexes Wisely**: Too many indexes slow down INSERT/UPDATE operations
2. **Query Optimization**: Use `EXPLAIN` or `SET STATISTICS IO ON` to analyze queries
3. **Avoid SELECT \***: Specify only needed columns
4. **Use Parameterized Queries**: Prevents SQL injection and improves query plan caching

---

## Stored Procedures

### 1. SP_GetClientTickets

**Purpose**: Retrieve all tickets for a specific client with full details.

```sql
CREATE PROCEDURE SP_GetClientTickets
    @ClientId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        t.TicketId,
        t.DateIssued,
        t.TicketStatus,
        b.BusNumber,
        b.Model AS BusModel,
        r.Origin,
        r.Destination,
        r.Price,
        s.DepartureTime,
        s.ArrivalTime,
        DATEDIFF(MINUTE, s.DepartureTime, s.ArrivalTime) AS DurationMinutes
    FROM Tickets t
    JOIN Schedule s ON t.ScheduleId = s.ScheduleId
    JOIN Buses b ON s.BusId = b.BusId
    JOIN Routes r ON s.RouteId = r.RouteId
    WHERE t.ClientId = @ClientId
    ORDER BY t.DateIssued DESC;
END;
GO

-- Usage
EXEC SP_GetClientTickets @ClientId = 1;
```

---

### 2. SP_GetDriverSchedules

**Purpose**: Get all schedules for a driver's assigned buses.

```sql
CREATE PROCEDURE SP_GetDriverSchedules
    @DriverId INT,
    @StartDate DATETIME = NULL,
    @EndDate DATETIME = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Default to current date if no dates provided
    IF @StartDate IS NULL SET @StartDate = GETDATE();
    IF @EndDate IS NULL SET @EndDate = DATEADD(DAY, 30, GETDATE());

    SELECT 
        s.ScheduleId,
        b.BusNumber,
        b.Model,
        r.Origin,
        r.Destination,
        r.Distance,
        s.DepartureTime,
        s.ArrivalTime,
        s.Status,
        COUNT(t.TicketId) AS TicketsSold,
        b.Capacity - COUNT(t.TicketId) AS AvailableSeats
    FROM Schedule s
    JOIN Buses b ON s.BusId = b.BusId
    JOIN Routes r ON s.RouteId = r.RouteId
    JOIN DriverAssignments da ON b.BusId = da.BusId
    LEFT JOIN Tickets t ON s.ScheduleId = t.ScheduleId
    WHERE da.DriverId = @DriverId
      AND da.Status = 'Active'
      AND s.DepartureTime BETWEEN @StartDate AND @EndDate
    GROUP BY s.ScheduleId, b.BusNumber, b.Model, r.Origin, r.Destination,
             r.Distance, s.DepartureTime, s.ArrivalTime, s.Status, b.Capacity
    ORDER BY s.DepartureTime;
END;
GO

-- Usage
EXEC SP_GetDriverSchedules @DriverId = 1, 
                           @StartDate = '2025-12-01', 
                           @EndDate = '2025-12-31';
```

---

### 3. SP_PurchaseTicket

**Purpose**: Transactional ticket purchase with validation.

```sql
CREATE PROCEDURE SP_PurchaseTicket
    @ClientId INT,
    @ScheduleId INT,
    @TicketId INT OUTPUT,
    @ErrorMessage NVARCHAR(500) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;

    BEGIN TRY
        -- Check if schedule exists and is valid
        IF NOT EXISTS (SELECT 1 FROM Schedule WHERE ScheduleId = @ScheduleId AND Status = 'Scheduled')
        BEGIN
            SET @ErrorMessage = 'Invalid or unavailable schedule';
            ROLLBACK TRANSACTION;
            RETURN 1;
        END

        -- Check if bus has available seats
        DECLARE @Capacity INT, @TicketsSold INT;
        
        SELECT @Capacity = b.Capacity
        FROM Schedule s
        JOIN Buses b ON s.BusId = b.BusId
        WHERE s.ScheduleId = @ScheduleId;

        SELECT @TicketsSold = COUNT(*)
        FROM Tickets
        WHERE ScheduleId = @ScheduleId AND TicketStatus = 'Active';

        IF @TicketsSold >= @Capacity
        BEGIN
            SET @ErrorMessage = 'No available seats on this bus';
            ROLLBACK TRANSACTION;
            RETURN 2;
        END

        -- Insert ticket
        INSERT INTO Tickets (ClientId, ScheduleId, DateIssued)
        VALUES (@ClientId, @ScheduleId, GETDATE());

        SET @TicketId = SCOPE_IDENTITY();

        -- Update client's ticket count
        UPDATE Clients
        SET TotalTicketsPurchased = TotalTicketsPurchased + 1
        WHERE ClientId = @ClientId;

        SET @ErrorMessage = NULL;
        COMMIT TRANSACTION;
        RETURN 0;

    END TRY
    BEGIN CATCH
        SET @ErrorMessage = ERROR_MESSAGE();
        ROLLBACK TRANSACTION;
        RETURN -1;
    END CATCH
END;
GO

-- Usage
DECLARE @NewTicketId INT, @Error NVARCHAR(500);
EXEC SP_PurchaseTicket 
    @ClientId = 1, 
    @ScheduleId = 5, 
    @TicketId = @NewTicketId OUTPUT, 
    @ErrorMessage = @Error OUTPUT;

IF @Error IS NULL
    PRINT 'Ticket purchased successfully: ' + CAST(@NewTicketId AS NVARCHAR);
ELSE
    PRINT 'Error: ' + @Error;
```

---

### 4. SP_GetAvailableSchedules

**Purpose**: Get schedules with available seats for ticket purchase.

```sql
CREATE PROCEDURE SP_GetAvailableSchedules
    @Origin NVARCHAR(100) = NULL,
    @Destination NVARCHAR(100) = NULL,
    @StartDate DATETIME = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @StartDate IS NULL SET @StartDate = GETDATE();

    SELECT 
        s.ScheduleId,
        b.BusId,
        b.BusNumber,
        b.Model,
        r.RouteId,
        r.Origin,
        r.Destination,
        r.Price,
        r.Distance,
        s.DepartureTime,
        s.ArrivalTime,
        b.Capacity,
        ISNULL(COUNT(t.TicketId), 0) AS TicketsSold,
        b.Capacity - ISNULL(COUNT(t.TicketId), 0) AS AvailableSeats
    FROM Schedule s
    JOIN Buses b ON s.BusId = b.BusId
    JOIN Routes r ON s.RouteId = r.RouteId
    LEFT JOIN Tickets t ON s.ScheduleId = t.ScheduleId AND t.TicketStatus = 'Active'
    WHERE s.Status = 'Scheduled'
      AND s.DepartureTime >= @StartDate
      AND b.Status = 'Active'
      AND (@Origin IS NULL OR r.Origin = @Origin)
      AND (@Destination IS NULL OR r.Destination = @Destination)
    GROUP BY s.ScheduleId, b.BusId, b.BusNumber, b.Model, r.RouteId, 
             r.Origin, r.Destination, r.Price, r.Distance, 
             s.DepartureTime, s.ArrivalTime, b.Capacity
    HAVING b.Capacity - ISNULL(COUNT(t.TicketId), 0) > 0
    ORDER BY s.DepartureTime;
END;
GO

-- Usage
EXEC SP_GetAvailableSchedules @Origin = 'Kigali', @Destination = 'Musanze';
```

---

### 5. SP_GetDashboardStatistics

**Purpose**: Get statistics for admin dashboard.

```sql
CREATE PROCEDURE SP_GetDashboardStatistics
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        (SELECT COUNT(*) FROM Buses WHERE Status = 'Active') AS ActiveBuses,
        (SELECT COUNT(*) FROM Routes WHERE IsActive = 1) AS ActiveRoutes,
        (SELECT COUNT(*) FROM Drivers WHERE IsActive = 1) AS ActiveDrivers,
        (SELECT COUNT(*) FROM Clients WHERE IsActive = 1) AS TotalClients,
        (SELECT COUNT(*) FROM Schedule WHERE Status = 'Scheduled') AS UpcomingSchedules,
        (SELECT COUNT(*) FROM Tickets WHERE DateIssued >= CAST(GETDATE() AS DATE)) AS TodaysTickets,
        (SELECT SUM(r.Price) 
         FROM Tickets t 
         JOIN Schedule s ON t.ScheduleId = s.ScheduleId 
         JOIN Routes r ON s.RouteId = r.RouteId 
         WHERE t.DateIssued >= CAST(GETDATE() AS DATE)) AS TodaysRevenue,
        (SELECT COUNT(*) FROM DriverAssignments WHERE Status = 'Active') AS ActiveAssignments;
END;
GO

-- Usage
EXEC SP_GetDashboardStatistics;
```

---

## Views

### 1. VW_TicketDetails

**Purpose**: Simplified view for ticket information.

```sql
CREATE VIEW VW_TicketDetails AS
SELECT 
    t.TicketId,
    c.Name AS ClientName,
    c.Email AS ClientEmail,
    b.BusNumber,
    r.Origin,
    r.Destination,
    r.Price,
    s.DepartureTime,
    s.ArrivalTime,
    t.DateIssued,
    t.TicketStatus
FROM Tickets t
JOIN Clients c ON t.ClientId = c.ClientId
JOIN Schedule s ON t.ScheduleId = s.ScheduleId
JOIN Buses b ON s.BusId = b.BusId
JOIN Routes r ON s.RouteId = r.RouteId;
GO

-- Usage
SELECT * FROM VW_TicketDetails WHERE ClientEmail = 'client@example.com';
```

---

### 2. VW_ScheduleOverview

**Purpose**: Complete schedule information with ticket counts.

```sql
CREATE VIEW VW_ScheduleOverview AS
SELECT 
    s.ScheduleId,
    b.BusNumber,
    b.Capacity,
    r.Origin,
    r.Destination,
    r.Price,
    s.DepartureTime,
    s.ArrivalTime,
    s.Status,
    COUNT(t.TicketId) AS TicketsSold,
    b.Capacity - COUNT(t.TicketId) AS AvailableSeats
FROM Schedule s
JOIN Buses b ON s.BusId = b.BusId
JOIN Routes r ON s.RouteId = r.RouteId
LEFT JOIN Tickets t ON s.ScheduleId = t.ScheduleId
GROUP BY s.ScheduleId, b.BusNumber, b.Capacity, r.Origin, r.Destination,
         r.Price, s.DepartureTime, s.ArrivalTime, s.Status;
GO

-- Usage
SELECT * FROM VW_ScheduleOverview WHERE AvailableSeats > 0;
```

---

### 3. VW_DriverAssignmentDetails

**Purpose**: Driver assignment information with bus details.

```sql
CREATE VIEW VW_DriverAssignmentDetails AS
SELECT 
    da.AssignmentId,
    d.Name AS DriverName,
    d.Email AS DriverEmail,
    d.LicenceNumber,
    b.BusNumber,
    b.Model AS BusModel,
    da.AssignmentDate,
    da.StartDate,
    da.EndDate,
    da.Status
FROM DriverAssignments da
JOIN Drivers d ON da.DriverId = d.DriverId
JOIN Buses b ON da.BusId = b.BusId;
GO

-- Usage
SELECT * FROM VW_DriverAssignmentDetails WHERE Status = 'Active';
```

---

## Security

### SQL Injection Prevention

**✅ Correct (Parameterized Queries)**:
```csharp
string query = "SELECT * FROM Clients WHERE Email = @Email AND Password = @Password";
command.Parameters.AddWithValue("@Email", email);
command.Parameters.AddWithValue("@Password", hashedPassword);
```

**❌ Incorrect (String Concatenation)**:
```csharp
// NEVER DO THIS!
string query = $"SELECT * FROM Clients WHERE Email = '{email}' AND Password = '{password}'";
```

### Password Security

**Hashing Algorithm**: SHA256

```csharp
using System.Security.Cryptography;
using System.Text;

private string EncryptPassword(string password)
{
    using (SHA256 sha256 = SHA256.Create())
    {
        byte[] bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
        StringBuilder builder = new StringBuilder();
        foreach (var b in bytes)
        {
            builder.Append(b.ToString("x2"));
        }
        return builder.ToString();
    }
}
```

**Never store plain-text passwords!**

### Database User Permissions

```sql
-- Create application user
CREATE LOGIN BusManagementApp WITH PASSWORD = 'SecurePassword123!';
CREATE USER BusManagementApp FOR LOGIN BusManagementApp;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON Buses TO BusManagementApp;
GRANT SELECT, INSERT, UPDATE, DELETE ON Routes TO BusManagementApp;
GRANT SELECT, INSERT, UPDATE, DELETE ON Schedule TO BusManagementApp;
GRANT SELECT, INSERT, UPDATE, DELETE ON Tickets TO BusManagementApp;
GRANT SELECT, INSERT, UPDATE ON Clients TO BusManagementApp;
GRANT SELECT, INSERT, UPDATE ON Drivers TO BusManagementApp;
GRANT SELECT ON Admins TO BusManagementApp;

-- Grant stored procedure execution
GRANT EXECUTE ON SP_GetClientTickets TO BusManagementApp;
GRANT EXECUTE ON SP_GetDriverSchedules TO BusManagementApp;
GRANT EXECUTE ON SP_PurchaseTicket TO BusManagementApp;
```

---

## Backup & Recovery

### Backup Strategy

#### Full Backup (Weekly)
```sql
BACKUP DATABASE BusManagementDB
TO DISK = 'C:\Backups\BusManagementDB_Full_20251201.bak'
WITH FORMAT, MEDIANAME = 'BusManagementDB_Backup',
     NAME = 'Full Backup of BusManagementDB';
```

#### Differential Backup (Daily)
```sql
BACKUP DATABASE BusManagementDB
TO DISK = 'C:\Backups\BusManagementDB_Diff_20251201.bak'
WITH DIFFERENTIAL, MEDIANAME = 'BusManagementDB_Backup',
     NAME = 'Differential Backup of BusManagementDB';
```

#### Transaction Log Backup (Hourly)
```sql
BACKUP LOG BusManagementDB
TO DISK = 'C:\Backups\BusManagementDB_Log_20251201_14.trn';
```

### Recovery

#### Full Restore
```sql
RESTORE DATABASE BusManagementDB
FROM DISK = 'C:\Backups\BusManagementDB_Full_20251201.bak'
WITH REPLACE, RECOVERY;
```

#### Point-in-Time Recovery
```sql
-- Restore full backup
RESTORE DATABASE BusManagementDB
FROM DISK = 'C:\Backups\BusManagementDB_Full_20251201.bak'
WITH NORECOVERY, REPLACE;

-- Restore differential backup
RESTORE DATABASE BusManagementDB
FROM DISK = 'C:\Backups\BusManagementDB_Diff_20251201.bak'
WITH NORECOVERY;

-- Restore log backups
RESTORE LOG BusManagementDB
FROM DISK = 'C:\Backups\BusManagementDB_Log_20251201_14.trn'
WITH RECOVERY, STOPAT = '2025-12-01 14:30:00';
```

---

## Migration Scripts

### Initial Database Setup

```sql
-- Create database
CREATE DATABASE BusManagementDB;
GO

USE BusManagementDB;
GO

-- Create tables (in order of dependencies)
-- 1. User tables (no dependencies)
CREATE TABLE Admins (...);
CREATE TABLE Clients (...);
CREATE TABLE Drivers (...);

-- 2. Buses and Routes (no dependencies)
CREATE TABLE Buses (...);
CREATE TABLE Routes (...);

-- 3. Schedule (depends on Buses, Routes)
CREATE TABLE Schedule (...);

-- 4. Tickets (depends on Clients, Schedule)
CREATE TABLE Tickets (...);

-- 5. DriverAssignments (depends on Drivers, Buses)
CREATE TABLE DriverAssignments (...);

-- Create indexes
CREATE INDEX IX_Clients_Email ON Clients(Email);
-- ... (all other indexes)

-- Create stored procedures
CREATE PROCEDURE SP_GetClientTickets ...
-- ... (all other stored procedures)

-- Create views
CREATE VIEW VW_TicketDetails AS ...
-- ... (all other views)

-- Insert seed data
INSERT INTO Admins (Name, Email, Password) VALUES (...);
INSERT INTO Routes (Origin, Destination, Distance, Price) VALUES (...);
```

---

## Contact & Support

**Developer**: Luccin  
**Module**: Database Design & Management  
**Last Updated**: December 2025

For questions or issues, refer to this documentation or contact the project lead.


