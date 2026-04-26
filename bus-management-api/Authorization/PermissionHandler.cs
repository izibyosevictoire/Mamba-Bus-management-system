using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace BusManagementApi.Authorization;

public class PermissionHandler : AuthorizationHandler<PermissionRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        PermissionRequirement requirement)
    {
        var permissionsClaim = context.User.FindFirst("permissions");

        if (permissionsClaim == null)
        {
            return Task.CompletedTask;
        }

        var permissions = permissionsClaim.Value.Split(',', StringSplitOptions.RemoveEmptyEntries);

        if (permissions.Contains(requirement.Permission))
        {
            context.Succeed(requirement);
        }

        return Task.CompletedTask;
    }
}
