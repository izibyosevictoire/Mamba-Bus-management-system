# Client Module Documentation
**Developer: Didace**

---

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Pages & Features](#pages--features)
4. [Database Operations](#database-operations)
5. [PDF Generation](#pdf-generation)
6. [Email Integration](#email-integration)
7. [Implementation Guide](#implementation-guide)
8. [API Reference](#api-reference)

---

## Overview

The Client module provides a complete ticket booking and management system for bus passengers. It enables clients to browse available schedules, purchase tickets, view their booking history, and receive tickets via email in PDF format.

### Key Responsibilities
- **Schedule Browsing**: View available bus schedules with routes and timings
- **Ticket Purchase**: Book tickets for specific bus schedules
- **Ticket Management**: View purchased tickets and booking history
- **PDF Generation**: Generate printable bus tickets
- **Email Delivery**: Automatic ticket delivery via email
- **Route Filtering**: Filter schedules by route and bus

### Technology Stack
- **Framework**: ASP.NET Core 8.0 Razor Pages
- **Authentication**: Cookie-based authentication with Client role
- **Database**: SQL Server with ADO.NET (Microsoft.Data.SqlClient)
- **PDF Generation**: iTextSharp 5.5.13.4
- **Email Service**: MailKit 4.11.0 with SMTP (Gmail)
- **UI**: Bootstrap 5, Font Awesome, Custom CSS

---

## Architecture

### Folder Structure
```
Pages/Clients/
├── Index.cshtml                    # Client Dashboard
├── Index.cshtml.cs                 # Dashboard logic with user claims
├── Purchase.cshtml                 # Schedule browsing & ticket purchase
├── Purchase.cshtml.cs              # Purchase logic + PDF + Email
├── Tickets.cshtml                  # View purchased tickets
├── Tickets.cshtml.cs               # Ticket history
├── ExportToPdf.cshtml              # PDF export page
├── ExportToPdf.cshtml.cs           # PDF generation logic
└── Tickets/                        # Empty folder (future enhancements)
```

### Models
```
Models/
└── ScheduleViewModel.cs            # View model for schedule data
```

---

## Pages & Features

### 1. Client Dashboard (`Index.cshtml`)

**Purpose**: Landing page for authenticated clients showing their profile information and quick navigation.

**Code Implementation**:

```csharp
namespace BusManagement.Pages.Clients
{
    [Authorize(Roles = "Client")]
    public class IndexModel : PageModel
    {
        public string? Email { get; set; }
        public string? Role { get; set; }
        public string? UserId { get; set; }

        public void OnGet()
        {
            // Extract user information from authentication claims
            Email = User.Identity?.Name;
            Role = User.FindFirst(ClaimTypes.Role)?.Value;
            UserId = User.FindFirst("UserId")?.Value;  // ClientId from database
        }
    }
}
```

**User Claims Explained**:
- **Email**: Retrieved from `User.Identity.Name` (set during login)
- **Role**: Retrieved from `ClaimTypes.Role` claim (value: "Client")
- **UserId**: Custom claim storing the `ClientId` from database

**UI Features**:
- Welcome message with user's email
- Navigation cards to key features:
  - 🎫 Purchase Tickets
  - 📋 My Tickets
  - 👤 Profile (future)

---

### 2. Purchase Page (`Purchase.cshtml`)

**Purpose**: Core booking interface where clients can browse schedules and purchase tickets.

#### 2.1 Data Model

**ScheduleViewModel** (`Models/ScheduleViewModel.cs`):
```csharp
namespace BusManagement.Models
{
    public class ScheduleViewModel
    {
        public int ScheduleId { get; set; }
        public int BusId { get; set; }
        public string BusNumber { get; set; } = string.Empty;
        public int RouteId { get; set; }
        public string Origin { get; set; } = string.Empty;
        public string Destination { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public DateTime DepartureTime { get; set; }
        public DateTime ArrivalTime { get; set; }
    }
}
```

#### 2.2 Purchase Logic (`Purchase.cshtml.cs`)

**Properties**:
```csharp
public List<ScheduleViewModel> Schedules { get; set; } = new();
public List<string> Routes { get; set; } = new();

[BindProperty(SupportsGet = true, Name = "selectedRoute")]
public string? SelectedRoute { get; set; }

[BindProperty(SupportsGet = true, Name = "selectedBusId")]
public int? SelectedBusId { get; set; }

public string? Message { get; set; }
```

**OnGet Method - Load Schedules**:
```csharp
public void OnGet()
{
    string connString = _configuration.GetConnectionString("connstring");

    using (var connection = new SqlConnection(connString))
    {
        connection.Open();

        // Fetch all schedules with JOIN to get Bus and Route data
        string query = "SELECT s.ScheduleId, s.BusId, b.BusNumber, s.RouteId, " +
                       "r.Origin, r.Destination, r.Price, s.DepartureTime, s.ArrivalTime " +
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

    // Create distinct route list for dropdown
    Routes = Schedules
        .Select(s => $"{s.Origin} - {s.Destination}")
        .Distinct()
        .ToList();

    // Apply filters if selected
    if (!string.IsNullOrEmpty(SelectedRoute))
    {
        Schedules = Schedules
            .Where(s => $"{s.Origin} - {s.Destination}" == SelectedRoute)
            .ToList();

        if (SelectedBusId.HasValue)
        {
            Schedules = Schedules
                .Where(s => s.BusId == SelectedBusId.Value)
                .ToList();
        }
    }
}
```

**Database Query Breakdown**:
1. **JOIN Operations**: Links Schedule → Buses → Routes
2. **Data Retrieved**: Complete schedule information with bus and route details
3. **Filtering Logic**: 
   - First filter by route (Origin - Destination)
   - Then optionally filter by specific bus

---

#### 2.3 Ticket Purchase - OnPost Method

**Purchase Flow**:
```csharp
public IActionResult OnPost(int ScheduleId)
{
    // 1. Get authenticated client's ID
    var clientId = User.FindFirst("UserId")?.Value;
    if (clientId == null)
        return RedirectToPage("/Login");

    string connString = _configuration.GetConnectionString("connstring");
    int ticketId;

    using (var connection = new SqlConnection(connString))
    {
        connection.Open();

        // 2. Insert ticket into database
        string insertQuery = "INSERT INTO Tickets (ClientId, ScheduleId, DateIssued) " +
                            "OUTPUT INSERTED.TicketId " +
                            "VALUES (@ClientId, @ScheduleId, @DateIssued)";
        
        using (var command = new SqlCommand(insertQuery, connection))
        {
            command.Parameters.AddWithValue("@ClientId", clientId);
            command.Parameters.AddWithValue("@ScheduleId", ScheduleId);
            command.Parameters.AddWithValue("@DateIssued", DateTime.Now);
            ticketId = (int)command.ExecuteScalar(); // Get inserted TicketId
        }

        // 3. Get client email
        string emailQuery = "SELECT Email FROM Clients WHERE ClientId = @ClientId";
        string clientEmail = "";
        
        using (var emailCommand = new SqlCommand(emailQuery, connection))
        {
            emailCommand.Parameters.AddWithValue("@ClientId", clientId);
            var result = emailCommand.ExecuteScalar();
            if (result != null)
                clientEmail = result.ToString();
        }

        // 4. Generate PDF and send email
        var ticket = GetTicket(ticketId, clientId);
        if (ticket.HasValue && !string.IsNullOrEmpty(clientEmail))
        {
            var pdfBytes = GenerateTicketPdf(ticket.Value);
            SendEmailWithAttachment(
                clientEmail, 
                "Your Bus Ticket", 
                "Attached is your purchased bus ticket.", 
                pdfBytes, 
                $"Ticket_{ticketId}.pdf"
            );
        }
    }

    Message = "Ticket purchased and sent to your email!";
    return Page();
}
```

**Key Points**:
- `OUTPUT INSERTED.TicketId`: SQL Server syntax to return auto-generated ID
- Transaction-like flow: Insert → Retrieve → Generate → Send
- User feedback via `Message` property

---

### 3. PDF Generation

#### 3.1 GetTicket Method

**Purpose**: Retrieve complete ticket information for PDF generation.

```csharp
private (int TicketId, string BusName, string RouteName, string RouteDestination, 
         decimal Price, DateTime DepartureTime, DateTime ArrivalTime, DateTime DateIssued)? 
    GetTicket(int ticketId, string clientId)
{
    string connString = _configuration.GetConnectionString("connstring");
    
    using (var connection = new SqlConnection(connString))
    {
        connection.Open();
        
        string query = @"
            SELECT t.TicketId, b.BusNumber AS BusName, r.Origin AS RouteName, 
                   r.Destination AS RouteDestination, r.Price AS Price, 
                   s.DepartureTime, s.ArrivalTime, t.DateIssued 
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
                        reader.GetInt32(0),      // TicketId
                        reader.GetString(1),     // BusName
                        reader.GetString(2),     // RouteName (Origin)
                        reader.GetString(3),     // RouteDestination
                        reader.GetDecimal(4),    // Price
                        reader.GetDateTime(5),   // DepartureTime
                        reader.GetDateTime(6),   // ArrivalTime
                        reader.GetDateTime(7)    // DateIssued
                    );
                }
            }
        }
    }
    return null;
}
```

**C# Feature Used**: **Tuple Return Type**
- Returns multiple values as a single tuple
- Uses nullable tuple (`?`) to handle cases where ticket is not found

---

#### 3.2 GenerateTicketPdf Method

**Purpose**: Create a professional PDF ticket using iTextSharp.

```csharp
private byte[] GenerateTicketPdf(
    (int TicketId, string BusName, string RouteName, string RouteDestination, 
     decimal Price, DateTime DepartureTime, DateTime ArrivalTime, DateTime DateIssued) ticket)
{
    using (var stream = new MemoryStream())
    {
        // 1. Create document
        var document = new Document();
        PdfWriter.GetInstance(document, stream);
        document.Open();

        // 2. Define fonts
        var titleFont = FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 20);
        var labelFont = FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 12);
        var normalFont = FontFactory.GetFont(FontFactory.HELVETICA, 12);

        // 3. Add title
        var title = new Paragraph("BUS TICKET", titleFont)
        {
            Alignment = Element.ALIGN_CENTER,
            SpacingAfter = 20f
        };
        document.Add(title);

        // 4. Create table with ticket information
        PdfPTable table = new PdfPTable(2) { WidthPercentage = 100 };
        
        void AddCell(string text, Font font)
        {
            PdfPCell cell = new PdfPCell(new Phrase(text, font)) 
            { 
                Border = Rectangle.NO_BORDER, 
                Padding = 5 
            };
            table.AddCell(cell);
        }

        // 5. Add ticket details
        AddCell("Ticket ID:", labelFont); 
        AddCell(ticket.TicketId.ToString(), normalFont);
        
        AddCell("Bus:", labelFont); 
        AddCell(ticket.BusName, normalFont);
        
        AddCell("Route:", labelFont); 
        AddCell($"{ticket.RouteName} - {ticket.RouteDestination}", normalFont);
        
        AddCell("Price:", labelFont); 
        AddCell($"{ticket.Price:F2} Frw", normalFont);
        
        AddCell("Duration:", labelFont); 
        AddCell($"{ticket.DepartureTime:HH:mm} - {ticket.ArrivalTime:HH:mm}", normalFont);
        
        AddCell("Date Issued:", labelFont); 
        AddCell(ticket.DateIssued.ToString("yyyy-MM-dd HH:mm"), normalFont);

        // 6. Add table to document
        document.Add(table);
        
        // 7. Close and return bytes
        document.Close();
        return stream.ToArray();
    }
}
```

**iTextSharp Components**:
- **Document**: Main PDF document object
- **PdfWriter**: Writes document to stream
- **Paragraph**: Text element with formatting
- **PdfPTable**: Table layout (2 columns: label | value)
- **PdfPCell**: Individual table cell
- **Font**: Text styling (HELVETICA_BOLD, HELVETICA)

**Formatting**:
- Title: Bold, 20pt, centered
- Labels: Bold, 12pt (left column)
- Values: Normal, 12pt (right column)
- No borders for clean appearance
- Price format: `{Price:F2} Frw` (2 decimal places)
- Date format: `yyyy-MM-dd HH:mm`

---

### 4. Email Integration

#### 4.1 SendEmailWithAttachment Method

**Purpose**: Send ticket PDF to client via email using Gmail SMTP.

```csharp
private void SendEmailWithAttachment(string toEmail, string subject, string body, 
                                     byte[] attachmentBytes, string filename)
{
    // 1. Create email message
    var message = new MimeMessage();
    message.From.Add(MailboxAddress.Parse("h1rhodin@gmail.com"));
    message.To.Add(MailboxAddress.Parse(toEmail));
    message.Subject = subject;

    // 2. Build message body with attachment
    var builder = new BodyBuilder { TextBody = body };
    builder.Attachments.Add(filename, attachmentBytes, new ContentType("application", "pdf"));
    message.Body = builder.ToMessageBody();

    // 3. Send via SMTP
    using (var client = new MailKit.Net.Smtp.SmtpClient())
    {
        client.Connect("smtp.gmail.com", 587, MailKit.Security.SecureSocketOptions.StartTls);
        client.Authenticate("h1rhodin@gmail.com", "mebl bwjo kuvy rpbq");  // App password
        client.Send(message);
        client.Disconnect(true);
    }
}
```

**MailKit Configuration**:
- **SMTP Server**: `smtp.gmail.com`
- **Port**: `587` (TLS)
- **Security**: `StartTls` (encrypted connection)
- **Authentication**: Gmail account with app-specific password

**Gmail App Password Setup**:
1. Enable 2-Factor Authentication on Gmail
2. Go to Google Account → Security
3. Generate "App Password" under "Signing in to Google"
4. Use generated password (not regular Gmail password)

**Important Notes**:
⚠️ **Security Concern**: Email credentials are hardcoded in source code
✅ **Best Practice**: Move to environment variables or Azure Key Vault
```csharp
// Recommended approach
var smtpUser = _configuration["Email:SmtpUser"];
var smtpPassword = _configuration["Email:SmtpPassword"];
```

---

### 5. View Tickets (`Tickets.cshtml`)

**Purpose**: Display all tickets purchased by the authenticated client.

**Database Query**:
```sql
SELECT 
    t.TicketId,
    b.BusNumber,
    r.Origin,
    r.Destination,
    r.Price,
    s.DepartureTime,
    s.ArrivalTime,
    t.DateIssued
FROM Tickets t
JOIN Schedule s ON t.ScheduleId = s.ScheduleId
JOIN Buses b ON s.BusId = b.BusId
JOIN Routes r ON s.RouteId = r.RouteId
WHERE t.ClientId = @ClientId
ORDER BY t.DateIssued DESC
```

**Implementation Pattern**:
```csharp
public class TicketsModel : PageModel
{
    public List<TicketViewModel> Tickets { get; set; } = new();

    public void OnGet()
    {
        var clientId = User.FindFirst("UserId")?.Value;
        if (clientId == null)
            return;

        using (var connection = new SqlConnection(_connectionString))
        {
            connection.Open();
            string query = /* SQL query above */;

            using (var command = new SqlCommand(query, connection))
            {
                command.Parameters.AddWithValue("@ClientId", clientId);
                var reader = command.ExecuteReader();

                while (reader.Read())
                {
                    Tickets.Add(new TicketViewModel
                    {
                        TicketId = reader.GetInt32(0),
                        BusNumber = reader.GetString(1),
                        Origin = reader.GetString(2),
                        Destination = reader.GetString(3),
                        Price = reader.GetDecimal(4),
                        DepartureTime = reader.GetDateTime(5),
                        ArrivalTime = reader.GetDateTime(6),
                        DateIssued = reader.GetDateTime(7)
                    });
                }
            }
        }
    }
}
```

**UI Features**:
- Display tickets in reverse chronological order (newest first)
- Show all relevant journey information
- "Download PDF" button for each ticket
- "No tickets found" message for empty state

---

### 6. Export to PDF (`ExportToPdf.cshtml`)

**Purpose**: Generate and download PDF for a specific ticket.

**Query Parameter**: `ticketId` (from URL)

**Implementation**:
```csharp
public class ExportToPdfModel : PageModel
{
    [BindProperty(SupportsGet = true)]
    public int TicketId { get; set; }

    public IActionResult OnGet()
    {
        var clientId = User.FindFirst("UserId")?.Value;
        if (clientId == null)
            return RedirectToPage("/Login");

        // Get ticket data
        var ticket = GetTicket(TicketId, clientId);
        if (!ticket.HasValue)
            return NotFound();

        // Generate PDF
        var pdfBytes = GenerateTicketPdf(ticket.Value);

        // Return as downloadable file
        return File(pdfBytes, "application/pdf", $"Ticket_{TicketId}.pdf");
    }
}
```

**File Download Headers**:
- **Content-Type**: `application/pdf`
- **Content-Disposition**: `attachment; filename="Ticket_{TicketId}.pdf"`
- Browser automatically prompts user to download

---

## Database Operations

### Tables Used

#### 1. Clients Table
```sql
CREATE TABLE Clients (
    ClientId INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(100) NOT NULL,
    Email NVARCHAR(100) UNIQUE NOT NULL,
    Password NVARCHAR(255) NOT NULL,
    Phone NVARCHAR(20)
);
```

#### 2. Tickets Table
```sql
CREATE TABLE Tickets (
    TicketId INT PRIMARY KEY IDENTITY(1,1),
    ClientId INT FOREIGN KEY REFERENCES Clients(ClientId),
    ScheduleId INT FOREIGN KEY REFERENCES Schedule(ScheduleId),
    DateIssued DATETIME NOT NULL
);
```

#### 3. Schedule Table
```sql
CREATE TABLE Schedule (
    ScheduleId INT PRIMARY KEY IDENTITY(1,1),
    BusId INT FOREIGN KEY REFERENCES Buses(BusId),
    RouteId INT FOREIGN KEY REFERENCES Routes(RouteId),
    DepartureTime DATETIME NOT NULL,
    ArrivalTime DATETIME NOT NULL
);
```

#### 4. Buses Table
```sql
CREATE TABLE Buses (
    BusId INT PRIMARY KEY IDENTITY(1,1),
    BusNumber NVARCHAR(50) NOT NULL,
    Capacity INT NOT NULL,
    Model NVARCHAR(100),
    Status NVARCHAR(50)
);
```

#### 5. Routes Table
```sql
CREATE TABLE Routes (
    RouteId INT PRIMARY KEY IDENTITY(1,1),
    Origin NVARCHAR(100) NOT NULL,
    Destination NVARCHAR(100) NOT NULL,
    Distance DECIMAL(10, 2),
    Price DECIMAL(10, 2) NOT NULL
);
```

### Entity Relationships
```
Clients (1) ←→ (Many) Tickets
Tickets (Many) ←→ (1) Schedule
Schedule (Many) ←→ (1) Buses
Schedule (Many) ←→ (1) Routes
```

---

## Security & Authorization

### Authentication Flow
1. User logs in via `/Login` page
2. Claims are created:
   ```csharp
   var claims = new List<Claim>
   {
       new Claim(ClaimTypes.Name, Email),
       new Claim(ClaimTypes.Role, "Client"),
       new Claim("UserId", ClientId.ToString())
   };
   ```
3. Cookie is created and stored
4. All `/Clients/*` pages check for "Client" role

### Authorization Rules
```csharp
// In Program.cs
builder.Services.AddRazorPages(options =>
{
    options.Conventions.AuthorizeFolder("/Clients", "Client");
});

// In each page model
[Authorize(Roles = "Client")]
public class IndexModel : PageModel { }
```

### Data Access Security
```csharp
// Always filter by authenticated client
var clientId = User.FindFirst("UserId")?.Value;

string query = "SELECT * FROM Tickets WHERE ClientId = @ClientId";
command.Parameters.AddWithValue("@ClientId", clientId);
```

**Security Benefits**:
✅ Clients can only view their own tickets
✅ Cannot access other clients' data
✅ SQL injection prevention via parameterized queries

---

## Implementation Guide

### Adding New Feature: Ticket Cancellation

**Step 1: Add Cancellation Column to Database**
```sql
ALTER TABLE Tickets
ADD IsCancelled BIT DEFAULT 0,
    CancellationDate DATETIME NULL;
```

**Step 2: Create Cancel Handler in Tickets.cshtml.cs**
```csharp
public IActionResult OnPostCancel(int ticketId)
{
    var clientId = User.FindFirst("UserId")?.Value;
    if (clientId == null)
        return RedirectToPage("/Login");

    using (var connection = new SqlConnection(_connectionString))
    {
        connection.Open();
        
        string query = "UPDATE Tickets " +
                      "SET IsCancelled = 1, CancellationDate = @CancellationDate " +
                      "WHERE TicketId = @TicketId AND ClientId = @ClientId";

        using (var command = new SqlCommand(query, connection))
        {
            command.Parameters.AddWithValue("@TicketId", ticketId);
            command.Parameters.AddWithValue("@ClientId", clientId);
            command.Parameters.AddWithValue("@CancellationDate", DateTime.Now);
            command.ExecuteNonQuery();
        }
    }

    return RedirectToPage();
}
```

**Step 3: Update UI in Tickets.cshtml**
```html
@if (!ticket.IsCancelled)
{
    <form method="post" asp-page-handler="Cancel" style="display:inline;">
        <input type="hidden" name="ticketId" value="@ticket.TicketId" />
        <button type="submit" class="btn btn-sm btn-danger" 
                onclick="return confirm('Cancel this ticket?')">
            Cancel Ticket
        </button>
    </form>
}
else
{
    <span class="badge bg-danger">Cancelled</span>
}
```

**Step 4: Add Cancellation Logic**
- Prevent cancellation within 24 hours of departure
- Implement refund policy
- Send cancellation confirmation email

---

## Best Practices

### 1. Error Handling
```csharp
public IActionResult OnPost(int ScheduleId)
{
    try
    {
        // Purchase logic
        return Page();
    }
    catch (SqlException ex)
    {
        Message = "Database error occurred. Please try again.";
        _logger.LogError(ex, "Error purchasing ticket");
        return Page();
    }
    catch (Exception ex)
    {
        Message = "An unexpected error occurred.";
        _logger.LogError(ex, "Unexpected error in ticket purchase");
        return Page();
    }
}
```

### 2. Input Validation
```csharp
public IActionResult OnPost(int ScheduleId)
{
    if (ScheduleId <= 0)
    {
        Message = "Invalid schedule selected.";
        return Page();
    }

    // Additional validation
    if (!IsScheduleAvailable(ScheduleId))
    {
        Message = "This schedule is no longer available.";
        return Page();
    }

    // Proceed with purchase
}
```

### 3. Email Configuration
```json
// appsettings.json
{
  "Email": {
    "SmtpServer": "smtp.gmail.com",
    "SmtpPort": 587,
    "SmtpUser": "your-email@gmail.com",
    "SmtpPassword": "app-specific-password",
    "FromName": "Bus Management System"
  }
}
```

```csharp
// Usage
var smtpServer = _configuration["Email:SmtpServer"];
var smtpPort = int.Parse(_configuration["Email:SmtpPort"]);
var smtpUser = _configuration["Email:SmtpUser"];
var smtpPassword = _configuration["Email:SmtpPassword"];
```

### 4. PDF Customization
```csharp
// Add logo
var logo = Image.GetInstance("wwwroot/images/logo.png");
logo.Alignment = Element.ALIGN_CENTER;
document.Add(logo);

// Add QR code for ticket verification
var qrCodeData = $"TICKET:{ticket.TicketId}";
var qrCode = GenerateQRCode(qrCodeData);
document.Add(qrCode);

// Add footer
var footer = new Paragraph("Thank you for choosing our service!", normalFont)
{
    Alignment = Element.ALIGN_CENTER,
    SpacingBefore = 20f
};
document.Add(footer);
```

---

## Testing Checklist

### Functional Testing
- [ ] Can browse all available schedules
- [ ] Route filter works correctly
- [ ] Bus filter works correctly
- [ ] Can purchase ticket successfully
- [ ] Ticket appears in "My Tickets" immediately
- [ ] PDF generates correctly
- [ ] Email is received with PDF attachment
- [ ] PDF download from tickets page works
- [ ] Cannot view other clients' tickets

### Integration Testing
- [ ] Email service is working
- [ ] PDF generation doesn't timeout
- [ ] Large number of schedules loads efficiently
- [ ] Concurrent ticket purchases don't conflict

### UI/UX Testing
- [ ] Responsive design on all devices
- [ ] Loading indicators during purchase
- [ ] Success/error messages are clear
- [ ] PDF is readable and well-formatted
- [ ] Email HTML rendering is correct

---

## Troubleshooting

### Issue: Email not sending
**Solutions**:
1. Check Gmail "Less secure app access" settings
2. Use App Password instead of regular password
3. Verify SMTP port (587 for TLS, 465 for SSL)
4. Check firewall settings
5. Enable SMTP authentication

```csharp
// Add error logging
try
{
    client.Send(message);
    _logger.LogInformation($"Email sent to {toEmail}");
}
catch (Exception ex)
{
    _logger.LogError(ex, $"Failed to send email to {toEmail}");
    throw;
}
```

### Issue: PDF generation fails
**Solutions**:
1. Ensure iTextSharp NuGet package is installed
2. Check for null ticket data
3. Verify MemoryStream is not disposed prematurely
4. Add try-catch around PDF generation

```csharp
try
{
    var pdfBytes = GenerateTicketPdf(ticket.Value);
    return File(pdfBytes, "application/pdf", $"Ticket_{TicketId}.pdf");
}
catch (Exception ex)
{
    _logger.LogError(ex, "PDF generation failed");
    return Content("Unable to generate PDF");
}
```

### Issue: Tickets not appearing
**Solutions**:
1. Verify ClientId is correctly retrieved from claims
2. Check database foreign key relationships
3. Ensure ticket was actually inserted
4. Verify WHERE clause in SELECT query

---

## Future Enhancements

1. **Seat Selection**: Allow clients to select specific seats
2. **Payment Integration**: Integrate with payment gateways (Stripe, PayPal)
3. **Ticket Modification**: Allow changing journey date/time
4. **Rating System**: Rate bus service after journey
5. **Notifications**: SMS notifications for journey reminders
6. **QR Code**: Add QR code to tickets for easy verification
7. **Multi-language Support**: Translate UI to multiple languages
8. **Discount Codes**: Implement promotional codes
9. **Loyalty Program**: Points-based rewards system
10. **Journey History**: Detailed analytics of travel patterns

---

## Contact & Support

**Developer**: Didace  
**Module**: Client Management & Ticket Booking  
**Last Updated**: December 2025

For questions or issues, refer to this documentation or contact the project lead.


