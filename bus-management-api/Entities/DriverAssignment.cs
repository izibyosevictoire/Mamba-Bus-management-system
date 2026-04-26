namespace BusManagementApi.Entities;
//driver assignment entity
public class DriverAssignment
{
    public int AssignmentId { get; set; }
    public int DriverId { get; set; }
    public int BusId { get; set; }
    public DateTime AssignmentDate { get; set; } = DateTime.UtcNow;
    public string Status { get; set; } = "Pending"; // Pending, Active, Completed, Cancelled, Rejected

    // Navigation properties
    public User Driver { get; set; } = null!;
    public Bus Bus { get; set; } = null!;
}
