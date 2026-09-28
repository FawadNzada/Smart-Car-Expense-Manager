namespace Persistence.Mapping;

using Core.Entities;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public static class FDemoMapping
{
    public static void Map(this EntityTypeBuilder<FDemo> entity)
    {
        entity.ToTable("FDemo");
        entity.HasKey(l => l.Id);

        entity.HasIndex(d => d.Name).IsUnique();
        entity.Property(d => d.Name).HasMaxLength(256);
    }
}