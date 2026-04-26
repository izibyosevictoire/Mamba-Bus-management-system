namespace BusManagementApi.Entities;
//agency entity
public class Agency
{
    public int AgencyId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string ContactEmail { get; set; } = string.Empty;
    public string ContactPhone { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<Bus> Buses { get; set; } = new List<Bus>();
}
