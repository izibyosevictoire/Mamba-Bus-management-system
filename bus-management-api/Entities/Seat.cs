namespace BusManagementApi.Entities;

public class Seat
{
    public int SeatId { get; set; }
    public int TripId { get; set; }
    public string SeatNumber { get; set; } = string.Empty;
    public bool IsAvailable { get; set; } = true;
    public bool IsLocked { get; set; } = false;
    public DateTime? LockedUntil { get; set; }
    public int? PassengerId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public Trip Trip { get; set; } = null!;
    public Passenger? Passenger { get; set; }
}
