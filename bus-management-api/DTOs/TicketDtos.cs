using System.ComponentModel.DataAnnotations;

namespace BusManagementApi.DTOs;

public class TicketDto
{
    public int TicketId { get; set; }
    public string TicketNumber { get; set; } = string.Empty;
    public string ClientName { get; set; } = string.Empty;
    public string BusNumber { get; set; } = string.Empty;
    public string Origin { get; set; } = string.Empty;
    public string Destination { get; set; } = string.Empty;
    public DateTime DepartureTime { get; set; }
    public decimal PricePaid { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime DateIssued { get; set; }
}

public class PurchaseTicketDto
{
    [Required]
    public int ScheduleId { get; set; }
}
