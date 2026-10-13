using Base.Core.Entities;
using System;

namespace Core.Entities;

public class Settlement : EntityObject
{
    public int FromUserId { get; set; }

    public User? FromUser { get; set; }

    public int ToUserId { get; set; }

    public User? ToUser { get; set; }

    public decimal Amount { get; set; }

    public DateTime Date { get; set; }

    public string? Notes { get; set; }
}