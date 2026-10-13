namespace Persistence.Mapping;

using Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public static class UserGroupMapping
{
    public static void Map(this EntityTypeBuilder<UserGroup> entity)
    {
        entity.ToTable("UserGroup");

        entity.HasKey(ug => new { ug.UserId, ug.GroupId });

        entity.HasOne(ug => ug.User)
            .WithMany()
            .HasForeignKey(ug => ug.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        entity.HasOne(ug => ug.Group)
            .WithMany(g => g.UserGroups)
            .HasForeignKey(ug => ug.GroupId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}