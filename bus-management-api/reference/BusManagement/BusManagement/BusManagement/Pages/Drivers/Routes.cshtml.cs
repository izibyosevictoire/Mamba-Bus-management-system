using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using Microsoft.Data.SqlClient;
using System.Security.Claims;

namespace BusManagement.Pages.Drivers
{
    public class RoutesModel : PageModel
    {
        private readonly IConfiguration _configuration;

        public List<DriverRoute> DriverRoutes { get; set; }

        public RoutesModel(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public void OnGet()
        {
            var driverId = Convert.ToInt32(User.FindFirstValue("UserId"));
            string connectionString = _configuration.GetConnectionString("connstring");

            DriverRoutes = new List<DriverRoute>();

            using (var connection = new SqlConnection(connectionString))
            {
                connection.Open();

                // Query to get routes assigned to the driver through schedules
                string query = @"
                    SELECT DISTINCT 
                        r.RouteId,
                        r.Origin,
                        r.Destination,
                        r.Distance,
                        s.DepartureTime,
                        s.ArrivalTime,
                        b.BusNumber
                    FROM Routes r
                    INNER JOIN Schedule s ON r.RouteId = s.RouteId
                    INNER JOIN Buses b ON s.BusId = b.BusId
                    INNER JOIN DriverAssignments da ON b.BusId = da.BusId
                    WHERE da.DriverId = @DriverId AND da.Status = 'Active'
                    ORDER BY s.DepartureTime";

                using (var command = new SqlCommand(query, connection))
                {
                    command.Parameters.AddWithValue("@DriverId", driverId);

                    using (var reader = command.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            DriverRoutes.Add(new DriverRoute
                            {
                                RouteId = reader.GetInt32(0),
                                Origin = reader.GetString(1),
                                Destination = reader.GetString(2),
                                Distance = reader.GetDecimal(3),
                                DepartureTime = reader.GetDateTime(4),
                                ArrivalTime = reader.GetDateTime(5),
                                BusNumber = reader.GetString(6)
                            });
                        }
                    }
                }
            }
        }
    }

    public class DriverRoute
    {
        public int RouteId { get; set; }
        public string Origin { get; set; }
        public string Destination { get; set; }
        public decimal Distance { get; set; }
        public DateTime DepartureTime { get; set; }
        public DateTime ArrivalTime { get; set; }
        public string BusNumber { get; set; }
    }
}

