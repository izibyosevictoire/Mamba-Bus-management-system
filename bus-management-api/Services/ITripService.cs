using BusManagementApi.DTOs;

namespace BusManagementApi.Services;

public interface ITripService
{
    Task<ApiResponse<TripResponseDto>> CreateTripAsync(CreateTripDto dto);
    Task<ApiResponse<TripResponseDto>> GetTripByIdAsync(int tripId);
    Task<ApiResponse<List<TripResponseDto>>> GetAllTripsAsync(DateTime? fromDate = null, DateTime? toDate = null);
    Task<ApiResponse<List<TripResponseDto>>> SearchTripsAsync(string? origin, string? destination, DateTime? tripDate);
    Task<ApiResponse<TripResponseDto>> UpdateTripAsync(int tripId, UpdateTripDto dto);
    Task<ApiResponse<bool>> DeleteTripAsync(int tripId);
    Task<ApiResponse<SeatAvailabilityDto>> GetSeatAvailabilityAsync(int tripId);
}
