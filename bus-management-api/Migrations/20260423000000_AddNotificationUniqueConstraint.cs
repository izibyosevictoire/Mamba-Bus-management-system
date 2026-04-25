using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BusManagementApi.Migrations
{
    /// <inheritdoc />
    public partial class AddNotificationUniqueConstraint : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Remove any existing duplicate notifications before applying the constraint
            migrationBuilder.Sql(@"
                WITH CTE AS (
                    SELECT NotificationId,
                           ROW_NUMBER() OVER (
                               PARTITION BY UserId, Type, Title, Message
                               ORDER BY NotificationId ASC
                           ) AS rn
                    FROM Notifications
                )
                DELETE FROM CTE WHERE rn > 1;
            ");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_Unique",
                table: "Notifications",
                columns: new[] { "UserId", "Type", "Title", "Message" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Notifications_Unique",
                table: "Notifications");
        }
    }
}
