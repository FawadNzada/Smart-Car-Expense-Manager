namespace frontend.Services;

public class TripItem
{
    public int Id { get; set; }

    public string VehicleName { get; set; } = "";

    public string LicensePlate { get; set; } = "";

    public string VehicleImage { get; set; } = "";

    public string Driver { get; set; } = "";

    public string StartLocation { get; set; } = "";

    public string Destination { get; set; } = "";

    public DateTime Date { get; set; }

    public TimeOnly StartTime { get; set; }

    public TimeOnly EndTime { get; set; }

    public int StartMileage { get; set; }

    public int EndMileage { get; set; }

    public string Status { get; set; } = "Planned";

    public string Notes { get; set; } = "";
}


public class TripStore
{
    private int nextId = 4;


    public List<TripItem> Trips { get; } = new()
    {
        new TripItem
        {
            Id = 1,

            VehicleName = "Volkswagen Golf",

            LicensePlate = "L-123AB",

            VehicleImage = "images/vehicles/vw.png",

            Driver = "Sebastian",

            StartLocation = "Linz",

            Destination = "Wels",

            Date = DateTime.Today,

            StartTime = new TimeOnly(8, 30),

            EndTime = new TimeOnly(9, 15),

            StartMileage = 52340,

            EndMileage = 52372,

            Status = "Completed",

            Notes = "Morning trip."
        },

        new TripItem
        {
            Id = 2,

            VehicleName = "BMW 3 Series",

            LicensePlate = "L-456CD",

            VehicleImage = "images/vehicles/bmw.png",

            Driver = "Lisa",

            StartLocation = "Linz",

            Destination = "Steyr",

            Date = DateTime.Today,

            StartTime = new TimeOnly(13, 0),

            EndTime = new TimeOnly(14, 0),

            StartMileage = 38120,

            EndMileage = 0,

            Status = "Active",

            Notes = ""
        },

        new TripItem
        {
            Id = 3,

            VehicleName = "Audi A4",

            LicensePlate = "L-789EF",

            VehicleImage = "images/vehicles/audi.png",

            Driver = "Max",

            StartLocation = "Linz",

            Destination = "Salzburg",

            Date = DateTime.Today.AddDays(1),

            StartTime = new TimeOnly(10, 0),

            EndTime = new TimeOnly(12, 0),

            StartMileage = 62450,

            EndMileage = 0,

            Status = "Planned",

            Notes = ""
        }
    };


    public void AddTrip(TripItem trip)
    {
        trip.Id = nextId++;

        Trips.Add(trip);
    }


    public TripItem? FindTrip(int id)
    {
        return Trips.FirstOrDefault(
            trip => trip.Id == id);
    }


    public void DeleteTrip(TripItem trip)
    {
        Trips.Remove(trip);
    }
}