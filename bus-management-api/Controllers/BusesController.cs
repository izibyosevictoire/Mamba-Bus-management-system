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
public class BusesController : ControllerBase
{
    private readonly BusManagementDbContext _context;

    public BusesController(BusManagementDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [HasPermission(Permissions.ManageBuses)]
    public async Task<IActionResult> GetAll()
    {
        var buses = await _context.Buses
            .Select(b => new BusDto
            {
                BusId = b.BusId,
                BusNumber = b.BusNumber,
                Capacity = b.Capacity,
                Model = b.Model,
                Status = b.Status,
                AgencyId = b.AgencyId,
                AgencyName = b.Agency != null ? b.Agency.Name : null
            })
            .ToListAsync();

        return Ok(ApiResponse<List<BusDto>>.Ok(buses));
    }

    [HttpGet("{id}")]
    [HasPermission(Permissions.ManageBuses)]
    public async Task<IActionResult> GetById(int id)
    {
        var bus = await _context.Buses.FindAsync(id);
        if (bus == null)
            return NotFound(ApiResponse<BusDto>.Fail("Bus not found"));

        return Ok(ApiResponse<BusDto>.Ok(new BusDto
        {
            BusId = bus.BusId,
            BusNumber = bus.BusNumber,
            Capacity = bus.Capacity,
            Model = bus.Model,
            Status = bus.Status,
            AgencyId = bus.AgencyId,
            AgencyName = bus.Agency?.Name
        }));
    }

    [HttpPost]
    [HasPermission(Permissions.ManageBuses)]
    public async Task<IActionResult> Create([FromBody] CreateBusDto dto)
    {
        if (await _context.Buses.AnyAsync(b => b.BusNumber == dto.BusNumber))
            return BadRequest(ApiResponse<BusDto>.Fail("Bus number already exists"));

        var bus = new Bus
        {
            BusNumber = dto.BusNumber,
            Capacity = dto.Capacity,
            Model = dto.Model,
            Status = dto.Status,
            AgencyId = dto.AgencyId
        };

        _context.Buses.Add(bus);
        await _context.SaveChangesAsync();

        return Ok(ApiResponse<BusDto>.Ok(new BusDto
        {
            BusId = bus.BusId,
            BusNumber = bus.BusNumber,
            Capacity = bus.Capacity,
            Model = bus.Model,
            Status = bus.Status,
            AgencyId = bus.AgencyId
        }, "Bus created"));
    }

    [HttpPut("{id}")]
    [HasPermission(Permissions.ManageBuses)]
    public async Task<IActionResult> Update(int id, [FromBody] CreateBusDto dto)
    {
        var bus = await _context.Buses.FindAsync(id);
        if (bus == null)
            return NotFound(ApiResponse<BusDto>.Fail("Bus not found"));

        bus.BusNumber = dto.BusNumber;
        bus.Capacity = dto.Capacity;
        bus.Model = dto.Model;
        bus.Status = dto.Status;
        bus.AgencyId = dto.AgencyId;
        bus.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(ApiResponse<BusDto>.Ok(new BusDto
        {
            BusId = bus.BusId,
            BusNumber = bus.BusNumber,
            Capacity = bus.Capacity,
            Model = bus.Model,
            Status = bus.Status,
            AgencyId = bus.AgencyId
        }, "Bus updated"));
    }

    [HttpDelete("{id}")]
    [HasPermission(Permissions.ManageBuses)]
    public async Task<IActionResult> Delete(int id)
    {
        var bus = await _context.Buses.FindAsync(id);
        if (bus == null)
            return NotFound(ApiResponse<object>.Fail("Bus not found"));

        _context.Buses.Remove(bus);
        await _context.SaveChangesAsync();
        return Ok(ApiResponse<object>.Ok(null!, "Bus deleted"));
    }
}
