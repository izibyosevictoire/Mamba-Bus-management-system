using System.ComponentModel.DataAnnotations;

namespace BusManagementApi.DTOs;

public class ScheduleDto
{
    public int ScheduleId { get; set; }
    public int BusId { get; set; }
    public string BusNumber { get; set; } = string.Empty;
    public int RouteId { get; set; }
    public string Origin { get; set; } = string.Empty;
    public string Destination { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public DateTime DepartureTime { get; set; }
    public DateTime ArrivalTime { get; set; }
    public int AvailableSeats { get; set; }
    public int? AgencyId { get; set; }
    public string? AgencyName { get; set; }
    public string? BusStatus { get; set; }
}

public class CreateScheduleDto
{
    [Required]
    public int BusId { get; set; }

    [Required]
    public int RouteId { get; set; }

    [Required]
    public DateTime DepartureTime { get; set; }

    [Required]
    public DateTime ArrivalTime { get; set; }
}
