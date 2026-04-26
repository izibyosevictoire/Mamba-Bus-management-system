namespace BusManagementApi.Entities;
//bus entity
public class Bus
{
    public int BusId { get; set; }
    public string BusNumber { get; set; } = string.Empty;
    public int Capacity { get; set; }
    public string Model { get; set; } = string.Empty;
    public string Status { get; set; } = "Active";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public int? AgencyId { get; set; }
    public Agency? Agency { get; set; }

    // Navigation properties
    public ICollection<Schedule> Schedules { get; set; } = new List<Schedule>();
    public ICollection<DriverAssignment> DriverAssignments { get; set; } = new List<DriverAssignment>();
}
