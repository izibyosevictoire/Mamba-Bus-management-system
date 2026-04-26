namespace BusManagementApi.Entities;

public class User
{
    public int UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string UserType { get; set; } = "Client"; // Admin, Driver, Client
    public string? LicenceNumber { get; set; }
    public string? LicencePhoto { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public ICollection<UserPermission> UserPermissions { get; set; } = new List<UserPermission>();
    public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
    public ICollection<DriverAssignment> DriverAssignments { get; set; } = new List<DriverAssignment>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
}
