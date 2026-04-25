namespace BusManagementApi.Authorization;

/// <summary>
/// Defines all permissions used in the system for Permission-Based Access Control (PBAC)
/// Simplified to 12 essential permissions
/// </summary>
public static class Permissions
{
    // Bus & Route Management (Admin only)
    public const string ManageBuses = "manage.buses";
    public const string ManageRoutes = "manage.routes";
    public const string ManageSchedules = "manage.schedules";
    public const string ManageAgencies = "manage.agencies";

    // User Management (Admin only)
    public const string ManageUsers = "manage.users";
    public const string ManagePermissions = "manage.permissions";

    // Driver Assignment (Admin only)
    public const string ManageAssignments = "manage.assignments";

    // Ticket Management
    public const string ViewAllTickets = "tickets.view.all";
    public const string PurchaseTickets = "tickets.purchase";
    public const string MarkTicketUsed = "tickets.mark.used";

    // View permissions (for drivers/clients)
    public const string ViewSchedules = "view.schedules";
    public const string ViewRoutes = "view.routes";
    public const string ViewOwnTickets = "view.own.tickets";
    public const string ViewOwnAssignment = "view.own.assignment";

    // Get all permissions for seeding
    public static List<(string Name, string Description, string Module)> GetAllPermissions()
    {
        return new List<(string, string, string)>
        {
            (ManageBuses, "Create, edit, delete buses", "Admin"),
            (ManageRoutes, "Create, edit, delete routes", "Admin"),
            (ManageSchedules, "Create, edit, delete schedules", "Admin"),
            (ManageAgencies, "Create, edit, delete agencies", "Admin"),
            (ManageUsers, "Create, edit, delete users", "Admin"),
            (ManagePermissions, "Assign permissions to users", "Admin"),
            (ManageAssignments, "Assign drivers to buses", "Admin"),
            (ViewAllTickets, "View all tickets in system", "Admin"),
            (PurchaseTickets, "Purchase bus tickets", "Client"),
            (MarkTicketUsed, "Mark a ticket as used (ticket checker)", "Admin"),
            (ViewSchedules, "View available schedules", "Shared"),
            (ViewRoutes, "View available routes", "Shared"),
            (ViewOwnTickets, "View own purchased tickets", "Client"),
            (ViewOwnAssignment, "View own driver assignment", "Driver")
        };
    }

    // Default permissions by user type
    public static List<string> GetDefaultPermissions(string userType)
    {
        return userType switch
        {
            "Admin" => new List<string>
            {
                ManageBuses, ManageRoutes, ManageSchedules, ManageAgencies,
                ManageUsers, ManagePermissions, ManageAssignments,
                ViewAllTickets, MarkTicketUsed, ViewSchedules, ViewRoutes
            },
            "Driver" => new List<string>
            {
                ViewSchedules, ViewRoutes, ViewOwnAssignment
            },
            "Client" or "Passenger" => new List<string>
            {
                ViewSchedules, ViewRoutes, ViewOwnTickets, PurchaseTickets
            },
            _ => new List<string>()
        };
    }
}
