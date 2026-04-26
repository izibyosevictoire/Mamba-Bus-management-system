using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Data.SqlClient;
using BusManagement.Models;
using iTextSharp.text.pdf;
using iTextSharp.text;
using MimeKit;

namespace BusManagement.Pages.Clients
{
    public class PurchaseModel : PageModel
    {
        private readonly IConfiguration _configuration;

        public PurchaseModel(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        // List that holds schedule details (loaded from DB)
        public List<ScheduleViewModel> Schedules { get; set; } = new();

        // For display in the route dropdown (distinct "Origin - Destination" values)
        public List<string> Routes { get; set; } = new();

        // These properties are bound from the query string (GET)
        [BindProperty(SupportsGet = true, Name = "selectedRoute")]
        public string? SelectedRoute { get; set; }

        [BindProperty(SupportsGet = true, Name = "selectedBusId")]
        public int? SelectedBusId { get; set; }

        public string? Message { get; set; }

        public void OnGet()
        {
            string connString = _configuration.GetConnectionString("connstring");

            using (var connection = new SqlConnection(connString))
            {
                connection.Open();

                // Base query to fetch all schedules (with their related Bus and Route data)
                string query = "SELECT s.ScheduleId, s.BusId, b.BusNumber, s.RouteId, r.Origin, r.Destination, r.Price, s.DepartureTime, s.ArrivalTime " +
                               "FROM Schedule s " +
                               "JOIN Buses b ON s.BusId = b.BusId " +
                               "JOIN Routes r ON s.RouteId = r.RouteId";

                using (var command = new SqlCommand(query, connection))
                {
                    using (var reader = command.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            Schedules.Add(new ScheduleViewModel
                            {
                                ScheduleId = reader.GetInt32(0),
                                BusId = reader.GetInt32(1),
                                BusNumber = reader.GetString(2),
                                RouteId = reader.GetInt32(3),
                                Origin = reader.GetString(4),
                                Destination = reader.GetString(5),
                                Price = reader.GetDecimal(6),
                                DepartureTime = reader.GetDateTime(7),
                                ArrivalTime = reader.GetDateTime(8)
                            });
                        }
                    }
                }
            }

            // Populate distinct routes using the format "Origin - Destination"
            Routes = Schedules
                .Select(s => $"{s.Origin} - {s.Destination}")
                .Distinct()
                .ToList();

            // If a route is selected, filter schedules accordingly.
            if (!string.IsNullOrEmpty(SelectedRoute))
            {
                Schedules = Schedules
                    .Where(s => $"{s.Origin} - {s.Destination}" == SelectedRoute)
                    .ToList();

                // If a bus is selected, further filter schedules.
                if (SelectedBusId.HasValue)
                {
                    Schedules = Schedules
                        .Where(s => s.BusId == SelectedBusId.Value)
                        .ToList();
                }
            }
        }

        public IActionResult OnPost(int ScheduleId)
        {
            var clientId = User.FindFirst("UserId")?.Value;
            if (clientId == null)
                return RedirectToPage("/Login");

            string connString = _configuration.GetConnectionString("connstring");
            int ticketId;

            using (var connection = new SqlConnection(connString))
            {
                connection.Open();

                // Save ticket
                string insertQuery = "INSERT INTO Tickets (ClientId, ScheduleId, DateIssued) OUTPUT INSERTED.TicketId VALUES (@ClientId, @ScheduleId, @DateIssued)";
                using (var command = new SqlCommand(insertQuery, connection))
                {
                    command.Parameters.AddWithValue("@ClientId", clientId);
                    command.Parameters.AddWithValue("@ScheduleId", ScheduleId);
                    command.Parameters.AddWithValue("@DateIssued", DateTime.Now);
                    ticketId = (int)command.ExecuteScalar(); // get inserted TicketId
                }

                // Get client email
                string emailQuery = "SELECT Email FROM Clients WHERE ClientId = @ClientId";
                string clientEmail = "";
                using (var emailCommand = new SqlCommand(emailQuery, connection))
                {
                    emailCommand.Parameters.AddWithValue("@ClientId", clientId);
                    var result = emailCommand.ExecuteScalar();
                    if (result != null)
                        clientEmail = result.ToString();
                }

                // Get ticket details (same as ExportToPdf)
                var ticket = GetTicket(ticketId, clientId);
                if (ticket.HasValue && !string.IsNullOrEmpty(clientEmail))
                {
                    var pdfBytes = GenerateTicketPdf(ticket.Value);
                    SendEmailWithAttachment(clientEmail, "Your Bus Ticket", "Attached is your purchased bus ticket.", pdfBytes, $"Ticket_{ticketId}.pdf");
                }
            }

            Message = "Ticket purchased and sent to your email!";
            return Page();
        }

        private (int TicketId, string BusName, string RouteName, string RouteDestination, decimal Price, DateTime DepartureTime, DateTime ArrivalTime, DateTime DateIssued)? GetTicket(int ticketId, string clientId)
        {
            string connString = _configuration.GetConnectionString("connstring");
            using (var connection = new SqlConnection(connString))
            {
                connection.Open();
                string query = @"
                    SELECT t.TicketId, b.BusNumber AS BusName, r.Origin AS RouteName, r.Destination AS RouteDestination, r.Price AS Price, 
                        s.DepartureTime AS DepartureTime, s.ArrivalTime AS ArrivalTime, t.DateIssued 
                    FROM Tickets t 
                    JOIN Schedule s ON t.ScheduleId = s.ScheduleId
                    JOIN Buses b ON s.BusId = b.BusId
                    JOIN Routes r ON s.RouteId = r.RouteId
                    WHERE t.TicketId = @TicketId AND t.ClientId = @ClientId";

                using (var command = new SqlCommand(query, connection))
                {
                    command.Parameters.AddWithValue("@TicketId", ticketId);
                    command.Parameters.AddWithValue("@ClientId", clientId);

                    using (var reader = command.ExecuteReader())
                    {
                        if (reader.Read())
                        {
                            return (
                                reader.GetInt32(0),
                                reader.GetString(1),
                                reader.GetString(2),
                                reader.GetString(3),
                                reader.GetDecimal(4),
                                reader.GetDateTime(5),
                                reader.GetDateTime(6),
                                reader.GetDateTime(7)
                            );
                        }
                    }
                }
            }
            return null;
        }

        private byte[] GenerateTicketPdf((int TicketId, string BusName, string RouteName, string RouteDestination, decimal Price, DateTime DepartureTime, DateTime ArrivalTime, DateTime DateIssued) ticket)
        {
            using (var stream = new MemoryStream())
            {
                var document = new Document();
                PdfWriter.GetInstance(document, stream);
                document.Open();

                var titleFont = FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 20);
                var labelFont = FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 12);
                var normalFont = FontFactory.GetFont(FontFactory.HELVETICA, 12);

                var title = new Paragraph("BUS TICKET", titleFont)
                {
                    Alignment = Element.ALIGN_CENTER,
                    SpacingAfter = 20f
                };
                document.Add(title);

                PdfPTable table = new PdfPTable(2) { WidthPercentage = 100 };
                void AddCell(string text, Font font)
                {
                    PdfPCell cell = new PdfPCell(new Phrase(text, font)) { Border = Rectangle.NO_BORDER, Padding = 5 };
                    table.AddCell(cell);
                }

                AddCell("Ticket ID:", labelFont); AddCell(ticket.TicketId.ToString(), normalFont);
                AddCell("Bus:", labelFont); AddCell(ticket.BusName, normalFont);
                AddCell("Route:", labelFont); AddCell($"{ticket.RouteName} - {ticket.RouteDestination}", normalFont);
                AddCell("Price:", labelFont); AddCell($"{ticket.Price:F2} Frw", normalFont);
                AddCell("Duration:", labelFont); AddCell($"{ticket.DepartureTime:HH:mm} - {ticket.ArrivalTime:HH:mm}", normalFont);
                AddCell("Date Issued:", labelFont); AddCell(ticket.DateIssued.ToString("yyyy-MM-dd HH:mm"), normalFont);

                document.Add(table);
                document.Close();

                return stream.ToArray();
            }
        }


        private void SendEmailWithAttachment(string toEmail, string subject, string body, byte[] attachmentBytes, string filename)
        {
            var message = new MimeMessage();
            message.From.Add(MailboxAddress.Parse("manziivan2002@gmail.com"));
            message.To.Add(MailboxAddress.Parse(toEmail));
            message.Subject = subject;

            var builder = new BodyBuilder { TextBody = body };
            builder.Attachments.Add(filename, attachmentBytes, new ContentType("application", "pdf"));
            message.Body = builder.ToMessageBody();

            using (var client = new MailKit.Net.Smtp.SmtpClient())
            {
                client.Connect("smtp.gmail.com", 587, MailKit.Security.SecureSocketOptions.StartTls);
                client.Authenticate("manziivan2002@gmail.com", "uvxlzkujugdnpsgl");
                client.Send(message);
                client.Disconnect(true);
            }
        }

    }
}
