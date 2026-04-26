namespace BusManagementApi.Entities;
//notification entity
public class Notification
{
    public int NotificationId { get; set; }
    public int UserId { get; set; } // The recipient
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    
    // Alert, Message, Assignment, TripUpdate, System
    public string Type { get; set; } = "Info"; 
    
    public bool IsRead { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Optional: link to driver assignment, ticket, or schedule
    public int? RelatedEntityId { get; set; } 

    public User User { get; set; } = null!;
}
