namespace Persistence.Mapping;

using Base.Persistence.Mappings;

using Core.Entities;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public static class DDemoMapping
{
    public static void Map(this EntityTypeBuilder<DDemo> entity)
    {
        entity.ToTable("DDemo");
        entity.HasKey(l => l.Id);

        entity.HasIndex(d => new { d.MDemoId, d.Name }).IsUnique();
        entity.Property(d => d.Name).HasMaxLength(64);

        entity.Property(e => e.Length).AsDecimal(9, 3);
    }
}