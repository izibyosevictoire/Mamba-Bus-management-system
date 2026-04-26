using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using BusManagementApi.DTOs;
using BusManagementApi.Services;
using BusManagementApi.Authorization;

namespace BusManagementApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TripsController : ControllerBase
{
    private readonly ITripService _tripService;

    public TripsController(ITripService tripService)
    {
        _tripService = tripService;
    }

    [HttpPost]
    [HasPermission(Permissions.ManageTrips)]
    public async Task<IActionResult> CreateTrip([FromBody] CreateTripDto dto)
    {
        var result = await _tripService.CreateTripAsync(dto);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetTrip(int id)
    {
        var result = await _tripService.GetTripByIdAsync(id);
        return result.Success ? Ok(result) : NotFound(result);
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAllTrips([FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate)
    {
        var result = await _tripService.GetAllTripsAsync(fromDate, toDate);
        return Ok(result);
    }

    [HttpGet("search")]
    [AllowAnonymous]
    public async Task<IActionResult> SearchTrips(
        [FromQuery] string? origin,
        [FromQuery] string? destination,
        [FromQuery] DateTime? tripDate)
    {
        var result = await _tripService.SearchTripsAsync(origin, destination, tripDate);
        return Ok(result);
    }

    [HttpPut("{id}")]
    [HasPermission(Permissions.ManageTrips)]
    public async Task<IActionResult> UpdateTrip(int id, [FromBody] UpdateTripDto dto)
    {
        var result = await _tripService.UpdateTripAsync(id, dto);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpDelete("{id}")]
    [HasPermission(Permissions.ManageTrips)]
    public async Task<IActionResult> DeleteTrip(int id)
    {
        var result = await _tripService.DeleteTripAsync(id);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet("{id}/seats")]
    [AllowAnonymous]
    public async Task<IActionResult> GetSeatAvailability(int id)
    {
        var result = await _tripService.GetSeatAvailabilityAsync(id);
        return result.Success ? Ok(result) : NotFound(result);
    }
}
