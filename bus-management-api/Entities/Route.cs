namespace BusManagementApi.Entities;
//route entity
public class Route
{
    public int RouteId { get; set; }
    public string Origin { get; set; } = string.Empty;
    public string Destination { get; set; } = string.Empty;
    public decimal Distance { get; set; }
    public decimal Price { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public ICollection<Schedule> Schedules { get; set; } = new List<Schedule>();
}
