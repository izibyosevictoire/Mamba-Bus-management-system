using Microsoft.EntityFrameworkCore;
using BusManagementApi.Entities;
using RouteEntity = BusManagementApi.Entities.Route;

namespace BusManagementApi.Data;

public class BusManagementDbContext : DbContext
{
    public BusManagementDbContext(DbContextOptions<BusManagementDbContext> options) : base(options)
    {
    }

    public DbSet<Bus> Buses { get; set; }
    public DbSet<Agency> Agencies { get; set; }
    public DbSet<RouteEntity> Routes { get; set; }
    public DbSet<Schedule> Schedules { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<Permission> Permissions { get; set; }
    public DbSet<UserPermission> UserPermissions { get; set; }
    public DbSet<Ticket> Tickets { get; set; }
    public DbSet<DriverAssignment> DriverAssignments { get; set; }
    public DbSet<Notification> Notifications { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Agency configuration
        modelBuilder.Entity<Agency>(entity =>
        {
            entity.HasKey(e => e.AgencyId);
            entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
            entity.Property(e => e.ContactEmail).HasMaxLength(256);
            entity.Property(e => e.ContactPhone).HasMaxLength(20);
            entity.HasIndex(e => e.Name).IsUnique();
        });

        // Bus configuration
        modelBuilder.Entity<Bus>(entity =>
        {
            entity.HasKey(e => e.BusId);
            entity.Property(e => e.BusNumber).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Model).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("Active");
            entity.HasIndex(e => e.BusNumber).IsUnique();
            entity.HasOne(e => e.Agency)
                .WithMany(a => a.Buses)
                .HasForeignKey(e => e.AgencyId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // Route configuration
        modelBuilder.Entity<RouteEntity>(entity =>
        {
            entity.HasKey(e => e.RouteId);
            entity.Property(e => e.Origin).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Destination).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Distance).HasPrecision(10, 2);
            entity.Property(e => e.Price).HasPrecision(10, 2);
        });

        // Schedule configuration
        modelBuilder.Entity<Schedule>(entity =>
        {
            entity.HasKey(e => e.ScheduleId);
            entity.HasOne(e => e.Bus)
                .WithMany(b => b.Schedules)
                .HasForeignKey(e => e.BusId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Route)
                .WithMany(r => r.Schedules)
                .HasForeignKey(e => e.RouteId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // User configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.UserId);
            entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Email).HasMaxLength(256).IsRequired();
            entity.Property(e => e.PasswordHash).IsRequired();
            entity.Property(e => e.Phone).HasMaxLength(20);
            entity.Property(e => e.UserType).HasMaxLength(20).IsRequired();
            entity.Property(e => e.LicenceNumber).HasMaxLength(50);
            entity.Property(e => e.LicencePhoto).HasMaxLength(500);
            entity.HasIndex(e => e.Email).IsUnique();
        });

        // Permission configuration
        modelBuilder.Entity<Permission>(entity =>
        {
            entity.HasKey(e => e.PermissionId);
            entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.Module).HasMaxLength(50).IsRequired();
            entity.HasIndex(e => e.Name).IsUnique();
        });

        // UserPermission configuration
        modelBuilder.Entity<UserPermission>(entity =>
        {
            entity.HasKey(e => e.UserPermissionId);
            entity.HasOne(e => e.User)
                .WithMany(u => u.UserPermissions)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Permission)
                .WithMany(p => p.UserPermissions)
                .HasForeignKey(e => e.PermissionId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => new { e.UserId, e.PermissionId }).IsUnique();
        });

        // Ticket configuration
        modelBuilder.Entity<Ticket>(entity =>
        {
            entity.HasKey(e => e.TicketId);
            entity.Property(e => e.TicketNumber).HasMaxLength(50).IsRequired();
            entity.Property(e => e.PricePaid).HasPrecision(10, 2);
            entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("Active");
            entity.HasIndex(e => e.TicketNumber).IsUnique();
            entity.HasOne(e => e.Client)
                .WithMany(u => u.Tickets)
                .HasForeignKey(e => e.ClientId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Schedule)
                .WithMany(s => s.Tickets)
                .HasForeignKey(e => e.ScheduleId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // DriverAssignment configuration
        // (existing configuration left mostly intact by EF automatically, except status default updated earlier if needed, but we don't need to change builder.Entity because default is fine, let's just make sure)
        modelBuilder.Entity<DriverAssignment>(entity =>
        {
            entity.HasKey(e => e.AssignmentId);
            entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("Pending");
            entity.HasOne(e => e.Driver)
                .WithMany(u => u.DriverAssignments)
                .HasForeignKey(e => e.DriverId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Bus)
                .WithMany(b => b.DriverAssignments)
                .HasForeignKey(e => e.BusId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Notification configuration
        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasKey(e => e.NotificationId);
            entity.Property(e => e.Title).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Message).HasMaxLength(1000).IsRequired();
            entity.Property(e => e.Type).HasMaxLength(50).IsRequired();
            entity.Property(e => e.CreatedAt)
    .HasDefaultValueSql("NOW()");
            entity.HasOne(e => e.User)
                .WithMany(u => u.Notifications)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            // Unique constraint: same user cannot receive the same notification twice
            entity.HasIndex(e => new { e.UserId, e.Type, e.Title, e.Message })
                  .IsUnique()
                  .HasDatabaseName("IX_Notifications_Unique");
        });
    }
}
