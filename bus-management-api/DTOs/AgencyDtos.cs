namespace BusManagementApi.DTOs;
// DTO for agency
public class AgencyDto
{
    public int AgencyId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string ContactEmail { get; set; } = string.Empty;
    public string ContactPhone { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class CreateAgencyDto
{
    public string Name { get; set; } = string.Empty;
    public string ContactEmail { get; set; } = string.Empty;
    public string ContactPhone { get; set; } = string.Empty;
}
