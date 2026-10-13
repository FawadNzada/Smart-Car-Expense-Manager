namespace Persistence.Mapping;

using Base.Persistence.Mappings;
using Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public static class SettlementMapping
{
    public static void Map(this EntityTypeBuilder<Settlement> entity)
    {
        entity.ToTable("Settlement");

        entity.HasKey(s => s.Id);

        entity.Property(s => s.Amount)
            .HasPrecision(18, 2);

        entity.Property(s => s.Notes)
            .HasMaxLength(1024);

        entity.HasOne(s => s.FromUser)
            .WithMany()
            .HasForeignKey(s => s.FromUserId)
            .OnDelete(DeleteBehavior.Restrict);

        entity.HasOne(s => s.ToUser)
            .WithMany()
            .HasForeignKey(s => s.ToUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}