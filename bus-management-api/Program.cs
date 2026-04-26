using System.Text;
using BusManagementApi.Authorization;
using BusManagementApi.Data;
using BusManagementApi.Entities;
using BusManagementApi.Hubs;
using BusManagementApi.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Database
builder.Services.AddDbContext<BusManagementDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ITripService, TripService>();
builder.Services.AddScoped<IBookingService, BookingService>();
builder.Services.AddSingleton<IEmailService, EmailService>();

// PBAC Authorization
builder.Services.AddSingleton<IAuthorizationPolicyProvider, PermissionPolicyProvider>();
builder.Services.AddScoped<IAuthorizationHandler, PermissionHandler>();

// JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });
builder.Services.AddSignalR();

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Bus Management API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter: Bearer {your token}"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

// CORS
builder.Services.AddCors(options =>
    options.AddPolicy("AllowAll", policy =>
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader()));

var app = builder.Build();

// Initialize database with error handling
try
{
    using (var scope = app.Services.CreateScope())
    {
        var context = scope.ServiceProvider.GetRequiredService<BusManagementDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        
        logger.LogInformation("Ensuring database is created...");
        
        // Just ensure database is created, don't run migrations automatically
        await context.Database.EnsureCreatedAsync();
        
        logger.LogInformation("Database is ready.");
        
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
            
            // Add default permissions to admin
            var defaultPermNames = Permissions.GetDefaultPermissions("Admin");
            var permEntities = await context.Permissions
                .Where(p => defaultPermNames.Contains(p.Name))
                .ToListAsync();

            foreach (var perm in permEntities)
            {
                context.UserPermissions.Add(new UserPermission
                {
                    UserId = admin.UserId,
                    PermissionId = perm.PermissionId
                });
            }
            await context.SaveChangesAsync();
        }
        
        logger.LogInformation("Database initialization completed successfully.");
    }
}
catch (Exception ex)
{
    var logger = app.Services.GetRequiredService<ILogger<Program>>();
    logger.LogError(ex, "An error occurred while initializing the database.");
    Console.WriteLine($"\n⚠️  Database initialization failed: {ex.Message}");
    Console.WriteLine($"Stack trace: {ex.StackTrace}");
    Console.WriteLine("\nThe API will start but database may not be ready.\n");
}

// Enable Swagger in all environments
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Bus Management API v1");
    c.RoutePrefix = "swagger"; // Access at /swagger
    c.DocumentTitle = "Bus Management API - Swagger UI";
});

app.UseHttpsRedirection();
app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHub<NotificationHub>("/hubs/notifications");

// Display URLs on startup
var urls = app.Urls;
app.Lifetime.ApplicationStarted.Register(() =>
{
    Console.WriteLine("\n🚀 Bus Management API is running!");
    Console.WriteLine("📚 Swagger UI: http://localhost:5168/swagger");
    Console.WriteLine("🔒 HTTPS: https://localhost:7065/swagger");
    Console.WriteLine("\n✅ Ready to accept requests!\n");
});

app.Run();
