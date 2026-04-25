namespace BusManagementApi.Services
{
    public interface IEmailService
    {
        Task SendEmailAsync(string toEmail, string subject, string body);
        Task SendWelcomeEmailAsync(string toEmail, string userName);
        Task SendTicketConfirmationAsync(string toEmail, string userName, string route, string departureTime, decimal price);
        Task SendAssignmentNotificationAsync(string toEmail, string userName, string busNumber);
    }
}
