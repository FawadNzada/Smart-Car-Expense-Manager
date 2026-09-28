namespace Persistence.Mapping;

using Base.Persistence.Mappings;
using Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public static class ExpenseShareMapping
{
    public static void Map(this EntityTypeBuilder<ExpenseShare> entity)
    {
        entity.ToTable("ExpenseShare");

        entity.HasKey(es => es.Id);

        entity.Property(es => es.Amount)
            .HasPrecision(18, 2);

        entity.HasOne(es => es.Expense)
            .WithMany(e => e.Shares)
            .HasForeignKey(es => es.ExpenseId)
            .OnDelete(DeleteBehavior.Cascade);

        entity.HasOne(es => es.User)
            .WithMany()
            .HasForeignKey(es => es.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}