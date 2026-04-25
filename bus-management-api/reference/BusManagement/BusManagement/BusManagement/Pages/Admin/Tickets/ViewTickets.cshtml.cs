using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Text;

namespace BusManagement.Pages.Admin.Tickets
{
    public class ViewTicketsModel : PageModel
    {
        private readonly IConfiguration _configuration;

        public ViewTicketsModel(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        // Note: Use SupportsGet=true so query string parameters bind on GET requests.
        [BindProperty(SupportsGet = true)]
        public int? ClientId { get; set; }

        [BindProperty(SupportsGet = true)]
        public int? ScheduleId { get; set; }

        public List<TicketViewModel> Tickets { get; set; } = new();
        public List<SelectListItem> Clients { get; set; } = new();
        public List<SelectListItem> Schedules { get; set; } = new();

        public void OnGet()
        {
            LoadDropdowns();
            LoadTickets();
        }

        private void LoadDropdowns()
        {
            string connStr = _configuration.GetConnectionString("connstring");
            using var connection = new SqlConnection(connStr);
            connection.Open();

            // Load Clients for dropdown.
            using (var cmd = new SqlCommand("SELECT ClientId, Name FROM Clients", connection))
            using (var reader = cmd.ExecuteReader())
            {
                while (reader.Read())
                {
                    Clients.Add(new SelectListItem
                    {
                        Value = reader.GetInt32(0).ToString(),
                        Text = reader.GetString(1)
                    });
                }
            }

            // Load Schedules for dropdown.
            using (var cmd = new SqlCommand(@"
                SELECT s.ScheduleId, b.BusNumber, r.Origin, r.Destination, s.DepartureTime 
                FROM Schedule s
                JOIN Buses b ON s.BusId = b.BusId
                JOIN Routes r ON s.RouteId = r.RouteId", connection))
            using (var reader = cmd.ExecuteReader())
            {
                while (reader.Read())
                {
                    Schedules.Add(new SelectListItem
                    {
                        Value = reader.GetInt32(0).ToString(),
                        Text = $"{reader.GetString(1)} | {reader.GetString(2)} to {reader.GetString(3)} @ {reader.GetDateTime(4):HH:mm}"
                    });
                }
            }
        }

        private void LoadTickets()
        {
            string connStr = _configuration.GetConnectionString("connstring");

            using var connection = new SqlConnection(connStr);
            connection.Open();

            var query = new StringBuilder(@"
                SELECT t.TicketId, c.Name, b.BusNumber, r.Origin, r.Destination, r.Price, s.DepartureTime, s.ArrivalTime, t.DateIssued
                FROM Tickets t
                JOIN Clients c ON t.ClientId = c.ClientId
                JOIN Schedule s ON t.ScheduleId = s.ScheduleId
                JOIN Buses b ON s.BusId = b.BusId
                JOIN Routes r ON s.RouteId = r.RouteId
                WHERE 1 = 1");

            if (ClientId.HasValue)
                query.Append(" AND t.ClientId = @ClientId");
            if (ScheduleId.HasValue)
                query.Append(" AND t.ScheduleId = @ScheduleId");

            using var cmd = new SqlCommand(query.ToString(), connection);
            if (ClientId.HasValue)
                cmd.Parameters.AddWithValue("@ClientId", ClientId.Value);
            if (ScheduleId.HasValue)
                cmd.Parameters.AddWithValue("@ScheduleId", ScheduleId.Value);

            using var reader = cmd.ExecuteReader();
            while (reader.Read())
            {
                Tickets.Add(new TicketViewModel
                {
                    TicketId = reader.GetInt32(0),
                    ClientName = reader.GetString(1),
                    BusNumber = reader.GetString(2),
                    Origin = reader.GetString(3),
                    Destination = reader.GetString(4),
                    Price = reader.GetDecimal(5),
                    DepartureTime = reader.GetDateTime(6),
                    ArrivalTime = reader.GetDateTime(7),
                    DateIssued = reader.GetDateTime(8)
                });
            }
        }

        public IActionResult OnGetExportToCSV()
        {
            LoadTickets();

            var csv = new StringBuilder();
            csv.AppendLine("TicketId,Client,Bus,Route,Price,Departure,Arrival,DateIssued");

            foreach (var t in Tickets)
            {
                csv.AppendLine($"{t.TicketId},{t.ClientName},{t.BusNumber},{t.Origin}-{t.Destination},{t.Price},{t.DepartureTime:HH:mm},{t.ArrivalTime:HH:mm},{t.DateIssued:yyyy-MM-dd HH:mm}");
            }

            var data = Encoding.UTF8.GetBytes(csv.ToString());
            return File(data, "text/csv", "TicketsReport.csv");
        }

        public class TicketViewModel
        {
            public int TicketId { get; set; }
            public string ClientName { get; set; } = string.Empty;
            public string BusNumber { get; set; } = string.Empty;
            public string Origin { get; set; } = string.Empty;
            public string Destination { get; set; } = string.Empty;
            public decimal Price { get; set; }
            public DateTime DepartureTime { get; set; }
            public DateTime ArrivalTime { get; set; }
            public DateTime DateIssued { get; set; }
        }
    }
}
