# 🚌 Mamba Bus System

A full-stack bus ticketing and fleet management platform built for transport agencies. It covers everything from fleet and route management to passenger booking, seat selection, ticket generation with QR codes, and real-time ticket validation at the gate.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Roles & Permissions](#roles--permissions)
- [Booking Flow](#booking-flow)
- [Ticket PDF Receipt](#ticket-pdf-receipt)
- [Ticket Checker](#ticket-checker)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Overview](#api-overview)

---

## Overview

Mamba Bus System is a web-based transport management platform designed for bus agencies in Rwanda. It allows admins to manage their fleet, routes, schedules, drivers, and agencies — while passengers can browse schedules, book seats, pay (Cash or Mobile Money), and download a professional PDF ticket with a QR code. Staff at the gate use the Ticket Checker to scan or enter ticket numbers and mark passengers as boarded.

---

## Features

### Admin
- Dashboard with analytics — bus count, route count, schedule count, user count, charts
- Full CRUD for Buses, Routes, Schedules, Agencies
- User management — view, edit (name, email, phone, role, active status), delete users
- Permission management — assign granular permissions per user
- Driver management — register drivers, assign buses, unassign with confirmation modal
- Send emergency broadcast alerts to all drivers
- Confirm cash payments for pending tickets
- Real-time notifications via SignalR

### Passenger
- Browse available schedules filtered by agency
- Multi-passenger booking — add multiple passengers in one session, each with name, gender, phone
- Duplicate name check — prevents two tickets under the same name on the same trip
- Visual seat map — 40-seat bus layout, green = available, red = booked, click to select
- Payment selection — Cash (pending, pay at office) or Mobile Money (MTN / Airtel)
- Booking confirmation screen with QR code per ticket
- Download professional PDF receipt per ticket
- View all personal tickets with status

### Ticket Checker
- Enter ticket number manually (e.g. `TKT-20260420-XXXX`) or scan QR code with device camera
- System validates: ticket exists, not already used, seat assigned
- Shows passenger name, seat number, route, departure date/time
- One-click "Mark as Used — Allow Boarding" button
- Clear visual feedback: green for valid, amber for already used, red for invalid

---

## Tech Stack

### Frontend
| Library | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| Vite | 7 | Build tool |
| Tailwind CSS | 3 | Styling |
| React Router DOM | 7 | Client-side routing |
| Axios | 1.13 | HTTP client |
| React Hook Form | 7 | Form management |
| Recharts | 3 | Dashboard charts |
| jsPDF | 3 | PDF ticket generation |
| qrcode.react | 4 | QR code rendering |
| html5-qrcode | 2.3 | Camera QR scanning |
| @microsoft/signalr | 10 | Real-time notifications |
| lucide-react | 0.56 | Icons |
| date-fns | 4 | Date formatting |
| react-hot-toast | 2 | Toast notifications |

### Backend
| Technology | Purpose |
|---|---|
| ASP.NET Core 8 | REST API |
| Entity Framework Core 8 | ORM / database access |
| SQL Server Express | Database |
| SignalR | Real-time notifications |
| JWT Bearer Auth | Authentication |
| Permission-Based Access Control (PBAC) | Authorization |
| SMTP (Gmail) | Email notifications |

---

## Project Structure

```
src/
├── api/
│   ├── client.js              # Axios instance with JWT interceptor
│   ├── services.js            # All API service methods
│   └── notificationService.js # Notification API calls
├── components/
│   └── Modal.jsx              # Reusable modal component
├── context/
│   ├── AuthContext.jsx        # Auth state, login, logout, register
│   └── SignalRContext.jsx     # Real-time notification hub
├── layouts/
│   └── DashboardLayout.jsx    # Sidebar, header, role-based nav
├── lib/
│   ├── utils.js               # cn() helper
│   └── ticketPDF.js           # Professional PDF receipt generator
├── pages/
│   ├── Landing.jsx            # Public landing page
│   ├── Login.jsx              # Login page
│   ├── Register.jsx           # Registration page
│   ├── Dashboard.jsx          # Admin analytics dashboard
│   ├── Buses.jsx              # Bus fleet management
│   ├── Routes.jsx             # Route management
│   ├── Schedules.jsx          # Schedule management
│   ├── Drivers.jsx            # Driver assignment management
│   ├── Tickets.jsx            # Passenger booking wizard + my tickets
│   ├── TicketChecker.jsx      # Gate validation tool
│   ├── Users.jsx              # User management
│   └── Agencies.jsx           # Agency management
└── App.jsx                    # Routes + protected/guest wrappers
```

---

## Roles & Permissions

The system uses Permission-Based Access Control (PBAC). Each user has a `userType` and a set of individually assigned permissions stored in the database.

| Role | Default Permissions |
|---|---|
| Admin | All permissions — manage buses, routes, schedules, agencies, users, assignments, view all tickets, mark tickets used |
| Driver | View schedules, view routes, view own assignment |
| Passenger / Client | View schedules, view routes, view own tickets, purchase tickets |
| Checker | Mark tickets used (validate at gate) |

Permissions are managed per-user via the Users page shield icon. The JWT token carries a comma-separated `permissions` claim which is checked on every protected endpoint.

---

## Booking Flow

```
1. Select Schedule
   └── Filter by agency → pick departure

2. Add Passengers
   └── Name (required), Gender, Phone/ID (optional)
   └── Duplicate name check against existing bookings on same trip
   └── Add multiple passengers in one session

3. Seat Selection
   └── Visual 4-across bus layout
   └── Green = available, Red = booked, Purple = selected
   └── Each passenger gets assigned one seat

4. Payment
   └── Cash → ticket created as "Pending Payment"
   └── Mobile Money → ticket created, pay at office/agent

5. Confirmation
   └── QR code generated per ticket
   └── Download PDF receipt
```

---

## Ticket PDF Receipt

Generated using jsPDF in A5 format. Layout:

- **Dark header** — brand name, "TRAVEL TICKET", ticket number in gold
- **Route band** — origin → destination with dotted travel line and arrow, full departure date and time
- **Detail cards** — passenger name, seat number, bus number, price paid, payment status, date issued
- **Tear line** — dashed scissor line separating the stub
- **QR code** — scannable at the gate, encodes ticket number and ID
- **Boarding instructions** — 4 bullet points
- **Dark footer** — thank you message and support contact

---

## Ticket Checker

The checker page is accessible to Admin and Checker roles at `/app/checker`.

**How it works:**
1. Staff enters the ticket number (e.g. `TKT-20260420-4110B82D`) or clicks "Scan QR" to use the device camera
2. System tries `GET /Tickets/validate/by-number/{number}` first, falls back to `GET /Tickets/{id}` if needed, then falls back to searching all tickets locally
3. Result shows passenger name, seat, route, departure time, and payment status
4. If valid and unused → "Mark as Used — Allow Boarding" button stamps the ticket via `PUT /Tickets/{id}/mark-used`
5. Already-used tickets show amber warning, invalid tickets show red error

---

## Getting Started

### Prerequisites
- Node.js 18+
- .NET 8 SDK
- SQL Server Express
- Git

### Frontend

```bash
# Clone the repo
git clone <repo-url>
cd bus-management-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Backend

```bash
cd bus-management-api

# Restore packages
dotnet restore

# Apply migrations
dotnet ef database update

# Run the API
dotnet run
```

The API runs on `http://localhost:5000` by default. The frontend proxies `/api` requests to it via Vite config.

---

## Environment Variables

### Backend — `appsettings.json`

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost\\SQLEXPRESS;Database=BusManagementApiDB;Trusted_Connection=True;TrustServerCertificate=True"
  },
  "Jwt": {
    "Key": "your-secret-key",
    "Issuer": "MambaBusApi",
    "Audience": "MambaBusClients",
    "ExpiryInHours": "24"
  },
  "EmailSettings": {
    "SmtpServer": "smtp.gmail.com",
    "SmtpPort": "587",
    "SmtpUser": "your-email@gmail.com",
    "SmtpPass": "your-app-password"
  }
}
```

---

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/Auth/login` | Login, returns JWT |
| POST | `/api/Auth/register` | Register new user |
| GET | `/api/Auth/profile` | Get current user profile |
| GET | `/api/Buses` | List all buses |
| POST | `/api/Buses` | Create bus |
| DELETE | `/api/Buses/{id}` | Delete bus (cascades assignments, schedules, tickets) |
| GET | `/api/Routes` | List all routes |
| GET | `/api/Schedules` | List all schedules |
| GET | `/api/Tickets/my-tickets` | Passenger's own tickets |
| POST | `/api/Tickets/purchase` | Purchase single ticket |
| POST | `/api/Tickets/purchase-multi` | Purchase multiple tickets (multi-passenger) |
| GET | `/api/Tickets/validate/by-number/{n}` | Validate ticket by number |
| PUT | `/api/Tickets/{id}/mark-used` | Mark ticket as used (checker) |
| GET | `/api/Users` | List all users (admin) |
| PUT | `/api/Users/{id}` | Update user |
| DELETE | `/api/Users/{id}` | Delete user (cascades permissions, tickets, assignments) |
| PUT | `/api/Users/{id}/permissions` | Assign permissions |
| GET | `/api/DriverAssignments` | List all assignments |
| POST | `/api/DriverAssignments` | Assign driver to bus |
| DELETE | `/api/DriverAssignments/{id}` | Unassign driver |
| GET | `/api/Agencies` | List agencies |

---

## Screenshots

> Add screenshots of the Dashboard, Booking Wizard, Ticket PDF, and Ticket Checker pages here.

---

## License

MIT — free to use and modify.
