using Base.Core.Entities;
using System;

using System.Collections.Generic;

namespace Core.Entities;

public class Expense : EntityObject
{
    public required string Category { get; set; }

    public decimal Amount { get; set; }

    public DateTime Date { get; set; }

    public int PaidById { get; set; }

    public User? PaidBy { get; set; }

    public int VehicleId { get; set; }

    public Vehicle? Vehicle { get; set; }

    public int? TripId { get; set; }

    public Trip? Trip { get; set; }

    public string? Notes { get; set; }

    public IList<ExpenseShare> Shares { get; set; } = new List<ExpenseShare>();
}