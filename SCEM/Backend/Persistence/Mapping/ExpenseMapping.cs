namespace Persistence.Mapping;

using Base.Persistence.Mappings;
using Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public static class ExpenseMapping
{
    public static void Map(this EntityTypeBuilder<Expense> entity)
    {
        entity.ToTable("Expense");

        entity.HasKey(e => e.Id);

        entity.Property(e => e.Category)
            .AsRequiredText(128);

        entity.Property(e => e.Amount)
            .HasPrecision(18, 2);

        entity.Property(e => e.Notes)
            .HasMaxLength(1024);

        entity.HasOne(e => e.PaidBy)
            .WithMany()
            .HasForeignKey(e => e.PaidById)
            .OnDelete(DeleteBehavior.Restrict);

        entity.HasOne(e => e.Vehicle)
            .WithMany()
            .HasForeignKey(e => e.VehicleId)
            .OnDelete(DeleteBehavior.Restrict);

        entity.HasOne(e => e.Trip)
            .WithMany()
            .HasForeignKey(e => e.TripId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}