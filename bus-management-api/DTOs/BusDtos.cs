using System.ComponentModel.DataAnnotations;

namespace BusManagementApi.DTOs;

public class BusDto
{
    public int BusId { get; set; }
    public string BusNumber { get; set; } = string.Empty;
    public int Capacity { get; set; }
    public string Model { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int? AgencyId { get; set; }
    public string? AgencyName { get; set; }
}

public class CreateBusDto
{
    [Required]
    public string BusNumber { get; set; } = string.Empty;

    [Required, Range(1, 100)]
    public int Capacity { get; set; }

    [Required]
    public string Model { get; set; } = string.Empty;

    public string Status { get; set; } = "Active";
    public int? AgencyId { get; set; }
}
