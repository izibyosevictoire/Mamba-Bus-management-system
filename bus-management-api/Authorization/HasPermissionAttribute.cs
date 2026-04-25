using Microsoft.AspNetCore.Authorization;

namespace BusManagementApi.Authorization;

public class HasPermissionAttribute : AuthorizeAttribute
{
    public HasPermissionAttribute(string permission) : base(permission)
    {
    }
}
