using System.ComponentModel.DataAnnotations;

namespace BusManagementApi.DTOs;

public class CreateBookingDto
{
    [Required]
    public int TripId { get; set; }

    [Required]
    [MinLength(1, ErrorMessage = "At least one passenger is required")]
    public List<PassengerDto> Passengers { get; set; } = new();

    [Required]
    [RegularExpression("^(MoMo|Cash)$", ErrorMessage = "Payment method must be 'MoMo' or 'Cash'")]
    public string PaymentMethod { get; set; } = string.Empty;

    public string? MobileMoneyPhone { get; set; }
}

public class PassengerDto
{
    [Required]
    [StringLength(200, MinimumLength = 2)]
    public string FullName { get; set; } = string.Empty;

    [StringLength(20)]
    public string? Gender { get; set; }

    [StringLength(50)]
    public string? PhoneOrId { get; set; }

    [Required]
    public string SeatNumber { get; set; } = string.Empty;
}

public class BookingResponseDto
{
    public int BookingId { get; set; }
    public string BookingReference { get; set; } = string.Empty;
    public int TripId { get; set; }
    public TripSummaryDto Trip { get; set; } = null!;
    public decimal TotalAmount { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public string PaymentStatus { get; set; } = string.Empty;
    public string? MobileMoneyPhone { get; set; }
    public DateTime BookingDate { get; set; }
    public List<PassengerResponseDto> Passengers { get; set; } = new();
}

public class PassengerResponseDto
{
    public int PassengerId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? Gender { get; set; }
    public string? PhoneOrId { get; set; }
    public string SeatNumber { get; set; } = string.Empty;
    public TicketResponseDto? Ticket { get; set; }
}

public class TicketResponseDto
{
    public int TicketId { get; set; }
    public string TicketNumber { get; set; } = string.Empty;
    public string QRCode { get; set; } = string.Empty;
    public bool IsUsed { get; set; }
    public DateTime IssuedAt { get; set; }
}

public class UpdatePaymentStatusDto
{
    [Required]
    [RegularExpression("^(Paid|Failed)$", ErrorMessage = "Status must be 'Paid' or 'Failed'")]
    public string PaymentStatus { get; set; } = string.Empty;
}

public class ValidateTicketDto
{
    public string? TicketNumber { get; set; }
    public string? QRCode { get; set; }
}

public class TicketValidationResponseDto
{
    public bool IsValid { get; set; }
    public string Message { get; set; } = string.Empty;
    public TicketDetailsDto? TicketDetails { get; set; }
}

public class TicketDetailsDto
{
    public string TicketNumber { get; set; } = string.Empty;
    public string PassengerName { get; set; } = string.Empty;
    public string? Gender { get; set; }
    public string SeatNumber { get; set; } = string.Empty;
    public TripDetailsDto Trip { get; set; } = null!;
    public bool IsUsed { get; set; }
    public DateTime IssuedAt { get; set; }
    public DateTime? UsedAt { get; set; }
}

public class TripDetailsDto
{
    public int TripId { get; set; }
    public string BusNumber { get; set; } = string.Empty;
    public string Origin { get; set; } = string.Empty;
    public string Destination { get; set; } = string.Empty;
    public DateTime TripDate { get; set; }
    public TimeSpan DepartureTime { get; set; }
    public TimeSpan ArrivalTime { get; set; }
}
