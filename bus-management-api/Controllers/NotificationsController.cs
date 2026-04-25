using System.Security.Claims;
using System.Text.Json;
using BusManagementApi.Authorization;
using BusManagementApi.Data;
using BusManagementApi.DTOs;
using BusManagementApi.Entities;
using BusManagementApi.Hubs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace BusManagementApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly BusManagementDbContext _context;
    private readonly IHubContext<NotificationHub> _hubContext;

    public NotificationsController(BusManagementDbContext context, IHubContext<NotificationHub> hubContext)
    {
        _context = context;
        _hubContext = hubContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetMyNotifications()
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        var notifications = await _context.Notifications
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Take(50)
            .Select(n => new
            {
                n.NotificationId,
                n.Title,
                n.Message,
                n.Type,
                n.IsRead,
                n.CreatedAt,
                n.RelatedEntityId
            })
            .ToListAsync();

        return Ok(ApiResponse<object>.Ok(notifications));
    }

    [HttpPut("{id}/read")]
    public async Task<IActionResult> MarkAsRead(int id)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var notification = await _context.Notifications.FirstOrDefaultAsync(n => n.NotificationId == id && n.UserId == userId);

        if (notification == null) return NotFound(ApiResponse<object>.Fail("Notification not found"));

        notification.IsRead = true;
        await _context.SaveChangesAsync();

        return Ok(ApiResponse<object>.Ok(null!, "Marked as read"));
    }

    [HttpPut("read-all")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var notifications = await _context.Notifications.Where(n => n.UserId == userId && !n.IsRead).ToListAsync();

        foreach (var n in notifications)
            n.IsRead = true;

        await _context.SaveChangesAsync();
        return Ok(ApiResponse<object>.Ok(null!, "All marked as read"));
    }

    [HttpPost("emergency-alert")]
    [HasPermission(Permissions.ManageBuses)]
    public async Task<IActionResult> SendEmergencyAlert([FromBody] JsonElement payload)
    {
        string message = payload.GetProperty("message").GetString() ?? string.Empty;
        int? targetDriverId = payload.TryGetProperty("driverId", out var dId) ? dId.GetInt32() : null;

        var driversQuery = _context.Users.Where(u => u.UserType == "Driver" && u.IsActive);

        if (targetDriverId.HasValue)
            driversQuery = driversQuery.Where(u => u.UserId == targetDriverId.Value);

        var drivers = await driversQuery.ToListAsync();

        // Prevent duplicate: skip drivers already notified with this exact message
        var alreadyNotifiedIds = await _context.Notifications
            .Where(n => n.Type == "Alert" && n.Message == message)
            .Select(n => n.UserId)
            .Distinct()
            .ToListAsync();

        var notifications = new List<Notification>();
        foreach (var d in drivers)
        {
            if (alreadyNotifiedIds.Contains(d.UserId)) continue;
            notifications.Add(new Notification
            {
                UserId = d.UserId,
                Title = "Emergency Alert",
                Message = message,
                Type = "Alert"
            });
        }

        if (!notifications.Any())
            return Ok(ApiResponse<object>.Ok(null!, "No new notifications (duplicate suppressed)"));

        _context.Notifications.AddRange(notifications);
        await _context.SaveChangesAsync();

        foreach (var n in notifications)
        {
            if (NotificationHub.UserConnections.TryGetValue(n.UserId.ToString(), out var connectionId))
            {
                await _hubContext.Clients.Client(connectionId).SendAsync("ReceiveNotification", new
                {
                    n.NotificationId,
                    n.Title,
                    n.Message,
                    n.Type,
                    n.IsRead,
                    n.CreatedAt
                });
            }
        }

        return Ok(ApiResponse<object>.Ok(null!, "Alert sent successfully"));
    }

    [HttpPost("trip-update")]
    [HasPermission(Permissions.ViewOwnAssignment)]
    public async Task<IActionResult> SendTripUpdate([FromBody] JsonElement payload)
    {
        var driverId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var driverName = User.FindFirst(ClaimTypes.Name)!.Value;

        string message = payload.GetProperty("message").GetString() ?? string.Empty;

        var assignment = await _context.DriverAssignments
            .Where(da => da.DriverId == driverId && da.Status == "Active")
            .FirstOrDefaultAsync();

        var recipientIds = new HashSet<int>();

        var adminIds = await _context.Users
            .Where(u => u.UserType == "Admin" && u.IsActive)
            .Select(u => u.UserId)
            .ToListAsync();
        foreach (var id in adminIds) recipientIds.Add(id);

        if (assignment != null)
        {
            var now = DateTime.Now.AddHours(-2);
            var passengerIds = await _context.Tickets
                .Where(t => t.Status == "Active" &&
                            t.Schedule.BusId == assignment.BusId &&
                            t.Schedule.DepartureTime >= now)
                .Select(t => t.ClientId)
                .Distinct()
                .ToListAsync();
            foreach (var id in passengerIds) recipientIds.Add(id);
        }

        var usersToNotify = await _context.Users
            .Where(u => recipientIds.Contains(u.UserId))
            .ToListAsync();

        // Prevent duplicate: skip users already notified with this exact title + message (truly idempotent)
        var titleToMatch = $"Trip Update: Driver {driverName}";
        var alreadyNotifiedUserIds = await _context.Notifications
            .Where(n => n.Type == "TripUpdate" && n.Title == titleToMatch && n.Message == message)
            .Select(n => n.UserId)
            .Distinct()
            .ToListAsync();

        var notifications = new List<Notification>();
        foreach (var currentUser in usersToNotify)
        {
            if (alreadyNotifiedUserIds.Contains(currentUser.UserId)) continue;
            notifications.Add(new Notification
            {
                UserId = currentUser.UserId,
                Title = titleToMatch,
                Message = message,
                Type = "TripUpdate"
            });
        }

        if (!notifications.Any())
            return Ok(ApiResponse<object>.Ok(null!, "No new notifications (duplicate suppressed)"));

        _context.Notifications.AddRange(notifications);
        await _context.SaveChangesAsync();

        foreach (var n in notifications)
        {
            if (NotificationHub.UserConnections.TryGetValue(n.UserId.ToString(), out var connectionId))
            {
                await _hubContext.Clients.Client(connectionId).SendAsync("ReceiveNotification", new
                {
                    n.NotificationId,
                    n.Title,
                    n.Message,
                    n.Type,
                    n.IsRead,
                    n.CreatedAt
                });
            }
        }

        return Ok(ApiResponse<object>.Ok(null!, "Trip update broadcasted"));
    }
}
