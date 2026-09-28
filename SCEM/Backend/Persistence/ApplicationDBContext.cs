using Base.Tools;

using Core.Entities;

using Microsoft.EntityFrameworkCore;

using System.Diagnostics;

namespace Persistence;

using Persistence.Mapping;

public class ApplicationDbContext : DbContext
{
    /// <summary>
    /// Parameterless constructor reads the connection string from appsettings.json (at design time)
    /// For migration generation! Note: The constructor must be the first one in order.
    /// </summary>
    public ApplicationDbContext()
    {
    }

    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        if (!optionsBuilder.IsConfigured)
        {
            //We need this for migration
            var connectionString = ConfigurationHelper.GetConfiguration().Get("DefaultConnection", "ConnectionStrings");
            optionsBuilder.UseSqlite(connectionString);
        }

        optionsBuilder.LogTo(message => Debug.WriteLine(message));
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        //modelBuilder.Entity<MDemo>().Map();
        //modelBuilder.Entity<FDemo>().Map();
        //modelBuilder.Entity<DDemo>().Map();
        modelBuilder.Entity<User>().Map();
        modelBuilder.Entity<Vehicle>().Map();
        modelBuilder.Entity<Group>().Map();
        modelBuilder.Entity<UserGroup>().Map();
        modelBuilder.Entity<Trip>().Map();
        modelBuilder.Entity<Expense>().Map();
        modelBuilder.Entity<ExpenseShare>().Map();
        modelBuilder.Entity<Reservation>().Map();
        modelBuilder.Entity<Settlement>().Map();
    }
}