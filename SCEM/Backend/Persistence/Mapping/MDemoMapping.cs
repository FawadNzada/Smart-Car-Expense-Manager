namespace Persistence.Mapping;

using Base.Persistence.Mappings;

using Core.Entities;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public static class MDemoMapping
{
    public static void Map(this EntityTypeBuilder<MDemo> entity)
    {
        entity.ToTable("MDemo");
        entity.HasKey(m => m.Id);

        entity.HasKey(m => m.Id);

        entity.HasIndex(m => m.Name).IsUnique();
        entity.Property(m => m.Name).AsRequiredText(256);

        entity.HasMany(m => m.DDemos).WithOne(d => d.MDemo).HasForeignKey(d => d.MDemoId);
    }
}