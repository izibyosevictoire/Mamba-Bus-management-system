namespace BusManagementApi.Entities;

public class Trip
{
    public int TripId { get; set; }
    public int BusId { get; set; }
    public int RouteId { get; set; }
    public DateTime TripDate { get; set; }
    public TimeSpan DepartureTime { get; set; }
    public TimeSpan ArrivalTime { get; set; }
    public decimal Price { get; set; }
    public string Status { get; set; } = "Scheduled"; // Scheduled, InProgress, Completed, Cancelled
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public Bus Bus { get; set; } = null!;
    public Route Route { get; set; } = null!;
    public ICollection<Seat> Seats { get; set; } = new List<Seat>();
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    public ICollection<Passenger> Passengers { get; set; } = new List<Passenger>();
}
