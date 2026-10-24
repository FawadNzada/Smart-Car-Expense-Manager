#pragma warning disable CS1591

using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

using Core.Contracts;
using Core.Entities;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers;

[Authorize(Policy = "NormalUser")]
[ApiController]
[Route("[controller]")]
public class TripController : ControllerBase
{
    private readonly IUnitOfWork _uow;

    public TripController(IUnitOfWork uow)
    {
        _uow = uow;
    }

    // =========================================
    // DTOs
    // =========================================

    public record TripDto(
        int Id,
        string VehicleName,
        string LicensePlate,
        string VehicleImage,
        string Driver,
        string StartLocation,
        string Destination,
        string Date,
        string StartTime,
        string EndTime,
        int StartMileage,
        int? EndMileage,
        string Status,
        string Notes
    );

    public record CreateTripDto(
        string LicensePlate,
        string StartLocation,
        string Destination,
        string Date,
        string StartTime,
        string EndTime,
        int StartMileage,
        int? EndMileage,
        string? Status,
        string? Notes
    );

    public record UpdateTripDto(
        string LicensePlate,
        string StartLocation,
        string Destination,
        string Date,
        string StartTime,
        string EndTime,
        int StartMileage,
        int? EndMileage,
        string Status,
        string? Notes
    );

    // =========================================
    // ENTITY -> DTO
    // =========================================

    private static TripDto ToDto(Trip trip)
    {
        var vehicle = trip.Vehicle;
        var driver = trip.Driver;

        var vehicleName = vehicle is null
            ? "Unknown Vehicle"
            : $"{vehicle.Brand} {vehicle.Model}".Trim();

        var driverName = driver is null
            ? "Unknown Driver"
            : $"{driver.FirstName} {driver.LastName}".Trim();

        return new TripDto(
            trip.Id,
            vehicleName,
            vehicle?.LicensePlate ?? "",
            vehicle?.Image ?? "",
            driverName,
            trip.StartLocation,
            trip.Destination,
            trip.Date.ToString(
                "yyyy-MM-dd",
                CultureInfo.InvariantCulture
            ),
            trip.StartTime.ToString(
                "HH:mm",
                CultureInfo.InvariantCulture
            ),
            trip.EndTime.ToString(
                "HH:mm",
                CultureInfo.InvariantCulture
            ),
            trip.StartMileage,
            trip.EndMileage,
            trip.Status,
            trip.Notes ?? ""
        );
    }

    // =========================================
    // KEYCLOAK USER
    // =========================================

    private async Task<Core.Entities.User?>
        FindCurrentUserAsync()
    {
        var keycloakId =
            User.FindFirst("sub")?.Value
            ?? User.FindFirst(
                ClaimTypes.NameIdentifier
            )?.Value;

        if (string.IsNullOrWhiteSpace(keycloakId))
        {
            return null;
        }

        var username = $"keycloak:{keycloakId}";

        var users =
            await _uow.UserRepository.GetNoTrackingAsync(
                user => user.Username == username
            );

        return users.FirstOrDefault();
    }

    // =========================================
    // VEHICLE LOOKUP
    // =========================================

    private async Task<Vehicle?> FindVehicleAsync(
        string licensePlate
    )
    {
        var normalizedPlate =
            licensePlate.Trim().ToLowerInvariant();

        var vehicles =
            await _uow.VehicleRepository.GetNoTrackingAsync(
                vehicle =>
                    vehicle.LicensePlate.ToLower()
                    == normalizedPlate
            );

        return vehicles.FirstOrDefault();
    }

    // =========================================
    // DATE AND TIME VALIDATION
    // =========================================

    private static bool TryParseDateAndTimes(
        string dateText,
        string startText,
        string endText,
        out DateTime date,
        out TimeOnly startTime,
        out TimeOnly endTime
    )
    {
        date = default;
        startTime = default;
        endTime = default;

        if (!DateOnly.TryParseExact(
            dateText,
            "yyyy-MM-dd",
            CultureInfo.InvariantCulture,
            DateTimeStyles.None,
            out var parsedDate
        ))
        {
            return false;
        }

        var timeFormats = new[]
        {
            "HH:mm",
            "HH:mm:ss"
        };

        if (!TimeOnly.TryParseExact(
            startText,
            timeFormats,
            CultureInfo.InvariantCulture,
            DateTimeStyles.None,
            out startTime
        ))
        {
            return false;
        }

        if (!TimeOnly.TryParseExact(
            endText,
            timeFormats,
            CultureInfo.InvariantCulture,
            DateTimeStyles.None,
            out endTime
        ))
        {
            return false;
        }

        if (endTime <= startTime)
        {
            return false;
        }

        date = parsedDate.ToDateTime(
            TimeOnly.MinValue
        );

        return true;
    }

    // =========================================
    // STATUS VALIDATION
    // =========================================

    private static bool IsValidStatus(string? status)
    {
        return status is not null &&
            (
                status == "Planned" ||
                status == "In Progress" ||
                status == "Completed" ||
                status == "Cancelled"
            );
    }

    // =========================================
    // GET - ALL OWN TRIPS
    // =========================================

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TripDto>>>
        GetAllAsync()
    {
        var currentUser =
            await FindCurrentUserAsync();

        if (currentUser is null)
        {
            return Ok(new List<TripDto>());
        }

        var trips =
            await _uow.TripRepository.GetNoTrackingAsync(
                trip => trip.DriverId == currentUser.Id,
                query => query
                    .OrderByDescending(trip => trip.Date)
                    .ThenByDescending(trip => trip.StartTime),
                nameof(Trip.Vehicle),
                nameof(Trip.Driver)
            );

        return Ok(
            trips.Select(ToDto).ToList()
        );
    }

    // =========================================
    // GET - TRIP BY ID
    // =========================================

    [HttpGet("{id:int}", Name = "GetTripById")]
    public async Task<ActionResult<TripDto>>
        GetByIdAsync(int id)
    {
        var currentUser =
            await FindCurrentUserAsync();

        if (currentUser is null)
        {
            return NotFound();
        }

        var trip =
            await _uow.TripRepository.GetByIdAsync(
                id,
                nameof(Trip.Vehicle),
                nameof(Trip.Driver)
            );

        if (
            trip is null ||
            trip.DriverId != currentUser.Id
        )
        {
            return NotFound();
        }

        return Ok(ToDto(trip));
    }

    // =========================================
    // POST - CREATE TRIP
    // =========================================

    [HttpPost]
    public async Task<ActionResult<TripDto>>
        CreateAsync(
            [FromBody] CreateTripDto input
        )
    {
        if (string.IsNullOrWhiteSpace(
            input.LicensePlate
        ))
        {
            return BadRequest(
                "Please select a vehicle."
            );
        }

        if (
            string.IsNullOrWhiteSpace(input.StartLocation) ||
            string.IsNullOrWhiteSpace(input.Destination)
        )
        {
            return BadRequest(
                "Start location and destination are required."
            );
        }

        if (
            input.StartLocation.Trim().Length > 256 ||
            input.Destination.Trim().Length > 256
        )
        {
            return BadRequest(
                "Location or destination is too long."
            );
        }

        if (!TryParseDateAndTimes(
            input.Date,
            input.StartTime,
            input.EndTime,
            out var date,
            out var startTime,
            out var endTime
        ))
        {
            return BadRequest(
                "Invalid date or time range."
            );
        }

        if (input.StartMileage < 0)
        {
            return BadRequest(
                "Start mileage cannot be negative."
            );
        }

        if (
            input.EndMileage.HasValue &&
            input.EndMileage.Value < input.StartMileage
        )
        {
            return BadRequest(
                "End mileage cannot be less than start mileage."
            );
        }

        if (input.Notes?.Length > 1024)
        {
            return BadRequest(
                "Notes cannot exceed 1024 characters."
            );
        }

        var status = string.IsNullOrWhiteSpace(input.Status)
            ? "Planned"
            : input.Status.Trim();

        if (!IsValidStatus(status))
        {
            return BadRequest(
                "Invalid trip status."
            );
        }

        var currentUser =
            await FindCurrentUserAsync();

        if (currentUser is null)
        {
            return BadRequest(
                "Current user was not found."
            );
        }

        var vehicle =
            await FindVehicleAsync(input.LicensePlate);

        if (vehicle is null)
        {
            return NotFound(
                "Selected vehicle was not found."
            );
        }

        using (var transaction =
            _uow.BeginTransaction())
        {
            var trip = new Trip
            {
                VehicleId = vehicle.Id,
                DriverId = currentUser.Id,

                StartLocation =
                    input.StartLocation.Trim(),

                Destination =
                    input.Destination.Trim(),

                Date = date,

                StartTime = startTime,

                EndTime = endTime,

                StartMileage = input.StartMileage,

                EndMileage = input.EndMileage,

                Status = status,

                Notes = input.Notes?.Trim()
            };

            await _uow.TripRepository.AddAsync(trip);

            await transaction.CommitTransactionAsync();

            var created =
                await _uow.TripRepository.GetByIdAsync(
                    trip.Id,
                    nameof(Trip.Vehicle),
                    nameof(Trip.Driver)
                );

            return CreatedAtRoute(
                "GetTripById",
                new { id = trip.Id },
                ToDto(created!)
            );
        }
    }

    // =========================================
    // PUT - UPDATE TRIP
    // =========================================

    [HttpPut("{id:int}")]
    public async Task<ActionResult> UpdateAsync(
        int id,
        [FromBody] UpdateTripDto input
    )
    {
        if (
            string.IsNullOrWhiteSpace(input.LicensePlate) ||
            string.IsNullOrWhiteSpace(input.StartLocation) ||
            string.IsNullOrWhiteSpace(input.Destination)
        )
        {
            return BadRequest(
                "Vehicle, start location and destination are required."
            );
        }

        if (
            input.StartLocation.Trim().Length > 256 ||
            input.Destination.Trim().Length > 256
        )
        {
            return BadRequest(
                "Location or destination is too long."
            );
        }

        if (!TryParseDateAndTimes(
            input.Date,
            input.StartTime,
            input.EndTime,
            out var date,
            out var startTime,
            out var endTime
        ))
        {
            return BadRequest(
                "Invalid date or time range."
            );
        }

        if (
            input.StartMileage < 0 ||
            (
                input.EndMileage.HasValue &&
                input.EndMileage.Value < input.StartMileage
            )
        )
        {
            return BadRequest(
                "Invalid mileage values."
            );
        }

        if (input.Notes?.Length > 1024)
        {
            return BadRequest(
                "Notes cannot exceed 1024 characters."
            );
        }

        if (!IsValidStatus(input.Status))
        {
            return BadRequest(
                "Invalid trip status."
            );
        }

        var currentUser =
            await FindCurrentUserAsync();

        if (currentUser is null)
        {
            return NotFound();
        }

        var vehicle =
            await FindVehicleAsync(input.LicensePlate);

        if (vehicle is null)
        {
            return NotFound(
                "Selected vehicle was not found."
            );
        }

        using (var transaction =
            _uow.BeginTransaction())
        {
            var trip =
                await _uow.TripRepository.GetByIdAsync(id);

            if (
                trip is null ||
                trip.DriverId != currentUser.Id
            )
            {
                return NotFound();
            }

            if (trip.Status == "Cancelled")
            {
                return BadRequest(
                    "Cancelled trips cannot be edited."
                );
            }

            trip.VehicleId = vehicle.Id;

            trip.StartLocation =
                input.StartLocation.Trim();

            trip.Destination =
                input.Destination.Trim();

            trip.Date = date;

            trip.StartTime = startTime;

            trip.EndTime = endTime;

            trip.StartMileage = input.StartMileage;

            trip.EndMileage = input.EndMileage;

            trip.Status = input.Status;

            trip.Notes = input.Notes?.Trim();

            await transaction.CommitTransactionAsync();
        }

        return NoContent();
    }

    // =========================================
    // DELETE - CANCEL TRIP
    // =========================================

    [HttpDelete("{id:int}")]
    public async Task<ActionResult> CancelAsync(int id)
    {
        var currentUser =
            await FindCurrentUserAsync();

        if (currentUser is null)
        {
            return NotFound();
        }

        using (var transaction =
            _uow.BeginTransaction())
        {
            var trip =
                await _uow.TripRepository.GetByIdAsync(id);

            if (
                trip is null ||
                trip.DriverId != currentUser.Id
            )
            {
                return NotFound();
            }

            if (trip.Status == "Cancelled")
            {
                return NoContent();
            }

            trip.Status = "Cancelled";

            await transaction.CommitTransactionAsync();
        }

        return NoContent();
    }
}