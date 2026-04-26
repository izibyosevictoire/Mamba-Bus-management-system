namespace BusManagementApi.Entities;
//schedule entity
public class Schedule
{
    public int ScheduleId { get; set; }
    public int BusId { get; set; }
    public int RouteId { get; set; }
    public DateTime DepartureTime { get; set; }
    public DateTime ArrivalTime { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public Bus Bus { get; set; } = null!;
    public Route Route { get; set; } = null!;
    public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
}
