# Bus Management System - Complete Project Documentation

**Version**: 1.0  
**Last Updated**: December 2025  
**Framework**: ASP.NET Core 8.0 Razor Pages

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Team & Task Allocation](#team--task-allocation)
5. [Documentation Index](#documentation-index)
6. [Getting Started](#getting-started)
7. [Project Structure](#project-structure)
8. [Database Schema](#database-schema)
9. [User Roles & Permissions](#user-roles--permissions)
10. [Features Overview](#features-overview)
11. [Development Guidelines](#development-guidelines)
12. [Deployment](#deployment)
13. [Troubleshooting](#troubleshooting)
14. [Contributing](#contributing)

---

## 🚀 Project Overview

The **Bus Management System** is a comprehensive web application designed to manage all aspects of a bus transportation service. It provides separate portals for three distinct user roles:

- **Admins**: Complete control over buses, routes, schedules, driver assignments, and system oversight
- **Clients**: Browse schedules, purchase tickets, receive PDF tickets via email, and manage bookings
- **Drivers**: View assigned buses, routes, and schedules for daily operations

### Key Features

✅ **Role-Based Access Control**: Secure authentication with role-specific dashboards  
✅ **Bus Fleet Management**: Add, edit, and track buses with status monitoring  
✅ **Route Management**: Define routes with distance and pricing  
✅ **Schedule Management**: Link buses to routes with departure/arrival times  
✅ **Ticket Booking System**: Online ticket purchase with instant confirmation  
✅ **PDF Ticket Generation**: Automatic PDF creation using iTextSharp  
✅ **Email Integration**: Automated ticket delivery via Gmail SMTP  
✅ **Driver Assignment**: Assign drivers to specific buses  
✅ **Responsive Design**: Modern UI that works on desktop, tablet, and mobile

---

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Login/  │  │  Admin   │  │  Client  │  │  Driver  │   │
│  │  Signup  │  │  Pages   │  │  Pages   │  │  Pages   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│       Razor Pages with Bootstrap 5 + Custom CSS            │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Authentication│  │ Authorization│  │   Business   │     │
│  │   (Cookie)    │  │   (Roles)    │  │    Logic     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│        ASP.NET Core 8.0 Middleware & Services              │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                    Data Access Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   ADO.NET    │  │   Dapper     │  │  SqlClient   │     │
│  │  (Primary)   │  │  (Optional)  │  │   Library    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                    Database Layer                            │
│        SQL Server Express - BusManagementDB                 │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐  │
│  │Clients │ │Drivers │ │ Admins │ │ Buses  │ │ Routes │  │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘  │
│  ┌────────┐ ┌────────────────────┐ ┌────────────────┐    │
│  │Schedule│ │ DriverAssignments  │ │    Tickets     │    │
│  └────────┘ └────────────────────┘ └────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Request Flow

```
User Request → Routing → Authentication → Authorization → Page Handler → Database → Response
```

1. **User makes request** (e.g., `/Admin/Buses/ManageBuses`)
2. **Routing** matches URL to Razor Page
3. **Authentication middleware** checks for valid cookie
4. **Authorization middleware** verifies user has required role
5. **Page Handler** executes (`OnGet()` or `OnPost()`)
6. **Database query** via ADO.NET
7. **Response rendered** and sent to browser

---

## 💻 Technology Stack

### Backend
- **Framework**: ASP.NET Core 8.0
- **Language**: C# 12
- **Architecture**: Razor Pages (Page-based MVC)
- **Data Access**: ADO.NET with Microsoft.Data.SqlClient
- **Authentication**: Cookie-based authentication
- **Authorization**: Role-based (Admin, Client, Driver)

### Frontend
- **UI Framework**: Bootstrap 5.3
- **CSS**: Custom CSS with CSS Variables
- **Icons**: Font Awesome 6.4.0
- **Fonts**: Google Fonts (Inter)
- **JavaScript**: Vanilla JS + Bootstrap JS

### Database
- **DBMS**: Microsoft SQL Server Express
- **ORM**: None (Direct ADO.NET)
- **Database Name**: BusManagementDB

### External Libraries
- **iTextSharp 5.5.13.4**: PDF generation for tickets
- **MailKit 4.11.0**: Email service for ticket delivery
- **Dapper 2.1.35**: Lightweight ORM (installed but not actively used)
- **System.Data.SqlClient 4.9.0**: Legacy SQL client (backup)

---

## 👥 Team & Task Allocation

| Developer | Module | Responsibilities | Documentation |
|-----------|--------|------------------|---------------|
| **Yvan** | Admin | Bus/Route/Schedule/Driver management, Admin dashboard | [01_ADMIN_DOCUMENTATION_Yvan.md](01_ADMIN_DOCUMENTATION_Yvan.md) |
| **Didace** | Client | Ticket booking, PDF generation, Email integration | [02_CLIENT_DOCUMENTATION_Didace.md](02_CLIENT_DOCUMENTATION_Didace.md) |
| **Abdias** | Drivers | Driver portal, Route viewing, Schedule viewing | [03_DRIVERS_DOCUMENTATION_Abdias.md](03_DRIVERS_DOCUMENTATION_Abdias.md) |
| **Luccin** | Database | Database design, Stored procedures, Views, Backup | [04_DATABASE_DOCUMENTATION_Luccin.md](04_DATABASE_DOCUMENTATION_Luccin.md) |
| **Gerard** | UI & Logic | Authentication, UI/UX, Shared layouts, Program.cs | [05_UI_OTHER_LOGIC_DOCUMENTATION_Gerard.md](05_UI_OTHER_LOGIC_DOCUMENTATION_Gerard.md) |

---

## 📚 Documentation Index

Each module has its own comprehensive documentation:

### 1. Admin Module (Yvan)
**File**: [01_ADMIN_DOCUMENTATION_Yvan.md](01_ADMIN_DOCUMENTATION_Yvan.md)

**Contents**:
- Admin Dashboard
- Bus Management (Add, Edit, Delete)
- Route Management
- Schedule Management
- Driver Assignment
- Ticket Viewing
- Database Operations
- Security & Authorization

---

### 2. Client Module (Didace)
**File**: [02_CLIENT_DOCUMENTATION_Didace.md](02_CLIENT_DOCUMENTATION_Didace.md)

**Contents**:
- Client Dashboard
- Schedule Browsing & Filtering
- Ticket Purchase Process
- PDF Ticket Generation (iTextSharp)
- Email Integration (MailKit)
- Ticket History
- Export to PDF

---

### 3. Drivers Module (Abdias)
**File**: [03_DRIVERS_DOCUMENTATION_Abdias.md](03_DRIVERS_DOCUMENTATION_Abdias.md)

**Contents**:
- Driver Dashboard
- Route Viewing
- Schedule Viewing (Driver's assigned buses)
- Driver Profile
- Claims-Based Identity
- Database Queries

---

### 4. Database Module (Luccin)
**File**: [04_DATABASE_DOCUMENTATION_Luccin.md](04_DATABASE_DOCUMENTATION_Luccin.md)

**Contents**:
- Complete Table Schemas
- Relationships & Foreign Keys
- Indexes & Performance
- Stored Procedures
- Views
- Backup & Recovery
- Migration Scripts

---

### 5. UI & Other Logic Module (Gerard)
**File**: [05_UI_OTHER_LOGIC_DOCUMENTATION_Gerard.md](05_UI_OTHER_LOGIC_DOCUMENTATION_Gerard.md)

**Contents**:
- Program.cs Configuration
- Authentication & Authorization Setup
- UI Framework (Bootstrap + Custom CSS)
- Shared Layouts & Navigation
- CSS Styling Guide
- JavaScript & Client-Side Logic
- Error Handling

---

## 🚀 Getting Started

### Prerequisites

1. **Windows 10/11** (or Windows Server)
2. **.NET 8.0 SDK** ([Download](https://dotnet.microsoft.com/download/dotnet/8.0))
3. **SQL Server Express** ([Download](https://www.microsoft.com/en-us/sql-server/sql-server-downloads))
4. **Visual Studio 2022** or **VS Code** with C# extension
5. **SSMS (SQL Server Management Studio)** (Optional, for database management)

---

### Installation Steps

#### 1. Clone or Download Project

```bash
git clone <repository-url>
cd BusManagement
```

#### 2. Setup Database

**Option A: Using SSMS**

1. Open SQL Server Management Studio
2. Connect to your SQL Server instance
3. Open `Database_Setup.sql` (create this file from Database documentation)
4. Execute the script to create database and tables

**Option B: Using Command Line**

```bash
sqlcmd -S localhost\SQLEXPRESS -i Database_Setup.sql
```

**Update Connection String** in `appsettings.json`:

```json
{
  "ConnectionStrings": {
    "connstring": "Data Source=YOUR_SERVER_NAME\\SQLEXPRESS;Initial Catalog=BusManagementDB;Integrated Security=True;TrustServerCertificate=True"
  }
}
```

Replace `YOUR_SERVER_NAME` with your actual server name.

#### 3. Restore NuGet Packages

```bash
dotnet restore
```

#### 4. Build Project

```bash
dotnet build
```

#### 5. Run Application

```bash
dotnet run
```

Or press **F5** in Visual Studio.

#### 6. Access Application

Open browser and navigate to:
- **HTTP**: `http://localhost:5000`
- **HTTPS**: `https://localhost:5001`

You'll be redirected to the login page.

---

### First-Time Setup

#### Create Admin Account

1. Navigate to `/Signup`
2. Select **User Type**: Admin
3. Fill in:
   - Name
   - Email
   - Password
4. Click **Sign Up**

#### Login

1. Navigate to `/Login`
2. Select **User Type**: Admin
3. Enter credentials
4. Click **Login**

You'll be redirected to the Admin Dashboard.

---

## 📁 Project Structure

```
BusManagement/
├── Pages/
│   ├── Admin/                      # Admin module pages
│   │   ├── Index.cshtml            # Admin dashboard
│   │   ├── Buses/                  # Bus management
│   │   ├── Routes/                 # Route management
│   │   ├── Schedules/              # Schedule management
│   │   ├── AssignDrivers/          # Driver assignment
│   │   └── Tickets/                # Ticket viewing
│   ├── Clients/                    # Client module pages
│   │   ├── Index.cshtml            # Client dashboard
│   │   ├── Purchase.cshtml         # Ticket purchase
│   │   ├── Tickets.cshtml          # Ticket history
│   │   └── ExportToPdf.cshtml      # PDF export
│   ├── Drivers/                    # Driver module pages
│   │   ├── Index.cshtml            # Driver dashboard
│   │   ├── Routes.cshtml           # Route viewing
│   │   └── Schedule.cshtml         # Schedule viewing
│   ├── Shared/                     # Shared components
│   │   ├── _Layout.cshtml          # Master layout
│   │   ├── AdminNavigation.cshtml  # Admin navbar
│   │   ├── ClientNavigation.cshtml # Client navbar
│   │   └── DriverNavigation.cshtml # Driver navbar
│   ├── Login.cshtml                # Login page
│   ├── Signup.cshtml               # Registration page
│   ├── Logout.cshtml               # Logout handler
│   ├── Error.cshtml                # Error page
│   ├── AccessDenied.cshtml         # 403 page
│   ├── _ViewStart.cshtml           # Default layout setter
│   └── _ViewImports.cshtml         # Global imports
├── Models/
│   └── ScheduleViewModel.cs        # View models
├── wwwroot/                        # Static files
│   ├── css/
│   │   └── site.css                # Custom CSS
│   ├── js/
│   │   └── site.js                 # Custom JavaScript
│   ├── lib/                        # Client-side libraries
│   │   ├── bootstrap/              # Bootstrap 5
│   │   ├── jquery/                 # jQuery
│   │   └── jquery-validation/      # jQuery Validation
│   └── uploads/                    # Uploaded files
│       └── licences/               # Driver license photos
├── Properties/
│   └── launchSettings.json         # Launch configuration
├── bin/                            # Build output
├── obj/                            # Build artifacts
├── appsettings.json                # Application settings
├── appsettings.Development.json    # Development settings
├── Program.cs                      # Application entry point
└── BusManagement.csproj            # Project file
```

---

## 🗄️ Database Schema

### Entity Relationship Diagram

```
┌─────────┐       ┌─────────┐       ┌─────────┐
│ Admins  │       │ Clients │       │ Drivers │
└─────────┘       └────┬────┘       └────┬────┘
                       │                  │
                       │                  │
                       │                  ▼
                       │         ┌─────────────────────┐
                       │         │ DriverAssignments   │
                       │         └──────────┬──────────┘
                       │                    │
                       │                    ▼
                       │         ┌─────────────────────┐
                       │         │       Buses         │
                       │         └──────────┬──────────┘
                       │                    │
                       │                    ▼
                       │         ┌─────────────────────┐
                       │         │      Schedule       │◄────────┐
                       │         └──────────┬──────────┘         │
                       │                    │                    │
                       │                    │              ┌─────▼────┐
                       │                    │              │  Routes  │
                       │                    ▼              └──────────┘
                       │         ┌─────────────────────┐
                       └────────►│      Tickets        │
                                 └─────────────────────┘
```

### Core Tables

| Table | Rows (Est.) | Description |
|-------|-------------|-------------|
| `Admins` | 1-5 | System administrators |
| `Clients` | 1000+ | Registered customers |
| `Drivers` | 50+ | Bus drivers |
| `Buses` | 20-100 | Bus fleet |
| `Routes` | 10-50 | Available routes |
| `Schedule` | 100+ | Bus schedules |
| `Tickets` | 10000+ | Ticket purchases |
| `DriverAssignments` | 50-100 | Driver-Bus mappings |

For complete schema details, see [04_DATABASE_DOCUMENTATION_Luccin.md](04_DATABASE_DOCUMENTATION_Luccin.md).

---

## 🔐 User Roles & Permissions

### Admin Role

**Access**:
- ✅ All admin pages (`/Admin/*`)
- ❌ Client pages (`/Clients/*`)
- ❌ Driver pages (`/Drivers/*`)

**Capabilities**:
- Manage buses (CRUD operations)
- Manage routes (CRUD operations)
- Manage schedules (CRUD operations)
- Assign drivers to buses
- View all tickets in system
- Access system statistics

---

### Client Role

**Access**:
- ❌ Admin pages (`/Admin/*`)
- ✅ All client pages (`/Clients/*`)
- ❌ Driver pages (`/Drivers/*`)

**Capabilities**:
- Browse available schedules
- Purchase tickets
- View purchased tickets
- Download ticket PDFs
- Receive tickets via email
- Manage profile

---

### Driver Role

**Access**:
- ❌ Admin pages (`/Admin/*`)
- ❌ Client pages (`/Clients/*`)
- ✅ All driver pages (`/Drivers/*`)

**Capabilities**:
- View assigned buses
- View all routes
- View schedules for assigned buses
- View profile information
- Access license information

---

## ✨ Features Overview

### Admin Features

1. **Dashboard**: Overview of system with quick action cards
2. **Bus Management**: Add, edit, delete, and view buses
3. **Route Management**: Define routes with pricing
4. **Schedule Management**: Create schedules linking buses to routes
5. **Driver Assignment**: Assign drivers to specific buses
6. **Ticket Viewing**: View all tickets purchased by clients

---

### Client Features

1. **Dashboard**: Personalized client dashboard
2. **Schedule Browsing**: Filter by route and bus
3. **Ticket Purchase**: One-click ticket booking
4. **PDF Generation**: Automatic ticket PDF creation
5. **Email Delivery**: Tickets sent to registered email
6. **Ticket History**: View all past and upcoming tickets
7. **PDF Download**: Download ticket PDFs anytime

---

### Driver Features

1. **Dashboard**: Driver profile and information
2. **Route Viewing**: See all available routes
3. **Schedule Viewing**: View schedules for assigned buses
4. **Filtering**: Filter by upcoming, today, or all schedules
5. **Journey Details**: See origin, destination, times, and duration

---

## 📝 Development Guidelines

### Code Style

**C# Conventions**:
- PascalCase for classes, methods, properties
- camelCase for local variables, parameters
- Prefix interfaces with `I` (e.g., `IRepository`)
- Use meaningful names (avoid abbreviations)

```csharp
// ✅ Good
public class BusManagementService
{
    public void AddBus(string busNumber, int capacity) { }
}

// ❌ Bad
public class BMS
{
    public void Add(string bn, int c) { }
}
```

---

**Razor Pages**:
- One PageModel per page
- Use `[BindProperty]` for form fields
- Separate GET and POST handlers
- Return `RedirectToPage()` after POST

```csharp
public class AddBusModel : PageModel
{
    [BindProperty]
    public string? BusNumber { get; set; }

    public void OnGet() { }

    public IActionResult OnPost()
    {
        // Process form
        return RedirectToPage("./ManageBuses");
    }
}
```

---

### Database Best Practices

1. **Always use parameterized queries**:
```csharp
// ✅ Correct
command.Parameters.AddWithValue("@BusId", busId);

// ❌ Wrong
query = $"DELETE FROM Buses WHERE BusId = {busId}"; // SQL Injection!
```

2. **Use `using` statements**:
```csharp
using (var connection = new SqlConnection(_connectionString))
{
    connection.Open();
    // Operations
} // Auto-dispose
```

3. **Handle exceptions**:
```csharp
try
{
    // Database operations
}
catch (SqlException ex)
{
    _logger.LogError(ex, "Database error");
}
```

---

### Git Workflow

1. **Branch Naming**:
   - Feature: `feature/add-bus-management`
   - Bug Fix: `bugfix/fix-ticket-pdf`
   - Hotfix: `hotfix/security-patch`

2. **Commit Messages**:
   ```
   [Module] Brief description
   
   Detailed explanation if needed
   ```
   
   Example:
   ```
   [Admin] Add bus management functionality
   
   - Created ManageBuses page
   - Implemented CRUD operations
   - Added validation
   ```

3. **Pull Request Process**:
   - Create feature branch
   - Make changes
   - Test locally
   - Create PR with description
   - Request review
   - Merge after approval

---

## 🚢 Deployment

### IIS Deployment (Windows Server)

1. **Publish Application**:
```bash
dotnet publish -c Release -o ./publish
```

2. **Configure IIS**:
   - Install .NET 8 Hosting Bundle
   - Create new website in IIS Manager
   - Point to publish folder
   - Set application pool to "No Managed Code"

3. **Update Connection String** in `appsettings.json`:
```json
{
  "ConnectionStrings": {
    "connstring": "Data Source=PRODUCTION_SERVER;Initial Catalog=BusManagementDB;User Id=app_user;Password=secure_password;"
  }
}
```

4. **Set Environment**:
```xml
<!-- web.config -->
<aspNetCore processPath="dotnet" arguments=".\BusManagement.dll" 
            stdoutLogEnabled="false" stdoutLogFile=".\logs\stdout" 
            hostingModel="inprocess">
  <environmentVariables>
    <environmentVariable name="ASPNETCORE_ENVIRONMENT" value="Production" />
  </environmentVariables>
</aspNetCore>
```

---

### Azure App Service Deployment

1. **Create App Service** in Azure Portal
2. **Configure Connection String** in Application Settings
3. **Deploy via GitHub Actions**:

```yaml
name: Deploy to Azure
on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: windows-latest
    steps:
    - uses: actions/checkout@v2
    - name: Setup .NET
      uses: actions/setup-dotnet@v1
      with:
        dotnet-version: '8.0.x'
    - name: Publish
      run: dotnet publish -c Release -o ./publish
    - name: Deploy to Azure
      uses: azure/webapps-deploy@v2
      with:
        app-name: 'bus-management-app'
        publish-profile: ${{ secrets.AZURE_PUBLISH_PROFILE }}
        package: ./publish
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Database Connection Fails

**Error**: `A network-related or instance-specific error occurred`

**Solutions**:
- Verify SQL Server is running
- Check server name in connection string
- Enable TCP/IP in SQL Server Configuration Manager
- Check firewall settings

---

#### 2. Login Not Working

**Error**: User credentials correct but login fails

**Solutions**:
- Check password hashing (SHA256)
- Verify `UserType` matches database table (Client/Driver/Admin)
- Check database for user record
- Clear browser cookies

---

#### 3. Authorization Fails

**Error**: Redirected to `/AccessDenied` when accessing page

**Solutions**:
- Verify user has correct role in claims
- Check folder authorization in `Program.cs`
- Ensure user is logged in
- Check page `[Authorize]` attribute

---

#### 4. Email Not Sending

**Error**: Tickets not arriving via email

**Solutions**:
- Verify Gmail credentials
- Use app-specific password (not regular password)
- Enable "Less secure app access" or use OAuth
- Check SMTP settings (smtp.gmail.com:587)
- Verify firewall allows outbound SMTP

---

#### 5. PDF Generation Fails

**Error**: Exception during ticket PDF creation

**Solutions**:
- Ensure iTextSharp package is installed
- Check for null ticket data
- Verify MemoryStream is not disposed prematurely
- Add try-catch around PDF generation

---

## 🤝 Contributing

### How to Contribute

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open Pull Request**

### Code Review Checklist

- [ ] Code follows project conventions
- [ ] All tests pass
- [ ] No linting errors
- [ ] Documentation updated
- [ ] SQL queries are parameterized
- [ ] Error handling implemented
- [ ] UI is responsive
- [ ] Accessibility guidelines followed

---

## 📞 Contact & Support

### Team Contacts

| Name | Role | Module | Email |
|------|------|--------|-------|
| Yvan | Developer | Admin | yvan@example.com |
| Didace | Developer | Client | didace@example.com |
| Abdias | Developer | Drivers | abdias@example.com |
| Luccin | Developer | Database | luccin@example.com |
| Gerard | Developer | UI & Logic | gerard@example.com |

---

## 📄 License

This project is developed for educational purposes as part of a learning project.

---

## 🙏 Acknowledgments

- **ASP.NET Core Team**: For the excellent framework
- **Bootstrap Team**: For the UI framework
- **Font Awesome**: For the icon library
- **iTextSharp**: For PDF generation capabilities
- **MailKit**: For email functionality

---

## 📚 Additional Resources

### Official Documentation
- [ASP.NET Core Documentation](https://docs.microsoft.com/en-us/aspnet/core/)
- [Razor Pages Tutorial](https://docs.microsoft.com/en-us/aspnet/core/razor-pages/)
- [Bootstrap 5 Documentation](https://getbootstrap.com/docs/5.3/)
- [SQL Server Documentation](https://docs.microsoft.com/en-us/sql/sql-server/)

### Tutorials
- [Authentication in ASP.NET Core](https://docs.microsoft.com/en-us/aspnet/core/security/authentication/)
- [Entity Framework Core](https://docs.microsoft.com/en-us/ef/core/) (for future migration)
- [iTextSharp Tutorial](http://developers.itextpdf.com/)
- [MailKit Documentation](https://github.com/jstedfast/MailKit)

---

## 📊 Project Statistics

- **Total Lines of Code**: ~15,000+
- **Number of Pages**: 30+
- **Database Tables**: 8
- **Stored Procedures**: 5+
- **API Endpoints**: 50+
- **Development Time**: 3-6 months
- **Team Size**: 5 developers

---

## 🗺️ Roadmap

### Version 1.1 (Planned)
- [ ] Seat selection functionality
- [ ] Payment gateway integration (Stripe/PayPal)
- [ ] SMS notifications
- [ ] Advanced search filters
- [ ] Dashboard analytics

### Version 2.0 (Future)
- [ ] Mobile app (Xamarin/Flutter)
- [ ] Real-time bus tracking (GPS)
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Progressive Web App (PWA)

---

**Happy Coding! 🚀**

For detailed information on specific modules, please refer to the individual documentation files listed in the [Documentation Index](#documentation-index).


