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
public class UsersController : ControllerBase
{
    private readonly BusManagementDbContext _context;

    public UsersController(BusManagementDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [HasPermission(Permissions.ManageUsers)]
    public async Task<IActionResult> GetAll()
    {
        var users = await _context.Users
            .Include(u => u.UserPermissions).ThenInclude(up => up.Permission)
            .Select(u => new UserDto
            {
                UserId = u.UserId,
                Name = u.Name,
                Email = u.Email,
                Phone = u.Phone,
                UserType = u.UserType,
                IsActive = u.IsActive,
                Permissions = u.UserPermissions.Select(up => up.Permission.Name).ToList()
            })
            .ToListAsync();

        return Ok(ApiResponse<List<UserDto>>.Ok(users));
    }

    [HttpGet("{id}")]
    [HasPermission(Permissions.ManageUsers)]
    public async Task<IActionResult> GetById(int id)
    {
        var user = await _context.Users
            .Include(u => u.UserPermissions).ThenInclude(up => up.Permission)
            .FirstOrDefaultAsync(u => u.UserId == id);

        if (user == null)
            return NotFound(ApiResponse<UserDto>.Fail("User not found"));

        return Ok(ApiResponse<UserDto>.Ok(new UserDto
        {
            UserId = user.UserId,
            Name = user.Name,
            Email = user.Email,
            Phone = user.Phone,
            UserType = user.UserType,
            IsActive = user.IsActive,
            Permissions = user.UserPermissions.Select(up => up.Permission.Name).ToList()
        }));
    }

    [HttpPut("{id}")]
    [HasPermission(Permissions.ManageUsers)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateUserDto dto)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null)
            return NotFound(ApiResponse<UserDto>.Fail("User not found"));

        user.Name = dto.Name;
        user.Phone = dto.Phone;
        user.IsActive = dto.IsActive;
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(ApiResponse<object>.Ok(null!, "User updated"));
    }

    [HttpDelete("{id}")]
    [HasPermission(Permissions.ManageUsers)]
    public async Task<IActionResult> Delete(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null)
            return NotFound(ApiResponse<object>.Fail("User not found"));

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();
        return Ok(ApiResponse<object>.Ok(null!, "User deleted"));
    }

    // Assign permissions to user
    [HttpPut("{id}/permissions")]
    [HasPermission(Permissions.ManagePermissions)]
    public async Task<IActionResult> AssignPermissions(int id, [FromBody] AssignPermissionsDto dto)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null)
            return NotFound(ApiResponse<object>.Fail("User not found"));

        // Remove existing permissions
        var existing = await _context.UserPermissions.Where(up => up.UserId == id).ToListAsync();
        _context.UserPermissions.RemoveRange(existing);

        // Add new permissions
        var permissions = await _context.Permissions
            .Where(p => dto.Permissions.Contains(p.Name))
            .ToListAsync();

        foreach (var perm in permissions)
        {
            _context.UserPermissions.Add(new UserPermission
            {
                UserId = id,
                PermissionId = perm.PermissionId
            });
        }

        await _context.SaveChangesAsync();
        return Ok(ApiResponse<object>.Ok(null!, "Permissions assigned"));
    }

    // Get available permissions
    [HttpGet("permissions/available")]
    [HasPermission(Permissions.ManagePermissions)]
    public async Task<IActionResult> GetAvailablePermissions()
    {
        var permissions = await _context.Permissions
            .Select(p => new { p.Name, p.Description, p.Module })
            .ToListAsync();

        return Ok(ApiResponse<object>.Ok(permissions));
    }
}
