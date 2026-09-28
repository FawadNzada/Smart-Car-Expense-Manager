namespace Persistence.Mapping;

using Base.Persistence.Mappings;
using Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public static class ReservationMapping
{
    public static void Map(this EntityTypeBuilder<Reservation> entity)
    {
        entity.ToTable("Reservation");

        entity.HasKey(r => r.Id);

        entity.Property(r => r.Status)
            .AsRequiredText(64);

        entity.Property(r => r.Notes)
            .HasMaxLength(1024);

        entity.HasOne(r => r.Vehicle)
            .WithMany()
            .HasForeignKey(r => r.VehicleId)
            .OnDelete(DeleteBehavior.Restrict);

        entity.HasOne(r => r.Driver)
            .WithMany()
            .HasForeignKey(r => r.DriverId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}