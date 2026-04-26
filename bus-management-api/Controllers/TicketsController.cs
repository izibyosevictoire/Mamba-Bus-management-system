using System.Security.Claims;
using BusManagementApi.Authorization;
using BusManagementApi.Data;
using BusManagementApi.DTOs;
using BusManagementApi.Entities;
using BusManagementApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BusManagementApi.Controllers;
//tickets
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TicketsController : ControllerBase
{
    private readonly BusManagementDbContext _context;
    private readonly IEmailService _emailService;

    public TicketsController(BusManagementDbContext context, IEmailService emailService)
    {
        _context = context;
        _emailService = emailService;
    }

    // Admin: View all tickets
    [HttpGet]
    [HasPermission(Permissions.ViewAllTickets)]
    public async Task<IActionResult> GetAll()
    {
        var tickets = await _context.Tickets
            .Include(t => t.Client)
            .Include(t => t.Schedule).ThenInclude(s => s.Bus)
            .Include(t => t.Schedule).ThenInclude(s => s.Route)
            .Select(t => new TicketDto
            {
                TicketId = t.TicketId,
                TicketNumber = t.TicketNumber,
                ClientName = t.Client.Name,
                BusNumber = t.Schedule.Bus.BusNumber,
                Origin = t.Schedule.Route.Origin,
                Destination = t.Schedule.Route.Destination,
                DepartureTime = t.Schedule.DepartureTime,
                PricePaid = t.PricePaid,
                Status = t.Status,
                DateIssued = t.DateIssued
            })
            .ToListAsync();

        return Ok(ApiResponse<List<TicketDto>>.Ok(tickets));
    }

    // Client: View own tickets
    [HttpGet("my-tickets")]
    [HasPermission(Permissions.ViewOwnTickets)]
    public async Task<IActionResult> GetMyTickets()
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        var tickets = await _context.Tickets
            .Include(t => t.Schedule).ThenInclude(s => s.Bus)
            .Include(t => t.Schedule).ThenInclude(s => s.Route)
            .Where(t => t.ClientId == userId)
            .Select(t => new TicketDto
            {
                TicketId = t.TicketId,
                TicketNumber = t.TicketNumber,
                ClientName = t.Client.Name,
                BusNumber = t.Schedule.Bus.BusNumber,
                Origin = t.Schedule.Route.Origin,
                Destination = t.Schedule.Route.Destination,
                DepartureTime = t.Schedule.DepartureTime,
                PricePaid = t.PricePaid,
                Status = t.Status,
                DateIssued = t.DateIssued
            })
            .ToListAsync();

        return Ok(ApiResponse<List<TicketDto>>.Ok(tickets));
    }

    // Client: Purchase ticket
    [HttpPost("purchase")]
    [HasPermission(Permissions.PurchaseTickets)]
    public async Task<IActionResult> Purchase([FromBody] PurchaseTicketDto dto)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        var schedule = await _context.Schedules
            .Include(s => s.Bus)
            .Include(s => s.Route)
            .Include(s => s.Tickets)
            .FirstOrDefaultAsync(s => s.ScheduleId == dto.ScheduleId);

        if (schedule == null)
            return NotFound(ApiResponse<TicketDto>.Fail("Schedule not found or no longer available."));

        if (schedule.DepartureTime <= DateTime.UtcNow)
            return BadRequest(ApiResponse<TicketDto>.Fail("Cannot purchase ticket for a schedule that has already departed."));

        var activeTickets = schedule.Tickets.Count(t => t.Status == "Active");
        if (activeTickets >= schedule.Bus.Capacity)
            return BadRequest(ApiResponse<TicketDto>.Fail("No available seats"));

        var client = await _context.Users.FindAsync(userId);
        if (client == null)
            return Unauthorized(ApiResponse<TicketDto>.Fail("User profile not found. Please log in again."));

        var ticket = new Ticket
        {
            ClientId = userId,
            ScheduleId = dto.ScheduleId,
            TicketNumber = $"TKT-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..8].ToUpper()}",
            PricePaid = schedule.Route.Price,
            Status = "Active"
        };

        _context.Tickets.Add(ticket);
        await _context.SaveChangesAsync();

        // Fire-and-forget email notification
        try 
        {
            await _emailService.SendTicketConfirmationAsync(client.Email, client.Name, $"{schedule.Route.Origin} to {schedule.Route.Destination}", schedule.DepartureTime.ToString("g"), schedule.Route.Price);
        }
        catch (Exception ex)
        {
            // Log but don't fail the purchase if email fails
            // (Note: EmailService itself has a catch but good practice to be safe here too)
        }

        return Ok(ApiResponse<TicketDto>.Ok(new TicketDto
        {
            TicketId = ticket.TicketId,
            TicketNumber = ticket.TicketNumber,
            ClientName = client!.Name,
            BusNumber = schedule.Bus.BusNumber,
            Origin = schedule.Route.Origin,
            Destination = schedule.Route.Destination,
            DepartureTime = schedule.DepartureTime,
            PricePaid = ticket.PricePaid,
            Status = ticket.Status,
            DateIssued = ticket.DateIssued
        }, "Ticket purchased successfully"));
    }
}
