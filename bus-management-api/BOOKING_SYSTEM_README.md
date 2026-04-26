# Bus Ticketing System - Booking & Passenger Management

## Overview
This implementation provides a comprehensive booking and passenger management system for the Bus Ticketing API with clean architecture, proper validation, and RESTful design.

## Features Implemented

### 1. Booking & Passenger Management ✅
- **Multi-passenger bookings**: One booking can include multiple passengers
- **Passenger details**: Full Name (required), Gender (optional), Phone/ID (optional)
- **Unique passenger names per trip**: Enforced at database level with unique index on (TripId, FullName)
- **Validation**: Duplicate passenger names on the same trip are rejected with clear error message

### 2. Trip & Seat Management ✅
- **Trip Model**: Combines Bus, Route, Date, and Time
- **Seat Model**: Auto-generated seats based on bus capacity
- **Seat availability checking**: Real-time seat availability queries
- **Double booking prevention**: Database constraints and application-level validation
- **Temporary seat locking**: 5-minute lock when booking is created (released on payment failure or timeout)

### 3. Multi-Passenger Booking ✅
- Each passenger gets a unique seat (validated)
- Individual ticket generation per passenger
- All passengers linked to single booking reference

### 4. Payment System ✅
- **Mobile Money (MoMo)**:
  - Stores phone number
  - Status: Pending → Paid/Failed
- **Cash**:
  - Default status: Pending
  - Admin can update to Paid

### 5. Ticket Generation ✅
- Tickets generated AFTER successful payment
- Each ticket includes:
  - Unique Ticket Number (format: TKT{timestamp}{random})
  - Passenger Name
  - Trip details (Bus, Date, Time, Route)
  - Seat Number
  - QR Code (Base64 encoded unique identifier)

### 6. Ticket Validation (Checker Role) ✅
- Validate by Ticket Number OR QR Code
- Validation rules enforced:
  - Ticket exists
  - Not already used
  - Matches trip date (must be today)
  - Has assigned seat
- On successful validation:
  - Returns passenger + seat + trip info
  - Marks ticket as "Used"
  - Records validator user ID and timestamp
- On failure:
  - Returns: "Invalid or already used ticket"

### 7. Roles & Authorization ✅
- **Passenger/Client**: Create bookings, view own bookings
- **Admin**: Manage trips, confirm cash payments, manage all resources
- **Checker**: Validate tickets
- Permission-based access control (PBAC) implemented

### 8. Business Rules (STRICT) ✅
All rules enforced at both database and application level:
- ✅ One passenger name = one ticket per trip (unique index)
- ✅ One seat = one passenger (unique foreign key)
- ✅ No double booking of seats (availability checks + locks)
- ✅ Ticket must match trip date (validated during check-in)
- ✅ Ticket cannot be reused (IsUsed flag)

## Database Schema

### New Tables

#### Trips
- TripId (PK)
- BusId (FK → Buses)
- RouteId (FK → Routes)
- TripDate, DepartureTime, ArrivalTime
- Price, Status
- Unique index on (BusId, TripDate, DepartureTime)

#### Seats
- SeatId (PK)
- TripId (FK → Trips)
- SeatNumber
- IsAvailable, IsLocked, LockedUntil
- PassengerId (FK → Passengers, nullable, unique)
- Unique index on (TripId, SeatNumber)

#### Bookings
- BookingId (PK)
- BookingReference (unique)
- UserId (FK → Users)
- TripId (FK → Trips)
- TotalAmount
- PaymentMethod (MoMo/Cash)
- PaymentStatus (Pending/Paid/Failed)
- MobileMoneyPhone
- BookingDate, PaymentDate

#### Passengers
- PassengerId (PK)
- BookingId (FK → Bookings)
- TripId (FK → Trips)
- FullName, Gender, PhoneOrId
- SeatId (FK → Seats, unique)
- Unique index on (TripId, FullName)

#### BookingTickets
- BookingTicketId (PK)
- PassengerId (FK → Passengers, unique)
- TicketNumber (unique)
- QRCode (unique)
- IsUsed, UsedAt
- ValidatedByUserId (FK → Users)
- IssuedAt

## API Endpoints

### Trips Management

#### Create Trip
```http
POST /api/trips
Authorization: Bearer {token}
Permission: manage.trips

{
  "busId": 1,
  "routeId": 1,
  "tripDate": "2026-04-25",
  "departureTime": "08:00:00",
  "arrivalTime": "12:00:00",
  "price": 50.00
}
```

#### Get Trip
```http
GET /api/trips/{id}
```

#### Search Trips
```http
GET /api/trips/search?origin=Kigali&destination=Musanze&tripDate=2026-04-25
```

#### Get Seat Availability
```http
GET /api/trips/{id}/seats
```

#### Update Trip
```http
PUT /api/trips/{id}
Permission: manage.trips

{
  "status": "Completed"
}
```

### Bookings Management

#### Create Booking
```http
POST /api/bookings
Authorization: Bearer {token}
Permission: bookings.create

{
  "tripId": 1,
  "passengers": [
    {
      "fullName": "John Doe",
      "gender": "Male",
      "phoneOrId": "0788123456",
      "seatNumber": "S01"
    },
    {
      "fullName": "Jane Smith",
      "gender": "Female",
      "seatNumber": "S02"
    }
  ],
  "paymentMethod": "MoMo",
  "mobileMoneyPhone": "0788123456"
}
```

Response:
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "bookingId": 1,
    "bookingReference": "BK202604211234561234",
    "tripId": 1,
    "trip": {
      "tripId": 1,
      "busNumber": "RAC001",
      "origin": "Kigali",
      "destination": "Musanze",
      "tripDate": "2026-04-25",
      "departureTime": "08:00:00",
      "price": 50.00
    },
    "totalAmount": 100.00,
    "paymentMethod": "MoMo",
    "paymentStatus": "Pending",
    "mobileMoneyPhone": "0788123456",
    "bookingDate": "2026-04-21T10:30:00Z",
    "passengers": [
      {
        "passengerId": 1,
        "fullName": "John Doe",
        "gender": "Male",
        "phoneOrId": "0788123456",
        "seatNumber": "S01",
        "ticket": null
      },
      {
        "passengerId": 2,
        "fullName": "Jane Smith",
        "gender": "Female",
        "seatNumber": "S02",
        "ticket": null
      }
    ]
  }
}
```

#### Get My Bookings
```http
GET /api/bookings/my-bookings
Authorization: Bearer {token}
Permission: bookings.view
```

#### Get Booking by ID
```http
GET /api/bookings/{id}
Authorization: Bearer {token}
Permission: bookings.view
```

#### Get Booking by Reference
```http
GET /api/bookings/reference/{reference}
Authorization: Bearer {token}
Permission: bookings.view
```

#### Update Payment Status (Admin)
```http
PATCH /api/bookings/{id}/payment-status
Authorization: Bearer {token}
Permission: payments.manage

{
  "paymentStatus": "Paid"
}
```

When payment status is set to "Paid", tickets are automatically generated for all passengers.

### Ticket Validation (Checker)

#### Validate Ticket
```http
POST /api/bookings/validate-ticket
Authorization: Bearer {token}
Permission: tickets.validate

{
  "ticketNumber": "TKT202604211234561234"
}
```

OR

```http
POST /api/bookings/validate-ticket
Authorization: Bearer {token}
Permission: tickets.validate

{
  "qrCode": "VElDS0VULTEtMjAyNjA0MjExMjM0NTYtYWJjZGVm..."
}
```

Response (Valid):
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "isValid": true,
    "message": "Ticket validated successfully",
    "ticketDetails": {
      "ticketNumber": "TKT202604211234561234",
      "passengerName": "John Doe",
      "gender": "Male",
      "seatNumber": "S01",
      "trip": {
        "tripId": 1,
        "busNumber": "RAC001",
        "origin": "Kigali",
        "destination": "Musanze",
        "tripDate": "2026-04-21",
        "departureTime": "08:00:00",
        "arrivalTime": "12:00:00"
      },
      "isUsed": true,
      "issuedAt": "2026-04-21T10:35:00Z",
      "usedAt": "2026-04-21T11:00:00Z"
    }
  }
}
```

Response (Invalid):
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "isValid": false,
    "message": "Invalid or already used ticket",
    "ticketDetails": null
  }
}
```

## Permissions

New permissions added:
- `manage.trips` - Create, edit, delete trips (Admin)
- `bookings.create` - Create new bookings (Client/Passenger)
- `bookings.view` - View own bookings (Client/Passenger)
- `payments.manage` - Update payment status (Admin)
- `tickets.validate` - Validate and mark tickets as used (Checker)

## Workflow Example

### 1. Admin Creates Trip
```
POST /api/trips
→ Trip created with auto-generated seats (based on bus capacity)
```

### 2. Passenger Searches for Trips
```
GET /api/trips/search?origin=Kigali&destination=Musanze&tripDate=2026-04-25
→ Returns available trips with seat availability
```

### 3. Passenger Checks Seat Availability
```
GET /api/trips/1/seats
→ Returns list of all seats with availability status
```

### 4. Passenger Creates Booking
```
POST /api/bookings
→ Validates passenger names (no duplicates on trip)
→ Validates seat availability
→ Locks seats for 5 minutes
→ Creates booking with Pending payment status
```

### 5. Admin Confirms Payment
```
PATCH /api/bookings/1/payment-status
{ "paymentStatus": "Paid" }
→ Releases seat locks
→ Marks seats as unavailable
→ Generates tickets for all passengers
→ Each ticket gets unique number and QR code
```

### 6. Passenger Retrieves Booking
```
GET /api/bookings/my-bookings
→ Returns booking with ticket details for each passenger
```

### 7. Checker Validates Ticket (Day of Travel)
```
POST /api/bookings/validate-ticket
{ "ticketNumber": "TKT..." }
→ Validates ticket exists, not used, matches today's date
→ Marks ticket as used
→ Records validator and timestamp
→ Returns passenger and trip details
```

## Error Handling

### Duplicate Passenger Name
```json
{
  "success": false,
  "message": "A ticket under the name 'John Doe' already exists for this trip.",
  "data": null
}
```

### Seat Not Available
```json
{
  "success": false,
  "message": "Seats S01, S02 are not available",
  "data": null
}
```

### Invalid Ticket Date
```json
{
  "success": true,
  "data": {
    "isValid": false,
    "message": "Ticket is for 2026-04-25, not today"
  }
}
```

## Database Migration

To apply the migration:

```bash
dotnet ef database update
```

Or run the SQL migration file directly:
```
Migrations/20260421000000_AddBookingAndTripManagement.cs
```

## Service Registration

Services are registered in `Program.cs`:
```csharp
builder.Services.AddScoped<ITripService, TripService>();
builder.Services.AddScoped<IBookingService, BookingService>();
```

## Testing Checklist

- [ ] Create trip with valid data
- [ ] Verify seats are auto-generated
- [ ] Search trips by origin/destination/date
- [ ] Check seat availability
- [ ] Create booking with single passenger
- [ ] Create booking with multiple passengers
- [ ] Try duplicate passenger name on same trip (should fail)
- [ ] Try booking unavailable seat (should fail)
- [ ] Try duplicate seat in same booking (should fail)
- [ ] Update payment to Paid (verify tickets generated)
- [ ] Update payment to Failed (verify seats released)
- [ ] Validate ticket with correct number
- [ ] Validate ticket with QR code
- [ ] Try validating used ticket (should fail)
- [ ] Try validating ticket on wrong date (should fail)
- [ ] Verify seat lock timeout (5 minutes)

## Architecture

### Clean Architecture Layers
1. **Entities**: Domain models (Trip, Booking, Passenger, Seat, BookingTicket)
2. **DTOs**: Data transfer objects for API requests/responses
3. **Services**: Business logic layer (TripService, BookingService)
4. **Controllers**: API endpoints (TripsController, BookingsController)
5. **Data**: DbContext and database configuration

### Design Patterns
- Repository pattern (via DbContext)
- Service layer pattern
- DTO pattern
- Dependency injection
- Transaction management (for booking creation)

## Security Considerations

1. **Authorization**: Permission-based access control on all endpoints
2. **Data Validation**: Input validation using Data Annotations
3. **SQL Injection**: Protected via EF Core parameterized queries
4. **Concurrency**: Database constraints prevent race conditions
5. **Seat Locking**: Temporary locks prevent double booking during checkout

## Performance Optimizations

1. **Eager Loading**: Related entities loaded efficiently with Include()
2. **Indexes**: Strategic indexes on frequently queried columns
3. **Seat Lock Cleanup**: Expired locks released automatically
4. **Batch Operations**: Multiple passengers created in single transaction

## Future Enhancements

- Email/SMS notifications on booking confirmation
- Payment gateway integration (Stripe, PayPal, etc.)
- QR code image generation (currently returns Base64 string)
- Booking cancellation with refund logic
- Seat selection UI integration
- Real-time seat availability via SignalR
- Booking expiration for unpaid bookings
- Reporting and analytics dashboard
