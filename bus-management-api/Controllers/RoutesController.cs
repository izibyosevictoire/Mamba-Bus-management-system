using BusManagementApi.Authorization;
using BusManagementApi.Data;
using BusManagementApi.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RouteEntity = BusManagementApi.Entities.Route;

namespace BusManagementApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RoutesController : ControllerBase
{
    private readonly BusManagementDbContext _context;

    public RoutesController(BusManagementDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var routes = await _context.Routes
            .Select(r => new RouteDto
            {
                RouteId = r.RouteId,
                Origin = r.Origin,
                Destination = r.Destination,
                Distance = r.Distance,
                Price = r.Price
            })
            .ToListAsync();

        return Ok(ApiResponse<List<RouteDto>>.Ok(routes));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var route = await _context.Routes.FindAsync(id);
        if (route == null)
            return NotFound(ApiResponse<RouteDto>.Fail("Route not found"));

        return Ok(ApiResponse<RouteDto>.Ok(new RouteDto
        {
            RouteId = route.RouteId,
            Origin = route.Origin,
            Destination = route.Destination,
            Distance = route.Distance,
            Price = route.Price
        }));
    }

    [HttpPost]
    [HasPermission(Permissions.ManageRoutes)]
    public async Task<IActionResult> Create([FromBody] CreateRouteDto dto)
    {
        var route = new RouteEntity
        {
            Origin = dto.Origin,
            Destination = dto.Destination,
            Distance = dto.Distance,
            Price = dto.Price
        };

        _context.Routes.Add(route);
        await _context.SaveChangesAsync();

        return Ok(ApiResponse<RouteDto>.Ok(new RouteDto
        {
            RouteId = route.RouteId,
            Origin = route.Origin,
            Destination = route.Destination,
            Distance = route.Distance,
            Price = route.Price
        }, "Route created"));
    }

    [HttpPut("{id}")]
    [HasPermission(Permissions.ManageRoutes)]
    public async Task<IActionResult> Update(int id, [FromBody] CreateRouteDto dto)
    {
        var route = await _context.Routes.FindAsync(id);
        if (route == null)
            return NotFound(ApiResponse<RouteDto>.Fail("Route not found"));

        route.Origin = dto.Origin;
        route.Destination = dto.Destination;
        route.Distance = dto.Distance;
        route.Price = dto.Price;
        route.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(ApiResponse<RouteDto>.Ok(new RouteDto
        {
            RouteId = route.RouteId,
            Origin = route.Origin,
            Destination = route.Destination,
            Distance = route.Distance,
            Price = route.Price
        }, "Route updated"));
    }

    [HttpDelete("{id}")]
    [HasPermission(Permissions.ManageRoutes)]
    public async Task<IActionResult> Delete(int id)
    {
        var route = await _context.Routes.FindAsync(id);
        if (route == null)
            return NotFound(ApiResponse<object>.Fail("Route not found"));

        _context.Routes.Remove(route);
        await _context.SaveChangesAsync();
        return Ok(ApiResponse<object>.Ok(null!, "Route deleted"));
    }
}
