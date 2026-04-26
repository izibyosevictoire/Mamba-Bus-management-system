using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using BusManagementApi.DTOs;
using BusManagementApi.Services;
using BusManagementApi.Authorization;
using System.Security.Claims;

namespace BusManagementApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BookingsController : ControllerBase
{
    private readonly IBookingService _bookingService;

    public BookingsController(IBookingService bookingService)
    {
        _bookingService = bookingService;
    }

    [HttpPost]
    [HasPermission(Permissions.CreateBooking)]
    public async Task<IActionResult> CreateBooking([FromBody] CreateBookingDto dto)
    {
        var userId = GetUserId();
        var result = await _bookingService.CreateBookingAsync(userId, dto);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet("{id}")]
    [HasPermission(Permissions.ViewBookings)]
    public async Task<IActionResult> GetBooking(int id)
    {
        var userId = GetUserId();
        var result = await _bookingService.GetBookingByIdAsync(id, userId);
        return result.Success ? Ok(result) : NotFound(result);
    }

    [HttpGet("reference/{reference}")]
    [HasPermission(Permissions.ViewBookings)]
    public async Task<IActionResult> GetBookingByReference(string reference)
    {
        var userId = GetUserId();
        var result = await _bookingService.GetBookingByReferenceAsync(reference, userId);
        return result.Success ? Ok(result) : NotFound(result);
    }

    [HttpGet("my-bookings")]
    [HasPermission(Permissions.ViewBookings)]
    public async Task<IActionResult> GetMyBookings()
    {
        var userId = GetUserId();
        var result = await _bookingService.GetUserBookingsAsync(userId);
        return Ok(result);
    }

    [HttpPatch("{id}/payment-status")]
    [HasPermission(Permissions.ManagePayments)]
    public async Task<IActionResult> UpdatePaymentStatus(int id, [FromBody] UpdatePaymentStatusDto dto)
    {
        var result = await _bookingService.UpdatePaymentStatusAsync(id, dto);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("validate-ticket")]
    [HasPermission(Permissions.ValidateTickets)]
    public async Task<IActionResult> ValidateTicket([FromBody] ValidateTicketDto dto)
    {
        var userId = GetUserId();
        var result = await _bookingService.ValidateTicketAsync(dto, userId);
        return Ok(result);
    }

    private int GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.Parse(userIdClaim ?? "0");
    }
}
