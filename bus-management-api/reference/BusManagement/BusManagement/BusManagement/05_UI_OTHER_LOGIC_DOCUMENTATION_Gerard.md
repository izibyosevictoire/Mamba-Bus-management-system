# UI & Other Logic Documentation
**Developer: Gerard**

---

## Table of Contents
1. [Overview](#overview)
2. [Application Configuration](#application-configuration)
3. [Authentication & Authorization](#authentication--authorization)
4. [UI Framework & Design](#ui-framework--design)
5. [Shared Layouts](#shared-layouts)
6. [Navigation Components](#navigation-components)
7. [CSS Styling Guide](#css-styling-guide)
8. [JavaScript & Client-Side Logic](#javascript--client-side-logic)
9. [Error Handling](#error-handling)
10. [Best Practices](#best-practices)

---

## Overview

This module covers all cross-cutting concerns, application configuration, authentication/authorization setup, UI design system, shared layouts, and client-side logic. It ensures a consistent user experience across all user roles (Admin, Client, Driver).

### Key Responsibilities
- **Application Startup**: Configure services, middleware, and routing
- **Authentication System**: Cookie-based auth with role-based authorization
- **UI Framework**: Bootstrap 5 + custom CSS for modern design
- **Shared Layouts**: Consistent page structure across all modules
- **Navigation**: Role-specific navigation bars
- **Client-Side Logic**: JavaScript for interactivity
- **Error Handling**: Centralized error pages and logging

### Technology Stack
- **Backend**: ASP.NET Core 8.0
- **Frontend**: Bootstrap 5.3, Font Awesome 6.4
- **CSS**: Custom CSS with CSS Variables (CSS Custom Properties)
- **JavaScript**: Vanilla JS with Bootstrap JS
- **Fonts**: Google Fonts (Inter)

---

## Application Configuration

### Program.cs - Complete Breakdown

**File**: `Program.cs`

```csharp
var builder = WebApplication.CreateBuilder(args);

// ===================================
// 1. ADD SERVICES TO CONTAINER
// ===================================

// Add Razor Pages support
builder.Services.AddRazorPages();

// ===================================
// 2. AUTHENTICATION CONFIGURATION
// ===================================

// Configure Cookie Authentication
builder.Services.AddAuthentication("CookieAuth")
    .AddCookie("CookieAuth", options =>
    {
        options.LoginPath = "/Login"; // Redirect to Login page for unauthorized users
        options.AccessDeniedPath = "/AccessDenied"; // Optional for unauthorized access
        options.ExpireTimeSpan = TimeSpan.FromMinutes(30); // Cookie expiration time
    });

builder.Services.AddAuthorization();

// ===================================
// 3. AUTHORIZATION POLICIES
// ===================================

builder.Services.AddAuthorization(options =>
{
    // Define the 'Driver' role policy
    options.AddPolicy("Driver", policy =>
        policy.RequireRole("Driver"));

    // Define the 'Client' role policy
    options.AddPolicy("Client", policy =>
        policy.RequireRole("Client"));

    // Define the 'Admin' role policy
    options.AddPolicy("Admin", policy =>
        policy.RequireRole("Admin"));
});

// ===================================
// 4. FOLDER-LEVEL AUTHORIZATION
// ===================================

builder.Services.AddRazorPages(options =>
{
    options.Conventions.AuthorizeFolder("/Admin", "Admin"); // Require Admin role for /Admin/*
    options.Conventions.AuthorizeFolder("/Clients", "Client"); // Require Client role for /Clients/*
    options.Conventions.AuthorizeFolder("/Drivers", "Driver"); // Require Driver role for /Drivers/*
});

// ===================================
// 5. BUILD APP
// ===================================

var app = builder.Build();

// ===================================
// 6. CONFIGURE HTTP REQUEST PIPELINE
// ===================================

// Exception handler for production
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
}

// Enable static files (CSS, JS, images)
app.UseStaticFiles();

// Enable routing
app.UseRouting();

// Enable authentication (must be before authorization)
app.UseAuthentication();

// Enable authorization
app.UseAuthorization();

// ===================================
// 7. ENDPOINT CONFIGURATION
// ===================================

app.UseEndpoints(endpoints =>
{
    // Map Razor Pages
    endpoints.MapRazorPages();

    // Redirect root URL to Login page
    endpoints.MapGet("/", context =>
    {
        context.Response.Redirect("/Login");
        return Task.CompletedTask;
    });
});

// ===================================
// 8. RUN APPLICATION
// ===================================

app.Run();
```

---

### Middleware Pipeline Order

**Critical Order** (Must follow this sequence):

```
1. Exception Handler (app.UseExceptionHandler)
2. Static Files (app.UseStaticFiles)
3. Routing (app.UseRouting)
4. Authentication (app.UseAuthentication) ← BEFORE Authorization
5. Authorization (app.UseAuthorization)
6. Endpoints (app.UseEndpoints)
```

**Why Order Matters**:
- **Authentication before Authorization**: Must identify user before checking permissions
- **Routing before Authentication**: Need to know which endpoint is being accessed
- **Static Files early**: Allow CSS/JS to load without authentication

---

### Configuration Files

#### appsettings.json

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "ConnectionStrings": {
    "connstring": "Data Source=DESKTOP-6F3M6TN\\SQLEXPRESS;Initial Catalog=BusManagementDB;Integrated Security=True;TrustServerCertificate=True"
  },
  "AllowedHosts": "*"
}
```

**Configuration Sections**:
- **Logging**: Configure log levels for different components
- **ConnectionStrings**: Database connection string
- **AllowedHosts**: Allowed host headers (security feature)

#### appsettings.Development.json

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Debug",
      "Microsoft.AspNetCore": "Information"
    }
  }
}
```

**Development-Specific Settings**:
- More verbose logging
- Debug mode enabled
- Development database connection (if different)

---

## Authentication & Authorization

### Authentication Flow

```
┌─────────────┐
│ User visits │
│  any page   │
└──────┬──────┘
       │
       ▼
┌─────────────────┐     No      ┌────────────────┐
│ Has auth cookie?├─────────────►│ Redirect to    │
└────────┬────────┘              │ /Login         │
         │ Yes                   └────────────────┘
         ▼
┌─────────────────┐     No      ┌────────────────┐
│ Has required    ├─────────────►│ Redirect to    │
│ role?           │              │ /AccessDenied  │
└────────┬────────┘              └────────────────┘
         │ Yes
         ▼
┌─────────────────┐
│ Allow access to │
│ requested page  │
└─────────────────┘
```

### Login Process (Login.cshtml.cs)

**Step-by-Step Flow**:

```csharp
public IActionResult OnPost()
{
    // 1. Validate input
    if (!ModelState.IsValid)
        return Page();

    // 2. Encrypt password
    string encryptedPassword = EncryptPassword(Password);

    // 3. Query database based on user type
    string query = string.Empty;
    if (UserType == "Client")
        query = "SELECT ClientId FROM Clients WHERE Email = @Email AND Password = @Password";
    else if (UserType == "Driver")
        query = "SELECT DriverId FROM Drivers WHERE Email = @Email AND Password = @Password";
    else if (UserType == "Admin")
        query = "SELECT AdminId FROM Admins WHERE Email = @Email AND Password = @Password";

    // 4. Execute query
    var result = command.ExecuteScalar();
    if (result != null)
    {
        userId = Convert.ToInt32(result);
        isAuthenticated = true;
    }

    // 5. Create claims if authenticated
    if (isAuthenticated)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Name, Email!),
            new Claim(ClaimTypes.Role, userRole),
            new Claim("UserId", userId.ToString())
        };

        // 6. Create identity and principal
        var claimsIdentity = new ClaimsIdentity(claims, "CookieAuth");
        var claimsPrincipal = new ClaimsPrincipal(claimsIdentity);

        // 7. Sign in user (create cookie)
        HttpContext.SignInAsync("CookieAuth", claimsPrincipal).Wait();

        // 8. Redirect based on role
        if (userRole == "Client") return RedirectToPage("/Clients/Index");
        if (userRole == "Driver") return RedirectToPage("/Drivers/Index");
        if (userRole == "Admin") return RedirectToPage("/Admin/Index");
    }

    return Page();
}
```

**Claims Created**:

| Claim Type | Example Value | Purpose |
|------------|---------------|---------|
| `ClaimTypes.Name` | `user@example.com` | User's email address |
| `ClaimTypes.Role` | `Client` | User role for authorization |
| `"UserId"` | `5` | User's primary key in database |

---

### Signup Process (Signup.cshtml.cs)

**Key Features**:
- Password hashing (SHA256)
- File upload for driver license photos
- Role-based registration (Client, Driver, Admin)

**Driver Registration (with file upload)**:

```csharp
public async Task<IActionResult> OnPostAsync()
{
    // 1. Encrypt password
    string encryptedPassword = EncryptPassword(Password);

    // 2. Handle file upload for drivers
    if (UserType == "Driver" && LicencePhoto != null)
    {
        var uploadsFolder = Path.Combine(_environment.WebRootPath, "uploads", "licences");
        if (!Directory.Exists(uploadsFolder))
        {
            Directory.CreateDirectory(uploadsFolder);
        }

        // Generate unique filename
        var fileName = $"{Path.GetFileNameWithoutExtension(LicencePhoto.FileName)}_{Guid.NewGuid().ToString().Substring(0, 4)}{Path.GetExtension(LicencePhoto.FileName)}";
        var filePath = Path.Combine(uploadsFolder, fileName);

        // Save file
        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await LicencePhoto.CopyToAsync(stream);
        }

        Licencefile = $"/uploads/licences/{fileName}";
    }

    // 3. Insert into database
    var query = "INSERT INTO Drivers (Name, LicenceNumber, LicencePhoto, Email, Password, Phone) " +
                "VALUES (@Name, @LicenceNumber, @LicencePhoto, @Email, @Password, @Phone)";
    
    // Execute query...

    return RedirectToPage("/Index");
}
```

**File Upload Security**:
- File size validation (recommended: max 5MB)
- File type validation (only images)
- Unique filenames to prevent overwriting
- Store files outside of database (in `wwwroot/uploads/`)

---

### Authorization Attributes

**Page-Level Authorization**:

```csharp
// Require authentication (any authenticated user)
[Authorize]
public class PageModel : PageModel { }

// Require specific role
[Authorize(Roles = "Admin")]
public class AdminPageModel : PageModel { }

// Require multiple roles (OR logic)
[Authorize(Roles = "Admin,Client")]
public class PageModel : PageModel { }

// Require policy
[Authorize(Policy = "AdminPolicy")]
public class PageModel : PageModel { }
```

**Folder-Level Authorization** (in Program.cs):

```csharp
builder.Services.AddRazorPages(options =>
{
    options.Conventions.AuthorizeFolder("/Admin", "Admin");
    options.Conventions.AuthorizeFolder("/Clients", "Client");
    options.Conventions.AuthorizeFolder("/Drivers", "Driver");
});
```

**Access Control in Views**:

```html
@* Check if user is authenticated *@
@if (User.Identity?.IsAuthenticated == true)
{
    <p>Welcome, @User.Identity.Name!</p>
}

@* Check user role *@
@if (User.IsInRole("Admin"))
{
    <a href="/Admin/Index">Admin Dashboard</a>
}

@* Check claim *@
@if (User.HasClaim(c => c.Type == "UserId"))
{
    <p>User ID: @User.FindFirst("UserId")?.Value</p>
}
```

---

## UI Framework & Design

### Design System

**Color Palette** (CSS Variables in `site.css`):

```css
:root {
  --primary-color: #6366f1;       /* Indigo - Primary actions */
  --primary-dark: #4f46e5;        /* Darker indigo - Hover states */
  --primary-light: #818cf8;       /* Light indigo - Backgrounds */
  --secondary-color: #ec4899;     /* Pink - Secondary actions */
  --accent-color: #f59e0b;        /* Amber - Highlights */
  --success-color: #10b981;       /* Green - Success states */
  --danger-color: #ef4444;        /* Red - Errors/warnings */
  --warning-color: #f59e0b;       /* Amber - Warnings */
  --dark-bg: #0f172a;             /* Dark slate - Dark backgrounds */
  --dark-card: #1e293b;           /* Slate - Card backgrounds */
  --light-bg: #f8fafc;            /* Light gray - Page backgrounds */
  --text-primary: #1e293b;        /* Dark gray - Primary text */
  --text-secondary: #64748b;      /* Medium gray - Secondary text */
  --text-light: #94a3b8;          /* Light gray - Muted text */
  --border-color: #e2e8f0;        /* Light gray - Borders */
}
```

**Using CSS Variables**:

```css
.button {
  background: var(--primary-color);
  color: white;
}

.button:hover {
  background: var(--primary-dark);
}
```

---

### Typography

**Font Family**: Google Fonts - Inter

```html
<!-- In _Layout.cshtml head -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
```

**Font Sizes**:

```css
html {
  font-size: 14px; /* Base size */
}

@media (min-width: 768px) {
  html {
    font-size: 16px; /* Desktop size */
  }
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
}
```

**Heading Styles**:

```css
h1, h2, h3, h4, h5, h6 {
  font-weight: 700;
  line-height: 1.2;
  color: var(--text-primary);
}

.display-1, .display-2, .display-3, .display-4 {
  font-weight: 800;
  letter-spacing: -0.02em;
}
```

---

### Icons

**Font Awesome 6.4.0**:

```html
<!-- In _Layout.cshtml head -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
```

**Common Icons Used**:

| Icon | Class | Usage |
|------|-------|-------|
| 🚌 | `fas fa-bus` | Buses |
| 🛣️ | `fas fa-route` | Routes |
| 📅 | `fas fa-calendar-alt` | Schedules |
| 🎫 | `fas fa-ticket-alt` | Tickets |
| 👤 | `fas fa-user` | User profile |
| 🔒 | `fas fa-lock` | Security/login |
| 🏠 | `fas fa-home` | Home/dashboard |
| ⚙️ | `fas fa-cogs` | Settings |
| 📊 | `fas fa-chart-bar` | Analytics |
| ✓ | `fas fa-check` | Success |
| ✗ | `fas fa-times` | Error/close |

**Usage in HTML**:

```html
<i class="fas fa-bus me-2"></i>Buses
```

---

## Shared Layouts

### 1. _Layout.cshtml

**Purpose**: Master layout template for all pages (if used).

**Current Setup**: Most pages use custom layouts (null layout).

**Typical Structure**:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>@ViewData["Title"] - Bus Management System</title>
    
    <!-- Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
    
    <!-- Bootstrap -->
    <link rel="stylesheet" href="~/lib/bootstrap/dist/css/bootstrap.min.css" />
    
    <!-- Custom CSS -->
    <link rel="stylesheet" href="~/css/site.css" asp-append-version="true" />
</head>
<body>
    <!-- Navigation (role-specific) -->
    @await Html.PartialAsync("AdminNavigation")
    
    <!-- Main Content -->
    <main>
        @RenderBody()
    </main>
    
    <!-- Footer -->
    <footer class="footer">
        <div class="container">
            <span class="text-muted">&copy; 2025 - Bus Management System</span>
        </div>
    </footer>
    
    <!-- Scripts -->
    <script src="~/lib/jquery/dist/jquery.min.js"></script>
    <script src="~/lib/bootstrap/dist/js/bootstrap.bundle.min.js"></script>
    <script src="~/js/site.js" asp-append-version="true"></script>
    
    @await RenderSectionAsync("Scripts", required: false)
</body>
</html>
```

---

### 2. _ViewStart.cshtml

**Purpose**: Set default layout for all Razor Pages.

```cshtml
@{
    Layout = "_Layout";
}
```

**Note**: Many pages in this project override with `Layout = null` for custom layouts.

---

### 3. _ViewImports.cshtml

**Purpose**: Import common namespaces and tag helpers.

```cshtml
@using BusManagement
@using BusManagement.Pages
@using BusManagement.Models
@namespace BusManagement.Pages
@addTagHelper *, Microsoft.AspNetCore.Mvc.TagHelpers
```

**Benefits**:
- No need to repeat `@using` statements in every page
- Tag helpers available globally
- Consistent namespace usage

---

## Navigation Components

### 1. AdminNavigation.cshtml

**Purpose**: Navigation bar for Admin users.

**Location**: `Pages/Shared/AdminNavigation.cshtml`

```html
<nav class="navbar navbar-expand-lg navbar-light bg-light">
    <div class="container-fluid">
        <a class="navbar-brand" href="/Admin/Index">
            <i class="fas fa-bus me-2"></i>Bus Management
        </a>
        
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" 
                data-bs-target="#adminNavbar">
            <span class="navbar-toggler-icon"></span>
        </button>
        
        <div class="collapse navbar-collapse" id="adminNavbar">
            <ul class="navbar-nav me-auto mb-2 mb-lg-0">
                <li class="nav-item">
                    <a class="nav-link" href="/Admin/Index">
                        <i class="fas fa-home me-1"></i>Dashboard
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="/Admin/Buses/ManageBuses">
                        <i class="fas fa-bus me-1"></i>Buses
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="/Admin/Routes/ManageRoutes">
                        <i class="fas fa-route me-1"></i>Routes
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="/Admin/Schedules/ManageSchedules">
                        <i class="fas fa-calendar-alt me-1"></i>Schedules
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="/Admin/AssignDrivers/ManageAssignDrivers">
                        <i class="fas fa-id-card me-1"></i>Drivers
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="/Admin/Tickets/ViewTickets">
                        <i class="fas fa-ticket-alt me-1"></i>Tickets
                    </a>
                </li>
            </ul>
            
            <ul class="navbar-nav">
                <li class="nav-item">
                    <a class="nav-link" href="/Logout">
                        <i class="fas fa-sign-out-alt me-1"></i>Logout
                    </a>
                </li>
            </ul>
        </div>
    </div>
</nav>
```

**CSS Styling** (from `site.css`):

```css
.navbar {
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(10px);
  box-shadow: var(--shadow-md);
  padding: 1rem 0;
  transition: var(--transition);
  border-bottom: 1px solid var(--border-color) !important;
}

.navbar-brand {
  font-weight: 800;
  font-size: 1.5rem;
  color: var(--primary-color);
  transition: var(--transition);
}

.navbar-brand:hover {
  transform: scale(1.05);
}

.nav-link {
  font-weight: 500;
  color: var(--text-secondary) !important;
  padding: 0.5rem 1rem !important;
  border-radius: var(--radius-md);
  transition: var(--transition);
  position: relative;
}

.nav-link:hover {
  color: var(--primary-color) !important;
  background: rgba(99, 102, 241, 0.1);
  transform: translateY(-2px);
}
```

---

### 2. ClientNavigation.cshtml

**Purpose**: Navigation bar for Client users.

**Similar Structure** with client-specific links:
- Dashboard (`/Clients/Index`)
- Purchase Tickets (`/Clients/Purchase`)
- My Tickets (`/Clients/Tickets`)
- Profile
- Logout

---

### 3. DriverNavigation.cshtml

**Purpose**: Navigation bar for Driver users.

**Driver-Specific Links**:
- Dashboard (`/Drivers/Index`)
- My Schedule (`/Drivers/Schedule`)
- Routes (`/Drivers/Routes`)
- Profile
- Logout

---

## CSS Styling Guide

### Button Styles

```css
.btn {
  font-weight: 600;
  padding: 0.625rem 1.5rem;
  border-radius: var(--radius-md);
  transition: var(--transition);
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  text-decoration: none;
}

.btn:focus, .btn:active:focus {
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.3) !important;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
  box-shadow: var(--shadow-md);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  background: var(--primary-dark);
}
```

**Usage**:

```html
<button class="btn btn-primary">
    <i class="fas fa-save me-2"></i>Save
</button>
```

---

### Card Styles

```css
.card {
  border: none;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  transition: var(--transition);
  overflow: hidden;
  background: white;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-xl);
}

.card-header {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 1.5rem;
  font-weight: 600;
}

.card-body {
  padding: 1.5rem;
}
```

**Usage**:

```html
<div class="card">
    <div class="card-header">
        <i class="fas fa-bus me-2"></i>Bus Information
    </div>
    <div class="card-body">
        <p>Bus Number: ABC-123</p>
    </div>
</div>
```

---

### Form Styles

```css
.form-control, .form-select {
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 0.75rem 1rem;
  transition: var(--transition);
  font-size: 1rem;
}

.form-control:focus, .form-select:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1) !important;
  outline: none;
}

.form-label {
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
  font-size: 0.925rem;
}
```

---

### Alert Styles

```css
.alert {
  border: none;
  border-radius: var(--radius-lg);
  padding: 1rem 1.25rem;
  font-weight: 500;
  border-left: 4px solid;
}

.alert-danger {
  background: rgba(239, 68, 68, 0.1);
  border-left-color: var(--danger-color);
  color: #991b1b;
}

.alert-success {
  background: rgba(16, 185, 129, 0.1);
  border-left-color: var(--success-color);
  color: #065f46;
}

.alert-warning {
  background: rgba(245, 158, 11, 0.1);
  border-left-color: var(--warning-color);
  color: #92400e;
}
```

**Usage**:

```html
@if (Model.ErrorMessage != null)
{
    <div class="alert alert-danger">
        <i class="fas fa-exclamation-circle me-2"></i>
        @Model.ErrorMessage
    </div>
}
```

---

### Responsive Design

**Breakpoints**:

```css
/* Mobile: < 768px */
@media (max-width: 768px) {
  .card {
    margin-bottom: 1.5rem;
  }
  
  .navbar-brand {
    font-size: 1.25rem;
  }
  
  .btn {
    padding: 0.5rem 1rem;
  }
}

/* Tablet: 768px - 992px */
@media (min-width: 768px) and (max-width: 992px) {
  .container {
    max-width: 720px;
  }
}

/* Desktop: > 992px */
@media (min-width: 992px) {
  .container {
    max-width: 960px;
  }
}
```

---

## JavaScript & Client-Side Logic

### site.js

**Location**: `wwwroot/js/site.js`

**Common Functions**:

```javascript
// Confirmation dialogs
function confirmDelete(entityName) {
    return confirm(`Are you sure you want to delete this ${entityName}?`);
}

// Form validation
function validateForm(formId) {
    const form = document.getElementById(formId);
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return false;
    }
    return true;
}

// Update current time (for dashboards)
function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
    });
    const timeElement = document.getElementById('currentTime');
    if (timeElement) {
        timeElement.textContent = timeString;
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Update time every minute
    updateTime();
    setInterval(updateTime, 60000);
    
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});
```

---

### Bootstrap JavaScript Components

**Modal Example**:

```html
<!-- Button trigger modal -->
<button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#exampleModal">
    Open Modal
</button>

<!-- Modal -->
<div class="modal fade" id="exampleModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Modal title</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <p>Modal body content...</p>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                <button type="button" class="btn btn-primary">Save changes</button>
            </div>
        </div>
    </div>
</div>
```

**Tabs Example** (used in Driver Schedule page):

```html
<ul class="nav nav-tabs" id="myTab" role="tablist">
    <li class="nav-item" role="presentation">
        <button class="nav-link active" data-bs-toggle="tab" data-bs-target="#home">Home</button>
    </li>
    <li class="nav-item" role="presentation">
        <button class="nav-link" data-bs-toggle="tab" data-bs-target="#profile">Profile</button>
    </li>
</ul>

<div class="tab-content" id="myTabContent">
    <div class="tab-pane fade show active" id="home">Home content...</div>
    <div class="tab-pane fade" id="profile">Profile content...</div>
</div>
```

---

## Error Handling

### 1. Error.cshtml

**Purpose**: Centralized error page for unhandled exceptions.

```cshtml
@page
@model ErrorModel
@{
    ViewData["Title"] = "Error";
}

<div class="container mt-5">
    <div class="row justify-content-center">
        <div class="col-md-8">
            <div class="card">
                <div class="card-body text-center">
                    <i class="fas fa-exclamation-triangle text-danger" style="font-size: 4rem;"></i>
                    <h1 class="mt-4">Oops! Something went wrong</h1>
                    <p class="text-muted">We're sorry, but an error occurred while processing your request.</p>
                    
                    @if (Model.ShowRequestId)
                    {
                        <p>
                            <strong>Request ID:</strong> <code>@Model.RequestId</code>
                        </p>
                    }
                    
                    <a href="/" class="btn btn-primary mt-3">
                        <i class="fas fa-home me-2"></i>Go Home
                    </a>
                </div>
            </div>
        </div>
    </div>
</div>
```

**Error.cshtml.cs**:

```csharp
public class ErrorModel : PageModel
{
    public string? RequestId { get; set; }
    public bool ShowRequestId => !string.IsNullOrEmpty(RequestId);

    public void OnGet()
    {
        RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier;
    }
}
```

---

### 2. AccessDenied.cshtml

**Purpose**: Shown when user tries to access a page without proper authorization.

```cshtml
@page
@{
    ViewData["Title"] = "Access Denied";
}

<div class="container mt-5">
    <div class="row justify-content-center">
        <div class="col-md-8">
            <div class="card">
                <div class="card-body text-center">
                    <i class="fas fa-lock text-warning" style="font-size: 4rem;"></i>
                    <h1 class="mt-4">Access Denied</h1>
                    <p class="text-muted">You do not have permission to access this page.</p>
                    
                    <div class="mt-4">
                        <a href="javascript:history.back()" class="btn btn-secondary me-2">
                            <i class="fas fa-arrow-left me-2"></i>Go Back
                        </a>
                        <a href="/Logout" class="btn btn-primary">
                            <i class="fas fa-sign-out-alt me-2"></i>Logout
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
```

---

### 3. Logout.cshtml.cs

**Purpose**: Sign out user and clear authentication cookie.

```csharp
public class LogoutModel : PageModel
{
    public async Task<IActionResult> OnGet()
    {
        // Sign out user
        await HttpContext.SignOutAsync("CookieAuth");
        
        // Redirect to login page
        return RedirectToPage("/Login");
    }
}
```

---

## Best Practices

### 1. Consistent Naming Conventions

**CSS Classes**:
- Use kebab-case: `.admin-header`, `.nav-link`
- Prefix custom classes: `.custom-card`, `.custom-btn`
- Use BEM methodology for complex components

**JavaScript**:
- Use camelCase: `updateTime()`, `validateForm()`
- Descriptive function names

**C# Files**:
- PascalCase for classes and methods: `LoginModel`, `OnPost()`
- camelCase for local variables: `userId`, `connectionString`

---

### 2. Performance Optimization

**CSS**:
- Minimize use of `!important`
- Use CSS variables for theme consistency
- Optimize selectors (avoid deep nesting)

**JavaScript**:
- Load scripts at end of body (or use `defer`)
- Minimize DOM manipulation
- Use event delegation for dynamic content

**Images**:
- Optimize file sizes
- Use appropriate formats (PNG for logos, JPG for photos)
- Lazy load images below the fold

---

### 3. Accessibility

**Semantic HTML**:
```html
<nav> for navigation
<main> for main content
<article> for independent content
<section> for thematic grouping
```

**ARIA Labels**:
```html
<button aria-label="Close modal" class="btn-close"></button>
<img src="logo.png" alt="Bus Management System Logo">
```

**Keyboard Navigation**:
- Ensure all interactive elements are keyboard accessible
- Use `tabindex` appropriately
- Visible focus indicators

---

### 4. SEO & Meta Tags

```html
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Bus Management System - Manage your bus fleet efficiently" />
    <meta name="keywords" content="bus, management, tickets, scheduling" />
    <title>@ViewData["Title"] - Bus Management System</title>
</head>
```

---

### 5. Browser Compatibility

**CSS Prefixes** (handled by Bootstrap):
```css
-webkit-transform: translateY(-5px);
-ms-transform: translateY(-5px);
transform: translateY(-5px);
```

**Supported Browsers**:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- IE 11 (with polyfills)

---

## Testing Checklist

### UI Testing
- [ ] All pages render correctly on desktop
- [ ] All pages render correctly on mobile
- [ ] Navigation works on all screen sizes
- [ ] Forms are usable and validated
- [ ] Buttons have appropriate hover/active states
- [ ] Icons display correctly
- [ ] Colors are consistent across pages

### Accessibility Testing
- [ ] All images have alt text
- [ ] Forms have proper labels
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast meets WCAG standards

### Cross-Browser Testing
- [ ] Test on Chrome
- [ ] Test on Firefox
- [ ] Test on Safari
- [ ] Test on Edge
- [ ] Test on mobile browsers

---

## Troubleshooting

### Issue: CSS changes not reflecting
**Solutions**:
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+F5)
3. Check `asp-append-version="true"` in link tag
4. Verify file path is correct

### Issue: JavaScript not working
**Solutions**:
1. Check browser console for errors (F12)
2. Ensure jQuery loads before Bootstrap
3. Verify script order in HTML
4. Check for syntax errors

### Issue: Bootstrap components not working
**Solutions**:
1. Ensure Bootstrap JS is loaded
2. Check jQuery is loaded first
3. Verify `data-bs-*` attributes (Bootstrap 5 uses `bs-` prefix)
4. Check modal/tab IDs match triggers

---

## Future Enhancements

1. **Dark Mode**: Toggle between light and dark themes
2. **Progressive Web App**: Make the app installable
3. **Real-Time Updates**: Use SignalR for live updates
4. **Advanced Animations**: GSAP or Framer Motion
5. **Localization**: Multi-language support (i18n)
6. **Offline Support**: Service workers for offline functionality
7. **Print Styles**: Optimize pages for printing
8. **Dashboard Widgets**: Draggable, customizable dashboard
9. **Chart Library**: Add Chart.js for analytics
10. **Notification System**: Toast notifications for user feedback

---

## Contact & Support

**Developer**: Gerard  
**Module**: UI Framework, Authentication, Application Configuration  
**Last Updated**: December 2025

For questions or issues, refer to this documentation or contact the project lead.


