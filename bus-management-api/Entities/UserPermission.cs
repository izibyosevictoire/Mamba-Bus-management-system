namespace BusManagementApi.Entities;

public class UserPermission
{
    public int UserPermissionId { get; set; }
    public int UserId { get; set; }
    public int PermissionId { get; set; }
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public User User { get; set; } = null!;
    public Permission Permission { get; set; } = null!;
}
