namespace frontend.Services;

public class VehicleItem
{
    public string Name { get; set; } = "";

    public string Brand { get; set; } = "";

    public string Model { get; set; } = "";

    public string LicensePlate { get; set; } = "";

    public int FuelLevel { get; set; }

    public string Status { get; set; } = "Available";

    public string StatusClass { get; set; } = "available";

    public string Image { get; set; } = "";
}


public class VehicleStore
{
    public List<VehicleItem> Vehicles { get; } = new()
    {
        new VehicleItem
        {
            Brand = "Volkswagen",
            Model = "Golf",
            Name = "Volkswagen Golf",
            LicensePlate = "L-123AB",
            FuelLevel = 75,
            Status = "Available",
            StatusClass = "available",
            Image = "images/vehicles/vw.png"
        },

        new VehicleItem
        {
            Brand = "BMW",
            Model = "3 Series",
            Name = "BMW 3 Series",
            LicensePlate = "L-456CD",
            FuelLevel = 40,
            Status = "In Use",
            StatusClass = "in-use",
            Image = "images/vehicles/bmw.png"
        },

        new VehicleItem
        {
            Brand = "Audi",
            Model = "A4",
            Name = "Audi A4",
            LicensePlate = "L-789EF",
            FuelLevel = 30,
            Status = "Reserved",
            StatusClass = "reserved",
            Image = "images/vehicles/audi.png"
        },

        new VehicleItem
        {
            Brand = "Mercedes",
            Model = "C-Class",
            Name = "Mercedes C-Class",
            LicensePlate = "L-321GH",
            FuelLevel = 20,
            Status = "Unavailable",
            StatusClass = "unavailable",
            Image = "images/vehicles/mercedes.png"
        }
    };


    public void AddVehicle(VehicleItem vehicle)
    {
        Vehicles.Add(vehicle);
    }


    public VehicleItem? FindVehicle(string licensePlate)
    {
        return Vehicles.FirstOrDefault(vehicle =>
            vehicle.LicensePlate.Equals(
                licensePlate,
                StringComparison.OrdinalIgnoreCase));
    }


    public bool LicensePlateExists(
        string licensePlate,
        VehicleItem? ignoreVehicle = null)
    {
        return Vehicles.Any(vehicle =>
            vehicle != ignoreVehicle
            &&
            vehicle.LicensePlate.Equals(
                licensePlate,
                StringComparison.OrdinalIgnoreCase));
    }


    public void DeleteVehicle(VehicleItem vehicle)
    {
        Vehicles.Remove(vehicle);
    }
}