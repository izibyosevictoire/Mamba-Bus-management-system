using System.ComponentModel.DataAnnotations;

namespace BusManagementApi.DTOs;

public class DriverAssignmentDto
{
    public int AssignmentId { get; set; }
    public int DriverId { get; set; }
    public string DriverName { get; set; } = string.Empty;
    public int BusId { get; set; }
    public string BusNumber { get; set; } = string.Empty;
    public DateTime AssignmentDate { get; set; }
    public string Status { get; set; } = string.Empty;
}

public class CreateAssignmentDto
{
    [Required]
    public int DriverId { get; set; }

    [Required]
    public int BusId { get; set; }
}
