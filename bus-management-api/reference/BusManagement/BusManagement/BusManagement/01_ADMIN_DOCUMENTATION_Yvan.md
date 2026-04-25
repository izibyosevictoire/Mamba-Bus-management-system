# Admin Module Documentation
**Developer: Yvan**

---

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Pages & Features](#pages--features)
4. [Database Operations](#database-operations)
5. [Code Structure](#code-structure)
6. [Security & Authorization](#security--authorization)
7. [Implementation Guide](#implementation-guide)
8. [API Reference](#api-reference)

---

## Overview

The Admin module is the core management system for the Bus Management application. It provides comprehensive control over all aspects of the bus system including buses, routes, schedules, driver assignments, and ticket viewing.

### Key Responsibilities
- **Bus Management**: Add, edit, view, and delete buses
- **Route Management**: Manage bus routes with origin, destination, distance, and pricing
- **Schedule Management**: Create and manage bus schedules linking buses to routes
- **Driver Assignment**: Assign drivers to specific buses
- **Ticket Oversight**: View all tickets purchased by clients

### Technology Stack
- **Framework**: ASP.NET Core 8.0 Razor Pages
- **Authentication**: Cookie-based authentication with role-based authorization
- **Database**: SQL Server with ADO.NET (Microsoft.Data.SqlClient)
- **UI**: Bootstrap 5, Font Awesome, Custom CSS

---

## Architecture

### Folder Structure
```
Pages/Admin/
├── Index.cshtml                          # Admin Dashboard
├── Index.cshtml.cs                       # Dashboard logic
├── ManageBuses.cshtml                    # Legacy bus management
├── ManageBuses.cshtml.cs
├── Buses/
│   ├── ManageBuses.cshtml                # Main bus management page
│   ├── ManageBuses.cshtml.cs             # Bus CRUD operations
│   ├── AddBus.cshtml                     # Add new bus
│   ├── AddBus.cshtml.cs
│   ├── EditBus.cshtml                    # Edit existing bus
│   └── EditBus.cshtml.cs
├── Routes/
│   ├── ManageRoutes.cshtml               # Route listing
│   ├── ManageRoutes.cshtml.cs            # Route CRUD operations
│   ├── AddRoute.cshtml                   # Add new route
│   ├── AddRoute.cshtml.cs
│   ├── EditRoute.cshtml                  # Edit route
│   └── EditRoute.cshtml.cs
├── Schedules/
│   ├── ManageSchedules.cshtml            # Schedule listing
│   ├── ManageSchedules.cshtml.cs         # Schedule CRUD operations
│   ├── AddSchedule.cshtml                # Create schedule
│   ├── AddSchedule.cshtml.cs
│   ├── EditSchedule.cshtml               # Edit schedule
│   └── EditSchedule.cshtml.cs
├── AssignDrivers/
│   ├── ManageAssignDrivers.cshtml        # Driver-Bus assignment
│   └── ManageAssignDrivers.cshtml.cs
└── Tickets/
    ├── ViewTickets.cshtml                # View all tickets
    └── ViewTickets.cshtml.cs
```

---

## Pages & Features

### 1. Admin Dashboard (`Index.cshtml`)

**Purpose**: Central hub for admin operations with quick access to all management functions.

**Features**:
- Real-time clock display
- Management action cards for each module
- Modern, responsive UI with hover effects
- Quick navigation to all admin functions

**Code Breakdown**:

```csharp
// Index.cshtml.cs
namespace BusManagement.Pages.Admin
{
    [Authorize(Roles = "Admin")]  // Only users with Admin role can access
    public class IndexModel : PageModel
    {
        public void OnGet()
        {
            // Dashboard loads without additional data
            // All data fetching happens in specific management pages
        }
    }
}
```

**UI Components**:
- Header with gradient background (`#6366f1`)
- Action cards with icons:
  - 🚌 Manage Buses (Primary Blue)
  - 🛣️ Manage Routes (Success Green)
  - 📅 Manage Schedules (Danger Red)
  - 🪪 Assign Drivers (Warning Orange)
  - 🎫 View Tickets (Secondary Purple)

---

### 2. Bus Management

#### 2.1 Manage Buses (`Buses/ManageBuses.cshtml.cs`)

**Purpose**: Display, filter, and delete buses from the system.

**Database Schema**:
```sql
Table: Buses
- BusId (INT, PRIMARY KEY, IDENTITY)
- BusNumber (NVARCHAR)
- Capacity (INT)
- Model (NVARCHAR)
- Status (NVARCHAR)
```

**Code Implementation**:

```csharp
public class ManageBusesModel : PageModel
{
    public List<Bus> Buses { get; set; } = new List<Bus>();
    
    private readonly IConfiguration _configuration;
    private readonly string _connectionString;

    public ManageBusesModel(IConfiguration configuration)
    {
        _configuration = configuration;
        _connectionString = configuration.GetConnectionString("connstring");
    }

    public void OnGet()
    {
        // Fetch all buses from database
        using (var connection = new SqlConnection(_connectionString))
        {
            connection.Open();
            string query = "SELECT BusId, BusNumber, Capacity, Model, Status FROM Buses";

            using (var command = new SqlCommand(query, connection))
            {
                var reader = command.ExecuteReader();
                while (reader.Read())
                {
                    Buses.Add(new Bus
                    {
                        BusId = reader.GetInt32(0),
                        BusNumber = reader.GetString(1),
                        Capacity = reader.GetInt32(2),
                        Model = reader.GetString(3),
                        Status = reader.GetString(4)
                    });
                }
            }
        }
    }

    public IActionResult OnPostDelete(int busId)
    {
        // Delete bus from database
        using (var connection = new SqlConnection(_connectionString))
        {
            connection.Open();
            string query = "DELETE FROM Buses WHERE BusId = @BusId";

            using (var command = new SqlCommand(query, connection))
            {
                command.Parameters.AddWithValue("@BusId", busId);
                command.ExecuteNonQuery();
            }
        }

        return RedirectToPage();
    }
}

public class Bus
{
    public int BusId { get; set; }
    public string BusNumber { get; set; }
    public int Capacity { get; set; }
    public string Model { get; set; }
    public string Status { get; set; }
}
```

**Operations**:
- **OnGet()**: Retrieves all buses from the database
- **OnPostDelete(int busId)**: Deletes a specific bus by ID

**UI Features**:
- Table display with sortable columns
- Edit and Delete buttons for each bus
- "Add New Bus" button linking to AddBus page
- Responsive design for mobile and desktop

---

#### 2.2 Add Bus (`Buses/AddBus.cshtml.cs`)

**Purpose**: Create new bus entries in the system.

**Form Fields**:
- Bus Number (Text, Required)
- Capacity (Number, Required)
- Model (Text, Required)
- Status (Dropdown: Active/Inactive/Maintenance)

**Implementation Pattern**:
```csharp
[BindProperty]
public string? BusNumber { get; set; }

[BindProperty]
public int Capacity { get; set; }

[BindProperty]
public string? Model { get; set; }

[BindProperty]
public string? Status { get; set; }

public IActionResult OnPost()
{
    if (!ModelState.IsValid)
        return Page();

    string query = "INSERT INTO Buses (BusNumber, Capacity, Model, Status) " +
                   "VALUES (@BusNumber, @Capacity, @Model, @Status)";

    using (var connection = new SqlConnection(_connectionString))
    {
        connection.Open();
        using (var command = new SqlCommand(query, connection))
        {
            command.Parameters.AddWithValue("@BusNumber", BusNumber);
            command.Parameters.AddWithValue("@Capacity", Capacity);
            command.Parameters.AddWithValue("@Model", Model);
            command.Parameters.AddWithValue("@Status", Status);
            command.ExecuteNonQuery();
        }
    }

    return RedirectToPage("./ManageBuses");
}
```

---

#### 2.3 Edit Bus (`Buses/EditBus.cshtml.cs`)

**Purpose**: Update existing bus information.

**Query Parameter**: `busId` (from URL)

**Implementation Pattern**:
```csharp
[BindProperty(SupportsGet = true)]
public int BusId { get; set; }

public void OnGet()
{
    // Load existing bus data
    string query = "SELECT BusNumber, Capacity, Model, Status FROM Buses WHERE BusId = @BusId";
    
    using (var connection = new SqlConnection(_connectionString))
    {
        connection.Open();
        using (var command = new SqlCommand(query, connection))
        {
            command.Parameters.AddWithValue("@BusId", BusId);
            var reader = command.ExecuteReader();
            
            if (reader.Read())
            {
                BusNumber = reader.GetString(0);
                Capacity = reader.GetInt32(1);
                Model = reader.GetString(2);
                Status = reader.GetString(3);
            }
        }
    }
}

public IActionResult OnPost()
{
    string query = "UPDATE Buses SET BusNumber = @BusNumber, Capacity = @Capacity, " +
                   "Model = @Model, Status = @Status WHERE BusId = @BusId";

    using (var connection = new SqlConnection(_connectionString))
    {
        connection.Open();
        using (var command = new SqlCommand(query, connection))
        {
            command.Parameters.AddWithValue("@BusId", BusId);
            command.Parameters.AddWithValue("@BusNumber", BusNumber);
            command.Parameters.AddWithValue("@Capacity", Capacity);
            command.Parameters.AddWithValue("@Model", Model);
            command.Parameters.AddWithValue("@Status", Status);
            command.ExecuteNonQuery();
        }
    }

    return RedirectToPage("./ManageBuses");
}
```

---

### 3. Route Management

#### 3.1 Manage Routes (`Routes/ManageRoutes.cshtml.cs`)

**Purpose**: Manage all bus routes in the system.

**Database Schema**:
```sql
Table: Routes
- RouteId (INT, PRIMARY KEY, IDENTITY)
- Origin (NVARCHAR)
- Destination (NVARCHAR)
- Distance (DECIMAL)
- Price (DECIMAL)
```

**Code Implementation**:

```csharp
public class ManageRoutesModel : PageModel
{
    public List<Route> Routes { get; set; } = new List<Route>();

    public void OnGet()
    {
        using (var connection = new SqlConnection(_connectionString))
        {
            connection.Open();
            string query = "SELECT RouteId, Origin, Destination, Distance, Price FROM Routes";

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

    public IActionResult OnPostDelete(int routeId)
    {
        using (var connection = new SqlConnection(_connectionString))
        {
            connection.Open();
            string query = "DELETE FROM Routes WHERE RouteId = @RouteId";

            using (var command = new SqlCommand(query, connection))
            {
                command.Parameters.AddWithValue("@RouteId", routeId);
                command.ExecuteNonQuery();
            }
        }

        return RedirectToPage();
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
```

**Key Features**:
- Display all routes with origin → destination
- Show distance in kilometers
- Display price in Rwandan Francs (Frw)
- Edit and delete operations

---

#### 3.2 Add/Edit Route

**Form Fields**:
- Origin (Text, Required)
- Destination (Text, Required)
- Distance (Decimal, Required, in KM)
- Price (Decimal, Required, in Frw)

**Validation**:
- Distance must be positive
- Price must be positive
- Origin and Destination cannot be the same

---

### 4. Schedule Management

#### 4.1 Manage Schedules (`Schedules/ManageSchedules.cshtml.cs`)

**Purpose**: Link buses to routes with specific departure and arrival times.

**Database Schema**:
```sql
Table: Schedule
- ScheduleId (INT, PRIMARY KEY, IDENTITY)
- BusId (INT, FOREIGN KEY → Buses)
- RouteId (INT, FOREIGN KEY → Routes)
- DepartureTime (DATETIME)
- ArrivalTime (DATETIME)
```

**Code Implementation**:

```csharp
public class ManageSchedulesModel : PageModel
{
    public List<Schedule> Schedules { get; set; } = new();

    public void OnGet()
    {
        using (var connection = new SqlConnection(_connectionString))
        {
            connection.Open();
            string query = "SELECT s.ScheduleId, b.BusNumber, r.Origin, r.Destination, " +
                          "s.DepartureTime, s.ArrivalTime " +
                          "FROM Schedule s " +
                          "JOIN Buses b ON s.BusId = b.BusId " +
                          "JOIN Routes r ON s.RouteId = r.RouteId";

            using (var command = new SqlCommand(query, connection))
            {
                var reader = command.ExecuteReader();
                while (reader.Read())
                {
                    Schedules.Add(new Schedule
                    {
                        ScheduleId = reader.GetInt32(0),
                        BusNumber = reader.GetString(1),
                        Origin = reader.GetString(2),
                        Destination = reader.GetString(3),
                        DepartureTime = reader.GetDateTime(4),
                        ArrivalTime = reader.GetDateTime(5)
                    });
                }
            }
        }
    }

    public IActionResult OnPostDelete(int scheduleId)
    {
        using (var connection = new SqlConnection(_connectionString))
        {
            connection.Open();
            string query = "DELETE FROM Schedule WHERE ScheduleId = @ScheduleId";

            using (var command = new SqlCommand(query, connection))
            {
                command.Parameters.AddWithValue("@ScheduleId", scheduleId);
                command.ExecuteNonQuery();
            }
        }

        return RedirectToPage();
    }
}
```

**Key Features**:
- Display bus number, route, and timing information
- JOIN operations to fetch related data
- Delete schedules (cascade considerations needed)

---

### 5. Driver Assignment (`AssignDrivers/ManageAssignDrivers.cshtml.cs`)

**Purpose**: Assign drivers to specific buses for operational management.

**Database Relationship**:
```sql
Table: DriverAssignments (Assumed)
- AssignmentId (INT, PRIMARY KEY)
- DriverId (INT, FOREIGN KEY → Drivers)
- BusId (INT, FOREIGN KEY → Buses)
- AssignmentDate (DATETIME)
```

**Implementation Notes**:
- Load all available drivers (not currently assigned)
- Load all buses
- Create assignment linking driver to bus
- Validation: One driver per bus at a time

---

### 6. Ticket Viewing (`Tickets/ViewTickets.cshtml.cs`)

**Purpose**: View all tickets purchased by clients across the system.

**Database Query**:
```sql
SELECT 
    t.TicketId,
    c.Name AS ClientName,
    c.Email,
    b.BusNumber,
    r.Origin,
    r.Destination,
    s.DepartureTime,
    s.ArrivalTime,
    t.DateIssued,
    r.Price
FROM Tickets t
JOIN Clients c ON t.ClientId = c.ClientId
JOIN Schedule s ON t.ScheduleId = s.ScheduleId
JOIN Buses b ON s.BusId = b.BusId
JOIN Routes r ON s.RouteId = r.RouteId
ORDER BY t.DateIssued DESC
```

**Display Information**:
- Ticket ID
- Client details (Name, Email)
- Bus information
- Route details
- Journey times
- Purchase date
- Price paid

---

## Database Operations

### Connection Management

**Connection String** (from `appsettings.json`):
```json
{
  "ConnectionStrings": {
    "connstring": "Data Source=DESKTOP-6F3M6TN\\SQLEXPRESS;Initial Catalog=BusManagementDB;Integrated Security=True;TrustServerCertificate=True"
  }
}
```

**Connection Pattern**:
```csharp
private readonly IConfiguration _configuration;
private readonly string _connectionString;

public ManageBusesModel(IConfiguration configuration)
{
    _configuration = configuration;
    _connectionString = configuration.GetConnectionString("connstring");
}

// Usage in methods
using (var connection = new SqlConnection(_connectionString))
{
    connection.Open();
    // Perform database operations
}
```

### CRUD Operations Pattern

#### CREATE (Insert)
```csharp
string query = "INSERT INTO Buses (BusNumber, Capacity, Model, Status) VALUES (@BusNumber, @Capacity, @Model, @Status)";

using (var command = new SqlCommand(query, connection))
{
    command.Parameters.AddWithValue("@BusNumber", BusNumber);
    command.Parameters.AddWithValue("@Capacity", Capacity);
    command.Parameters.AddWithValue("@Model", Model);
    command.Parameters.AddWithValue("@Status", Status);
    command.ExecuteNonQuery();
}
```

#### READ (Select)
```csharp
string query = "SELECT BusId, BusNumber, Capacity, Model, Status FROM Buses";

using (var command = new SqlCommand(query, connection))
{
    var reader = command.ExecuteReader();
    while (reader.Read())
    {
        Buses.Add(new Bus
        {
            BusId = reader.GetInt32(0),
            BusNumber = reader.GetString(1),
            Capacity = reader.GetInt32(2),
            Model = reader.GetString(3),
            Status = reader.GetString(4)
        });
    }
}
```

#### UPDATE
```csharp
string query = "UPDATE Buses SET BusNumber = @BusNumber, Capacity = @Capacity, Model = @Model, Status = @Status WHERE BusId = @BusId";

using (var command = new SqlCommand(query, connection))
{
    command.Parameters.AddWithValue("@BusId", BusId);
    command.Parameters.AddWithValue("@BusNumber", BusNumber);
    command.Parameters.AddWithValue("@Capacity", Capacity);
    command.Parameters.AddWithValue("@Model", Model);
    command.Parameters.AddWithValue("@Status", Status);
    command.ExecuteNonQuery();
}
```

#### DELETE
```csharp
string query = "DELETE FROM Buses WHERE BusId = @BusId";

using (var command = new SqlCommand(query, connection))
{
    command.Parameters.AddWithValue("@BusId", busId);
    command.ExecuteNonQuery();
}
```

### SQL Injection Prevention
✅ **All queries use parameterized commands** with `@Parameters`
✅ **Never concatenate user input directly into SQL queries**

---

## Security & Authorization

### Role-Based Access Control

**Authorization Attribute**:
```csharp
[Authorize(Roles = "Admin")]
public class IndexModel : PageModel
{
    // Only users with "Admin" role can access this page
}
```

**Folder-Level Authorization** (in `Program.cs`):
```csharp
builder.Services.AddRazorPages(options =>
{
    options.Conventions.AuthorizeFolder("/Admin", "Admin");
});
```

### Access Control Flow
1. User attempts to access `/Admin/*` page
2. ASP.NET Core checks for authentication cookie
3. Validates user role from claims
4. If role = "Admin" → Allow access
5. If role ≠ "Admin" → Redirect to `/AccessDenied`
6. If not authenticated → Redirect to `/Login`

---

## Implementation Guide

### Adding a New Management Feature

**Example: Adding Category Management**

1. **Create Database Table**:
```sql
CREATE TABLE Categories (
    CategoryId INT PRIMARY KEY IDENTITY(1,1),
    CategoryName NVARCHAR(100) NOT NULL,
    Description NVARCHAR(500)
);
```

2. **Create Folder Structure**:
```
Pages/Admin/Categories/
├── ManageCategories.cshtml
├── ManageCategories.cshtml.cs
├── AddCategory.cshtml
├── AddCategory.cshtml.cs
├── EditCategory.cshtml
└── EditCategory.cshtml.cs
```

3. **Implement ManageCategories.cshtml.cs**:
```csharp
namespace BusManagement.Pages.Admin.Categories
{
    [Authorize(Roles = "Admin")]
    public class ManageCategoriesModel : PageModel
    {
        public List<Category> Categories { get; set; } = new();
        private readonly IConfiguration _configuration;
        private readonly string _connectionString;

        public ManageCategoriesModel(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = configuration.GetConnectionString("connstring");
        }

        public void OnGet()
        {
            using (var connection = new SqlConnection(_connectionString))
            {
                connection.Open();
                string query = "SELECT CategoryId, CategoryName, Description FROM Categories";

                using (var command = new SqlCommand(query, connection))
                {
                    var reader = command.ExecuteReader();
                    while (reader.Read())
                    {
                        Categories.Add(new Category
                        {
                            CategoryId = reader.GetInt32(0),
                            CategoryName = reader.GetString(1),
                            Description = reader.IsDBNull(2) ? "" : reader.GetString(2)
                        });
                    }
                }
            }
        }

        public IActionResult OnPostDelete(int categoryId)
        {
            using (var connection = new SqlConnection(_connectionString))
            {
                connection.Open();
                string query = "DELETE FROM Categories WHERE CategoryId = @CategoryId";

                using (var command = new SqlCommand(query, connection))
                {
                    command.Parameters.AddWithValue("@CategoryId", categoryId);
                    command.ExecuteNonQuery();
                }
            }
            return RedirectToPage();
        }
    }

    public class Category
    {
        public int CategoryId { get; set; }
        public string CategoryName { get; set; }
        public string Description { get; set; }
    }
}
```

4. **Create View (ManageCategories.cshtml)**:
```html
@page
@model BusManagement.Pages.Admin.Categories.ManageCategoriesModel
@{
    ViewData["Title"] = "Manage Categories";
}

<div class="container mt-4">
    <h2>Manage Categories</h2>
    <a href="/Admin/Categories/AddCategory" class="btn btn-primary mb-3">Add New Category</a>
    
    <table class="table table-striped">
        <thead>
            <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Description</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
            @foreach (var category in Model.Categories)
            {
                <tr>
                    <td>@category.CategoryId</td>
                    <td>@category.CategoryName</td>
                    <td>@category.Description</td>
                    <td>
                        <a href="/Admin/Categories/EditCategory?categoryId=@category.CategoryId" class="btn btn-sm btn-warning">Edit</a>
                        <form method="post" asp-page-handler="Delete" style="display:inline;">
                            <input type="hidden" name="categoryId" value="@category.CategoryId" />
                            <button type="submit" class="btn btn-sm btn-danger" onclick="return confirm('Are you sure?')">Delete</button>
                        </form>
                    </td>
                </tr>
            }
        </tbody>
    </table>
</div>
```

5. **Add to Dashboard** (`Admin/Index.cshtml`):
```html
<div class="col-lg-4 col-md-6">
    <div class="action-card">
        <div class="action-icon" style="background: #3b82f6;">
            <i class="fas fa-tags text-white"></i>
        </div>
        <h4 class="text-center fw-bold mb-3">Manage Categories</h4>
        <div class="d-grid">
            <a href="/Admin/Categories/ManageCategories" class="btn btn-info">
                <i class="fas fa-arrow-right me-2"></i>Manage Categories
            </a>
        </div>
    </div>
</div>
```

---

## API Reference

### Page Handlers

#### GET Handlers
- `OnGet()` - Load page data
- `OnGetAsync()` - Async version for heavy operations

#### POST Handlers
- `OnPost()` - Handle form submissions
- `OnPostDelete(int id)` - Specific delete handler
- `OnPostEdit()` - Edit operations

### Common Properties

#### BindProperty
```csharp
[BindProperty]
public string? PropertyName { get; set; }  // Two-way binding for forms

[BindProperty(SupportsGet = true)]
public int Id { get; set; }  // Also bind from query string
```

### Navigation Methods

#### Redirect
```csharp
return RedirectToPage();  // Redirect to current page (refresh)
return RedirectToPage("./ManageBuses");  // Redirect to sibling page
return RedirectToPage("/Admin/Index");  // Redirect to absolute path
```

#### Page Return
```csharp
return Page();  // Re-render current page (validation errors)
```

---

## Best Practices

### 1. Connection Management
✅ Always use `using` statements for SqlConnection
✅ Open connection late, close early
✅ Dispose resources properly

### 2. Error Handling
```csharp
public IActionResult OnPost()
{
    try
    {
        // Database operations
        return RedirectToPage();
    }
    catch (SqlException ex)
    {
        ModelState.AddModelError(string.Empty, $"Database error: {ex.Message}");
        return Page();
    }
}
```

### 3. Validation
```csharp
if (!ModelState.IsValid)
{
    return Page();  // Return with validation errors
}
```

### 4. User Feedback
```csharp
[TempData]
public string? StatusMessage { get; set; }

// Set message
StatusMessage = "Bus added successfully!";

// Display in view
@if (Model.StatusMessage != null)
{
    <div class="alert alert-success">@Model.StatusMessage</div>
}
```

---

## Testing Checklist

### Functional Testing
- [ ] Can add new bus/route/schedule
- [ ] Can edit existing records
- [ ] Can delete records (with confirmation)
- [ ] Form validation works correctly
- [ ] Proper error messages displayed
- [ ] Data loads correctly on page refresh

### Security Testing
- [ ] Non-admin users cannot access `/Admin/*` pages
- [ ] Direct URL access is blocked without admin role
- [ ] SQL injection attempts fail
- [ ] XSS attempts are sanitized

### UI/UX Testing
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] Buttons have appropriate hover effects
- [ ] Forms are user-friendly
- [ ] Navigation is intuitive

---

## Troubleshooting

### Common Issues

#### Issue: "Cannot access admin pages"
**Solution**: Ensure user is logged in with Admin role
```csharp
// Check in Login.cshtml.cs
if (userRole == "Admin") 
    return RedirectToPage("/Admin/Index");
```

#### Issue: "Database connection fails"
**Solution**: Verify connection string in `appsettings.json`
- Check server name
- Verify database name
- Ensure SQL Server is running

#### Issue: "Delete fails due to foreign key constraint"
**Solution**: Handle cascading deletes or show appropriate error
```sql
-- Option 1: Cascade delete
ALTER TABLE Schedule
ADD CONSTRAINT FK_Schedule_Bus
FOREIGN KEY (BusId) REFERENCES Buses(BusId)
ON DELETE CASCADE;

-- Option 2: Check for dependencies before delete
SELECT COUNT(*) FROM Schedule WHERE BusId = @BusId
```

---

## Future Enhancements

### Recommended Features
1. **Dashboard Statistics**: Show counts of buses, routes, active schedules
2. **Search & Filter**: Add search functionality to management pages
3. **Bulk Operations**: Delete/update multiple records at once
4. **Export Functionality**: Export data to CSV/Excel
5. **Audit Logging**: Track who made changes and when
6. **Advanced Validation**: Check for schedule conflicts
7. **Image Upload**: Add bus photos
8. **Email Notifications**: Notify drivers of assignments

---

## Contact & Support

**Developer**: Yvan  
**Module**: Admin Management  
**Last Updated**: December 2025

For questions or issues, refer to this documentation or contact the project lead.


