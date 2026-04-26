# Bus Management API

A .NET Core 8 REST API for bus transportation management with Permission-Based Access Control (PBAC).

## Features

- User authentication with JWT tokens
- Permission-based access control (PBAC)
- Bus fleet management
- Route management
- Schedule management
- Ticket booking system
- Driver assignment management

## Tech Stack

- .NET 8
- Entity Framework Core 8
- SQL Server
- JWT Authentication
- BCrypt password hashing
- Swagger/OpenAPI

## Quick Start

### Prerequisites

- .NET 8 SDK
- SQL Server (LocalDB, Express, or full)
- Visual Studio 2022 / VS Code / Rider

### Option 1: Using EF Migrations (Recommended)

```bash
# 1. Clone and navigate to project
cd bus-management-api

# 2. Update connection string in appsettings.json if needed

# 3. Run the application (auto-creates database and seeds data)
dotnet run
```

The application automatically:
- Creates the database
- Applies migrations
- Seeds permissions and admin user

### Option 2: Using SQL Script

```bash
# 1. Open SQL Server Management Studio (SSMS)
# 2. Execute: Database/BusManagementApiDB-Complete.sql
# 3. Run the application
dotnet run
```

## Default Admin Account

| Field | Value |
|-------|-------|
| Email | admin@busmanagement.com |
| Password | Admin@123 |

## API Documentation

After starting the application, access Swagger UI at:
```
https://localhost:{port}/swagger
```

## Authentication

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@busmanagement.com",
  "password": "Admin@123"
}
```

### Using the Token
Include the JWT token in the Authorization header:
```
Authorization: Bearer {your-token-here}
```

## API Endpoints

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/auth/login | Login | Public |
| POST | /api/auth/register | Register new user | Public |
| GET | /api/auth/profile | Get current user | Required |

### Buses
| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | /api/buses | manage.buses |
| GET | /api/buses/{id} | manage.buses |
| POST | /api/buses | manage.buses |
| PUT | /api/buses/{id} | manage.buses |
| DELETE | /api/buses/{id} | manage.buses |

### Routes
| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | /api/routes | view.routes |
| GET | /api/routes/{id} | view.routes |
| POST | /api/routes | manage.routes |
| PUT | /api/routes/{id} | manage.routes |
| DELETE | /api/routes/{id} | manage.routes |

### Schedules
| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | /api/schedules | manage.schedules |
| GET | /api/schedules/available | view.schedules |
| GET | /api/schedules/{id} | view.schedules |
| POST | /api/schedules | manage.schedules |
| PUT | /api/schedules/{id} | manage.schedules |
| DELETE | /api/schedules/{id} | manage.schedules |

### Tickets
| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | /api/tickets | tickets.view.all |
| GET | /api/tickets/my-tickets | view.own.tickets |
| POST | /api/tickets/purchase | tickets.purchase |

### Driver Assignments
| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | /api/driverassignments | manage.assignments |
| GET | /api/driverassignments/my-assignment | view.own.assignment |
| POST | /api/driverassignments | manage.assignments |
| DELETE | /api/driverassignments/{id} | manage.assignments |

### Users
| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | /api/users | manage.users |
| GET | /api/users/{id} | manage.users |
| POST | /api/users | manage.users |
| PUT | /api/users/{id} | manage.users |
| DELETE | /api/users/{id} | manage.users |
| GET | /api/users/{id}/permissions | manage.permissions |
| PUT | /api/users/{id}/permissions | manage.permissions |

## Permissions

| Permission | Description | Default For |
|------------|-------------|-------------|
| manage.buses | Create, edit, delete buses | Admin |
| manage.routes | Create, edit, delete routes | Admin |
| manage.schedules | Create, edit, delete schedules | Admin |
| manage.users | Create, edit, delete users | Admin |
| manage.permissions | Assign permissions to users | Admin |
| manage.assignments | Assign drivers to buses | Admin |
| tickets.view.all | View all tickets | Admin |
| tickets.purchase | Purchase tickets | Client |
| view.schedules | View available schedules | All |
| view.routes | View available routes | All |
| view.own.tickets | View own tickets | Client |
| view.own.assignment | View own assignment | Driver |

## User Types

| Type | Default Permissions |
|------|---------------------|
| Admin | All manage.* + tickets.view.all + view.* |
| Driver | view.schedules, view.routes, view.own.assignment |
| Client | view.schedules, view.routes, view.own.tickets, tickets.purchase |

## Project Structure

```
bus-management-api/
├── Authorization/          # PBAC system
│   ├── HasPermissionAttribute.cs
│   ├── PermissionHandler.cs
│   ├── PermissionPolicyProvider.cs
│   ├── PermissionRequirement.cs
│   └── Permissions.cs
├── Controllers/            # API controllers
├── Data/                   # DbContext & seeding
│   ├── BusManagementDbContext.cs
│   └── DbInitializer.cs
├── Database/               # SQL scripts
│   └── BusManagementApiDB-Complete.sql
├── DTOs/                   # Data transfer objects
├── Entities/               # EF Core entities
├── Services/               # Business logic
├── Program.cs
└── appsettings.json
```

## Configuration

### appsettings.json
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=BusManagementApiDB;Trusted_Connection=True;"
  },
  "Jwt": {
    "Key": "your-secret-key-min-32-characters",
    "Issuer": "BusManagementApi",
    "Audience": "BusManagementApi",
    "ExpireMinutes": 60
  }
}
```

## Testing with Swagger

1. Start the application: `dotnet run`
2. Open Swagger UI in browser
3. Click "Authorize" button
4. Login via `/api/auth/login` endpoint
5. Copy the token from response
6. Paste in Authorize dialog: `Bearer {token}`
7. Test protected endpoints

## Testing with curl

```bash
# Login
curl -X POST https://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@busmanagement.com","password":"Admin@123"}'

# Get buses (with token)
curl https://localhost:5001/api/buses \
  -H "Authorization: Bearer {your-token}"
```

## Common Issues

### 401 Unauthorized
- Ensure token is prefixed with `Bearer ` (with space)
- Check token hasn't expired
- Verify user has required permission

### Database Connection
- Verify SQL Server is running
- Check connection string in appsettings.json
- For LocalDB: `(localdb)\mssqllocaldb`

### JWT Key Error
- Key must be at least 32 characters for HMAC-SHA256
