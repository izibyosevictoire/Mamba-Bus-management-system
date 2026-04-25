using BusManagementApi.DTOs;

namespace BusManagementApi.Services;

public interface IAuthService
{
    Task<LoginResponseDto?> LoginAsync(LoginDto dto);
    Task<UserDto?> RegisterAsync(RegisterDto dto);
    Task<UserDto?> GetCurrentUserAsync(int userId);
}
