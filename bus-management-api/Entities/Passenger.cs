namespace BusManagementApi.Entities;

public class Passenger
{
    public int PassengerId { get; set; }
    public int BookingId { get; set; }
    public int TripId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? Gender { get; set; }
    public string? PhoneOrId { get; set; }
    public int SeatId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Booking Booking { get; set; } = null!;
    public Trip Trip { get; set; } = null!;
    public Seat Seat { get; set; } = null!;
    public BookingTicket? BookingTicket { get; set; }
}
