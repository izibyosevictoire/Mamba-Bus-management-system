using Microsoft.EntityFrameworkCore;
using BusManagementApi.Data;
using BusManagementApi.DTOs;
using BusManagementApi.Entities;

namespace BusManagementApi.Services;

public class TripService : ITripService
{
    private readonly BusManagementDbContext _context;

    public TripService(BusManagementDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<TripResponseDto>> CreateTripAsync(CreateTripDto dto)
    {
        // Validate bus exists
        var bus = await _context.Buses.FindAsync(dto.BusId);
        if (bus == null)
            return ApiResponse<TripResponseDto>.Fail("Bus not found");

        // Validate route exists
        var route = await _context.Routes.FindAsync(dto.RouteId);
        if (route == null)
            return ApiResponse<TripResponseDto>.Fail("Route not found");

        // Check for duplicate trip
        var existingTrip = await _context.Trips
            .AnyAsync(t => t.BusId == dto.BusId && 
                          t.TripDate.Date == dto.TripDate.Date && 
                          t.DepartureTime == dto.DepartureTime);

        if (existingTrip)
            return ApiResponse<TripResponseDto>.Fail("A trip with this bus, date, and time already exists");

        var trip = new Trip
        {
            BusId = dto.BusId,
            RouteId = dto.RouteId,
            TripDate = dto.TripDate.Date,
            DepartureTime = dto.DepartureTime,
            ArrivalTime = dto.ArrivalTime,
            Price = dto.Price,
            Status = "Scheduled"
        };

        _context.Trips.Add(trip);
        await _context.SaveChangesAsync();

        // Generate seats for the trip
        await GenerateSeatsForTripAsync(trip.TripId, bus.Capacity);

        return await GetTripByIdAsync(trip.TripId);
    }

    private async Task GenerateSeatsForTripAsync(int tripId, int capacity)
    {
        var seats = new List<Seat>();
        for (int i = 1; i <= capacity; i++)
        {
            seats.Add(new Seat
            {
                TripId = tripId,
                SeatNumber = $"S{i:D2}",
                IsAvailable = true,
                IsLocked = false
            });
        }

        _context.Seats.AddRange(seats);
        await _context.SaveChangesAsync();
    }

    public async Task<ApiResponse<TripResponseDto>> GetTripByIdAsync(int tripId)
    {
        var trip = await _context.Trips
            .Include(t => t.Bus)
            .Include(t => t.Route)
            .Include(t => t.Seats)
            .FirstOrDefaultAsync(t => t.TripId == tripId);

        if (trip == null)
            return ApiResponse<TripResponseDto>.Fail("Trip not found");

        var response = MapToTripResponseDto(trip);
        return ApiResponse<TripResponseDto>.Ok(response);
    }

    public async Task<ApiResponse<List<TripResponseDto>>> GetAllTripsAsync(DateTime? fromDate = null, DateTime? toDate = null)
    {
        var query = _context.Trips
            .Include(t => t.Bus)
            .Include(t => t.Route)
            .Include(t => t.Seats)
            .AsQueryable();

        if (fromDate.HasValue)
            query = query.Where(t => t.TripDate >= fromDate.Value.Date);

        if (toDate.HasValue)
            query = query.Where(t => t.TripDate <= toDate.Value.Date);

        var trips = await query.OrderBy(t => t.TripDate).ThenBy(t => t.DepartureTime).ToListAsync();
        var response = trips.Select(MapToTripResponseDto).ToList();

        return ApiResponse<List<TripResponseDto>>.Ok(response);
    }

    public async Task<ApiResponse<List<TripResponseDto>>> SearchTripsAsync(string? origin, string? destination, DateTime? tripDate)
    {
        var query = _context.Trips
            .Include(t => t.Bus)
            .Include(t => t.Route)
            .Include(t => t.Seats)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(origin))
            query = query.Where(t => t.Route.Origin.Contains(origin));

        if (!string.IsNullOrWhiteSpace(destination))
            query = query.Where(t => t.Route.Destination.Contains(destination));

        if (tripDate.HasValue)
            query = query.Where(t => t.TripDate.Date == tripDate.Value.Date);

        var trips = await query
            .Where(t => t.Status == "Scheduled")
            .OrderBy(t => t.TripDate)
            .ThenBy(t => t.DepartureTime)
            .ToListAsync();

        var response = trips.Select(MapToTripResponseDto).ToList();
        return ApiResponse<List<TripResponseDto>>.Ok(response);
    }

    public async Task<ApiResponse<TripResponseDto>> UpdateTripAsync(int tripId, UpdateTripDto dto)
    {
        var trip = await _context.Trips.FindAsync(tripId);
        if (trip == null)
            return ApiResponse<TripResponseDto>.Fail("Trip not found");

        if (dto.TripDate.HasValue)
            trip.TripDate = dto.TripDate.Value.Date;

        if (dto.DepartureTime.HasValue)
            trip.DepartureTime = dto.DepartureTime.Value;

        if (dto.ArrivalTime.HasValue)
            trip.ArrivalTime = dto.ArrivalTime.Value;

        if (dto.Price.HasValue)
            trip.Price = dto.Price.Value;

        if (!string.IsNullOrWhiteSpace(dto.Status))
            trip.Status = dto.Status;

        trip.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return await GetTripByIdAsync(tripId);
    }

    public async Task<ApiResponse<bool>> DeleteTripAsync(int tripId)
    {
        var trip = await _context.Trips
            .Include(t => t.Bookings)
            .FirstOrDefaultAsync(t => t.TripId == tripId);

        if (trip == null)
            return ApiResponse<bool>.Fail("Trip not found");

        if (trip.Bookings.Any())
            return ApiResponse<bool>.Fail("Cannot delete trip with existing bookings");

        _context.Trips.Remove(trip);
        await _context.SaveChangesAsync();

        return ApiResponse<bool>.Ok(true, "Trip deleted successfully");
    }

    public async Task<ApiResponse<SeatAvailabilityDto>> GetSeatAvailabilityAsync(int tripId)
    {
        var trip = await _context.Trips
            .Include(t => t.Seats)
            .FirstOrDefaultAsync(t => t.TripId == tripId);

        if (trip == null)
            return ApiResponse<SeatAvailabilityDto>.Fail("Trip not found");

        // Release expired locks
        var expiredLocks = trip.Seats.Where(s => s.IsLocked && s.LockedUntil < DateTime.UtcNow);
        foreach (var seat in expiredLocks)
        {
            seat.IsLocked = false;
            seat.LockedUntil = null;
        }
        await _context.SaveChangesAsync();

        var response = new SeatAvailabilityDto
        {
            TripId = tripId,
            Seats = trip.Seats.Select(s => new SeatDto
            {
                SeatId = s.SeatId,
                SeatNumber = s.SeatNumber,
                IsAvailable = s.IsAvailable,
                IsLocked = s.IsLocked
            }).OrderBy(s => s.SeatNumber).ToList()
        };

        return ApiResponse<SeatAvailabilityDto>.Ok(response);
    }

    private TripResponseDto MapToTripResponseDto(Trip trip)
    {
        var availableSeats = trip.Seats.Count(s => s.IsAvailable && !s.IsLocked);
        var bookedSeats = trip.Seats.Count(s => !s.IsAvailable);

        return new TripResponseDto
        {
            TripId = trip.TripId,
            BusId = trip.BusId,
            BusNumber = trip.Bus.BusNumber,
            BusCapacity = trip.Bus.Capacity,
            RouteId = trip.RouteId,
            Origin = trip.Route.Origin,
            Destination = trip.Route.Destination,
            TripDate = trip.TripDate,
            DepartureTime = trip.DepartureTime,
            ArrivalTime = trip.ArrivalTime,
            Price = trip.Price,
            Status = trip.Status,
            AvailableSeats = availableSeats,
            BookedSeats = bookedSeats
        };
    }
}
