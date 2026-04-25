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

    private TicketDto MapToDto(Ticket t, string clientName, string busNumber, string origin, string destination, DateTime departureTime) => new TicketDto
    {
        TicketId = t.TicketId,
        TicketNumber = t.TicketNumber,
        ClientName = clientName,
        PassengerName = t.PassengerName,
        BusNumber = busNumber,
        Origin = origin,
        Destination = destination,
        DepartureTime = departureTime,
        PricePaid = t.PricePaid,
        Status = t.Status,
        DateIssued = t.DateIssued,
        SeatNumber = t.SeatNumber,
    };

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
                TicketId = t.TicketId, TicketNumber = t.TicketNumber,
                ClientName = t.Client.Name, PassengerName = t.PassengerName,
                BusNumber = t.Schedule.Bus.BusNumber,
                Origin = t.Schedule.Route.Origin, Destination = t.Schedule.Route.Destination,
                DepartureTime = t.Schedule.DepartureTime,
                PricePaid = t.PricePaid, Status = t.Status,
                DateIssued = t.DateIssued, SeatNumber = t.SeatNumber
            }).ToListAsync();
        return Ok(ApiResponse<List<TicketDto>>.Ok(tickets));
    }

    [HttpGet("my-tickets")]
    [HasPermission(Permissions.ViewOwnTickets)]
    public async Task<IActionResult> GetMyTickets()
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var tickets = await _context.Tickets
            .Include(t => t.Client)
            .Include(t => t.Schedule).ThenInclude(s => s.Bus)
            .Include(t => t.Schedule).ThenInclude(s => s.Route)
            .Where(t => t.ClientId == userId)
            .Select(t => new TicketDto
            {
                TicketId = t.TicketId, TicketNumber = t.TicketNumber,
                ClientName = t.Client.Name, PassengerName = t.PassengerName,
                BusNumber = t.Schedule.Bus.BusNumber,
                Origin = t.Schedule.Route.Origin, Destination = t.Schedule.Route.Destination,
                DepartureTime = t.Schedule.DepartureTime,
                PricePaid = t.PricePaid, Status = t.Status,
                DateIssued = t.DateIssued, SeatNumber = t.SeatNumber
            }).ToListAsync();
        return Ok(ApiResponse<List<TicketDto>>.Ok(tickets));
    }

    [HttpGet("{id:int}")]
    [HasPermission(Permissions.ViewOwnTickets)]
    public async Task<IActionResult> GetById(int id)
    {
        var t = await _context.Tickets
            .Include(t => t.Client)
            .Include(t => t.Schedule).ThenInclude(s => s.Bus)
            .Include(t => t.Schedule).ThenInclude(s => s.Route)
            .FirstOrDefaultAsync(x => x.TicketId == id);
        if (t == null) return NotFound(ApiResponse<TicketDto>.Fail("Ticket not found."));
        return Ok(ApiResponse<TicketDto>.Ok(MapToDto(t, t.Client.Name, t.Schedule.Bus.BusNumber, t.Schedule.Route.Origin, t.Schedule.Route.Destination, t.Schedule.DepartureTime)));
    }

    [HttpPost("purchase")]
    [HasPermission(Permissions.PurchaseTickets)]
    public async Task<IActionResult> Purchase([FromBody] PurchaseTicketDto dto)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var schedule = await _context.Schedules
            .Include(s => s.Bus).Include(s => s.Route).Include(s => s.Tickets)
            .FirstOrDefaultAsync(s => s.ScheduleId == dto.ScheduleId);
        if (schedule == null) return NotFound(ApiResponse<TicketDto>.Fail("Schedule not found."));
        if (schedule.DepartureTime <= DateTime.Now) return BadRequest(ApiResponse<TicketDto>.Fail("Schedule has already departed."));
        if (schedule.Tickets.Count(t => t.Status == "Active") >= schedule.Bus.Capacity)
            return BadRequest(ApiResponse<TicketDto>.Fail("No available seats."));
        var client = await _context.Users.FindAsync(userId);
        if (client == null) return Unauthorized(ApiResponse<TicketDto>.Fail("User not found."));

        var ticket = new Ticket
        {
            ClientId = userId, ScheduleId = dto.ScheduleId,
            TicketNumber = $"TKT-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..8].ToUpper()}",
            PricePaid = schedule.Route.Price, Status = "Active",
            SeatNumber = dto.SeatNumber,
            PassengerName = dto.PassengerName ?? client.Name,
        };
        _context.Tickets.Add(ticket);
        await _context.SaveChangesAsync();

        try { await _emailService.SendTicketConfirmationAsync(client.Email, client.Name, $"{schedule.Route.Origin} to {schedule.Route.Destination}", schedule.DepartureTime.ToString("g"), schedule.Route.Price); } catch { }

        return Ok(ApiResponse<TicketDto>.Ok(MapToDto(ticket, client.Name, schedule.Bus.BusNumber, schedule.Route.Origin, schedule.Route.Destination, schedule.DepartureTime), "Ticket purchased successfully"));
    }

    [HttpPost("purchase-multi")]
    [HasPermission(Permissions.PurchaseTickets)]
    public async Task<IActionResult> PurchaseMulti([FromBody] PurchaseMultiTicketDto dto)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var schedule = await _context.Schedules
            .Include(s => s.Bus).Include(s => s.Route).Include(s => s.Tickets)
            .FirstOrDefaultAsync(s => s.ScheduleId == dto.ScheduleId);
        if (schedule == null) return NotFound(ApiResponse<object>.Fail("Schedule not found."));
        if (schedule.DepartureTime <= DateTime.Now) return BadRequest(ApiResponse<object>.Fail("Schedule has already departed."));
        var activeCount = schedule.Tickets.Count(t => t.Status == "Active");
        if (activeCount + dto.Passengers.Count > schedule.Bus.Capacity)
            return BadRequest(ApiResponse<object>.Fail("Not enough available seats."));
        var client = await _context.Users.FindAsync(userId);
        if (client == null) return Unauthorized(ApiResponse<object>.Fail("User not found."));

        var results = new List<TicketDto>();
        foreach (var p in dto.Passengers)
        {
            var ticket = new Ticket
            {
                ClientId = userId, ScheduleId = dto.ScheduleId,
                TicketNumber = $"TKT-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..8].ToUpper()}",
                PricePaid = schedule.Route.Price, Status = "Active",
                SeatNumber = p.SeatNumber,
                PassengerName = p.PassengerName,
            };
            _context.Tickets.Add(ticket);
            await _context.SaveChangesAsync();
            results.Add(MapToDto(ticket, client.Name, schedule.Bus.BusNumber, schedule.Route.Origin, schedule.Route.Destination, schedule.DepartureTime));
        }
        return Ok(ApiResponse<List<TicketDto>>.Ok(results, "Tickets purchased successfully"));
    }

    [HttpPut("{id}/mark-used")]
    [HasPermission(Permissions.MarkTicketUsed)]
    public async Task<IActionResult> MarkAsUsed(int id)
    {
        var ticket = await _context.Tickets
            .Include(t => t.Client)
            .Include(t => t.Schedule).ThenInclude(s => s.Bus)
            .Include(t => t.Schedule).ThenInclude(s => s.Route)
            .FirstOrDefaultAsync(t => t.TicketId == id);
        if (ticket == null) return NotFound(ApiResponse<TicketDto>.Fail("Ticket not found."));
        if (ticket.Status == "Used") return BadRequest(ApiResponse<TicketDto>.Fail("Ticket has already been used."));
        if (ticket.Status == "Cancelled") return BadRequest(ApiResponse<TicketDto>.Fail("Ticket has been cancelled."));
        ticket.Status = "Used";
        await _context.SaveChangesAsync();
        return Ok(ApiResponse<TicketDto>.Ok(MapToDto(ticket, ticket.Client.Name, ticket.Schedule.Bus.BusNumber, ticket.Schedule.Route.Origin, ticket.Schedule.Route.Destination, ticket.Schedule.DepartureTime), "Ticket marked as used successfully"));
    }

    [HttpGet("validate/{id:int}")]
    [HasPermission(Permissions.MarkTicketUsed)]
    public async Task<IActionResult> ValidateById(int id)
    {
        var ticket = await _context.Tickets
            .Include(t => t.Client)
            .Include(t => t.Schedule).ThenInclude(s => s.Bus)
            .Include(t => t.Schedule).ThenInclude(s => s.Route)
            .FirstOrDefaultAsync(t => t.TicketId == id);
        if (ticket == null) return NotFound(ApiResponse<TicketDto>.Fail("Ticket not found."));
        if (ticket.Status == "Used") return BadRequest(ApiResponse<TicketDto>.Fail("Ticket has already been used."));
        if (ticket.Status == "Cancelled") return BadRequest(ApiResponse<TicketDto>.Fail("Ticket has been cancelled."));
        return Ok(ApiResponse<TicketDto>.Ok(MapToDto(ticket, ticket.Client.Name, ticket.Schedule.Bus.BusNumber, ticket.Schedule.Route.Origin, ticket.Schedule.Route.Destination, ticket.Schedule.DepartureTime), "Ticket is valid"));
    }

    [HttpGet("validate/by-number/{number}")]
    [HasPermission(Permissions.MarkTicketUsed)]
    public async Task<IActionResult> ValidateByNumber(string number)
    {
        var ticket = await _context.Tickets
            .Include(t => t.Client)
            .Include(t => t.Schedule).ThenInclude(s => s.Bus)
            .Include(t => t.Schedule).ThenInclude(s => s.Route)
            .FirstOrDefaultAsync(t => t.TicketNumber == number);
        if (ticket == null) return NotFound(ApiResponse<TicketDto>.Fail($"Ticket '{number}' not found."));
        if (ticket.Status == "Used") return BadRequest(ApiResponse<TicketDto>.Fail("Ticket has already been used."));
        if (ticket.Status == "Cancelled") return BadRequest(ApiResponse<TicketDto>.Fail("Ticket has been cancelled."));
        return Ok(ApiResponse<TicketDto>.Ok(MapToDto(ticket, ticket.Client.Name, ticket.Schedule.Bus.BusNumber, ticket.Schedule.Route.Origin, ticket.Schedule.Route.Destination, ticket.Schedule.DepartureTime), "Ticket is valid"));
    }

    // GET /api/Tickets/seats/{scheduleId} - returns taken seat numbers
    [HttpGet("seats/{scheduleId}")]
    [Authorize]
    public async Task<IActionResult> GetTakenSeats(int scheduleId)
    {
        var takenSeats = await _context.Tickets
            .Where(t => t.ScheduleId == scheduleId && t.SeatNumber != null && (t.Status == "Active" || t.Status == "Used"))
            .Select(t => t.SeatNumber!.Value)
            .ToListAsync();
        return Ok(ApiResponse<List<int>>.Ok(takenSeats));
    }
}