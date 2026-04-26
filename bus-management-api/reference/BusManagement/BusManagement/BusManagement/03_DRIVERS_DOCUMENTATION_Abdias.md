# Drivers Module Documentation
**Developer: Abdias**

---

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Pages & Features](#pages--features)
4. [Database Operations](#database-operations)
5. [Authentication & Security](#authentication--security)
6. [Implementation Guide](#implementation-guide)
7. [API Reference](#api-reference)

---

## Overview

The Drivers module provides a dedicated portal for bus drivers to view their assignments, routes, and schedules. This module enables drivers to access all information necessary for their daily operations, including route details, bus assignments, and journey schedules.

### Key Responsibilities
- **Driver Dashboard**: Personalized dashboard showing driver information
- **Route Viewing**: Display all bus routes with origin, destination, and distance
- **Schedule Management**: View assigned schedules with departure/arrival times
- **Bus Assignment Viewing**: See which buses are assigned to the driver
- **Profile Management**: Access driver profile information (name, license, contact)

### Technology Stack
- **Framework**: ASP.NET Core 8.0 Razor Pages
- **Authentication**: Cookie-based authentication with Driver role
- **Database**: SQL Server with ADO.NET (Microsoft.Data.SqlClient)
- **UI**: Bootstrap 5, Font Awesome, Custom CSS
- **Security**: Role-based authorization, claims-based identity

---

## Architecture

### Folder Structure
```
Pages/Drivers/
├── Index.cshtml                    # Driver Dashboard
├── Index.cshtml.cs                 # Dashboard logic with driver claims
├── Routes.cshtml                   # View all available routes
├── Routes.cshtml.cs                # Route display logic
├── Schedule.cshtml                 # View driver's assigned schedules
└── Schedule.cshtml.cs              # Schedule retrieval logic
```

### Data Flow
```
Driver Login → Authentication → Claims Creation → Driver Dashboard
                                                   ↓
                                      ┌────────────┴────────────┐
                                      ↓                         ↓
                                  View Routes              View Schedules
                                      ↓                         ↓
                              All System Routes        Driver's Assigned Schedules
```

---

## Pages & Features

### 1. Driver Dashboard (`Index.cshtml`)

**Purpose**: Landing page for authenticated drivers showing their profile information and quick navigation to key features.

**Code Implementation**:

```csharp
namespace BusManagement.Pages.Drivers
{
    [Authorize(Roles = "Driver")]
    public class IndexModel : PageModel
    {
        public string? Email { get; set; }
        public string? Role { get; set; }
        public string? UserId { get; set; }

        public void OnGet()
        {
            // Extract driver information from authentication claims
            Email = User.Identity?.Name;
            Role = User.FindFirst(ClaimTypes.Role)?.Value;
            UserId = User.FindFirst("UserId")?.Value;  // DriverId from database
        }
    }
}
```

**Claims Breakdown**:

| Claim Type | Value | Description |
|------------|-------|-------------|
| `User.Identity.Name` | Email address | Driver's login email |
| `ClaimTypes.Role` | "Driver" | User role for authorization |
| `"UserId"` | DriverId (int) | Primary key from Drivers table |

**UI Components**:
- Welcome banner with driver's email
- Profile card displaying:
  - Driver name (retrieved from database)
  - License number
  - Contact information
  - Account status
- Navigation cards:
  - 🗺️ View Routes
  - 📅 My Schedule
  - 🚌 My Bus Assignments
  - 👤 Profile Settings

**Database Integration for Extended Profile**:
```csharp
public void OnGet()
{
    // Get basic info from claims
    Email = User.Identity?.Name;
    Role = User.FindFirst(ClaimTypes.Role)?.Value;
    UserId = User.FindFirst("UserId")?.Value;

    // Fetch additional driver details
    if (UserId != null)
    {
        using (var connection = new SqlConnection(_connectionString))
        {
            connection.Open();
            string query = "SELECT Name, LicenceNumber, Phone, LicencePhoto " +
                          "FROM Drivers WHERE DriverId = @DriverId";

            using (var command = new SqlCommand(query, connection))
            {
                command.Parameters.AddWithValue("@DriverId", UserId);
                var reader = command.ExecuteReader();

                if (reader.Read())
                {
                    Name = reader.GetString(0);
                    LicenceNumber = reader.GetString(1);
                    Phone = reader.GetString(2);
                    LicencePhoto = reader.GetString(3);
                }
            }
        }
    }
}
```

---

### 2. Routes View (`Routes.cshtml`)

**Purpose**: Display all available bus routes in the system for driver reference.

#### 2.1 Route Model

**Database Schema**:
```sql
Table: Routes
- RouteId (INT, PRIMARY KEY, IDENTITY)
- Origin (NVARCHAR)
- Destination (NVARCHAR)
- Distance (DECIMAL)
- Price (DECIMAL)
```

#### 2.2 Routes Logic (`Routes.cshtml.cs`)

**Code Implementation**:

```csharp
namespace BusManagement.Pages.Drivers
{
    [Authorize(Roles = "Driver")]
    public class RoutesModel : PageModel
    {
        public List<Route> Routes { get; set; } = new List<Route>();
        
        private readonly IConfiguration _configuration;
        private readonly string _connectionString;

        public RoutesModel(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = configuration.GetConnectionString("connstring");
        }

        public void OnGet()
        {
            // Fetch all routes from database
            using (var connection = new SqlConnection(_connectionString))
            {
                connection.Open();
                string query = "SELECT RouteId, Origin, Destination, Distance, Price " +
                              "FROM Routes " +
                              "ORDER BY Origin, Destination";

                using (var command = new SqlCommand(query, connection))
                {
                    var reader = command.ExecuteReader();
                    
                    while (reader.Read())
                    {
                        Routes.Add(new Route
                        {
                            RouteId = reader.GetInt32(0),
                            Origin = reader.GetString(1),
                            Destination = reader.GetString(2),
                            Distance = reader.GetDecimal(3),
                            Price = reader.GetDecimal(4)
                        });
                    }
                }
            }
        }
    }

    public class Route
    {
        public int RouteId { get; set; }
        public string Origin { get; set; }
        public string Destination { get; set; }
        public decimal Distance { get; set; }
        public decimal Price { get; set; }
    }
}
```

**Key Features**:
- **Read-Only Access**: Drivers can view but not modify routes
- **Ordered Display**: Routes sorted alphabetically by origin
- **Complete Information**: Shows distance and pricing for reference

**UI Display**:
```html
<div class="container mt-4">
    <h2 class="mb-4">
        <i class="fas fa-route me-2"></i>Available Routes
    </h2>

    <div class="row">
        @foreach (var route in Model.Routes)
        {
            <div class="col-md-6 col-lg-4 mb-3">
                <div class="card route-card">
                    <div class="card-body">
                        <h5 class="card-title">
                            @route.Origin → @route.Destination
                        </h5>
                        <p class="card-text">
                            <i class="fas fa-road me-2"></i>
                            Distance: @route.Distance km
                        </p>
                        <p class="card-text">
                            <i class="fas fa-money-bill-wave me-2"></i>
                            Price: @route.Price.ToString("F2") Frw
                        </p>
                    </div>
                </div>
            </div>
        }
    </div>
</div>
```

**CSS Styling** (route-card):
```css
.route-card {
    border-left: 4px solid #10b981;
    transition: transform 0.3s ease;
}

.route-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0,0,0,0.1);
}
```

---

### 3. Schedule View (`Schedule.cshtml`)

**Purpose**: Display schedules assigned to the specific authenticated driver.

#### 3.1 Database Relationships

**Schema Overview**:
```sql
Drivers → DriverAssignments → Buses → Schedule → Routes
```

**Tables Involved**:
1. **Drivers**: Driver information
2. **DriverAssignments**: Links drivers to buses
3. **Buses**: Bus details
4. **Schedule**: Journey schedules
5. **Routes**: Route information

#### 3.2 Schedule Logic (`Schedule.cshtml.cs`)

**Code Implementation**:

```csharp
namespace BusManagement.Pages.Drivers
{
    [Authorize(Roles = "Driver")]
    public class ScheduleModel : PageModel
    {
        public List<ScheduleItem> Schedules { get; set; } = new();
        
        private readonly IConfiguration _configuration;
        private readonly string _connectionString;

        public ScheduleModel(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = configuration.GetConnectionString("connstring");
        }

        public void OnGet()
        {
            // Get authenticated driver's ID
            var driverId = User.FindFirst("UserId")?.Value;
            
            if (driverId == null)
                return;

            using (var connection = new SqlConnection(_connectionString))
            {
                connection.Open();
                
                // Complex query with multiple JOINs
                string query = @"
                    SELECT 
                        s.ScheduleId,
                        b.BusNumber,
                        b.Model AS BusModel,
                        r.Origin,
                        r.Destination,
                        r.Distance,
                        r.Price,
                        s.DepartureTime,
                        s.ArrivalTime
                    FROM Schedule s
                    JOIN Buses b ON s.BusId = b.BusId
                    JOIN Routes r ON s.RouteId = r.RouteId
                    JOIN DriverAssignments da ON b.BusId = da.BusId
                    WHERE da.DriverId = @DriverId
                    ORDER BY s.DepartureTime DESC";

                using (var command = new SqlCommand(query, connection))
                {
                    command.Parameters.AddWithValue("@DriverId", driverId);
                    var reader = command.ExecuteReader();

                    while (reader.Read())
                    {
                        Schedules.Add(new ScheduleItem
                        {
                            ScheduleId = reader.GetInt32(0),
                            BusNumber = reader.GetString(1),
                            BusModel = reader.GetString(2),
                            Origin = reader.GetString(3),
                            Destination = reader.GetString(4),
                            Distance = reader.GetDecimal(5),
                            Price = reader.GetDecimal(6),
                            DepartureTime = reader.GetDateTime(7),
                            ArrivalTime = reader.GetDateTime(8)
                        });
                    }
                }
            }
        }
    }

    public class ScheduleItem
    {
        public int ScheduleId { get; set; }
        public string BusNumber { get; set; }
        public string BusModel { get; set; }
        public string Origin { get; set; }
        public string Destination { get; set; }
        public decimal Distance { get; set; }
        public decimal Price { get; set; }
        public DateTime DepartureTime { get; set; }
        public DateTime ArrivalTime { get; set; }

        // Computed properties
        public TimeSpan Duration => ArrivalTime - DepartureTime;
        public bool IsUpcoming => DepartureTime > DateTime.Now;
        public bool IsToday => DepartureTime.Date == DateTime.Today;
    }
}
```

**Query Breakdown**:

```sql
-- Step 1: Start with Schedule table
FROM Schedule s

-- Step 2: Get bus information
JOIN Buses b ON s.BusId = b.BusId

-- Step 3: Get route details
JOIN Routes r ON s.RouteId = r.RouteId

-- Step 4: Link to driver through assignments
JOIN DriverAssignments da ON b.BusId = da.BusId

-- Step 5: Filter by authenticated driver
WHERE da.DriverId = @DriverId

-- Step 6: Sort by departure time (newest first)
ORDER BY s.DepartureTime DESC
```

**Security Note**: The `WHERE da.DriverId = @DriverId` clause ensures drivers can only see schedules for buses they're assigned to.

---

#### 3.3 Advanced Schedule Display

**UI Implementation with Filtering**:

```html
@page
@model BusManagement.Pages.Drivers.ScheduleModel
@{
    ViewData["Title"] = "My Schedule";
}

<div class="container mt-4">
    <h2 class="mb-4">
        <i class="fas fa-calendar-alt me-2"></i>My Schedule
    </h2>

    <!-- Filter tabs -->
    <ul class="nav nav-tabs mb-4" id="scheduleTabs" role="tablist">
        <li class="nav-item" role="presentation">
            <button class="nav-link active" data-bs-toggle="tab" 
                    data-bs-target="#upcoming">
                Upcoming Trips
            </button>
        </li>
        <li class="nav-item" role="presentation">
            <button class="nav-link" data-bs-toggle="tab" 
                    data-bs-target="#today">
                Today's Trips
            </button>
        </li>
        <li class="nav-item" role="presentation">
            <button class="nav-link" data-bs-toggle="tab" 
                    data-bs-target="#all">
                All Schedules
            </button>
        </li>
    </ul>

    <!-- Tab content -->
    <div class="tab-content" id="scheduleTabContent">
        <!-- Upcoming trips -->
        <div class="tab-pane fade show active" id="upcoming">
            @foreach (var schedule in Model.Schedules.Where(s => s.IsUpcoming))
            {
                @await Html.PartialAsync("_ScheduleCard", schedule)
            }
        </div>

        <!-- Today's trips -->
        <div class="tab-pane fade" id="today">
            @foreach (var schedule in Model.Schedules.Where(s => s.IsToday))
            {
                @await Html.PartialAsync("_ScheduleCard", schedule)
            }
        </div>

        <!-- All schedules -->
        <div class="tab-pane fade" id="all">
            @foreach (var schedule in Model.Schedules)
            {
                @await Html.PartialAsync("_ScheduleCard", schedule)
            }
        </div>
    </div>
</div>
```

**Partial View: _ScheduleCard.cshtml**

```html
@model BusManagement.Pages.Drivers.ScheduleItem

<div class="card schedule-card mb-3 @(Model.IsUpcoming ? "upcoming" : "past")">
    <div class="card-body">
        <div class="row">
            <div class="col-md-8">
                <h5 class="card-title">
                    <i class="fas fa-bus me-2"></i>
                    @Model.BusNumber (@Model.BusModel)
                </h5>
                
                <div class="route-info mb-3">
                    <i class="fas fa-map-marker-alt text-success me-2"></i>
                    <strong>@Model.Origin</strong>
                    <i class="fas fa-arrow-right mx-2"></i>
                    <i class="fas fa-map-marker-alt text-danger me-2"></i>
                    <strong>@Model.Destination</strong>
                </div>

                <div class="schedule-details">
                    <p class="mb-1">
                        <i class="fas fa-clock me-2"></i>
                        <strong>Departure:</strong> 
                        @Model.DepartureTime.ToString("MMM dd, yyyy HH:mm")
                    </p>
                    <p class="mb-1">
                        <i class="fas fa-clock me-2"></i>
                        <strong>Arrival:</strong> 
                        @Model.ArrivalTime.ToString("MMM dd, yyyy HH:mm")
                    </p>
                    <p class="mb-1">
                        <i class="fas fa-hourglass-half me-2"></i>
                        <strong>Duration:</strong> 
                        @Model.Duration.Hours hours @Model.Duration.Minutes minutes
                    </p>
                </div>
            </div>

            <div class="col-md-4 text-end">
                <div class="badge-container mb-3">
                    @if (Model.IsUpcoming)
                    {
                        <span class="badge bg-success">Upcoming</span>
                    }
                    else
                    {
                        <span class="badge bg-secondary">Completed</span>
                    }
                    
                    @if (Model.IsToday)
                    {
                        <span class="badge bg-warning">Today</span>
                    }
                </div>

                <p class="text-muted mb-1">
                    <small>Distance: @Model.Distance km</small>
                </p>
                <p class="text-muted">
                    <small>Price: @Model.Price.ToString("F2") Frw</small>
                </p>
            </div>
        </div>
    </div>
</div>
```

---

## Database Operations

### Tables and Relationships

#### 1. Drivers Table
```sql
CREATE TABLE Drivers (
    DriverId INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(100) NOT NULL,
    LicenceNumber NVARCHAR(50) UNIQUE NOT NULL,
    LicencePhoto NVARCHAR(500),  -- File path
    Email NVARCHAR(100) UNIQUE NOT NULL,
    Password NVARCHAR(255) NOT NULL,
    Phone NVARCHAR(20)
);
```

**Sample Data**:
```sql
INSERT INTO Drivers (Name, LicenceNumber, LicencePhoto, Email, Password, Phone)
VALUES 
('John Doe', 'DL123456', '/uploads/licences/john_licence.png', 
 'john@example.com', 'hashed_password', '+250788123456');
```

#### 2. DriverAssignments Table
```sql
CREATE TABLE DriverAssignments (
    AssignmentId INT PRIMARY KEY IDENTITY(1,1),
    DriverId INT FOREIGN KEY REFERENCES Drivers(DriverId) ON DELETE CASCADE,
    BusId INT FOREIGN KEY REFERENCES Buses(BusId) ON DELETE CASCADE,
    AssignmentDate DATETIME DEFAULT GETDATE(),
    Status NVARCHAR(50) DEFAULT 'Active',  -- Active, Inactive, Temporary
    UNIQUE(DriverId, BusId)  -- Prevent duplicate assignments
);
```

**Business Rules**:
- One driver can be assigned to multiple buses
- One bus can have multiple drivers (shift-based)
- Active assignments are used for schedule filtering

#### 3. Query Patterns

**Get Driver's Assigned Buses**:
```sql
SELECT 
    b.BusId,
    b.BusNumber,
    b.Model,
    b.Capacity,
    da.AssignmentDate,
    da.Status
FROM DriverAssignments da
JOIN Buses b ON da.BusId = b.BusId
WHERE da.DriverId = @DriverId AND da.Status = 'Active'
ORDER BY da.AssignmentDate DESC;
```

**Get All Schedules for Driver's Buses**:
```sql
SELECT 
    s.ScheduleId,
    b.BusNumber,
    r.Origin,
    r.Destination,
    s.DepartureTime,
    s.ArrivalTime,
    COUNT(t.TicketId) AS TicketsSold,
    b.Capacity,
    (b.Capacity - COUNT(t.TicketId)) AS AvailableSeats
FROM Schedule s
JOIN Buses b ON s.BusId = b.BusId
JOIN Routes r ON s.RouteId = r.RouteId
JOIN DriverAssignments da ON b.BusId = da.BusId
LEFT JOIN Tickets t ON s.ScheduleId = t.ScheduleId
WHERE da.DriverId = @DriverId AND da.Status = 'Active'
GROUP BY s.ScheduleId, b.BusNumber, r.Origin, r.Destination, 
         s.DepartureTime, s.ArrivalTime, b.Capacity
ORDER BY s.DepartureTime;
```

**Check for Schedule Conflicts**:
```sql
SELECT COUNT(*) AS ConflictCount
FROM Schedule s1
JOIN DriverAssignments da ON s1.BusId = da.BusId
WHERE da.DriverId = @DriverId
  AND da.Status = 'Active'
  AND (
    (@NewDepartureTime BETWEEN s1.DepartureTime AND s1.ArrivalTime)
    OR (@NewArrivalTime BETWEEN s1.DepartureTime AND s1.ArrivalTime)
    OR (s1.DepartureTime BETWEEN @NewDepartureTime AND @NewArrivalTime)
  );
```

---

## Authentication & Security

### Role-Based Authorization

**Driver-Specific Authorization**:
```csharp
// In Program.cs
builder.Services.AddRazorPages(options =>
{
    options.Conventions.AuthorizeFolder("/Drivers", "Driver");
});

// Policy definition
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("Driver", policy =>
        policy.RequireRole("Driver"));
});
```

**Page-Level Authorization**:
```csharp
[Authorize(Roles = "Driver")]
public class IndexModel : PageModel
{
    // Only authenticated drivers can access this page
}
```

### Claims-Based Identity

**Claims Set During Login** (`Login.cshtml.cs`):
```csharp
if (UserType == "Driver")
{
    query = "SELECT DriverId FROM Drivers WHERE Email = @Email AND Password = @Password";
    userRole = "Driver";
}

// Create claims
var claims = new List<Claim>
{
    new Claim(ClaimTypes.Name, Email!),
    new Claim(ClaimTypes.Role, userRole),
    new Claim("UserId", userId.ToString())  // DriverId
};

var claimsIdentity = new ClaimsIdentity(claims, "CookieAuth");
var claimsPrincipal = new ClaimsPrincipal(claimsIdentity);

HttpContext.SignInAsync("CookieAuth", claimsPrincipal).Wait();
```

**Accessing Claims in Pages**:
```csharp
// Get driver's email
var email = User.Identity?.Name;

// Get driver's role
var role = User.FindFirst(ClaimTypes.Role)?.Value;

// Get driver's ID
var driverId = User.FindFirst("UserId")?.Value;
```

### Data Access Security

**Principle**: Drivers should only access their own data.

```csharp
// ✅ CORRECT: Filter by authenticated driver
var driverId = User.FindFirst("UserId")?.Value;
string query = "SELECT * FROM Schedule s " +
               "JOIN DriverAssignments da ON s.BusId = da.BusId " +
               "WHERE da.DriverId = @DriverId";
command.Parameters.AddWithValue("@DriverId", driverId);

// ❌ INCORRECT: Allows access to all schedules
string query = "SELECT * FROM Schedule";  // Security vulnerability!
```

---

## Implementation Guide

### Adding New Feature: Trip Completion Logging

**Use Case**: Drivers mark trips as completed and add notes.

**Step 1: Create Database Table**
```sql
CREATE TABLE TripLogs (
    LogId INT PRIMARY KEY IDENTITY(1,1),
    ScheduleId INT FOREIGN KEY REFERENCES Schedule(ScheduleId),
    DriverId INT FOREIGN KEY REFERENCES Drivers(DriverId),
    CompletionTime DATETIME NOT NULL,
    Status NVARCHAR(50) NOT NULL,  -- Completed, Delayed, Cancelled
    Notes NVARCHAR(1000),
    FuelUsed DECIMAL(10, 2),
    OdometerReading INT
);
```

**Step 2: Add Property to ScheduleItem**
```csharp
public class ScheduleItem
{
    // Existing properties...
    
    public bool IsCompleted { get; set; }
    public string? CompletionNotes { get; set; }
}
```

**Step 3: Update Query**
```csharp
string query = @"
    SELECT 
        s.ScheduleId,
        b.BusNumber,
        -- ... other fields ...
        CASE WHEN tl.LogId IS NOT NULL THEN 1 ELSE 0 END AS IsCompleted,
        tl.Notes AS CompletionNotes
    FROM Schedule s
    JOIN Buses b ON s.BusId = b.BusId
    JOIN Routes r ON s.RouteId = r.RouteId
    JOIN DriverAssignments da ON b.BusId = da.BusId
    LEFT JOIN TripLogs tl ON s.ScheduleId = tl.ScheduleId 
                         AND tl.DriverId = da.DriverId
    WHERE da.DriverId = @DriverId
    ORDER BY s.DepartureTime DESC";
```

**Step 4: Add POST Handler**
```csharp
public IActionResult OnPostCompleteTrip(int scheduleId, string notes, 
                                       decimal fuelUsed, int odometerReading)
{
    var driverId = User.FindFirst("UserId")?.Value;
    if (driverId == null)
        return RedirectToPage("/Login");

    using (var connection = new SqlConnection(_connectionString))
    {
        connection.Open();
        
        string query = "INSERT INTO TripLogs (ScheduleId, DriverId, CompletionTime, " +
                      "Status, Notes, FuelUsed, OdometerReading) " +
                      "VALUES (@ScheduleId, @DriverId, @CompletionTime, @Status, " +
                      "@Notes, @FuelUsed, @OdometerReading)";

        using (var command = new SqlCommand(query, connection))
        {
            command.Parameters.AddWithValue("@ScheduleId", scheduleId);
            command.Parameters.AddWithValue("@DriverId", driverId);
            command.Parameters.AddWithValue("@CompletionTime", DateTime.Now);
            command.Parameters.AddWithValue("@Status", "Completed");
            command.Parameters.AddWithValue("@Notes", notes ?? "");
            command.Parameters.AddWithValue("@FuelUsed", fuelUsed);
            command.Parameters.AddWithValue("@OdometerReading", odometerReading);
            
            command.ExecuteNonQuery();
        }
    }

    TempData["SuccessMessage"] = "Trip marked as completed!";
    return RedirectToPage();
}
```

**Step 5: Add UI Button**
```html
@if (!schedule.IsCompleted && DateTime.Now > schedule.ArrivalTime)
{
    <button type="button" class="btn btn-success btn-sm" 
            data-bs-toggle="modal" data-bs-target="#completeModal@(schedule.ScheduleId)">
        Mark as Completed
    </button>
    
    <!-- Modal for completion form -->
    <div class="modal fade" id="completeModal@(schedule.ScheduleId)">
        <!-- Modal content with form fields -->
    </div>
}
```

---

## Best Practices

### 1. Error Handling
```csharp
public void OnGet()
{
    var driverId = User.FindFirst("UserId")?.Value;
    
    if (string.IsNullOrEmpty(driverId))
    {
        // Handle missing claim
        TempData["ErrorMessage"] = "Driver information not found. Please log in again.";
        return;
    }

    try
    {
        // Database operations
    }
    catch (SqlException ex)
    {
        _logger.LogError(ex, "Database error fetching schedules for driver {DriverId}", driverId);
        TempData["ErrorMessage"] = "Unable to load schedules. Please try again.";
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Unexpected error in driver schedule page");
        TempData["ErrorMessage"] = "An unexpected error occurred.";
    }
}
```

### 2. Logging
```csharp
// Add ILogger to constructor
private readonly ILogger<ScheduleModel> _logger;

public ScheduleModel(IConfiguration configuration, ILogger<ScheduleModel> logger)
{
    _configuration = configuration;
    _logger = logger;
    _connectionString = configuration.GetConnectionString("connstring");
}

// Use throughout code
_logger.LogInformation("Driver {DriverId} viewed schedules", driverId);
_logger.LogWarning("Driver {DriverId} has no assigned buses", driverId);
_logger.LogError(ex, "Failed to load schedules for driver {DriverId}", driverId);
```

### 3. Caching
```csharp
// Cache routes since they rarely change
private IMemoryCache _cache;

public RoutesModel(IConfiguration configuration, IMemoryCache memoryCache)
{
    _configuration = configuration;
    _cache = memoryCache;
    _connectionString = configuration.GetConnectionString("connstring");
}

public void OnGet()
{
    if (!_cache.TryGetValue("AllRoutes", out List<Route> routes))
    {
        routes = LoadRoutesFromDatabase();
        
        var cacheOptions = new MemoryCacheEntryOptions()
            .SetAbsoluteExpiration(TimeSpan.FromHours(1));
        
        _cache.Set("AllRoutes", routes, cacheOptions);
    }
    
    Routes = routes;
}
```

### 4. Validation
```csharp
public IActionResult OnPostCompleteTrip(int scheduleId, string notes)
{
    // Validate schedule exists and belongs to driver
    var driverId = User.FindFirst("UserId")?.Value;
    
    if (!IsScheduleAssignedToDriver(scheduleId, driverId))
    {
        return Forbid();  // 403 Forbidden
    }

    // Validate schedule is in the past
    var schedule = GetSchedule(scheduleId);
    if (schedule.ArrivalTime > DateTime.Now)
    {
        TempData["ErrorMessage"] = "Cannot complete a future trip.";
        return Page();
    }

    // Proceed with completion
}
```

---

## Testing Checklist

### Functional Testing
- [ ] Driver can log in successfully
- [ ] Dashboard displays driver information correctly
- [ ] Routes page shows all system routes
- [ ] Schedule page shows only driver's assigned schedules
- [ ] Cannot view other drivers' schedules
- [ ] Upcoming/today filters work correctly
- [ ] Schedule details are accurate

### Security Testing
- [ ] Non-driver users cannot access `/Drivers/*` pages
- [ ] Drivers cannot access admin or client pages
- [ ] SQL injection attempts are blocked
- [ ] Direct URL manipulation doesn't expose other drivers' data
- [ ] Session timeout works correctly

### UI/UX Testing
- [ ] Responsive design on mobile/tablet/desktop
- [ ] Schedule cards are readable
- [ ] Filter tabs work smoothly
- [ ] Date/time formats are clear
- [ ] Icons enhance readability

---

## Troubleshooting

### Issue: "No schedules found"
**Possible Causes**:
1. Driver not assigned to any bus
2. No schedules created for assigned buses
3. DriverAssignments.Status is not 'Active'

**Solution**:
```sql
-- Check driver assignments
SELECT * FROM DriverAssignments WHERE DriverId = @DriverId;

-- Check if assigned buses have schedules
SELECT b.BusNumber, COUNT(s.ScheduleId) AS ScheduleCount
FROM DriverAssignments da
JOIN Buses b ON da.BusId = b.BusId
LEFT JOIN Schedule s ON b.BusId = s.BusId
WHERE da.DriverId = @DriverId
GROUP BY b.BusNumber;
```

### Issue: "Driver information not loading"
**Solutions**:
1. Verify claims are set correctly during login
2. Check `User.FindFirst("UserId")` returns valid value
3. Ensure DriverId exists in database

```csharp
// Debug helper
public void OnGet()
{
    var driverId = User.FindFirst("UserId")?.Value;
    _logger.LogInformation("Driver ID from claims: {DriverId}", driverId ?? "NULL");
    
    if (driverId == null)
    {
        _logger.LogWarning("Driver claim 'UserId' is missing!");
    }
}
```

---

## Future Enhancements

1. **Real-Time Updates**: WebSocket notifications for schedule changes
2. **GPS Integration**: Track bus location during journey
3. **Fuel Management**: Log fuel consumption per trip
4. **Maintenance Alerts**: Notify drivers of bus maintenance needs
5. **Passenger Count**: Real-time passenger boarding tracking
6. **Route Optimization**: Suggest alternative routes based on traffic
7. **Earnings Dashboard**: Show driver compensation and bonuses
8. **Rating System**: Display driver ratings from passengers
9. **Messaging**: Chat with dispatchers or passengers
10. **Incident Reporting**: Report accidents or issues during trips

---

## Contact & Support

**Developer**: Abdias  
**Module**: Drivers Portal & Schedule Management  
**Last Updated**: December 2025

For questions or issues, refer to this documentation or contact the project lead.


