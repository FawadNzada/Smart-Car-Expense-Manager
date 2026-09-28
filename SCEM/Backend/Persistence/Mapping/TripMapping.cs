namespace Persistence.Mapping;

using Base.Persistence.Mappings;
using Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public static class TripMapping
{
    public static void Map(this EntityTypeBuilder<Trip> entity)
    {
        entity.ToTable("Trip");

        entity.HasKey(t => t.Id);

        entity.Property(t => t.StartLocation)
            .AsRequiredText(256);

        entity.Property(t => t.Destination)
            .AsRequiredText(256);

        entity.Property(t => t.Status)
            .AsRequiredText(64);

        entity.Property(t => t.Notes)
            .HasMaxLength(1024);

        entity.HasOne(t => t.Vehicle)
            .WithMany()
            .HasForeignKey(t => t.VehicleId)
            .OnDelete(DeleteBehavior.Restrict);

        entity.HasOne(t => t.Driver)
            .WithMany()
            .HasForeignKey(t => t.DriverId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}