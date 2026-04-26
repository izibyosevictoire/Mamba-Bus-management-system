# Mamba Bus System — Full Project Presentation
## Slide-by-Slide Content with Speaker Notes

---

## SLIDE 1 — Title Slide

**Title:** Mamba Bus System
**Subtitle:** A Full-Stack Digital Bus Ticketing & Fleet Management Platform
**Presented by:** [Your Name]
**Institution:** [Your University / Institution]
**Date:** April 2026

> **Speaker Notes:**
> "Good morning/afternoon everyone. Today I will be presenting my project — the Mamba Bus System. This is a complete web-based platform designed to digitize and modernize how bus transport agencies in Rwanda manage their operations, from fleet management all the way to passenger ticketing and boarding validation."

---

## SLIDE 2 — Project Overview

**Title:** What is the Mamba Bus System?

- A web application for managing bus transport operations end-to-end
- Designed for transport agencies, drivers, passengers, and gate staff
- Replaces manual paper-based ticketing with a digital system
- Accessible from any device through a web browser
- Built as a university final project using modern industry technologies

**Key Problems it Solves:**
- No more lost paper tickets
- No double-booking of seats
- Real-time seat availability
- Instant ticket validation at the gate
- Centralized fleet and route management

> **Speaker Notes:**
> "The Mamba Bus System was built to solve a real problem — many transport agencies in Rwanda still use paper tickets and manual processes. This leads to lost tickets, double bookings, and no way to verify passengers at the gate. My system digitizes the entire process from booking to boarding."

---

## SLIDE 3 — System Architecture Overview

**Title:** How the System is Built

```
┌─────────────────────────────────────────────────────┐
│                   USER'S BROWSER                     │
│              React.js Frontend (Vite)                │
│   Pages · Components · State · PDF · QR Code        │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP Requests (Axios)
                       │ JWT Token in every request
                       ▼
┌─────────────────────────────────────────────────────┐
│              ASP.NET Core 8 Web API                  │
│   Controllers → Services → Entity Framework Core    │
│   JWT Authentication · Permission-Based Security    │
│   SignalR (Real-time Notifications)                 │
└──────────────────────┬──────────────────────────────┘
                       │ SQL Queries (EF Core)
                       ▼
┌─────────────────────────────────────────────────────┐
│           SQL Server Express Database                │
│  Users · Buses · Routes · Schedules · Tickets       │
│  Permissions · Notifications · Assignments          │
└─────────────────────────────────────────────────────┘
```

**Three-Tier Architecture:**
- Presentation Layer → React.js (what users see)
- Business Logic Layer → ASP.NET Core API (rules and processing)
- Data Layer → SQL Server (storage)

> **Speaker Notes:**
> "The system follows a classic three-tier architecture. The frontend is what the user sees and interacts with. It communicates with the backend API which handles all the business logic — things like checking if a seat is available or validating a ticket. The backend then reads and writes data to the SQL Server database. These three layers are completely separate, which makes the system easier to maintain and scale."

---

## SLIDE 4 — Backend Web API

**Title:** The Backend — ASP.NET Core Web API

**What it is:**
- A REST API built with ASP.NET Core 8 (.NET framework by Microsoft)
- Acts as the "brain" of the system — all rules and logic live here
- Runs on the server, the frontend never touches the database directly

**Architecture inside the backend:**
- **Controllers** — receive HTTP requests and return responses
- **Entity Framework Core** — translates C# code into SQL database queries
- **DbContext** — the connection between the app and the database
- **DTOs (Data Transfer Objects)** — control exactly what data is sent/received
- **SignalR Hub** — sends real-time notifications to connected users

> **Speaker Notes:**
> "The backend is built with ASP.NET Core 8, which is Microsoft's modern web framework. Think of it as the engine of the car — the user never sees it, but nothing works without it. When a passenger books a ticket, the frontend sends a request to the backend. The backend checks the rules — is the seat available? Is the schedule in the future? — then saves the ticket to the database and sends back a confirmation."

---

## SLIDE 5 — Backend Controllers & Endpoints

**Title:** Key API Endpoints

| Endpoint | Method | What it does |
|---|---|---|
| `/api/Auth/login` | POST | User logs in, receives JWT token |
| `/api/Auth/register` | POST | New user registration |
| `/api/Buses` | GET/POST/DELETE | Manage bus fleet |
| `/api/Routes` | GET/POST/PUT/DELETE | Manage travel routes |
| `/api/Schedules` | GET/POST/PUT/DELETE | Manage departure schedules |
| `/api/Tickets/purchase` | POST | Book a single ticket |
| `/api/Tickets/purchase-multi` | POST | Book for multiple passengers |
| `/api/Tickets/my-tickets` | GET | View own tickets |
| `/api/Tickets/validate/by-number/{n}` | GET | Validate ticket at gate |
| `/api/Tickets/{id}/mark-used` | PUT | Mark ticket as boarded |
| `/api/Users` | GET/PUT/DELETE | Admin user management |
| `/api/DriverAssignments` | GET/POST/DELETE | Assign drivers to buses |

> **Speaker Notes:**
> "The backend exposes these endpoints — think of them as doors that the frontend can knock on to get or send data. Each endpoint has a specific job. For example, when a passenger wants to book a ticket, the frontend sends a POST request to /api/Tickets/purchase with the schedule ID and passenger details. The backend validates everything and creates the ticket in the database."

---

## SLIDE 6 — Authentication & Security

**Title:** How the System Stays Secure

**JWT (JSON Web Token) Authentication:**
- When a user logs in, the backend generates a secure token
- This token is stored in the browser (localStorage)
- Every request to the API includes this token in the header
- The backend verifies the token before processing any request
- Token expires after 24 hours — user must log in again

**Permission-Based Access Control (PBAC):**
- Each user has individual permissions stored in the database
- Example permissions: `tickets.purchase`, `manage.buses`, `tickets.mark.used`
- The backend checks permissions on every protected endpoint
- An Admin has all permissions; a Passenger only has booking permissions

**Example:**
```
Passenger tries to access /api/Buses (Admin only)
→ Backend checks JWT token ✓
→ Backend checks permissions ✗ (no manage.buses permission)
→ Returns 403 Forbidden
```

> **Speaker Notes:**
> "Security is handled in two layers. First, every user must log in to get a JWT token — this is like a digital ID card. Every request to the API must include this token, otherwise the server rejects it. Second, even authenticated users can only access what their permissions allow. A passenger cannot delete a bus, and a driver cannot purchase tickets on behalf of others. This is called Permission-Based Access Control."

---

## SLIDE 7 — Database Design

**Title:** The Database — SQL Server

**Main Tables:**

| Table | Purpose |
|---|---|
| Users | All system users (Admin, Driver, Passenger, Checker) |
| Buses | Bus fleet — number, capacity, model, agency |
| Routes | Travel routes — origin, destination, distance, price |
| Schedules | Departure times linking a bus to a route |
| Tickets | Booked tickets — passenger, seat, payment, status |
| Permissions | Available system permissions |
| UserPermissions | Which permissions each user has |
| DriverAssignments | Which driver is assigned to which bus |
| Notifications | Real-time alerts sent to users |

**Key Relationships:**
- A Schedule belongs to one Bus and one Route
- A Ticket belongs to one Schedule and one User
- A User can have many Permissions
- A Driver can have one active Assignment

> **Speaker Notes:**
> "The database has 9 main tables. The most important relationship is between Schedules and Tickets — a schedule is a specific bus on a specific route at a specific time, and a ticket is a passenger's booking for that schedule. When a bus or route is deleted, all related schedules and tickets are automatically removed too — this is called cascade delete."

---

## SLIDE 8 — Frontend Overview

**Title:** The Frontend — React.js

**What it is:**
- A Single Page Application (SPA) built with React 19 and Vite
- Runs entirely in the user's browser — no page reloads
- Communicates with the backend API using Axios (HTTP library)
- Styled with Tailwind CSS for a professional, responsive design

**Project Structure:**
```
src/
├── pages/        → Full page views (Dashboard, Tickets, Users...)
├── components/   → Reusable UI pieces (Modal, etc.)
├── context/      → Global state (Auth, Notifications)
├── api/          → All API calls in one place (services.js)
├── layouts/      → Sidebar + header wrapper
└── lib/          → Utilities (PDF generator, helpers)
```

**State Management:**
- React Context API for authentication state (who is logged in)
- React useState/useEffect for local component data
- React Hook Form for all form inputs and validation

> **Speaker Notes:**
> "The frontend is built with React, which is the most popular JavaScript library for building user interfaces. It's a Single Page Application — meaning the page never fully reloads, it just updates the parts that change, making it feel fast and smooth. All API calls are organized in a single file called services.js, so if the backend URL changes, I only need to update one place."

---

## SLIDE 9 — Frontend Pages & Features

**Title:** What Each Page Does

| Page | Role | Who Uses It |
|---|---|---|
| Landing | Public homepage | Everyone |
| Login / Register | Authentication | Everyone |
| Dashboard | Analytics charts, stats | Admin |
| Buses | Add/edit/delete fleet | Admin |
| Routes | Manage travel routes | Admin |
| Schedules | Plan departures (future dates only) | Admin |
| Drivers | Assign/unassign buses to drivers | Admin |
| Users | Manage accounts & permissions | Admin |
| Agencies | Manage transport agencies | Admin |
| My Tickets | Book tickets, view bookings, download PDF | Passenger |
| Ticket Checker | Scan/validate tickets at gate | Checker/Admin |

> **Speaker Notes:**
> "The frontend has 11 pages, each serving a specific role. The system is role-based — an Admin sees the full management dashboard, a Passenger only sees their tickets page, and a Ticket Checker only sees the validation tool. This is controlled by the sidebar navigation which filters menu items based on the logged-in user's role."

---

## SLIDE 10 — Key Feature: Booking Wizard

**Title:** How Passengers Book Tickets — 5-Step Wizard

```
Step 1: SELECT SCHEDULE
        Browse available departures, filter by agency
              ↓
Step 2: ADD PASSENGERS
        Enter name, gender, phone for each person
        System checks: no duplicate names on same trip
              ↓
Step 3: CHOOSE SEATS
        Visual bus layout (40 seats)
        Green = available, Red = booked
        Each passenger selects one seat
              ↓
Step 4: PAYMENT
        Choose: Cash (pay at office) or Mobile Money
              ↓
Step 5: CONFIRMATION
        QR code generated per ticket
        Download professional PDF receipt
```

> **Speaker Notes:**
> "The booking process is a 5-step wizard. I designed it this way so passengers are guided through each step clearly. One important feature is the duplicate name check — if someone tries to book two tickets under the same name for the same trip, the system rejects it. The seat map shows real-time availability so passengers can see exactly which seats are free."

---

## SLIDE 11 — Key Feature: Ticket PDF Receipt

**Title:** Professional Ticket Receipt

**The PDF includes:**
- Dark branded header with "MAMBA BUS" and "TRAVEL TICKET"
- Ticket number in gold (e.g. TKT-20260422-XXXX)
- Route with animated arrow: KIGALI ----► MUSANZE
- Full departure date and time
- Passenger name, seat number, bus number, price paid
- Payment status and date issued
- Dashed tear line (✂ DETACH HERE)
- Real QR code (scannable at the gate)
- 6 boarding instructions with numbered badges
- Dark footer with support contact

**Generated using:** jsPDF + qrcode libraries (runs in the browser, no server needed)

> **Speaker Notes:**
> "When a passenger downloads their ticket, they get a professional A5-sized PDF receipt. The QR code is real and scannable — it encodes the ticket number and passenger details. The checker at the gate can scan this QR code or type the ticket number manually to validate it. The boarding instructions tell the passenger exactly what to do — arrive 15 minutes early, go to your seat, keep the ticket, etc."

---

## SLIDE 12 — Key Feature: Ticket Checker

**Title:** Gate Validation — Ticket Checker

**How it works:**
1. Staff opens the Ticket Checker page
2. Types the ticket number (e.g. TKT-20260422-XXXX) OR scans QR code with camera
3. System checks:
   - ✅ Does this ticket exist?
   - ✅ Has it NOT been used already?
   - ✅ Is the seat assigned?
4. If valid → shows passenger name, seat, route, departure time
5. Staff clicks "Mark as Used — Allow Boarding"
6. Ticket is stamped as used in the database
7. If someone tries to use the same ticket again → ❌ "Already Used"

**Prevents:**
- Fake tickets
- Reusing the same ticket twice
- Boarding the wrong bus

> **Speaker Notes:**
> "The Ticket Checker is used by staff at the boarding gate. They can either type the ticket number or use their device camera to scan the QR code. The system instantly tells them if the ticket is valid. Once they click 'Mark as Used', the ticket is permanently stamped in the database so it can never be used again. This completely eliminates ticket fraud."

---

## SLIDE 13 — API Communication Flow

**Title:** How Frontend and Backend Talk

**Step-by-step example — Passenger books a ticket:**

```
1. Passenger fills booking form in browser (React)
         ↓
2. React sends POST /api/Tickets/purchase-multi
   with JWT token in Authorization header
         ↓
3. ASP.NET Core receives request
   → Verifies JWT token (is user logged in?)
   → Checks permission (tickets.purchase)
   → Validates data (is schedule in future? seats available?)
         ↓
4. Entity Framework Core runs SQL INSERT
   → Saves ticket to SQL Server database
         ↓
5. Backend returns ticket data (JSON)
   including: ticketId, ticketNumber, seatNumber, passengerName
         ↓
6. React receives response
   → Shows confirmation screen with QR code
   → Passenger can download PDF
```

> **Speaker Notes:**
> "This diagram shows exactly what happens when a passenger books a ticket. The frontend never touches the database directly — it always goes through the API. The API acts as a security guard — it checks the token, checks permissions, validates the data, then and only then saves to the database. This separation is what makes the system secure."

---

## SLIDE 14 — Real-Time Notifications

**Title:** Live Notifications with SignalR

**What is SignalR?**
- A Microsoft library for real-time, two-way communication
- Unlike normal HTTP (request → response), SignalR keeps a persistent connection
- The server can push messages to the browser instantly

**Used in Mamba Bus for:**
- Notifying a driver when they are assigned to a bus
- Admin receives notification when a driver accepts/rejects an assignment
- Notification bell in the header shows unread count
- Notifications marked as read when clicked

**How it works:**
```
Admin assigns driver to bus
       ↓
Backend saves assignment + creates Notification record
       ↓
SignalR Hub pushes notification to driver's browser instantly
       ↓
Driver sees notification bell light up in real-time
       ↓
Driver opens notification: "You have been assigned to Bus BUS-001"
```

> **Speaker Notes:**
> "One of the more advanced features is real-time notifications using SignalR. When an admin assigns a driver to a bus, the driver's browser receives a notification instantly — without needing to refresh the page. This is similar to how WhatsApp messages arrive in real-time. It makes the system feel live and responsive."

---

## SLIDE 15 — Technologies Used

**Title:** Technology Stack & Why Each Was Chosen

**Frontend:**
| Technology | Why |
|---|---|
| React 19 | Most popular UI library, component-based, fast |
| Vite | Extremely fast development build tool |
| Tailwind CSS | Utility-first CSS, consistent professional design |
| Axios | Simple, reliable HTTP client for API calls |
| React Hook Form | Lightweight, performant form management |
| jsPDF | Generate PDF receipts in the browser |
| qrcode | Generate real QR codes for tickets |
| html5-qrcode | Scan QR codes using device camera |
| Recharts | Beautiful charts for the admin dashboard |
| SignalR Client | Real-time notifications |

**Backend:**
| Technology | Why |
|---|---|
| ASP.NET Core 8 | Fast, secure, industry-standard .NET API framework |
| Entity Framework Core | ORM — write C# instead of raw SQL |
| SQL Server Express | Reliable relational database, free for development |
| JWT Bearer Auth | Stateless, secure token-based authentication |
| SignalR | Real-time push notifications |

> **Speaker Notes:**
> "I chose these technologies because they are all industry-standard tools used by professional developers. React is used by companies like Facebook, Netflix, and Airbnb. ASP.NET Core is used by Microsoft, Stack Overflow, and many enterprise companies. Using these technologies means the skills I learned building this project are directly applicable in the job market."

---

## SLIDE 16 — Challenges & Solutions

**Title:** Problems I Faced & How I Solved Them

**Challenge 1: Database FK Constraint Errors on Delete**
- Problem: Deleting a bus failed because schedules and tickets referenced it
- Solution: Implemented cascade delete — remove tickets → schedules → bus in order

**Challenge 2: Seat Number Not Saving**
- Problem: The Ticket entity was missing SeatNumber and PassengerName columns
- Solution: Added columns to entity, ran SQL ALTER TABLE to add to existing DB

**Challenge 3: JWT Token Not Including New Permissions**
- Problem: Admin had permissions in DB but token was old, so 403 errors appeared
- Solution: User must log out and log back in to get a fresh token with updated claims

**Challenge 4: QR Code Not Appearing in PDF**
- Problem: jsPDF cannot render React components directly
- Solution: Used the `qrcode` npm library to generate a PNG data URL, then embedded it with `doc.addImage()`

**Challenge 5: Past Dates Being Scheduled**
- Problem: Admins could accidentally create schedules in the past
- Solution: Added `min={nowLocal()}` on datetime inputs + server-side validation

> **Speaker Notes:**
> "Every project has challenges. The most interesting one was the QR code in the PDF — React's QR component renders to the screen, but jsPDF works with raw data. I solved this by using a separate library that generates the QR as a PNG image, which jsPDF can then embed. Each challenge taught me something new about how the technologies work together."

---

## SLIDE 17 — System Roles Summary

**Title:** Who Uses the System & What They Can Do

```
┌─────────────────────────────────────────────────────┐
│  👤 PASSENGER                                        │
│  • Browse schedules                                  │
│  • Book seats (multi-passenger)                      │
│  • Pay (Cash or Mobile Money)                        │
│  • Download PDF ticket with QR code                  │
│  • View booking history                              │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│  🧑‍💼 ADMIN                                           │
│  • Manage buses, routes, schedules, agencies         │
│  • Register and manage drivers                       │
│  • Assign/unassign buses to drivers                  │
│  • Manage user accounts and permissions              │
│  • View analytics dashboard                          │
│  • Send emergency alerts to all drivers              │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│  🎟️ TICKET CHECKER                                   │
│  • Scan QR codes at boarding gate                    │
│  • Validate ticket by number                         │
│  • Mark tickets as used (prevent reuse)              │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│  🚌 DRIVER                                           │
│  • View assigned bus and route                       │
│  • Accept or reject assignments                      │
│  • Receive real-time notifications                   │
└─────────────────────────────────────────────────────┘
```

> **Speaker Notes:**
> "The system has four distinct roles. Each role sees a different version of the application — the sidebar navigation changes based on who is logged in. This is controlled by the permission system in the database. An admin has all permissions, while a passenger only has permission to view schedules and purchase tickets."

---

## SLIDE 18 — Conclusion

**Title:** Summary & What I Learned

**What was built:**
- A complete full-stack web application with 11 pages
- REST API with 30+ endpoints
- Role-based access control with 14 permissions
- Real-time notifications via SignalR
- Multi-passenger booking with seat selection
- PDF ticket generation with real QR codes
- Gate validation system

**What I learned:**
- How to design and build a REST API from scratch
- How frontend and backend communicate securely
- Database design and relationships
- JWT authentication and permission systems
- Real-world problem solving (cascade deletes, schema migrations)
- Professional UI/UX design with Tailwind CSS

**Future improvements:**
- Real MTN MoMo API integration for live mobile payments
- Mobile app version (React Native)
- SMS ticket delivery
- Live bus tracking on a map

> **Speaker Notes:**
> "In conclusion, the Mamba Bus System is a complete, working solution to a real problem in Rwanda's transport sector. Building it taught me how professional software is structured — with a clear separation between frontend, backend, and database. The biggest lesson was that real-world software development involves solving unexpected problems, and every bug you fix makes you a better developer. Thank you for your attention — I'm happy to take any questions."

---

## SLIDE 19 — Thank You / Q&A

**Title:** Thank You

> "Mamba Bus System — Digitizing Transport, One Ticket at a Time"

**Contact / Repository:**
- GitHub: [your-github-link]
- Email: [your-email]

**Questions?**

---

## HOW TO BUILD THE POWERPOINT

Use these slides in PowerPoint or Google Slides:

1. **Slide background:** Dark navy (#0F172A) for title slides, white for content slides
2. **Accent color:** Indigo (#6366F1) for headings and highlights
3. **Gold accent:** (#EAB308) for ticket numbers and special callouts
4. **Font:** Use Calibri or Inter — bold for headings, regular for body
5. **Code blocks:** Use a dark background box with monospace font (Courier New)
6. **Diagrams:** Use SmartArt or draw boxes/arrows for the architecture diagram on Slide 3
7. **Icons:** Use emoji or insert icons from flaticon.com for the roles slide

**Slide count:** 19 slides — approximately 20-25 minutes presentation time
