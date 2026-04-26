using Microsoft.EntityFrameworkCore;
using BusManagementApi.Data;
using BusManagementApi.DTOs;
using BusManagementApi.Entities;

namespace BusManagementApi.Services;

public class BookingService : IBookingService
{
    private readonly BusManagementDbContext _context;

    public BookingService(BusManagementDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<BookingResponseDto>> CreateBookingAsync(int userId, CreateBookingDto dto)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // Validate trip exists
            var trip = await _context.Trips
                .Include(t => t.Bus)
                .Include(t => t.Route)
                .Include(t => t.Seats)
                .Include(t => t.Passengers)
                .FirstOrDefaultAsync(t => t.TripId == dto.TripId);

            if (trip == null)
                return ApiResponse<BookingResponseDto>.Fail("Trip not found");

            if (trip.Status != "Scheduled")
                return ApiResponse<BookingResponseDto>.Fail("Trip is not available for booking");

            // Validate payment method
            if (dto.PaymentMethod == "MoMo" && string.IsNullOrWhiteSpace(dto.MobileMoneyPhone))
                return ApiResponse<BookingResponseDto>.Fail("Mobile money phone number is required");

            // Check for duplicate passenger names on this trip
            var passengerNames = dto.Passengers.Select(p => p.FullName.Trim().ToLower()).ToList();
            var existingPassengers = await _context.Passengers
                .Where(p => p.TripId == dto.TripId && passengerNames.Contains(p.FullName.ToLower()))
                .Select(p => p.FullName)
                .ToListAsync();

            if (existingPassengers.Any())
                return ApiResponse<BookingResponseDto>.Fail(
                    $"A ticket under the name '{existingPassengers.First()}' already exists for this trip.");

            // Validate seats availability and uniqueness
            var requestedSeatNumbers = dto.Passengers.Select(p => p.SeatNumber).ToList();
            if (requestedSeatNumbers.Count != requestedSeatNumbers.Distinct().Count())
                return ApiResponse<BookingResponseDto>.Fail("Duplicate seat numbers in booking");

            var seats = await _context.Seats
                .Where(s => s.TripId == dto.TripId && requestedSeatNumbers.Contains(s.SeatNumber))
                .ToListAsync();

            if (seats.Count != requestedSeatNumbers.Count)
                return ApiResponse<BookingResponseDto>.Fail("One or more seats not found");

            var unavailableSeats = seats.Where(s => !s.IsAvailable || s.IsLocked).Select(s => s.SeatNumber).ToList();
            if (unavailableSeats.Any())
                return ApiResponse<BookingResponseDto>.Fail(
                    $"Seats {string.Join(", ", unavailableSeats)} are not available");

            // Lock seats temporarily (5 minutes)
            foreach (var seat in seats)
            {
                seat.IsLocked = true;
                seat.LockedUntil = DateTime.UtcNow.AddMinutes(5);
            }

            // Create booking
            var booking = new Booking
            {
                BookingReference = GenerateBookingReference(),
                UserId = userId,
                TripId = dto.TripId,
                TotalAmount = trip.Price * dto.Passengers.Count,
                PaymentMethod = dto.PaymentMethod,
                PaymentStatus = "Pending",
                MobileMoneyPhone = dto.MobileMoneyPhone,
                BookingDate = DateTime.UtcNow
            };

            _context.Bookings.Add(booking);
            await _context.SaveChangesAsync();

            // Create passengers
            var passengers = new List<Passenger>();
            foreach (var passengerDto in dto.Passengers)
            {
                var seat = seats.First(s => s.SeatNumber == passengerDto.SeatNumber);
                
                var passenger = new Passenger
                {
                    BookingId = booking.BookingId,
                    TripId = dto.TripId,
                    FullName = passengerDto.FullName.Trim(),
                    Gender = passengerDto.Gender,
                    PhoneOrId = passengerDto.PhoneOrId,
                    SeatId = seat.SeatId
                };

                passengers.Add(passenger);
            }

            _context.Passengers.AddRange(passengers);
            await _context.SaveChangesAsync();

            await transaction.CommitAsync();

            return await GetBookingByIdAsync(booking.BookingId, userId);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return ApiResponse<BookingResponseDto>.Fail($"Booking failed: {ex.Message}");
        }
    }

    public async Task<ApiResponse<BookingResponseDto>> UpdatePaymentStatusAsync(int bookingId, UpdatePaymentStatusDto dto)
    {
        var booking = await _context.Bookings
            .Include(b => b.Passengers)
            .ThenInclude(p => p.Seat)
            .FirstOrDefaultAsync(b => b.BookingId == bookingId);

        if (booking == null)
            return ApiResponse<BookingResponseDto>.Fail("Booking not found");

        if (booking.PaymentStatus == "Paid")
            return ApiResponse<BookingResponseDto>.Fail("Booking is already paid");

        booking.PaymentStatus = dto.PaymentStatus;
        booking.UpdatedAt = DateTime.UtcNow;

        if (dto.PaymentStatus == "Paid")
        {
            booking.PaymentDate = DateTime.UtcNow;

            // Confirm seat bookings and generate tickets
            foreach (var passenger in booking.Passengers)
            {
                var seat = passenger.Seat;
                seat.IsAvailable = false;
                seat.IsLocked = false;
                seat.LockedUntil = null;
                seat.PassengerId = passenger.PassengerId;

                // Generate ticket
                var ticket = new BookingTicket
                {
                    PassengerId = passenger.PassengerId,
                    TicketNumber = GenerateTicketNumber(),
                    QRCode = GenerateQRCode(passenger.PassengerId),
                    IsUsed = false,
                    IssuedAt = DateTime.UtcNow
                };

                _context.BookingTickets.Add(ticket);
            }
        }
        else if (dto.PaymentStatus == "Failed")
        {
            // Release locked seats
            foreach (var passenger in booking.Passengers)
            {
                var seat = passenger.Seat;
                seat.IsLocked = false;
                seat.LockedUntil = null;
            }
        }

        await _context.SaveChangesAsync();
        return await GetBookingByIdAsync(bookingId, booking.UserId);
    }

    public async Task<ApiResponse<TicketValidationResponseDto>> ValidateTicketAsync(ValidateTicketDto dto, int validatorUserId)
    {
        if (string.IsNullOrWhiteSpace(dto.TicketNumber) && string.IsNullOrWhiteSpace(dto.QRCode))
            return ApiResponse<TicketValidationResponseDto>.Fail("Ticket number or QR code is required");

        BookingTicket? ticket = null;

        if (!string.IsNullOrWhiteSpace(dto.TicketNumber))
        {
            ticket = await _context.BookingTickets
                .Include(t => t.Passenger)
                    .ThenInclude(p => p.Seat)
                .Include(t => t.Passenger)
                    .ThenInclude(p => p.Trip)
                        .ThenInclude(t => t.Bus)
                .Include(t => t.Passenger)
                    .ThenInclude(p => p.Trip)
                        .ThenInclude(t => t.Route)
                .FirstOrDefaultAsync(t => t.TicketNumber == dto.TicketNumber);
        }
        else if (!string.IsNullOrWhiteSpace(dto.QRCode))
        {
            ticket = await _context.BookingTickets
                .Include(t => t.Passenger)
                    .ThenInclude(p => p.Seat)
                .Include(t => t.Passenger)
                    .ThenInclude(p => p.Trip)
                        .ThenInclude(t => t.Bus)
                .Include(t => t.Passenger)
                    .ThenInclude(p => p.Trip)
                        .ThenInclude(t => t.Route)
                .FirstOrDefaultAsync(t => t.QRCode == dto.QRCode);
        }

        if (ticket == null)
        {
            return ApiResponse<TicketValidationResponseDto>.Ok(new TicketValidationResponseDto
            {
                IsValid = false,
                Message = "Invalid or already used ticket"
            });
        }

        if (ticket.IsUsed)
        {
            return ApiResponse<TicketValidationResponseDto>.Ok(new TicketValidationResponseDto
            {
                IsValid = false,
                Message = "Invalid or already used ticket"
            });
        }

        var passenger = ticket.Passenger;
        var trip = passenger.Trip;

        // Validate trip date matches today
        if (trip.TripDate.Date != DateTime.UtcNow.Date)
        {
            return ApiResponse<TicketValidationResponseDto>.Ok(new TicketValidationResponseDto
            {
                IsValid = false,
                Message = $"Ticket is for {trip.TripDate:yyyy-MM-dd}, not today"
            });
        }

        // Mark ticket as used
        ticket.IsUsed = true;
        ticket.UsedAt = DateTime.UtcNow;
        ticket.ValidatedByUserId = validatorUserId;
        await _context.SaveChangesAsync();

        var response = new TicketValidationResponseDto
        {
            IsValid = true,
            Message = "Ticket validated successfully",
            TicketDetails = new TicketDetailsDto
            {
                TicketNumber = ticket.TicketNumber,
                PassengerName = passenger.FullName,
                Gender = passenger.Gender,
                SeatNumber = passenger.Seat.SeatNumber,
                Trip = new TripDetailsDto
                {
                    TripId = trip.TripId,
                    BusNumber = trip.Bus.BusNumber,
                    Origin = trip.Route.Origin,
                    Destination = trip.Route.Destination,
                    TripDate = trip.TripDate,
                    DepartureTime = trip.DepartureTime,
                    ArrivalTime = trip.ArrivalTime
                },
                IsUsed = ticket.IsUsed,
                IssuedAt = ticket.IssuedAt,
                UsedAt = ticket.UsedAt
            }
        };

        return ApiResponse<TicketValidationResponseDto>.Ok(response);
    }

    public async Task<ApiResponse<BookingResponseDto>> GetBookingByIdAsync(int bookingId, int userId)
    {
        var booking = await _context.Bookings
            .Include(b => b.Trip)
                .ThenInclude(t => t.Bus)
            .Include(b => b.Trip)
                .ThenInclude(t => t.Route)
            .Include(b => b.Passengers)
                .ThenInclude(p => p.Seat)
            .Include(b => b.Passengers)
                .ThenInclude(p => p.BookingTicket)
            .FirstOrDefaultAsync(b => b.BookingId == bookingId && b.UserId == userId);

        if (booking == null)
            return ApiResponse<BookingResponseDto>.Fail("Booking not found");

        var response = MapToBookingResponseDto(booking);
        return ApiResponse<BookingResponseDto>.Ok(response);
    }

    public async Task<ApiResponse<BookingResponseDto>> GetBookingByReferenceAsync(string bookingReference, int userId)
    {
        var booking = await _context.Bookings
            .Include(b => b.Trip)
                .ThenInclude(t => t.Bus)
            .Include(b => b.Trip)
                .ThenInclude(t => t.Route)
            .Include(b => b.Passengers)
                .ThenInclude(p => p.Seat)
            .Include(b => b.Passengers)
                .ThenInclude(p => p.BookingTicket)
            .FirstOrDefaultAsync(b => b.BookingReference == bookingReference && b.UserId == userId);

        if (booking == null)
            return ApiResponse<BookingResponseDto>.Fail("Booking not found");

        var response = MapToBookingResponseDto(booking);
        return ApiResponse<BookingResponseDto>.Ok(response);
    }

    public async Task<ApiResponse<List<BookingResponseDto>>> GetUserBookingsAsync(int userId)
    {
        var bookings = await _context.Bookings
            .Include(b => b.Trip)
                .ThenInclude(t => t.Bus)
            .Include(b => b.Trip)
                .ThenInclude(t => t.Route)
            .Include(b => b.Passengers)
                .ThenInclude(p => p.Seat)
            .Include(b => b.Passengers)
                .ThenInclude(p => p.BookingTicket)
            .Where(b => b.UserId == userId)
            .OrderByDescending(b => b.BookingDate)
            .ToListAsync();

        var response = bookings.Select(MapToBookingResponseDto).ToList();
        return ApiResponse<List<BookingResponseDto>>.Ok(response);
    }

    private BookingResponseDto MapToBookingResponseDto(Booking booking)
    {
        return new BookingResponseDto
        {
            BookingId = booking.BookingId,
            BookingReference = booking.BookingReference,
            TripId = booking.TripId,
            Trip = new TripSummaryDto
            {
                TripId = booking.Trip.TripId,
                BusNumber = booking.Trip.Bus.BusNumber,
                Origin = booking.Trip.Route.Origin,
                Destination = booking.Trip.Route.Destination,
                TripDate = booking.Trip.TripDate,
                DepartureTime = booking.Trip.DepartureTime,
                Price = booking.Trip.Price
            },
            TotalAmount = booking.TotalAmount,
            PaymentMethod = booking.PaymentMethod,
            PaymentStatus = booking.PaymentStatus,
            MobileMoneyPhone = booking.MobileMoneyPhone,
            BookingDate = booking.BookingDate,
            Passengers = booking.Passengers.Select(p => new PassengerResponseDto
            {
                PassengerId = p.PassengerId,
                FullName = p.FullName,
                Gender = p.Gender,
                PhoneOrId = p.PhoneOrId,
                SeatNumber = p.Seat.SeatNumber,
                Ticket = p.BookingTicket != null ? new TicketResponseDto
                {
                    TicketId = p.BookingTicket.BookingTicketId,
                    TicketNumber = p.BookingTicket.TicketNumber,
                    QRCode = p.BookingTicket.QRCode,
                    IsUsed = p.BookingTicket.IsUsed,
                    IssuedAt = p.BookingTicket.IssuedAt
                } : null
            }).ToList()
        };
    }

    private string GenerateBookingReference()
    {
        return $"BK{DateTime.UtcNow:yyyyMMddHHmmss}{new Random().Next(1000, 9999)}";
    }

    private string GenerateTicketNumber()
    {
        return $"TKT{DateTime.UtcNow:yyyyMMddHHmmss}{new Random().Next(1000, 9999)}";
    }

    private string GenerateQRCode(int passengerId)
    {
        return Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(
            $"TICKET-{passengerId}-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid():N}"));
    }
}
