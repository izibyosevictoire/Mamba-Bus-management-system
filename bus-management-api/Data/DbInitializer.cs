using BusManagementApi.Authorization;
using BusManagementApi.Entities;
using Microsoft.EntityFrameworkCore;

namespace BusManagementApi.Data;

public static class DbInitializer
{
    public static async Task InitializeAsync(BusManagementDbContext context)
    {
        await context.Database.MigrateAsync();

        // Seed permissions if not exist
        var allPermissions = Permissions.GetAllPermissions();
        var existingPermNames = await context.Permissions.Select(p => p.Name).ToListAsync();

        foreach (var perm in allPermissions)
        {
            if (!existingPermNames.Contains(perm.Name))
            {
                context.Permissions.Add(new Permission
                {
                    Name = perm.Name,
                    Description = perm.Description,
                    Module = perm.Module
                });
            }
        }
        await context.SaveChangesAsync();

        // Seed default admin if not exist
        if (!await context.Users.AnyAsync(u => u.UserType == "Admin"))
        {
            var admin = new User
            {
                Name = "System Admin",
                Email = "admin@busmanagement.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                Phone = "0000000000",
                UserType = "Admin",
                IsActive = true
            };

            context.Users.Add(admin);
            await context.SaveChangesAsync();
        }

        // Sync Default Permissions for all users (including existing ones migrating to PBAC)
        var allUsers = await context.Users.ToListAsync();

        foreach (var user in allUsers)
        {
            var defaultPermNames = Permissions.GetDefaultPermissions(user.UserType);
            if (!defaultPermNames.Any()) continue;

            var permEntities = await context.Permissions
                .Where(p => defaultPermNames.Contains(p.Name))
                .ToListAsync();

            var existingUserPermIds = await context.UserPermissions
                .Where(up => up.UserId == user.UserId)
                .Select(up => up.PermissionId)
                .ToListAsync();

            foreach (var perm in permEntities)
            {
                if (!existingUserPermIds.Contains(perm.PermissionId))
                {
                    context.UserPermissions.Add(new UserPermission
                    {
                        UserId = user.UserId,
                        PermissionId = perm.PermissionId
                    });
                }
            }
        }
        await context.SaveChangesAsync();
    }
}
