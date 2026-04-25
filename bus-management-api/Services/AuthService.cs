using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BusManagementApi.Authorization;
using BusManagementApi.Data;
using BusManagementApi.DTOs;
using BusManagementApi.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace BusManagementApi.Services;

public class AuthService : IAuthService
{
    private readonly BusManagementDbContext _context;
    private readonly IConfiguration _config;

    public AuthService(BusManagementDbContext context, IConfiguration config)
    {
        _context = context;
        _config = config;
    }

    public async Task<LoginResponseDto?> LoginAsync(LoginDto dto)
    {
        var user = await _context.Users
            .Include(u => u.UserPermissions)
            .ThenInclude(up => up.Permission)
            .FirstOrDefaultAsync(u => u.Email == dto.Email && u.IsActive);

        if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            return null;

        var permissions = user.UserPermissions.Select(up => up.Permission.Name).ToList();

        return new LoginResponseDto
        {
            Token = GenerateToken(user, permissions),
            User = new UserDto
            {
                UserId = user.UserId,
                Name = user.Name,
                Email = user.Email,
                Phone = user.Phone,
                UserType = user.UserType,
                IsActive = user.IsActive,
                Permissions = permissions
            }
        };
    }

    public async Task<UserDto?> RegisterAsync(RegisterDto dto)
    {
        if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
            return null;

        if (dto.UserType == "Admin" && await _context.Users.AnyAsync(u => u.UserType == "Admin"))
            throw new InvalidOperationException("System security violation: An administrator account already exists. Only one admin is allowed.");

        var user = new User
        {
            Name = dto.Name,
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Phone = dto.Phone,
            UserType = dto.UserType,
            LicenceNumber = dto.LicenceNumber,
            IsActive = true
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Assign default permissions
        var defaultPerms = Permissions.GetDefaultPermissions(dto.UserType);
        var permEntities = await _context.Permissions
            .Where(p => defaultPerms.Contains(p.Name))
            .ToListAsync();

        foreach (var perm in permEntities)
        {
            _context.UserPermissions.Add(new UserPermission
            {
                UserId = user.UserId,
                PermissionId = perm.PermissionId
            });
        }
        await _context.SaveChangesAsync();

        return new UserDto
        {
            UserId = user.UserId,
            Name = user.Name,
            Email = user.Email,
            Phone = user.Phone,
            UserType = user.UserType,
            IsActive = user.IsActive,
            Permissions = defaultPerms
        };
    }

    public async Task<UserDto?> GetCurrentUserAsync(int userId)
    {
        var user = await _context.Users
            .Include(u => u.UserPermissions)
            .ThenInclude(up => up.Permission)
            .FirstOrDefaultAsync(u => u.UserId == userId);

        if (user == null) return null;

        return new UserDto
        {
            UserId = user.UserId,
            Name = user.Name,
            Email = user.Email,
            Phone = user.Phone,
            UserType = user.UserType,
            IsActive = user.IsActive,
            Permissions = user.UserPermissions.Select(up => up.Permission.Name).ToList()
        };
    }

    private string GenerateToken(User user, List<string> permissions)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.UserId.ToString()),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Name, user.Name),
            new("userType", user.UserType),
            new("permissions", string.Join(",", permissions))
        };

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(double.Parse(_config["Jwt:ExpiryInHours"]!)),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
