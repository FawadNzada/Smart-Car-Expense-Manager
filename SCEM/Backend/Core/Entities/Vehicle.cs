using Base.Core.Entities;

namespace Core.Entities;

public class Vehicle : EntityObject
{
    public required string Brand { get; set; }

    public required string Model { get; set; }

    public required string LicensePlate { get; set; }

    public int FuelLevel { get; set; }

    public required string Status { get; set; }

    public string? Image { get; set; }
}