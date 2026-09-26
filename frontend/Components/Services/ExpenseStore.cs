namespace frontend.Services;

public class ExpenseItem
{
    public int Id { get; set; }

    public string Category { get; set; } = "Fuel";

    public decimal Amount { get; set; }

    public DateTime Date { get; set; }

    public string PaidBy { get; set; } = "";

    public string VehicleName { get; set; } = "";

    public string LicensePlate { get; set; } = "";

    public int? TripId { get; set; }

    public string TripRoute { get; set; } = "";

    public string Notes { get; set; } = "";
}


public class ExpenseStore
{
    private int nextId = 4;


    public List<ExpenseItem> Expenses { get; } = new()
    {
        new ExpenseItem
        {
            Id = 1,
            Category = "Fuel",
            Amount = 72.40m,
            Date = DateTime.Today,
            PaidBy = "Sebastian",
            VehicleName = "Volkswagen Golf",
            LicensePlate = "L-123AB",
            TripId = 1,
            TripRoute = "Linz → Wels",
            Notes = "Full tank."
        },

        new ExpenseItem
        {
            Id = 2,
            Category = "Parking",
            Amount = 8.50m,
            Date = DateTime.Today,
            PaidBy = "Lisa",
            VehicleName = "BMW 3 Series",
            LicensePlate = "L-456CD",
            TripId = 2,
            TripRoute = "Linz → Steyr",
            Notes = "Parking garage."
        },

        new ExpenseItem
        {
            Id = 3,
            Category = "Maintenance",
            Amount = 189.90m,
            Date = DateTime.Today.AddDays(-2),
            PaidBy = "Max",
            VehicleName = "Audi A4",
            LicensePlate = "L-789EF",
            TripId = null,
            TripRoute = "",
            Notes = "Oil and filter change."
        }
    };


    public void AddExpense(ExpenseItem expense)
    {
        expense.Id = nextId++;

        Expenses.Add(expense);
    }


    public ExpenseItem? FindExpense(int id)
    {
        return Expenses.FirstOrDefault(
            expense => expense.Id == id);
    }


    public void DeleteExpense(ExpenseItem expense)
    {
        Expenses.Remove(expense);
    }
}