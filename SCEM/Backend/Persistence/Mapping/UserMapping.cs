namespace Persistence.Mapping;

using Base.Persistence.Mappings;

using Core.Entities;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public static class UserMapping
{
    public static void Map(this EntityTypeBuilder<User> entity)
    {
        entity.ToTable("User");
        entity.HasKey(u => u.Id);

        entity.HasIndex(u => u.Username).IsUnique();
        entity.Property(u => u.Username).AsRequiredText(256);

        entity.HasIndex(u => u.Email).IsUnique();
        entity.Property(u => u.Email).AsRequiredText(256);

        entity.Property(u => u.FirstName).AsRequiredText(256);
        entity.Property(u => u.LastName).AsRequiredText(256);
    }
}