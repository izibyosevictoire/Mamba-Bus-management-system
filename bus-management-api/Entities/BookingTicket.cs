namespace BusManagementApi.Entities;

public class BookingTicket
{
    public int BookingTicketId { get; set; }
    public int PassengerId { get; set; }
    public string TicketNumber { get; set; } = string.Empty;
    public string QRCode { get; set; } = string.Empty;
    public bool IsUsed { get; set; } = false;
    public DateTime? UsedAt { get; set; }
    public int? ValidatedByUserId { get; set; }
    public DateTime IssuedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Passenger Passenger { get; set; } = null!;
    public User? ValidatedBy { get; set; }
}
