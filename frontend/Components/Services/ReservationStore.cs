namespace frontend.Services;

public class ReservationItem
{
    public int Id { get; set; }

    public string VehicleName { get; set; } = "";

    public string LicensePlate { get; set; } = "";

    public string VehicleImage { get; set; } = "";

    public string Driver { get; set; } = "";

    public DateTime Date { get; set; }

    public TimeSpan StartTime { get; set; }

    public TimeSpan EndTime { get; set; }

    public string Status { get; set; } = "Planned";

    public string Notes { get; set; } = "";
}


public class ReservationStore
{
    private int nextId = 4;


    public List<ReservationItem> Reservations { get; } = new()
    {
        new ReservationItem
        {
            Id = 1,
            VehicleName = "Volkswagen Golf",
            LicensePlate = "L-123AB",
            VehicleImage = "images/vehicles/vw.png",
            Driver = "Sebastian",
            Date = DateTime.Today,
            StartTime = new TimeSpan(15, 0, 0),
            EndTime = new TimeSpan(18, 0, 0),
            Status = "Upcoming",
            Notes = "Afternoon reservation."
        },

        new ReservationItem
        {
            Id = 2,
            VehicleName = "BMW 3 Series",
            LicensePlate = "L-456CD",
            VehicleImage = "images/vehicles/bmw.png",
            Driver = "Lisa",
            Date = DateTime.Today.AddDays(1),
            StartTime = new TimeSpan(9, 0, 0),
            EndTime = new TimeSpan(12, 0, 0),
            Status = "Planned",
            Notes = ""
        },

        new ReservationItem
        {
            Id = 3,
            VehicleName = "Audi A4",
            LicensePlate = "L-789EF",
            VehicleImage = "images/vehicles/audi.png",
            Driver = "Max",
            Date = DateTime.Today.AddDays(3),
            StartTime = new TimeSpan(10, 0, 0),
            EndTime = new TimeSpan(14, 0, 0),
            Status = "Planned",
            Notes = ""
        }
    };


    public void AddReservation(
        ReservationItem reservation)
    {
        reservation.Id = nextId++;

        Reservations.Add(reservation);
    }


    public ReservationItem? FindReservation(
        int id)
    {
        return Reservations.FirstOrDefault(
            reservation =>
                reservation.Id == id);
    }


    public void DeleteReservation(
        ReservationItem reservation)
    {
        Reservations.Remove(reservation);
    }


    public bool HasConflict(
        string licensePlate,
        DateTime date,
        TimeSpan startTime,
        TimeSpan endTime,
        int? ignoreReservationId = null)
    {
        return Reservations.Any(reservation =>

            reservation.Id != ignoreReservationId

            && reservation.Status != "Cancelled"

            && reservation.Status != "Completed"

            && reservation.LicensePlate.Equals(
                licensePlate,
                StringComparison.OrdinalIgnoreCase)

            && reservation.Date.Date == date.Date

            && startTime < reservation.EndTime

            && endTime > reservation.StartTime
        );
    }
}