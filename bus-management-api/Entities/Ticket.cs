namespace BusManagementApi.Entities;

public class Ticket
{
    public int TicketId { get; set; }
    public int ClientId { get; set; }
    public int ScheduleId { get; set; }
    public string TicketNumber { get; set; } = string.Empty;
    public decimal PricePaid { get; set; }
    public string Status { get; set; } = "Active"; // Active, Used, Cancelled
    public DateTime DateIssued { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public User Client { get; set; } = null!;
    public Schedule Schedule { get; set; } = null!;
}
