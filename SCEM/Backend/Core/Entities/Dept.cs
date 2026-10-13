using Base.Core.Entities;
using System;

namespace Core.Entities;

public class Debt : EntityObject
{
    public int FromUserId { get; set; }

    public User? FromUser { get; set; }

    public int ToUserId { get; set; }

    public User? ToUser { get; set; }

    public decimal Amount { get; set; }

    public DateTime Date { get; set; }

    public string? Description { get; set; }

    public int? ExpenseId { get; set; }

    public Expense? Expense { get; set; }

    public required string Status { get; set; }
}