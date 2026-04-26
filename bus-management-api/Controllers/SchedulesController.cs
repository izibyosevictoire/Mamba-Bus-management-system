using BusManagementApi.Authorization;
using BusManagementApi.Data;
using BusManagementApi.DTOs;
using BusManagementApi.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BusManagementApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SchedulesController : ControllerBase
{
    private readonly BusManagementDbContext _context;

    public SchedulesController(BusManagementDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var schedules = await _context.Schedules
            .Include(s => s.Bus)
                .ThenInclude(b => b.Agency)
            .Include(s => s.Route)
            .Include(s => s.Tickets)
            .Select(s => new ScheduleDto
            {
                ScheduleId = s.ScheduleId,
                BusId = s.BusId,
                BusNumber = s.Bus.BusNumber,
                RouteId = s.RouteId,
                Origin = s.Route.Origin,
                Destination = s.Route.Destination,
                Price = s.Route.Price,
                DepartureTime = s.DepartureTime,
                ArrivalTime = s.ArrivalTime,
                AvailableSeats = s.Bus.Capacity - s.Tickets.Count(t => t.Status == "Active"),
                AgencyId = s.Bus.AgencyId,
                AgencyName = s.Bus.Agency != null ? s.Bus.Agency.Name : null
            })
            .ToListAsync();

        return Ok(ApiResponse<List<ScheduleDto>>.Ok(schedules));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var s = await _context.Schedules
            .Include(s => s.Bus)
                .ThenInclude(b => b.Agency)
            .Include(s => s.Route)
            .Include(s => s.Tickets)
            .FirstOrDefaultAsync(s => s.ScheduleId == id);

        if (s == null)
            return NotFound(ApiResponse<ScheduleDto>.Fail("Schedule not found"));

        return Ok(ApiResponse<ScheduleDto>.Ok(new ScheduleDto
        {
            ScheduleId = s.ScheduleId,
            BusId = s.BusId,
            BusNumber = s.Bus.BusNumber,
            RouteId = s.RouteId,
            Origin = s.Route.Origin,
            Destination = s.Route.Destination,
            Price = s.Route.Price,
            DepartureTime = s.DepartureTime,
            ArrivalTime = s.ArrivalTime,
            AvailableSeats = s.Bus.Capacity - s.Tickets.Count(t => t.Status == "Active"),
            AgencyId = s.Bus.AgencyId,
            AgencyName = s.Bus.Agency?.Name
        }));
    }

    [HttpPost]
    [HasPermission(Permissions.ManageSchedules)]
    public async Task<IActionResult> Create([FromBody] CreateScheduleDto dto)
    {
        var bus = await _context.Buses.FindAsync(dto.BusId);
        if (bus == null)
            return BadRequest(ApiResponse<ScheduleDto>.Fail("Bus not found"));

        var route = await _context.Routes.FindAsync(dto.RouteId);
        if (route == null)
            return BadRequest(ApiResponse<ScheduleDto>.Fail("Route not found"));

        var schedule = new Schedule
        {
            BusId = dto.BusId,
            RouteId = dto.RouteId,
            DepartureTime = dto.DepartureTime,
            ArrivalTime = dto.ArrivalTime
        };

        _context.Schedules.Add(schedule);
        await _context.SaveChangesAsync();

        return Ok(ApiResponse<ScheduleDto>.Ok(new ScheduleDto
        {
            ScheduleId = schedule.ScheduleId,
            BusId = schedule.BusId,
            BusNumber = bus.BusNumber,
            RouteId = schedule.RouteId,
            Origin = route.Origin,
            Destination = route.Destination,
            Price = route.Price,
            DepartureTime = schedule.DepartureTime,
            ArrivalTime = schedule.ArrivalTime,
            AvailableSeats = bus.Capacity,
            AgencyId = bus.AgencyId,
            AgencyName = await _context.Agencies.Where(a => a.AgencyId == bus.AgencyId).Select(a => a.Name).FirstOrDefaultAsync()
        }, "Schedule created"));
    }

    [HttpPut("{id}")]
    [HasPermission(Permissions.ManageSchedules)]
    public async Task<IActionResult> Update(int id, [FromBody] CreateScheduleDto dto)
    {
        var schedule = await _context.Schedules.FindAsync(id);
        if (schedule == null)
            return NotFound(ApiResponse<ScheduleDto>.Fail("Schedule not found"));

        schedule.BusId = dto.BusId;
        schedule.RouteId = dto.RouteId;
        schedule.DepartureTime = dto.DepartureTime;
        schedule.ArrivalTime = dto.ArrivalTime;
        schedule.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(ApiResponse<object>.Ok(null!, "Schedule updated"));
    }

    [HttpDelete("{id}")]
    [HasPermission(Permissions.ManageSchedules)]
    public async Task<IActionResult> Delete(int id)
    {
        var schedule = await _context.Schedules.FindAsync(id);
        if (schedule == null)
            return NotFound(ApiResponse<object>.Fail("Schedule not found"));

        _context.Schedules.Remove(schedule);
        await _context.SaveChangesAsync();
        return Ok(ApiResponse<object>.Ok(null!, "Schedule deleted"));
    }
}
