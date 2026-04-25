namespace BusManagementApi.Entities;

public class Ticket
{
    public int TicketId { get; set; }
    public int ClientId { get; set; }
    public int ScheduleId { get; set; }
    public string TicketNumber { get; set; } = string.Empty;
    public string PassengerName { get; set; } = string.Empty;
    public string? PassengerNameNormalized { get; set; }
    public string? PassengerGender { get; set; }
    public string? PassengerContact { get; set; }
    public decimal PricePaid { get; set; }
    public int? SeatNumber { get; set; }
    public string Status { get; set; } = "Active"; // Active, Used, Cancelled
    public string? PaymentMethod { get; set; } = "cash";
    public string? PaymentStatus { get; set; } = "Pending";
    public string? MomoPhone { get; set; }
    public string? ValidationToken { get; set; }
    public DateTime? CheckedInAt { get; set; }
    public DateTime DateIssued { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public User Client { get; set; } = null!;
    public Schedule Schedule { get; set; } = null!;
}