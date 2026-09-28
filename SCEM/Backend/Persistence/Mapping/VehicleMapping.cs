namespace Persistence.Mapping;

using Base.Persistence.Mappings;
using Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public static class VehicleMapping
{
    public static void Map(this EntityTypeBuilder<Vehicle> entity)
    {
        entity.ToTable("Vehicle");

        entity.HasKey(v => v.Id);

        entity.Property(v => v.Brand).AsRequiredText(256);

        entity.Property(v => v.Model).AsRequiredText(256);

        entity.HasIndex(v => v.LicensePlate).IsUnique();
        entity.Property(v => v.LicensePlate).AsRequiredText(32);

        entity.Property(v => v.Status).AsRequiredText(64);

        entity.Property(v => v.Image).HasMaxLength(512);
    }
}