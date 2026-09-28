using Base.Core.Entities;

namespace Core.Entities;

public class ExpenseShare : EntityObject
{
    public int ExpenseId { get; set; }

    public Expense? Expense { get; set; }

    public int UserId { get; set; }

    public User? User { get; set; }

    public decimal Amount { get; set; }
}