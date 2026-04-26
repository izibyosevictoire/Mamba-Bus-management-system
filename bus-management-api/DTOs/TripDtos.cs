using System.ComponentModel.DataAnnotations;

namespace BusManagementApi.DTOs;

public class CreateTripDto
{
    [Required]
    public int BusId { get; set; }

    [Required]
    public int RouteId { get; set; }

    [Required]
    public DateTime TripDate { get; set; }

    [Required]
    public TimeSpan DepartureTime { get; set; }

    [Required]
    public TimeSpan ArrivalTime { get; set; }

    [Required]
    [Range(0.01, double.MaxValue, ErrorMessage = "Price must be greater than 0")]
    public decimal Price { get; set; }
}

public class UpdateTripDto
{
    public DateTime? TripDate { get; set; }
    public TimeSpan? DepartureTime { get; set; }
    public TimeSpan? ArrivalTime { get; set; }
    public decimal? Price { get; set; }
    
    [RegularExpression("^(Scheduled|InProgress|Completed|Cancelled)$")]
    public string? Status { get; set; }
}

public class TripResponseDto
{
    public int TripId { get; set; }
    public int BusId { get; set; }
    public string BusNumber { get; set; } = string.Empty;
    public int BusCapacity { get; set; }
    public int RouteId { get; set; }
    public string Origin { get; set; } = string.Empty;
    public string Destination { get; set; } = string.Empty;
    public DateTime TripDate { get; set; }
    public TimeSpan DepartureTime { get; set; }
    public TimeSpan ArrivalTime { get; set; }
    public decimal Price { get; set; }
    public string Status { get; set; } = string.Empty;
    public int AvailableSeats { get; set; }
    public int BookedSeats { get; set; }
}

public class TripSummaryDto
{
    public int TripId { get; set; }
    public string BusNumber { get; set; } = string.Empty;
    public string Origin { get; set; } = string.Empty;
    public string Destination { get; set; } = string.Empty;
    public DateTime TripDate { get; set; }
    public TimeSpan DepartureTime { get; set; }
    public decimal Price { get; set; }
}

public class SeatAvailabilityDto
{
    public int TripId { get; set; }
    public List<SeatDto> Seats { get; set; } = new();
}

public class SeatDto
{
    public int SeatId { get; set; }
    public string SeatNumber { get; set; } = string.Empty;
    public bool IsAvailable { get; set; }
    public bool IsLocked { get; set; }
}
