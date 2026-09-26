namespace frontend.Services;

public class DebtItem
{
    public int Id { get; set; }

    public string FromPerson { get; set; } = "";

    public string ToPerson { get; set; } = "";

    public decimal Amount { get; set; }

    public DateTime Date { get; set; }

    public string Description { get; set; } = "";

    public int? ExpenseId { get; set; }

    public string ExpenseDescription { get; set; } = "";

    public string Status { get; set; } = "Open";
}


public class DebtStore
{
    private int nextId = 4;


    public List<DebtItem> Debts { get; } = new()
    {
        new DebtItem
        {
            Id = 1,
            FromPerson = "Lisa",
            ToPerson = "Sebastian",
            Amount = 36.20m,
            Date = DateTime.Today,
            Description = "Fuel cost split",
            ExpenseId = 1,
            ExpenseDescription = "Fuel – Volkswagen Golf",
            Status = "Open"
        },

        new DebtItem
        {
            Id = 2,
            FromPerson = "Sebastian",
            ToPerson = "Max",
            Amount = 20.00m,
            Date = DateTime.Today.AddDays(-1),
            Description = "Parking costs",
            ExpenseId = 2,
            ExpenseDescription = "Parking – BMW 3 Series",
            Status = "Open"
        },

        new DebtItem
        {
            Id = 3,
            FromPerson = "Max",
            ToPerson = "Lisa",
            Amount = 45.00m,
            Date = DateTime.Today.AddDays(-3),
            Description = "Maintenance split",
            ExpenseId = 3,
            ExpenseDescription = "Maintenance – Audi A4",
            Status = "Paid"
        }
    };


    public void AddDebt(DebtItem debt)
    {
        debt.Id = nextId++;

        Debts.Add(debt);
    }


    public DebtItem? FindDebt(int id)
    {
        return Debts.FirstOrDefault(
            debt => debt.Id == id);
    }


    public void DeleteDebt(DebtItem debt)
    {
        Debts.Remove(debt);
    }


    public void MarkAsPaid(DebtItem debt)
    {
        debt.Status = "Paid";
    }


    public void ReopenDebt(DebtItem debt)
    {
        debt.Status = "Open";
    }
}