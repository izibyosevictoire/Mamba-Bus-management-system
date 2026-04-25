namespace BusManagementApi.Entities;

public class Permission
{
    public int PermissionId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Module { get; set; } = string.Empty; // Buses, Routes, Schedules, Tickets, Drivers, Users
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<UserPermission> UserPermissions { get; set; } = new List<UserPermission>();
}
