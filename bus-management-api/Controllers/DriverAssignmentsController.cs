using System.Security.Claims;
using BusManagementApi.Authorization;
using BusManagementApi.Data;
using BusManagementApi.DTOs;
using BusManagementApi.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BusManagementApi.Hubs;
using Microsoft.AspNetCore.SignalR;
using BusManagementApi.Services;

namespace BusManagementApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DriverAssignmentsController : ControllerBase
{
    private readonly BusManagementDbContext _context;
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly IEmailService _emailService;

    public DriverAssignmentsController(BusManagementDbContext context, IHubContext<NotificationHub> hubContext, IEmailService emailService)
    {
        _context = context;
        _hubContext = hubContext;
        _emailService = emailService;
    }

    // Admin: View all assignments
    [HttpGet]
    [HasPermission(Permissions.ManageAssignments)]
    public async Task<IActionResult> GetAll()
    {
        var assignments = await _context.DriverAssignments
            .Include(da => da.Driver)
            .Include(da => da.Bus)
            .Select(da => new DriverAssignmentDto
            {
                AssignmentId = da.AssignmentId,
                DriverId = da.DriverId,
                DriverName = da.Driver.Name,
                BusId = da.BusId,
                BusNumber = da.Bus.BusNumber,
                AssignmentDate = da.AssignmentDate,
                Status = da.Status
            })
            .ToListAsync();

        return Ok(ApiResponse<List<DriverAssignmentDto>>.Ok(assignments));
    }

    // Driver: View own assignment
    [HttpGet("my-assignment")]
    [HasPermission(Permissions.ViewOwnAssignment)]
    public async Task<IActionResult> GetMyAssignment()
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        var assignment = await _context.DriverAssignments
            .Include(da => da.Driver)
            .Include(da => da.Bus)
            .Where(da => da.DriverId == userId && (da.Status == "Active" || da.Status == "Pending"))
            .OrderByDescending(da => da.AssignmentDate)
            .Select(da => new DriverAssignmentDto
            {
                AssignmentId = da.AssignmentId,
                DriverId = da.DriverId,
                DriverName = da.Driver.Name,
                BusId = da.BusId,
                BusNumber = da.Bus.BusNumber,
                AssignmentDate = da.AssignmentDate,
                Status = da.Status
            })
            .FirstOrDefaultAsync();

        if (assignment == null)
            return NotFound(ApiResponse<DriverAssignmentDto>.Fail("No active or pending assignment"));

        return Ok(ApiResponse<DriverAssignmentDto>.Ok(assignment));
    }

    // Admin: Create assignment
    [HttpPost]
    [HasPermission(Permissions.ManageAssignments)]
    public async Task<IActionResult> Create([FromBody] CreateAssignmentDto dto)
    {
        var driver = await _context.Users.FirstOrDefaultAsync(u => u.UserId == dto.DriverId && u.UserType == "Driver");
        if (driver == null)
            return BadRequest(ApiResponse<DriverAssignmentDto>.Fail("Driver not found"));

        var bus = await _context.Buses.FindAsync(dto.BusId);
        if (bus == null)
            return BadRequest(ApiResponse<DriverAssignmentDto>.Fail("Bus not found"));

        // Check if bus already has active or pending driver
        if (await _context.DriverAssignments.AnyAsync(da => da.BusId == dto.BusId && (da.Status == "Active" || da.Status == "Pending")))
            return BadRequest(ApiResponse<DriverAssignmentDto>.Fail("Bus already has an active or pending driver"));

        // Check if driver already assigned
        if (await _context.DriverAssignments.AnyAsync(da => da.DriverId == dto.DriverId && (da.Status == "Active" || da.Status == "Pending")))
            return BadRequest(ApiResponse<DriverAssignmentDto>.Fail("Driver already assigned or pending another bus"));

        var assignment = new DriverAssignment
        {
            DriverId = dto.DriverId,
            BusId = dto.BusId,
            Status = "Pending"
        };

        _context.DriverAssignments.Add(assignment);
        
        var notification = new Notification
        {
            UserId = driver.UserId,
            Title = "New Bus Assignment",
            Message = $"You have been assigned to Bus {bus.BusNumber}. Please accept or reject this assignment.",
            Type = "Assignment",
            RelatedEntityId = assignment.AssignmentId
        };
        _context.Notifications.Add(notification);
        
        await _context.SaveChangesAsync();

        if (NotificationHub.UserConnections.TryGetValue(driver.UserId.ToString(), out var connectionId))
        {
            await _hubContext.Clients.Client(connectionId).SendAsync("ReceiveNotification", new 
            {
                notification.NotificationId,
                notification.Title,
                notification.Message,
                notification.Type,
                notification.IsRead,
                notification.CreatedAt
            });
        }
    
        // Email Notification to Driver
        await _emailService.SendAssignmentNotificationAsync(driver.Email, driver.Name, bus.BusNumber);

        return Ok(ApiResponse<DriverAssignmentDto>.Ok(new DriverAssignmentDto
        {
            AssignmentId = assignment.AssignmentId,
            DriverId = assignment.DriverId,
            DriverName = driver.Name,
            BusId = assignment.BusId,
            BusNumber = bus.BusNumber,
            AssignmentDate = assignment.AssignmentDate,
            Status = assignment.Status
        }, "Driver assigned"));
    }

    // Driver: Respond to assignment
    [HttpPut("{id}/respond")]
    [HasPermission(Permissions.ViewOwnAssignment)]
    public async Task<IActionResult> Respond(int id, [FromBody] dynamic payload)
    {
        string response = payload.GetProperty("status").GetString(); // "Accepted" or "Rejected"
        if (response != "Accepted" && response != "Rejected")
            return BadRequest(ApiResponse<object>.Fail("Invalid response"));

        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var driverName = User.FindFirst(ClaimTypes.Name)!.Value;

        var assignment = await _context.DriverAssignments
            .Include(a => a.Bus)
            .FirstOrDefaultAsync(a => a.AssignmentId == id && a.DriverId == userId);
            
        if (assignment == null)
            return NotFound(ApiResponse<object>.Fail("Assignment not found"));

        if (assignment.Status != "Pending")
            return BadRequest(ApiResponse<object>.Fail("Assignment is already " + assignment.Status));

        assignment.Status = response == "Accepted" ? "Active" : "Rejected";
        
        // Notify Admins
        var admins = await _context.Users.Where(u => u.UserType == "Admin" && u.IsActive).ToListAsync();
        var notifications = new List<Notification>();
        foreach (var admin in admins)
        {
            notifications.Add(new Notification
            {
                UserId = admin.UserId,
                Title = $"Assignment {response}",
                Message = $"Driver {driverName} has {response.ToLower()} the assignment for Bus {assignment.Bus.BusNumber}.",
                Type = "Alert",
                RelatedEntityId = assignment.AssignmentId
            });
        }
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

        return Ok(ApiResponse<object>.Ok(null!, $"Assignment {response.ToLower()} successfully"));
    }

    // Admin: Delete assignment
    [HttpDelete("{id}")]
    [HasPermission(Permissions.ManageAssignments)]
    public async Task<IActionResult> Delete(int id)
    {
        var assignment = await _context.DriverAssignments.FindAsync(id);
        if (assignment == null)
            return NotFound(ApiResponse<object>.Fail("Assignment not found"));

        // If it was already responded, maybe just "Cancel" instead of hard delete, but let's keep delete logic as is or just do hard delete
        _context.DriverAssignments.Remove(assignment);
        await _context.SaveChangesAsync();
        return Ok(ApiResponse<object>.Ok(null!, "Assignment deleted"));
    }
}
