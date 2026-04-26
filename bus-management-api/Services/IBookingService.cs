using BusManagementApi.DTOs;

namespace BusManagementApi.Services;

public interface IBookingService
{
    Task<ApiResponse<BookingResponseDto>> CreateBookingAsync(int userId, CreateBookingDto dto);
    Task<ApiResponse<BookingResponseDto>> GetBookingByIdAsync(int bookingId, int userId);
    Task<ApiResponse<BookingResponseDto>> GetBookingByReferenceAsync(string bookingReference, int userId);
    Task<ApiResponse<List<BookingResponseDto>>> GetUserBookingsAsync(int userId);
    Task<ApiResponse<BookingResponseDto>> UpdatePaymentStatusAsync(int bookingId, UpdatePaymentStatusDto dto);
    Task<ApiResponse<TicketValidationResponseDto>> ValidateTicketAsync(ValidateTicketDto dto, int validatorUserId);
}
