using Base.Core.Entities;
using System;

namespace Core.Entities;

public class Trip : EntityObject
{
    public int VehicleId { get; set; }

    public Vehicle? Vehicle { get; set; }

    public int DriverId { get; set; }

    public User? Driver { get; set; }

    public required string StartLocation { get; set; }

    public required string Destination { get; set; }

    public DateTime Date { get; set; }

    public TimeOnly StartTime { get; set; }

    public TimeOnly EndTime { get; set; }

    public int StartMileage { get; set; }

    public int? EndMileage { get; set; }

    public required string Status { get; set; }

    public string? Notes { get; set; }
}