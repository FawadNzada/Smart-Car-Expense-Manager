using Base.Core.Entities;
using System;

namespace Core.Entities;

public class Reservation : EntityObject
{
    public int VehicleId { get; set; }

    public Vehicle? Vehicle { get; set; }

    public int DriverId { get; set; }

    public User? Driver { get; set; }

    public DateTime Date { get; set; }

    public TimeOnly StartTime { get; set; }

    public TimeOnly EndTime { get; set; }

    public required string Status { get; set; }

    public string? Notes { get; set; }
}