using Base.Core.Entities;
using System;

namespace Core.Entities;

public class ExpenseShare : EntityObject
{
    public int ExpenseId { get; set; }

    public Expense? Expense { get; set; }

    public int UserId { get; set; }

    public User? User { get; set; }

    public decimal Amount { get; set; }

    // Wurde die Schuld bezahlt?
    public bool IsPaid { get; set; } = false;

    // Wann wurde sie bezahlt?
    public DateTime? PaidAt { get; set; }
}