using System.ComponentModel.DataAnnotations;

namespace BusManagementApi.DTOs;
// DTO for route
public class RouteDto
{
    public int RouteId { get; set; }
    public string Origin { get; set; } = string.Empty;
    public string Destination { get; set; } = string.Empty;
    public decimal Distance { get; set; }
    public decimal Price { get; set; }
}

public class CreateRouteDto
{
    [Required]
    public string Origin { get; set; } = string.Empty;

    [Required]
    public string Destination { get; set; } = string.Empty;

    [Required, Range(0.1, 10000)]
    public decimal Distance { get; set; }

    [Required, Range(0.01, 100000)]
    public decimal Price { get; set; }
}
