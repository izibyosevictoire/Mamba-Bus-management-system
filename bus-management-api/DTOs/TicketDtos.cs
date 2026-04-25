using System.ComponentModel.DataAnnotations;

namespace BusManagementApi.DTOs;

public class TicketDto
{
    public int TicketId { get; set; }
    public string TicketNumber { get; set; } = string.Empty;
    public string ClientName { get; set; } = string.Empty;
    public string PassengerName { get; set; } = string.Empty;
    public string BusNumber { get; set; } = string.Empty;
    public string Origin { get; set; } = string.Empty;
    public string Destination { get; set; } = string.Empty;
    public DateTime DepartureTime { get; set; }
    public decimal PricePaid { get; set; }
    public int? SeatNumber { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime DateIssued { get; set; }
}

public class PurchaseTicketDto
{
    [Required]
    public int ScheduleId { get; set; }
    public int? SeatNumber { get; set; }
    public string? PassengerName { get; set; }
}

public class PassengerDto
{
    [Required]
    public string PassengerName { get; set; } = string.Empty;
    public string? Gender { get; set; }
    public string? Phone { get; set; }
    public int? SeatNumber { get; set; }
}

public class PurchaseMultiTicketDto
{
    [Required]
    public int ScheduleId { get; set; }
    public string? PaymentMethod { get; set; } = "cash";
    public string? MomoPhone { get; set; }
    [Required]
    public List<PassengerDto> Passengers { get; set; } = new();
}