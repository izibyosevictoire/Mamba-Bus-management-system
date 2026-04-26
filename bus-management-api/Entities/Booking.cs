namespace BusManagementApi.Entities;

public class Booking
{
    public int BookingId { get; set; }
    public string BookingReference { get; set; } = string.Empty;
    public int UserId { get; set; }
    public int TripId { get; set; }
    public decimal TotalAmount { get; set; }
    public string PaymentMethod { get; set; } = string.Empty; // MoMo, Cash
    public string PaymentStatus { get; set; } = "Pending"; // Pending, Paid, Failed
    public string? MobileMoneyPhone { get; set; }
    public DateTime BookingDate { get; set; } = DateTime.UtcNow;
    public DateTime? PaymentDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public User User { get; set; } = null!;
    public Trip Trip { get; set; } = null!;
    public ICollection<Passenger> Passengers { get; set; } = new List<Passenger>();
}
