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
public class AgenciesController : ControllerBase
{
    private readonly BusManagementDbContext _context;

    public AgenciesController(BusManagementDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var agencies = await _context.Agencies
            .Select(a => new AgencyDto
            {
                AgencyId = a.AgencyId,
                Name = a.Name,
                ContactEmail = a.ContactEmail,
                ContactPhone = a.ContactPhone,
                CreatedAt = a.CreatedAt
            })
            .ToListAsync();

        return Ok(ApiResponse<List<AgencyDto>>.Ok(agencies));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var agency = await _context.Agencies.FindAsync(id);
        if (agency == null)
            return NotFound(ApiResponse<AgencyDto>.Fail("Agency not found"));

        return Ok(ApiResponse<AgencyDto>.Ok(new AgencyDto
        {
            AgencyId = agency.AgencyId,
            Name = agency.Name,
            ContactEmail = agency.ContactEmail,
            ContactPhone = agency.ContactPhone,
            CreatedAt = agency.CreatedAt
        }));
    }

    [HttpPost]
    [HasPermission(Permissions.ManageAgencies)]
    public async Task<IActionResult> Create([FromBody] CreateAgencyDto dto)
    {
        var agency = new Agency
        {
            Name = dto.Name,
            ContactEmail = dto.ContactEmail,
            ContactPhone = dto.ContactPhone
        };

        _context.Agencies.Add(agency);
        await _context.SaveChangesAsync();

        return Ok(ApiResponse<AgencyDto>.Ok(new AgencyDto
        {
            AgencyId = agency.AgencyId,
            Name = agency.Name,
            ContactEmail = agency.ContactEmail,
            ContactPhone = agency.ContactPhone,
            CreatedAt = agency.CreatedAt
        }, "Agency created"));
    }

    [HttpPut("{id}")]
    [HasPermission(Permissions.ManageAgencies)]
    public async Task<IActionResult> Update(int id, [FromBody] CreateAgencyDto dto)
    {
        var agency = await _context.Agencies.FindAsync(id);
        if (agency == null)
            return NotFound(ApiResponse<AgencyDto>.Fail("Agency not found"));

        agency.Name = dto.Name;
        agency.ContactEmail = dto.ContactEmail;
        agency.ContactPhone = dto.ContactPhone;

        await _context.SaveChangesAsync();
        return Ok(ApiResponse<AgencyDto>.Ok(new AgencyDto
        {
            AgencyId = agency.AgencyId,
            Name = agency.Name,
            ContactEmail = agency.ContactEmail,
            ContactPhone = agency.ContactPhone,
            CreatedAt = agency.CreatedAt
        }, "Agency updated"));
    }

    [HttpDelete("{id}")]
    [HasPermission(Permissions.ManageAgencies)]
    public async Task<IActionResult> Delete(int id)
    {
        var agency = await _context.Agencies.FindAsync(id);
        if (agency == null)
            return NotFound(ApiResponse<object>.Fail("Agency not found"));

        _context.Agencies.Remove(agency);
        await _context.SaveChangesAsync();
        return Ok(ApiResponse<object>.Ok(null!, "Agency deleted"));
    }
}
