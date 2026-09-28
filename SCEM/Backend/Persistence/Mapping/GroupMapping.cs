namespace Persistence.Mapping;

using Base.Persistence.Mappings;
using Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public static class GroupMapping
{
    public static void Map(this EntityTypeBuilder<Group> entity)
    {
        entity.ToTable("Group");

        entity.HasKey(g => g.Id);

        entity.Property(g => g.Name).AsRequiredText(256);

        entity.Property(g => g.Description).HasMaxLength(512);

        entity.HasOne(g => g.Owner)
            .WithMany()
            .HasForeignKey(g => g.OwnerId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}